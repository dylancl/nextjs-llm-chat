import { useState, useEffect, useRef, useCallback } from "react";

interface StreamingMetrics {
  tokensPerSecond: number;
  totalTokens: number;
  elapsedTime: number;
  isActive: boolean;
}

export function useStreamingMetrics() {
  const [metrics, setMetrics] = useState<StreamingMetrics>({
    tokensPerSecond: 0,
    totalTokens: 0,
    elapsedTime: 0,
    isActive: false,
  });

  const startTimeRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number | null>(null);
  const tokenCountRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startStreaming = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    lastUpdateRef.current = now;
    tokenCountRef.current = 0;

    setMetrics({
      tokensPerSecond: 0,
      totalTokens: 0,
      elapsedTime: 0,
      isActive: true,
    });

    // Update metrics every 100ms for smooth animation
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const elapsedSeconds = (now - startTimeRef.current) / 1000;
        const tokensPerSecond =
          elapsedSeconds > 0 ? tokenCountRef.current / elapsedSeconds : 0;

        setMetrics((prev) => ({
          ...prev,
          tokensPerSecond: Math.round(tokensPerSecond * 10) / 10, // Round to 1 decimal
          elapsedTime: elapsedSeconds,
          totalTokens: tokenCountRef.current,
        }));
      }
    }, 100);
  }, []);

  const updateTokenCount = useCallback(
    (newContent: string, previousContent: string = "") => {
      // Estimate tokens by counting words and punctuation
      // Simple heuristic: ~0.75 tokens per word for English text
      const contentDiff = newContent.slice(previousContent.length);
      const wordCount = contentDiff
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const punctuationCount = (contentDiff.match(/[.,!?;:()[\]{}"'-]/g) || [])
        .length;

      // Rough estimation: words + punctuation * 0.75
      const estimatedNewTokens = Math.ceil(
        (wordCount + punctuationCount * 0.3) * 0.75
      );
      tokenCountRef.current += estimatedNewTokens;
    },
    []
  );

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setMetrics((prev) => ({
      ...prev,
      isActive: false,
    }));

    // Clear refs
    startTimeRef.current = null;
    lastUpdateRef.current = null;
    tokenCountRef.current = 0;
  }, []);

  const resetMetrics = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setMetrics({
      tokensPerSecond: 0,
      totalTokens: 0,
      elapsedTime: 0,
      isActive: false,
    });

    startTimeRef.current = null;
    lastUpdateRef.current = null;
    tokenCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    startStreaming,
    updateTokenCount,
    stopStreaming,
    resetMetrics,
  };
}
