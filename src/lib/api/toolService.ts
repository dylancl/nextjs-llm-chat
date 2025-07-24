import { ToolCall, ToolName, ToolResult } from '@/types/tools';
import { NextRequest } from 'next/server';

/**
 * Execute tool calls and return results
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  request: NextRequest
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    try {
      const result = await executeToolCall(toolCall, request);
      results.push({
        toolCallId: toolCall.id,
        result,
      });
    } catch (error) {
      results.push({
        toolCallId: toolCall.id,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Execute a single tool call
 */
async function executeToolCall(
  toolCall: ToolCall,
  request: NextRequest
): Promise<unknown> {
  const { name, arguments: argsString } = toolCall.function;
  let args: Record<string, unknown>;

  try {
    // Handle case where arguments might be empty or malformed
    if (!argsString || argsString.trim() === '') {
      args = {};
    } else {
      args = JSON.parse(argsString);
    }
  } catch (error) {
    console.error(`Failed to parse tool arguments for ${name}:`, argsString);
    throw new Error(`Invalid JSON arguments for tool ${name}: ${error}`);
  }

  console.log(`Executing tool: ${name} with args:`, args);

  switch (name) {
    case ToolName.GET_CURRENT_TIME:
      return executeGetCurrentTime(args);

    case ToolName.CALCULATE:
      return executeCalculate(args);

    case ToolName.SEARCH_WEB:
      return executeSearchWeb(args, request);

    case ToolName.SCRAPE_WEBSITE:
      return executeScrapeWebsite(args, request);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Get current time tool
 */
async function executeGetCurrentTime(
  args: Record<string, unknown>
): Promise<string> {
  const timezone = (args.timezone as string) || 'UTC';

  try {
    const now = new Date();
    const timeString =
      timezone === 'UTC'
        ? now.toISOString()
        : now.toLocaleString('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          });

    return `Current time${
      timezone !== 'UTC' ? ` in ${timezone}` : ''
    }: ${timeString}`;
  } catch {
    return `Current time (UTC): ${new Date().toISOString()}`;
  }
}

/**
 * Calculate tool
 */
async function executeCalculate(
  args: Record<string, unknown>
): Promise<string> {
  const expression = args.expression as string;

  if (!expression) {
    throw new Error('Expression is required');
  }

  // Simple math evaluation (be careful with eval in production!)
  // This is a basic implementation - you might want to use a proper math parser
  try {
    // Only allow basic math operations for security
    const sanitized = expression.replace(/[^0-9+\-*/.()√π\s]/g, '');

    // Replace some common math functions
    const mathExpression = sanitized
      .replace(/√/g, 'Math.sqrt')
      .replace(/π/g, 'Math.PI');

    // Use Function constructor instead of eval for slightly better security
    const result = new Function(`return ${mathExpression}`)();

    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('Invalid mathematical expression');
    }

    return `${expression} = ${result}`;
  } catch (error) {
    throw new Error(
      `Mathematical calculation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Search web tool
 */
async function executeSearchWeb(
  args: Record<string, unknown>,
  request: NextRequest
): Promise<string> {
  const query = args.query as string;
  const count = Math.min((args.count as number) || 5, 10);

  if (!query) {
    throw new Error('Search query is required');
  }

  try {
    const searchResponse = await fetch(new URL('/api/search', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        maxResults: count,
      }),
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      throw new Error(error.error || 'Search failed');
    }

    const searchData = await searchResponse.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      return `No search results found for: ${query}`;
    }

    const formattedResults = results
      .map(
        (
          result: { title: string; url: string; description?: string },
          index: number
        ) =>
          `${index + 1}. **${result.title}**\n   ${result.url}\n   ${
            result.description || ''
          }`
      )
      .join('\n\n');

    return `Search results for "${query}":\n\n${formattedResults}`;
  } catch (error) {
    throw new Error(
      `Web search failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Scrape website tool
 */
async function executeScrapeWebsite(
  args: Record<string, unknown>,
  request: NextRequest
): Promise<string> {
  const url = args.url as string;

  if (!url) {
    throw new Error('URL is required');
  }

  try {
    const scrapeResponse = await fetch(new URL('/api/scrape', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.json();
      throw new Error(error.error || 'Scraping failed');
    }

    const scrapeData = await scrapeResponse.json();

    if (!scrapeData.success) {
      throw new Error(scrapeData.error || 'Scraping failed');
    }

    const content = scrapeData.content || '';
    const title = scrapeData.title || url;

    // Limit content length for response
    const maxLength = 3000;
    const truncatedContent =
      content.length > maxLength
        ? content.substring(0, maxLength) + '...[truncated]'
        : content;

    return `**${title}**\n\nContent from ${url}:\n\n${truncatedContent}`;
  } catch (error) {
    throw new Error(
      `Website scraping failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
