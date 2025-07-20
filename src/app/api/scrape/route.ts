import { NextRequest, NextResponse } from "next/server";
import { ScrapeRequestBody } from "../../../types/scraping";
import { ScrapingService } from "../../../lib/scraping/scrapingService";

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeRequestBody = await request.json();
    const scrapingService = new ScrapingService();
    const result = await scrapingService.scrapeUrl(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
