import { NextResponse } from "next/server";
import { getBraveUsage, recordBraveUsage } from "@/lib/db/braveUsageService";

export interface BraveUsage {
  requestsThisMonth: number;
  monthlyLimit: number;
  requestsRemaining: number;
  lastReset: string;
  nextReset: string;
}

export async function GET() {
  try {
    const result = await getBraveUsage();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Brave usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await recordBraveUsage();

    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          retryAfter: result.retryAfter,
          nextReset: result.nextReset,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Brave usage tracking error:", error);
    return NextResponse.json(
      { error: "Usage tracking failed" },
      { status: 500 }
    );
  }
}
