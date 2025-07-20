import { PlaywrightCrawler } from 'crawlee';
import { chromium } from 'playwright';
import { ScrapeRequestBody, ScrapeResult } from '../../types/scraping';
import { extractPageContent } from './pageExtractor';

/**
 * Main scraping service that orchestrates the scraping process
 */
export class ScrapingService {
  private readonly defaultTimeout = 30000;
  private readonly maxContentLength = 8000;

  /**
   * Scrapes content from a URL
   */
  async scrapeUrl(body: ScrapeRequestBody): Promise<ScrapeResult> {
    const { url, timeout = this.defaultTimeout } = body;

    console.log(`ScrapingService: Starting scrape for URL: ${url}`);

    // Validate URL
    const validUrl = this.validateUrl(url);
    if (!validUrl.isValid) {
      console.log(`ScrapingService: URL validation failed: ${validUrl.error}`);
      return {
        success: false,
        error: validUrl.error,
        url: url,
      };
    }

    console.log(`ScrapingService: URL validation passed`);

    const result: ScrapeResult = {
      success: false,
      url: url,
    };

    try {
      const crawler = this.createCrawler(timeout, result);
      console.log(`ScrapingService: Created crawler, running with URL: ${url}`);
      await crawler.run([url]);
      console.log(`ScrapingService: Crawler finished. Result:`, {
        success: result.success,
        hasContent: !!result.content,
        contentLength: result.content?.length,
        error: result.error,
      });

      if (!result.success && !result.error) {
        result.error = 'Failed to extract content from the page';
      }
    } catch (error) {
      console.error('Scraping error:', error);
      result.error =
        error instanceof Error ? error.message : 'Unknown scraping error';
    }

    return result;
  }

  /**
   * Validates a URL
   */
  private validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url) {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        return { isValid: false, error: 'Invalid protocol' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid URL' };
    }
  }

  /**
   * Creates a Playwright crawler instance
   */
  private createCrawler(
    timeout: number,
    result: ScrapeResult
  ): PlaywrightCrawler {
    return new PlaywrightCrawler({
      launchContext: {
        launcher: chromium,
        launchOptions: {
          headless: true,
          timeout: timeout,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      },
      requestHandlerTimeoutSecs: Math.floor(timeout / 1000),
      maxRequestRetries: 1,
      requestHandler: async ({ page, request, log }) => {
        log.info(`Scraping ${request.url}`);

        try {
          // Wait for the page to load
          await page.waitForLoadState('networkidle', { timeout: timeout });

          // Get the page title
          const title = await page.title();

          // Extract main content
          const content = await extractPageContent(page, log);

          result.success = true;
          result.title = title;
          result.content = content;
          result.contentLength = content.length;
        } catch (error) {
          log.error(`Error scraping page: ${error}`);
          throw error;
        }
      },
      failedRequestHandler: async ({ request, error, log }) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        log.error(`Failed to scrape ${request.url}: ${errorMessage}`);
        result.error = errorMessage;
      },
    });
  }
}
