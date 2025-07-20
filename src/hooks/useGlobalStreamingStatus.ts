import { useMemo } from 'react';
import { Message, StreamingMetrics } from '@/hooks/useMessages';

interface GlobalStreamingStatus {
  isStreaming: boolean;
  currentMetrics?: StreamingMetrics;
  streamingMessageId?: string;
}

export function useGlobalStreamingStatus(
  messages: Message[],
  getMessageMetrics: (messageId: string) => StreamingMetrics | undefined
): GlobalStreamingStatus {
  return useMemo(() => {
    // Find the currently streaming message (should be the last assistant message that's streaming)
    const streamingMessage = messages
      .filter((msg) => msg.role === 'assistant' && msg.isStreaming)
      .pop();

    if (!streamingMessage) {
      return {
        isStreaming: false,
      };
    }

    const metrics = getMessageMetrics(streamingMessage.id);

    return {
      isStreaming: true,
      currentMetrics: metrics,
      streamingMessageId: streamingMessage.id,
    };
  }, [messages, getMessageMetrics]);
}
