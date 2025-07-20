import { OpenAI } from "openai";
import { SearchResult } from "../../app/api/search/route";

const RESULT_SELECTION_SYSTEM_PROMPT = `
You are a smart assistant that helps select the most relevant search result for a user's query.
You will be given a user query and a list of search results, each with a title, snippet, and URL.
Your task is to analyze the search results and select the ONE result that is most likely to contain the comprehensive and relevant information to answer the user's query.

Consider these factors when selecting:
1. Relevance: How well does the title and snippet match the user's query?
2. Authority: Is the source credible and authoritative on the topic?
3. Comprehensiveness: Does the snippet suggest the content will provide detailed information?
4. Recency: For time-sensitive topics, prefer more recent content
5. Content type: Prefer articles, guides, and documentation over forums or social media

Respond with ONLY the index number (0-based) of the best result. For example, if the third result is best, respond with "2".
Do not provide any explanation or additional text.
`;

interface ResultSelection {
  selectedIndex: number;
  selectedResult: SearchResult;
}

export async function selectBestResult(
  userQuery: string,
  searchResults: SearchResult[],
  bonzai: OpenAI
): Promise<ResultSelection | null> {
  if (searchResults.length === 0) {
    return null;
  }

  if (searchResults.length === 1) {
    return {
      selectedIndex: 0,
      selectedResult: searchResults[0],
    };
  }

  try {
    // Format the search results for the LLM
    const resultsText = searchResults
      .map(
        (result, index) =>
          `[${index}] Title: ${result.title}\nSnippet: ${result.snippet}\nURL: ${result.url}\n`
      )
      .join("\n");

    const prompt = `User Query: ${userQuery}

Search Results:
${resultsText}

Select the index of the most relevant result:`;

    const completion = await bonzai.chat.completions.create({
      model: "gpt-4o-mini", // Use a faster model for result selection
      messages: [
        { role: "system", content: RESULT_SELECTION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.1, // Low temperature for consistent selection
      max_tokens: 10,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      console.warn(
        "No response from LLM for result selection, using first result"
      );
      return {
        selectedIndex: 0,
        selectedResult: searchResults[0],
      };
    }

    // Parse the response to get the selected index
    const selectedIndex = parseInt(response);

    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= searchResults.length
    ) {
      console.warn(`Invalid index ${response} from LLM, using first result`);
      return {
        selectedIndex: 0,
        selectedResult: searchResults[0],
      };
    }

    console.log(
      `LLM selected result ${selectedIndex}: ${searchResults[selectedIndex].title}`
    );

    return {
      selectedIndex,
      selectedResult: searchResults[selectedIndex],
    };
  } catch (error) {
    console.error("Error in result selection:", error);
    // Fallback to first result if LLM selection fails
    return {
      selectedIndex: 0,
      selectedResult: searchResults[0],
    };
  }
}
