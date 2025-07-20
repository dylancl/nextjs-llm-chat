import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export function createBonzaiClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL:
      process.env.BONZAI_BASE_URL ||
      "https://api.bonzai.iodigital.com/universal",
    apiKey: "placeholder", // Required by OpenAI SDK but not used
    defaultHeaders: {
      "api-key": apiKey,
    },
  });
}

export function validateApiKey(apiKey?: string): string {
  const effectiveApiKey = apiKey || process.env.BONZAI_API_KEY;

  if (!effectiveApiKey) {
    throw new Error("API key is required");
  }

  return effectiveApiKey;
}

export function validateMessages(
  messages: unknown
): ChatCompletionMessageParam[] {
  if (!messages || !Array.isArray(messages)) {
    throw new Error("Messages array is required");
  }

  return messages as ChatCompletionMessageParam[];
}
