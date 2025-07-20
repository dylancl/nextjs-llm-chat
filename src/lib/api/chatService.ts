import { NextRequest, NextResponse } from "next/server";
import { ChatCompletion } from "openai/resources/chat/completions";
import {
  createBonzaiClient,
  validateApiKey,
  validateMessages,
} from "./bonzaiClient";
import { enhanceMessagesWithRag } from "./ragService";
import { createStreamingResponse } from "./streamingService";
import { trackUsage } from "./usageTracking";
import { convertToSimpleMessage, convertToOpenAIMessage } from "./messageUtils";
import { ChatRequestBody, ChatCompletionParams, RagInfo } from "./types";

export async function handleChatRequest(
  request: NextRequest
): Promise<Response> {
  try {
    const body: ChatRequestBody = await request.json();
    const {
      messages,
      model,
      temperature,
      max_tokens,
      stream,
      system,
      apiKey,
      useRag = false,
      ragSearchResults = 3,
      useWebScraping = false,
    } = body;

    // Validate and prepare
    const effectiveApiKey = validateApiKey(apiKey);
    const validatedMessages = validateMessages(messages);
    const bonzai = createBonzaiClient(effectiveApiKey);

    let enhancedMessages = validatedMessages;
    let ragInfo: RagInfo | null = null;

    // Add RAG functionality if enabled
    if (useRag && validatedMessages.length > 0) {
      // Convert to simple message format for RAG processing
      const simpleMessages = validatedMessages.map(convertToSimpleMessage);

      const ragResult = await enhanceMessagesWithRag(
        simpleMessages,
        bonzai,
        request,
        ragSearchResults,
        useWebScraping
      );

      // Convert back to proper format
      enhancedMessages = ragResult.enhancedMessages.map(convertToOpenAIMessage);
      ragInfo = ragResult.ragInfo;
    }

    // Add system message if provided
    const fullMessages = system
      ? [{ role: "system" as const, content: system }, ...enhancedMessages]
      : enhancedMessages;

    const params: ChatCompletionParams = {
      model: model || process.env.DEFAULT_MODEL || "claude-3-5-sonnet",
      messages: fullMessages,
      temperature:
        temperature || parseFloat(process.env.DEFAULT_TEMPERATURE || "0.7"),
      max_tokens:
        max_tokens || parseInt(process.env.DEFAULT_MAX_TOKENS || "2000"),
      stream: stream || false,
    };

    if (!stream) {
      // Non-streaming response
      const completion = (await bonzai.chat.completions.create({
        ...params,
        stream: false,
      })) as ChatCompletion;

      // Track actual usage after getting response
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      await trackUsage(request, { inputTokens, outputTokens });

      // Add RAG info to the response
      const responseWithRag = {
        ...completion,
        ragInfo,
      };

      return NextResponse.json(responseWithRag);
    } else {
      // Streaming response
      return createStreamingResponse(bonzai, params, ragInfo, request);
    }
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof Error) {
      if (error.message === "API key is required") {
        return NextResponse.json(
          { error: "API key is required" },
          { status: 401 }
        );
      }

      if (error.message === "Messages array is required") {
        return NextResponse.json(
          { error: "Messages array is required" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
