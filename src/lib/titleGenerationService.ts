import OpenAI from 'openai';

const TITLE_GENERATION_SYSTEM_PROMPT = `You are a helpful assistant that generates short, descriptive titles for conversations based on the initial user query. 

Guidelines:
- Keep titles under 60 characters
- Make them descriptive but concise
- Focus on the main topic or question
- Use title case
- No quotes or special formatting

Examples:
- "How do I make a chocolate cake?" -> "Chocolate Cake Recipe"
- "What are the latest advancements in AI?" -> "Latest AI Advancements"
- "Help me debug this Python code" -> "Python Code Debugging"
- "Explain quantum computing" -> "Quantum Computing Explanation"
`;

export async function generateConversationTitle(
  firstUserMessage: string,
  bonzai: OpenAI
): Promise<string> {
  try {
    const completion = await bonzai.chat.completions.create({
      model: 'gpt-4.1-nano', // Use a faster model for title generation
      messages: [
        { role: 'system', content: TITLE_GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: firstUserMessage },
      ],
      temperature: 0.3,
      max_tokens: 20,
      stream: false,
    });

    const title = completion.choices[0]?.message?.content?.trim();
    return title || 'New Conversation';
  } catch (error) {
    console.error('Failed to generate conversation title:', error);
    // Fallback to truncated user message
    return (
      firstUserMessage.slice(0, 50) +
      (firstUserMessage.length > 50 ? '...' : '')
    );
  }
}
