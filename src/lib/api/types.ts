import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';
import { ToolCall } from '@/types/tools';

export interface ChatRequestBody {
  messages: Array<{
    role: string;
    content: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    toolName?: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  system?: string;
  apiKey?: string;
  useRag?: boolean;
  ragSearchResults?: number;
  useWebScraping?: boolean;
  // Tool calling support
  tools?: ChatCompletionTool[];
  toolChoice?: ChatCompletionToolChoiceOption;
}

export interface RagInfo {
  query: string;
  resultsCount: number;
  sources?: Array<{ title: string; url: string }>;
  braveUsage?: {
    requestsThisMonth: number;
    monthlyLimit: number;
    requestsRemaining: number;
  };
  scrapingUsed?: boolean;
  scrapedSource?: {
    title: string;
    url: string;
    contentLength: number;
  };
}

export interface ChatCompletionParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
  tools?: ChatCompletionTool[];
  tool_choice?: ChatCompletionToolChoiceOption;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
}
