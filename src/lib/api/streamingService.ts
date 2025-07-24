import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';
import { ChatCompletionParams, RagInfo } from './types';
import { trackUsage, estimateTokens } from './usageTracking';
import { executeToolCalls } from './toolService';
import { ToolCall, ToolName } from '@/types/tools';
import {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/index.mjs';

export async function createStreamingResponse(
  bonzai: OpenAI,
  params: ChatCompletionParams,
  ragInfo: RagInfo | null,
  request: NextRequest
): Promise<Response> {
  const stream = await bonzai.chat.completions.create({
    ...params,
    stream: true,
  });

  const totalContent = '';
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        // Send RAG info as first chunk if available
        if (ragInfo) {
          const ragChunk = {
            ragInfo,
            choices: [
              {
                delta: { role: 'assistant', content: '' },
              },
            ],
          };
          const data = `data: ${JSON.stringify(ragChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Process the initial stream
        await processStream(
          stream,
          controller,
          encoder,
          params,
          bonzai,
          request,
          totalContent
        );

        // Estimate tokens and track usage
        const estimatedOutputTokens = estimateTokens(totalContent);
        const estimatedInputTokens = estimateTokens(
          JSON.stringify(params.messages)
        );

        // Track usage after stream completion (fire and forget)
        trackUsage(request, {
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
        }).catch((err) =>
          console.error('Failed to track streaming usage:', err)
        );

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

async function processStream(
  stream: AsyncIterable<ChatCompletionChunk>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  params: ChatCompletionParams,
  bonzai: OpenAI,
  request: NextRequest,
  totalContent: string,
  currentMessages: ChatCompletionMessageParam[] = params.messages,
  maxSteps: number = 10 // Prevent infinite loops
): Promise<string> {
  if (maxSteps <= 0) {
    console.warn('Max steps reached, stopping tool call chain');
    return totalContent;
  }

  const collectedToolCalls: Map<number, ToolCall> = new Map();
  let toolCallsCompleted = false;
  let hasToolCalls = false;
  let stepContent = '';

  for await (const chunk of stream) {
    // Collect content for token estimation
    if (chunk.choices?.[0]?.delta?.content) {
      const content = chunk.choices[0].delta.content;
      totalContent += content;
      stepContent += content;
    }

    // Handle tool calls in streaming
    if (chunk.choices?.[0]?.delta?.tool_calls && !toolCallsCompleted) {
      hasToolCalls = true;
      const toolCallDeltas = chunk.choices[0].delta.tool_calls;

      for (const delta of toolCallDeltas) {
        if (delta.index !== undefined) {
          // Initialize tool call if it doesn't exist
          if (!collectedToolCalls.has(delta.index)) {
            collectedToolCalls.set(delta.index, {
              id: delta.id || `call_${Date.now()}_${delta.index}`,
              type: 'function',
              function: {
                name: ToolName.NONE,
                arguments: '',
              },
            });
          }

          const toolCall = collectedToolCalls.get(delta.index)!;

          // Update the tool call ID if provided
          if (delta.id) {
            toolCall.id = delta.id;
          }

          // Handle function name with improved logic
          if (delta.function?.name !== undefined) {
            if (delta.function.name === '') {
              toolCall.function.name = ToolName.NONE;
            } else {
              if (toolCall.function.name === ToolName.NONE) {
                toolCall.function.name = delta.function.name as ToolName;
              } else {
                // Only append if this looks like a continuation
                const currentName = toolCall.function.name;
                const newPart = delta.function.name;

                // If the new part looks like a complete function name, replace
                if (
                  newPart.includes('_') ||
                  newPart.length > currentName.length
                ) {
                  toolCall.function.name = newPart as ToolName;
                } else {
                  toolCall.function.name = (toolCall.function.name +
                    newPart) as ToolName;
                }
              }
            }
          }

          // Handle function arguments with improved logic
          if (delta.function?.arguments !== undefined) {
            if (delta.function.arguments === '') {
              toolCall.function.arguments = '';
            } else {
              const currentArgs = toolCall.function.arguments;
              const newArgs = delta.function.arguments;

              if (currentArgs === '') {
                toolCall.function.arguments = newArgs;
              } else {
                // Check for JSON boundaries to detect new tool calls
                const trimmedCurrent = currentArgs.trim();
                const trimmedNew = newArgs.trim();

                if (
                  trimmedCurrent.endsWith('}') &&
                  trimmedNew.startsWith('{')
                ) {
                  try {
                    JSON.parse(trimmedCurrent);
                    toolCall.function.arguments = newArgs;
                  } catch {
                    toolCall.function.arguments += newArgs;
                  }
                } else {
                  toolCall.function.arguments += newArgs;
                }
              }
            }
          }
        }
      }

      // Send the tool call deltas to the client for real-time updates
      const data = `data: ${JSON.stringify(chunk)}\n\n`;
      controller.enqueue(encoder.encode(data));
    } else if (!hasToolCalls) {
      // Only send regular content chunks if we don't have tool calls
      const data = `data: ${JSON.stringify(chunk)}\n\n`;
      controller.enqueue(encoder.encode(data));
    }

    // Check if this is the final chunk (finish_reason is set)
    if (
      chunk.choices?.[0]?.finish_reason &&
      hasToolCalls &&
      !toolCallsCompleted
    ) {
      toolCallsCompleted = true;

      // Convert map to array and filter out incomplete tool calls
      const toolCallsArray = Array.from(collectedToolCalls.values());
      const completeToolCalls = toolCallsArray.filter((tc) => {
        if (!tc || !tc.function.name || !tc.function.arguments.trim()) {
          return false;
        }

        // Validate that arguments is valid JSON
        try {
          JSON.parse(tc.function.arguments);
          return true;
        } catch {
          console.warn(
            `Invalid JSON in tool call ${tc.id}:`,
            tc.function.arguments
          );
          return false;
        }
      });

      if (completeToolCalls.length > 0) {
        // Execute tool calls
        console.log('Executing tool calls:', completeToolCalls);
        const toolResults = await executeToolCalls(completeToolCalls, request);
        console.log('Tool execution results:', toolResults);

        // Send tool results as a separate chunk
        const toolResultChunk = {
          toolResults,
          choices: [
            {
              delta: { role: 'assistant', content: '' },
            },
          ],
        };
        const toolData = `data: ${JSON.stringify(toolResultChunk)}\n\n`;
        controller.enqueue(encoder.encode(toolData));

        // Create messages including the tool calls and results
        const messagesWithTools = [
          ...currentMessages,
          {
            role: 'assistant' as const,
            content: stepContent || null,
            tool_calls: completeToolCalls.map((tc) => ({
              id: tc.id,
              type: tc.type,
              function: tc.function,
            })),
          },
          ...toolResults.map((result) => ({
            role: 'tool' as const,
            content: result.error
              ? `Error: ${result.error}`
              : String(result.result),
            tool_call_id: result.toolCallId,
          })),
        ];

        // Make a new request to get the follow-up response
        const followUpStream = await bonzai.chat.completions.create({
          ...params,
          messages: messagesWithTools,
          tools: params.tools, // Keep tools available for potential additional calls
          stream: true,
        });

        // Recursively process the follow-up stream with decremented maxSteps
        totalContent = await processStream(
          followUpStream,
          controller,
          encoder,
          params,
          bonzai,
          request,
          totalContent,
          messagesWithTools,
          maxSteps - 1
        );
      }
    } else if (chunk.choices?.[0]?.finish_reason && !hasToolCalls) {
      // Regular completion without tool calls
      const data = `data: ${JSON.stringify(chunk)}\n\n`;
      controller.enqueue(encoder.encode(data));
    }
  }

  return totalContent;
}
