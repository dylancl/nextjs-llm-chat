import { fallbackStarters } from "@/data/conversationStarters";
import { useState, useCallback, useEffect } from "react";

export interface ConversationStarter {
  id: string;
  title: string;
  prompt: string;
}

export function useConversationStarters() {
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize starters on the client side to avoid hydration mismatch
  useEffect(() => {
    const randomizedStarters = [...fallbackStarters]
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    setStarters(randomizedStarters);
  }, []);

  const fetchStarters = useCallback(async (apiKey?: string) => {
    if (!apiKey) {
      setError("API key is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStarters([]); // Clear existing starters for fresh streaming

    try {
      const response = await fetch("/api/conversation-starters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch conversation starters: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6); // Remove 'data: ' prefix

              if (data.trim()) {
                try {
                  const parsed = JSON.parse(data);

                  if (parsed.done) {
                    // Stream completed
                    setIsLoading(false);
                    return;
                  }

                  const starter: ConversationStarter = parsed.starter;
                  if (
                    starter &&
                    starter.id &&
                    starter.title &&
                    starter.prompt
                  ) {
                    setStarters((prev) => {
                      // Check for duplicates using the current state
                      if (prev.some((s) => s.id === starter.id)) {
                        return prev;
                      }
                      return [...prev, starter];
                    });
                  }
                } catch (parseError) {
                  console.warn("Failed to parse streaming data:", data);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      console.error("Error fetching conversation starters:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load conversation starters"
      );

      // Fallback to randomized fallback starters
      const randomizedStarters = [...fallbackStarters]
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
      setStarters(randomizedStarters);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStarters = useCallback(
    (apiKey?: string) => {
      fetchStarters(apiKey);
    },
    [fetchStarters]
  );

  return {
    starters,
    isLoading,
    error,
    fetchStarters,
    refreshStarters,
  };
}
