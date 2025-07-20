import { useState, useCallback } from 'react';
import { Artifact } from '@/types/artifacts';

export interface StreamingMetrics {
  tokensPerSecond: number;
  totalTokens: number;
  elapsedTime: number;
  isActive: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  streamingMetrics?: StreamingMetrics;
  artifacts?: Artifact[];
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        ...message,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage.id;
    },
    []
  );

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const updateMessageContent = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content } : msg))
    );
  }, []);

  const editMessage = useCallback((id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? { ...msg, content: newContent, timestamp: new Date() }
          : msg
      )
    );
  }, []);

  const setMessageStreaming = useCallback(
    (id: string, isStreaming: boolean) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, isStreaming } : msg))
      );
    },
    []
  );

  const removeMessagesAfter = useCallback(
    (messageId: string) => {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return [];

      const messagesToKeep = messages.slice(0, messageIndex + 1);
      const removedMessages = messages.slice(messageIndex + 1);
      setMessages(messagesToKeep);
      return removedMessages;
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getLastUserMessage = useCallback(() => {
    return [...messages].reverse().find((msg) => msg.role === 'user');
  }, [messages]);

  return {
    messages,
    addMessage,
    updateMessage,
    updateMessageContent,
    editMessage,
    setMessageStreaming,
    removeMessagesAfter,
    clearMessages,
    getLastUserMessage,
    setMessages,
  };
}
