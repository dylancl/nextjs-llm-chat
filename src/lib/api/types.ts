import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface ChatRequestBody {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  system?: string;
  apiKey?: string;
  useRag?: boolean;
  ragSearchResults?: number;
  useWebScraping?: boolean;
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
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
}
