import { fallbackStarters } from "@/data/conversationStarters";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    // Use API key from request body or environment
    const effectiveApiKey = apiKey || process.env.BONZAI_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

    const bonzai = new OpenAI({
      baseURL:
        process.env.BONZAI_BASE_URL ||
        "https://api.bonzai.iodigital.com/universal",
      apiKey: "placeholder", // Required by OpenAI SDK but not used
      defaultHeaders: {
        "api-key": effectiveApiKey,
      },
    });

    const systemPrompt = `Generate exactly 6 questions like the examples below. Each should be:
- Concise but interesting (10-15 words each)
- Cover a variety of topics (technology, philosophy, science, etc.)

For example:
- "Generate a script that calculates the Fibonacci sequence in Python."
- "What are the ethical implications of AI in healthcare?"
- "Explain the concept of Schrödinger's cat in quantum mechanics."
- "How can we use machine learning to predict climate change impacts?"

DO NOT USE THE EXAMPLE QUESTIONS ABOVE AS STARTERS, they are provided as inspiration only.

DO NOT INCLUDE MARKDOWN OR ANY FORMATTING.

Return each question as a separate line in ND-JSON format (one JSON object per line).
Each line should be a complete JSON object with this exact structure:
{"id": "unique-id", "title": "Question title", "prompt": "The actual prompt to send to the AI"}

Example:
{"id": "starter-1", "title": "", "prompt": ""}
{"id": "starter-2", "title": "", "prompt": ""}

Generate exactly 6 lines, one per question.`;

    const TARGET_COUNT = 6;

    const response = await bonzai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            "Generate 6 random conversation starters now in ND-JSON format.",
        },
      ],
      temperature: 1, // High temperature for more variety
      max_tokens: 1000,
      stream: true,
    });

    // Create a readable stream to handle streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedContent = "";
        const processedStarters = new Set<string>();

        try {
          for await (const chunk of response) {
            // Stop processing if we already have enough starters
            if (processedStarters.size >= TARGET_COUNT) {
              break;
            }

            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              accumulatedContent += content;

              // Process complete lines (ND-JSON format)
              const lines = accumulatedContent.split("\n");
              accumulatedContent = lines.pop() || ""; // Keep incomplete line for next iteration

              for (const line of lines) {
                // Stop if we already have enough starters
                if (processedStarters.size >= TARGET_COUNT) {
                  break;
                }

                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                try {
                  const starter = JSON.parse(trimmedLine);

                  // Validate starter structure and avoid duplicates
                  if (
                    starter.id &&
                    starter.title &&
                    starter.prompt &&
                    !processedStarters.has(starter.id)
                  ) {
                    processedStarters.add(starter.id);

                    // Send starter to client
                    const data = JSON.stringify({ starter }) + "\n";
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (parseError) {
                  console.warn(
                    "Failed to parse line as JSON:",
                    trimmedLine,
                    parseError
                  );
                }
              }
            }
          }

          // Process any remaining content only if we don't have enough starters yet
          if (
            accumulatedContent.trim() &&
            processedStarters.size < TARGET_COUNT
          ) {
            try {
              const starter = JSON.parse(accumulatedContent.trim());
              if (
                starter.id &&
                starter.title &&
                starter.prompt &&
                !processedStarters.has(starter.id)
              ) {
                processedStarters.add(starter.id);
                const data = JSON.stringify({ starter }) + "\n";
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            } catch (parseError) {
              console.warn(
                "Failed to parse final content:",
                accumulatedContent,
                parseError
              );
            }
          }

          // Only send fallback starters if we have fewer than target
          if (processedStarters.size < TARGET_COUNT) {
            const fallbackNeeded = Math.min(
              TARGET_COUNT - processedStarters.size,
              fallbackStarters.length
            );
            for (let i = 0; i < fallbackNeeded; i++) {
              const starter = fallbackStarters[i];
              if (!processedStarters.has(starter.id)) {
                processedStarters.add(starter.id);
                const data = JSON.stringify({ starter }) + "\n";
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }
        } catch (streamError) {
          console.error("Stream processing error:", streamError);

          // Send fallback starters on error
          for (const starter of fallbackStarters.slice(0, 6)) {
            const data = JSON.stringify({ starter }) + "\n";
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Send completion signal
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Conversation starters API error:", error);

    // Return fallback starters as a stream on error
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const starter of fallbackStarters.slice(0, 6)) {
          const data = JSON.stringify({ starter }) + "\n";
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
}
