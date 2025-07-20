export interface ActivityIndicator {
  id: string;
  type: "rag" | "scraping";
  timestamp: Date;
  associatedMessageId?: string; // Links to the user message that triggered this activity
  status: "searching" | "processing" | "completed" | "error";
  data: RagIndicatorData | ScrapingIndicatorData;
}

export interface RagIndicatorData {
  query: string;
  resultsCount: number;
  sources?: Array<{
    title: string;
    url: string;
  }>;
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

export interface ScrapingIndicatorData {
  url: string;
  title?: string;
  status: "fetching" | "processing" | "completed" | "error";
  contentLength?: number;
  errorMessage?: string;
}
