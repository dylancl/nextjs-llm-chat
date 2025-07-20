import { useState, useEffect } from 'react';
import { Message, StreamingMetrics } from '@/hooks/useMessages';

export function useRealTimeStreamingMetrics(
  messages: Message[],
  getMessageMetrics: (messageId: string) => StreamingMetrics | undefined
) {
  const [currentMetrics, setCurrentMetrics] = useState<StreamingMetrics | null>(
    null
  );

  useEffect(() => {
    // Find the currently streaming message
    const streamingMessage = messages.find(
      (msg) => msg.role === 'assistant' && msg.isStreaming
    );

    if (!streamingMessage) {
      setCurrentMetrics(null);
      return;
    }

    // Update metrics every 100ms while streaming
    const interval = setInterval(() => {
      const metrics = getMessageMetrics(streamingMessage.id);
      if (metrics) {
        setCurrentMetrics(metrics);
      }
    }, 100);

    // Initial update
    const initialMetrics = getMessageMetrics(streamingMessage.id);
    if (initialMetrics) {
      setCurrentMetrics(initialMetrics);
    }

    return () => clearInterval(interval);
  }, [messages, getMessageMetrics]);

  return {
    isStreaming: !!currentMetrics?.isActive,
    currentMetrics,
  };
}
