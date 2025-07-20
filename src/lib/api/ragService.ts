import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';
import { SearchResult } from '../../app/api/search/route';
import { RagInfo } from './types';
import { selectBestResult } from './resultSelectionService';

const SEARCH_QUERY_SYSTEM_PROMPT = `
You are an assistant tasked with generating a concise and relevant search query based on user input.
Your goal is to distill the user's message into a clear and focused search query that can be used to find relevant information.
The search query should be specific, include key terms, and avoid unnecessary words.
If the user's message is already a good search query, you can return it as is.
Here are some examples of how to transform user messages into search queries:
- "What is the weather like today?" -> "current weather"
- "Tell me about the history of the Eiffel Tower." -> "Eiffel Tower history"
- "How do I make a chocolate cake?" -> "chocolate cake recipe"
- "What are the latest advancements in AI?" -> "latest advancements in AI"
`;

export async function formatSearchQuery(
  userMessage: string,
  bonzai: OpenAI
): Promise<string> {
  const searchQueryPrompt = {
    role: 'system' as const,
    content: SEARCH_QUERY_SYSTEM_PROMPT,
  };

  const completion = await bonzai.chat.completions.create({
    model: 'gpt-4.1-nano', // Use a faster model for query generation
    messages: [searchQueryPrompt, { role: 'user', content: userMessage }],
    temperature: 0,
    max_tokens: 50,
    stream: false,
  });

  const searchQuery = completion.choices[0]?.message?.content?.trim();
  return searchQuery || userMessage;
}

export async function enhanceMessagesWithRag(
  messages: Array<{ role: string; content: string }>,
  bonzai: OpenAI,
  request: NextRequest,
  ragSearchResults: number,
  useWebScraping: boolean = false
): Promise<{
  enhancedMessages: Array<{ role: string; content: string }>;
  ragInfo: RagInfo | null;
}> {
  if (messages.length === 0) {
    return { enhancedMessages: messages, ragInfo: null };
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return { enhancedMessages: messages, ragInfo: null };
  }

  // Format the user message into a better search query using LLM
  const searchQuery = await formatSearchQuery(lastMessage.content, bonzai);

  console.log('Formatted search query for RAG:', searchQuery);
  console.log(
    'Using RAG search results limit:',
    ragSearchResults,
    'for query:',
    searchQuery
  );

  // Search for relevant information
  const searchResponse = await fetch(new URL('/api/search', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: searchQuery,
      maxResults: ragSearchResults,
    }),
  });

  console.log('Search response status for RAG:', searchResponse.status);

  if (!searchResponse.ok) {
    return { enhancedMessages: messages, ragInfo: null };
  }

  const searchData = await searchResponse.json();
  const results: SearchResult[] = searchData.results || [];

  console.log('Search results for RAG:', results);

  if (results.length === 0) {
    return { enhancedMessages: messages, ragInfo: null };
  }

  // Initialize RAG info
  const ragInfo: RagInfo = {
    query: searchQuery,
    resultsCount: results.length,
    sources: results.map((r) => ({ title: r.title, url: r.url })),
    braveUsage: searchData.braveUsage,
    scrapingUsed: false,
  };

  let context: string;
  let enhancedUserMessage: { role: string; content: string } = lastMessage;

  console.log('Using web scraping:', useWebScraping);

  if (useWebScraping) {
    try {
      // Use LLM to select the best result for scraping
      const selection = await selectBestResult(
        lastMessage.content,
        results,
        bonzai
      );

      if (selection) {
        console.log(
          `Selected result for scraping: ${selection.selectedResult.title}`
        );

        // Scrape the selected result
        const scrapeResponse = await fetch(
          new URL('/api/scrape', request.url),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: selection.selectedResult.url,
              timeout: 30000,
            }),
          }
        );

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();

          if (scrapeData.success && scrapeData.content) {
            console.log(
              `Successfully scraped content from ${selection.selectedResult.url} (${scrapeData.contentLength} chars)`
            );

            // Update RAG info with scraping details
            ragInfo.scrapingUsed = true;
            ragInfo.scrapedSource = {
              title: scrapeData.title || selection.selectedResult.title,
              url: selection.selectedResult.url,
              contentLength: scrapeData.contentLength || 0,
            };

            // Create context from scraped content
            context = `Scraped content from: ${
              scrapeData.title || selection.selectedResult.title
            }
URL: ${selection.selectedResult.url}

${scrapeData.content}`;

            // Enhance the user message with scraped context
            enhancedUserMessage = {
              ...lastMessage,
              content: `Context from web scraping:
${context}

Date: ${new Date().toISOString()}
User question: ${lastMessage.content}
Location: ${request.headers.get('x-forwarded-for') || 'unknown'}

Please answer the user's question using the provided scraped content when relevant. The content above was scraped from a web page that was selected as most relevant to the user's query. If the content doesn't fully answer the question, supplement with your general knowledge and mention what specific information might be missing.
Cite the source when referencing the scraped content.`,
            };
          } else {
            console.warn(
              `Scraping failed: ${scrapeData.error}, falling back to snippet mode`
            );
            throw new Error(scrapeData.error || 'Scraping failed');
          }
        } else {
          console.warn(
            `Scrape API returned ${scrapeResponse.status}, falling back to snippet mode`
          );
          throw new Error(`Scrape API error: ${scrapeResponse.status}`);
        }
      } else {
        console.warn(
          'No result selected for scraping, falling back to snippet mode'
        );
        throw new Error('No result selected for scraping');
      }
    } catch (error) {
      console.error(
        'Web scraping failed, falling back to multi-snippet mode:',
        error
      );
      ragInfo.scrapingUsed = false;
      // Fall through to original multi-snippet logic
    }
  }

  // Fallback to original multi-snippet mode if scraping is disabled or failed
  if (!useWebScraping || !ragInfo.scrapingUsed) {
    // Create context from search results
    context = results
      .map(
        (result, index) =>
          `[${index + 1}] ${result.title}\n${result.snippet}\nSource: ${
            result.url
          }`
      )
      .join('\n\n');

    // Enhance the user message with context
    enhancedUserMessage = {
      ...lastMessage,
      content: `Context from web search:
${context}

Date: ${new Date().toISOString()}
User question: ${lastMessage.content}
Location: ${request.headers.get('x-forwarded-for') || 'unknown'}

Please answer the user's question using the provided context when relevant. If the context doesn't contain relevant information, answer based on your general knowledge and mention that you don't have specific up-to-date information on the topic.
Include footnotes for any sources you reference, using the format [1], [2], etc. at the end of your response, and list the sources at the end of your answer (newline them).`,
    };
  }

  // Replace the last message with the enhanced version
  const enhancedMessages = [...messages.slice(0, -1), enhancedUserMessage];

  console.log('Enhanced user message for RAG:', enhancedUserMessage);

  return { enhancedMessages, ragInfo };
}
