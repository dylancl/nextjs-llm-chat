import { NextRequest, NextResponse } from "next/server";

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  braveUsage?: {
    requestsThisMonth: number;
    monthlyLimit: number;
    requestsRemaining: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 5 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const braveApiKey = process.env.BRAVE_API_KEY;
    if (!braveApiKey) {
      return NextResponse.json(
        { error: "Brave API key not configured" },
        { status: 500 }
      );
    }

    // Check and record usage before making the request
    const usageResponse = await fetch(
      new URL("/api/brave-usage", request.url),
      {
        method: "POST",
      }
    );

    if (!usageResponse.ok) {
      const usageError = await usageResponse.json();
      return NextResponse.json(
        {
          error: usageError.error,
          retryAfter: usageError.retryAfter,
          nextReset: usageError.nextReset,
        },
        { status: usageResponse.status }
      );
    }

    const braveSearchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
      query
    )}&count=${maxResults}`;

    console.log("Fetching Brave search results for query:", query);
    console.log("Brave search URL:", braveSearchUrl);

    const response = await fetch(braveSearchUrl, {
      headers: {
        "X-Subscription-Token": braveApiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();

    const results: SearchResult[] = [];

    console.log("Brave search response data:", data);

    // Process web results
    if (data.web && data.web.results) {
      for (const result of data.web.results.slice(0, maxResults)) {
        results.push({
          title: result.title || "Untitled",
          snippet: result.description || "",
          url: result.url || "",
        });
      }
    }

    // Get current usage stats to include in response
    const currentUsageResponse = await fetch(
      new URL("/api/brave-usage", request.url),
      {
        method: "GET",
      }
    );

    let braveUsage;
    if (currentUsageResponse.ok) {
      const usageData = await currentUsageResponse.json();
      braveUsage = {
        requestsThisMonth: usageData.monthlyLimit.requestsThisMonth,
        monthlyLimit: usageData.monthlyLimit.monthlyLimit,
        requestsRemaining: usageData.monthlyLimit.requestsRemaining,
      };
    }

    const searchResponse: SearchResponse = {
      results,
      query,
      braveUsage,
    };

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error("Brave search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
