import { useState, useCallback } from 'react';
import { Artifact } from '@/types/artifacts';
import { ToolCall, ToolResult } from '@/types/tools';

export interface StreamingMetrics {
  tokensPerSecond: number;
  totalTokens: number;
  elapsedTime: number;
  isActive: boolean;
}

// New interface for chronological message parts
export interface MessagePart {
  id: string;
  type: 'content' | 'tool_calls' | 'tool_results';
  content?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  streamingMetrics?: StreamingMetrics;
  artifacts?: Artifact[];
  // Tool calling support
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  toolCallId?: string; // For tool response messages
  toolName?: string; // For tool response messages
  // New field for chronological parts
  parts?: MessagePart[];
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

  // Helper function to add a chronological part to a message
  const addMessagePart = useCallback(
    (messageId: string, part: Omit<MessagePart, 'id' | 'timestamp'>) => {
      const newPart: MessagePart = {
        ...part,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const existingParts = msg.parts || [];
            return { ...msg, parts: [...existingParts, newPart] };
          }
          return msg;
        })
      );

      return newPart.id;
    },
    []
  );

  // Helper function to update the last content part of a message
  const updateLastContentPart = useCallback(
    (messageId: string, content: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.parts) {
            const parts = [...msg.parts];
            // Find the last content part and update it
            for (let i = parts.length - 1; i >= 0; i--) {
              if (parts[i].type === 'content') {
                parts[i] = { ...parts[i], content };
                break;
              }
            }
            return { ...msg, parts };
          }
          return msg;
        })
      );
    },
    []
  );

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
    addMessagePart,
    updateLastContentPart,
  };
}
