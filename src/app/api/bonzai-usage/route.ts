import { NextRequest, NextResponse } from "next/server";
import { getBonzaiUsage, recordBonzaiUsage } from "@/lib/db/bonzaiUsageService";

export interface BonzaiUsage {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestsToday: number;
  inputTokensToday: number;
  outputTokensToday: number;
  lastReset: string;
  nextReset: string;
}
export async function GET() {
  try {
    const usage = await getBonzaiUsage();
    return NextResponse.json({ usage });
  } catch (error) {
    console.error("Bonzai usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { inputTokens = 0, outputTokens = 0 } = await request.json();

    // Record the usage (no limits to check for Bonzai)
    const usage = await recordBonzaiUsage(inputTokens, outputTokens);

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("Bonzai usage tracking error:", error);
    return NextResponse.json(
      { error: "Usage tracking failed" },
      { status: 500 }
    );
  }
}
