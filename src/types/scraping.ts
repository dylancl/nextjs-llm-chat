export interface ScrapeRequestBody {
  url: string;
  timeout?: number;
}

export interface ScrapeResult {
  success: boolean;
  title?: string;
  content?: string;
  url: string;
  contentLength?: number;
  error?: string;
}
