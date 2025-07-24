import {
  getRandomMockResponse,
  createMockStreamingResponse,
  simulateApiError,
} from '@/lib/mockStreaming';
import { MockConfig } from '@/types/mockConfig';
import { ENHANCED_SYSTEM_PROMPT } from '@/lib/prompts/artifactPrompts';
import { ToolDefinition, ToolCall, BUILT_IN_TOOLS } from '@/types/tools';
import { convertToolsToOpenAIFormat } from '@/lib/api/toolUtils';

export interface ChatRequestConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;
  mockMode: boolean;
  mockConfig: MockConfig;
  useRag: boolean;
  ragSearchResults: number;
  useWebScraping: boolean;
  // Tool calling support
  useTools?: boolean;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | string;
}

export interface ChatRequest {
  messages: Array<{
    role: string;
    content: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    toolName?: string;
  }>;
  config: ChatRequestConfig;
  signal?: AbortSignal;
}

export class ChatApiService {
  static async sendChatRequest({
    messages,
    config,
    signal,
  }: ChatRequest): Promise<Response> {
    if (config.mockMode) {
      return this.createMockResponse(config, signal);
    }

    // Enhance system prompt with artifact instructions
    const enhancedSystemPrompt = ENHANCED_SYSTEM_PROMPT(config.systemPrompt);

    // Prepare tools if enabled
    const enabledTools =
      config.useTools && config.tools && config.tools.length > 0
        ? convertToolsToOpenAIFormat(config.tools)
        : undefined;

    return fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: config.streaming,
        system: enhancedSystemPrompt,
        apiKey: config.apiKey,
        useRag: config.useRag,
        ragSearchResults: config.ragSearchResults,
        useWebScraping: config.useWebScraping,
        // Tool calling support
        tools: enabledTools,
        toolChoice: config.useTools ? config.toolChoice || 'auto' : undefined,
      }),
      signal,
    });
  }

  private static createMockResponse(
    config: ChatRequestConfig,
    signal?: AbortSignal
  ): Response {
    const mockContent = getRandomMockResponse(config.mockConfig);

    // Simulate API error if configured
    const apiError = simulateApiError(config.mockConfig);
    if (apiError) {
      throw new Error(apiError.message);
    }

    if (config.streaming) {
      const mockStream = createMockStreamingResponse(
        mockContent,
        config.mockConfig,
        signal
      );
      return new Response(mockStream, {
        headers: { 'Content-Type': 'text/plain' },
        status: 200,
      });
    } else {
      const mockData = {
        choices: [
          {
            message: {
              content: mockContent,
            },
          },
        ],
      };
      return new Response(JSON.stringify(mockData), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  }

  static validateConfig(config: ChatRequestConfig): boolean {
    return config.mockMode || !!config.apiKey;
  }
}
