import { NextRequest } from "next/server";
import { UsageInfo } from "./types";

export async function trackUsage(
  request: NextRequest,
  usageInfo: UsageInfo
): Promise<void> {
  try {
    await fetch(new URL("/api/bonzai-usage", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputTokens: usageInfo.inputTokens,
        outputTokens: usageInfo.outputTokens,
      }),
    });
  } catch (error) {
    console.error("Failed to track usage:", error);
  }
}

export function estimateTokens(content: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(content.length / 4);
}
