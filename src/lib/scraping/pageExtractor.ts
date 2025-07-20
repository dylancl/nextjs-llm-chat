import { Page, Locator } from 'playwright';
import { contentSelectors, excludeSelectors } from './selectors';
import { calculateContentScore, isValidContent } from './contentValidator';
import {
  extractMainContent,
  cleanExtractedContent,
  truncateContent,
} from './contentExtractor';

interface Logger {
  info: (message: string) => void;
}

/**
 * Extracts content from a page using various strategies
 */
export async function extractPageContent(
  page: Page,
  log: Logger
): Promise<string> {
  let content = '';
  let foundContent = false;
  let bestContentScore = 0;
  let bestContent = '';

  // Try content selectors first
  for (const selector of contentSelectors) {
    try {
      const elements = await page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          // Check up to 3 elements
          const element = elements.nth(i);

          // Skip if element contains too many excluded elements
          if (await hasExcludedContent(element, excludeSelectors)) {
            continue;
          }

          const elementContent = await element.textContent();
          if (elementContent) {
            const cleanContent = elementContent.trim();
            const contentScore = calculateContentScore(cleanContent);

            log.info(
              `Content length: ${
                cleanContent.length
              }, Score: ${contentScore}, Words: ${
                cleanContent.split(/\s+/).length
              }`
            );

            if (
              contentScore > bestContentScore &&
              cleanContent.length > 100 // Basic length check
            ) {
              bestContentScore = contentScore;
              bestContent = cleanContent;
              foundContent = true;
              log.info(
                `Found better content using selector: ${selector} (score: ${contentScore})`
              );

              // If we found really good content, use it immediately
              if (contentScore > 0.7) {
                // Lowered threshold
                content = bestContent;
                break;
              }
            }
          }
        }

        if (foundContent && bestContentScore > 0.7) break; // Lowered threshold
      }
    } catch {
      // Continue to next selector
      continue;
    }
  }

  // Use the best content found
  if (foundContent && bestContent) {
    content = bestContent;
  }

  // Fallback: get full page content if no specific content area found
  if (!foundContent) {
    log.info('No specific content area found, extracting from full page');
    content = await extractFallbackContent(page);
    foundContent = !!content;
  }

  // Apply final content cleaning and processing
  if (foundContent && content) {
    content = cleanExtractedContent(content);
  }

  // Validate content quality with enhanced checks
  if (!content || content.trim().length < 100) {
    throw new Error(
      'Extracted content is too short, low quality, or contains mostly boilerplate text'
    );
  }

  // Check if we have any substantial content (more lenient validation)
  const words = content.split(/\s+/).filter((word) => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 5);

  // More lenient validation - accept if we have reasonable content
  if (words.length < 20 || sentences.length < 1) {
    throw new Error(
      'Extracted content is too short, low quality, or contains mostly boilerplate text'
    );
  }

  // For known quality sites like Wikipedia, be even more lenient
  const isKnownQualitySite =
    /(?:wikipedia\.org|britannica\.com|stackexchange\.com|stackoverflow\.com|github\.com)/i.test(
      content
    );
  if (!isKnownQualitySite && !isValidContent(content)) {
    throw new Error(
      'Extracted content is too short, low quality, or contains mostly boilerplate text'
    );
  }

  // Smart content length management
  content = truncateContent(content);

  return content;
}

/**
 * Checks if an element contains too many excluded elements
 */
async function hasExcludedContent(
  element: Locator,
  excludeSelectors: string[]
): Promise<boolean> {
  for (const excludeSelector of excludeSelectors) {
    try {
      const excludedCount = await element.locator(excludeSelector).count();
      if (excludedCount > 2) {
        // Allow some excluded elements but not too many
        return true;
      }
    } catch {
      // Continue if selector fails
    }
  }
  return false;
}

/**
 * Extracts content as a fallback when no specific content selectors work
 */
async function extractFallbackContent(page: Page): Promise<string> {
  try {
    // Remove excluded elements before getting page content
    for (const selector of excludeSelectors) {
      try {
        await page.locator(selector).evaluateAll((elements) => {
          elements.forEach((el) => el.remove());
        });
      } catch {
        // Continue if selector fails
      }
    }

    // Get the cleaned page content
    const bodyContent = await page.locator('body').textContent();
    if (bodyContent) {
      return bodyContent.trim();
    }
  } catch {
    // Final fallback - get full HTML and extract
    const fullHtml = await page.content();
    return extractMainContent(fullHtml);
  }

  return '';
}
