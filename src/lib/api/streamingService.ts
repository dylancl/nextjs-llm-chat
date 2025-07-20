import { OpenAI } from "openai";
import { NextRequest } from "next/server";
import { ChatCompletionParams, RagInfo } from "./types";
import { trackUsage, estimateTokens } from "./usageTracking";

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

  let totalContent = "";
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
                delta: { role: "assistant", content: "" },
              },
            ],
          };
          const data = `data: ${JSON.stringify(ragChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        for await (const chunk of stream) {
          // Collect content for token estimation
          if (chunk.choices?.[0]?.delta?.content) {
            totalContent += chunk.choices[0].delta.content;
          }

          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

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
          console.error("Failed to track streaming usage:", err)
        );

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
