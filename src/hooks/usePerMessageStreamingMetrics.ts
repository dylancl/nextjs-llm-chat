import { useState, useRef, useCallback } from 'react';
import { StreamingMetrics } from './useChat';

export function usePerMessageStreamingMetrics() {
  const [messageMetrics, setMessageMetrics] = useState<
    Record<string, StreamingMetrics>
  >({});
  const messageRefs = useRef<
    Record<
      string,
      {
        startTime: number;
        tokenCount: number;
        interval: NodeJS.Timeout | null;
      }
    >
  >({});

  const startStreaming = useCallback((messageId: string) => {
    const now = Date.now();

    // Initialize refs for this message
    messageRefs.current[messageId] = {
      startTime: now,
      tokenCount: 0,
      interval: null,
    };

    // Initialize metrics for this message
    setMessageMetrics((prev) => ({
      ...prev,
      [messageId]: {
        tokensPerSecond: 0,
        totalTokens: 0,
        elapsedTime: 0,
        isActive: true,
      },
    }));

    // Update metrics every 100ms for smooth animation
    messageRefs.current[messageId].interval = setInterval(() => {
      const refs = messageRefs.current[messageId];
      if (refs) {
        const now = Date.now();
        const elapsedSeconds = (now - refs.startTime) / 1000;
        const tokensPerSecond =
          elapsedSeconds > 0 ? refs.tokenCount / elapsedSeconds : 0;

        setMessageMetrics((prev) => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            tokensPerSecond: Math.round(tokensPerSecond * 10) / 10,
            elapsedTime: elapsedSeconds,
            totalTokens: refs.tokenCount,
          },
        }));
      }
    }, 100);
  }, []);

  const updateTokenCount = useCallback(
    (messageId: string, newContent: string, previousContent: string = '') => {
      const refs = messageRefs.current[messageId];
      if (!refs) return;

      // Estimate tokens by counting words and punctuation
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
      refs.tokenCount += estimatedNewTokens;
    },
    []
  );

  const stopStreaming = useCallback((messageId: string) => {
    const refs = messageRefs.current[messageId];
    if (!refs) return;

    // Clear the interval
    if (refs.interval) {
      clearInterval(refs.interval);
      refs.interval = null;
    }

    // Mark as inactive but keep the final metrics
    setMessageMetrics((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isActive: false,
      },
    }));
  }, []);

  const getMessageMetrics = useCallback(
    (messageId: string): StreamingMetrics | undefined => {
      const stateMetrics = messageMetrics[messageId];
      const refs = messageRefs.current[messageId];

      // If we have refs (active streaming), calculate real-time metrics
      if (refs) {
        const now = Date.now();
        const elapsedSeconds = (now - refs.startTime) / 1000;
        const tokensPerSecond =
          elapsedSeconds > 0 ? refs.tokenCount / elapsedSeconds : 0;

        return {
          tokensPerSecond: Math.round(tokensPerSecond * 10) / 10,
          totalTokens: refs.tokenCount,
          elapsedTime: elapsedSeconds,
          isActive: refs.interval !== null,
        };
      }

      // Fallback to state metrics for completed streams
      return stateMetrics;
    },
    [messageMetrics]
  );

  const clearMessageMetrics = useCallback((messageId: string) => {
    const refs = messageRefs.current[messageId];
    if (refs?.interval) {
      clearInterval(refs.interval);
    }
    delete messageRefs.current[messageId];

    setMessageMetrics((prev) => {
      const newMetrics = { ...prev };
      delete newMetrics[messageId];
      return newMetrics;
    });
  }, []);

  const clearAllMetrics = useCallback(() => {
    // Clear all intervals
    Object.values(messageRefs.current).forEach((refs) => {
      if (refs.interval) {
        clearInterval(refs.interval);
      }
    });

    messageRefs.current = {};
    setMessageMetrics({});
  }, []);

  return {
    startStreaming,
    updateTokenCount,
    stopStreaming,
    getMessageMetrics,
    clearMessageMetrics,
    clearAllMetrics,
  };
}
