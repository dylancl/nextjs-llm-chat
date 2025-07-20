import { useState, useCallback, useEffect } from 'react';
import { Message } from './useMessages';

interface ConversationPreview {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastUserMessage?: string;
}

interface ConversationWithMessages {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current conversation data
  const currentConversation = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)
    : null;

  // Load conversation previews
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data.conversations); // Already sorted by updatedAt DESC in database
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(
    async (
      firstUserMessage: string,
      messages: Message[],
      apiKey: string
    ): Promise<number> => {
      setIsLoading(true);
      try {
        // Generate title for the conversation
        const titleResponse = await fetch('/api/conversation-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: firstUserMessage, apiKey }),
        });

        if (!titleResponse.ok) throw new Error('Failed to generate title');
        const { title } = await titleResponse.json();

        // Create conversation in database
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, messages }),
        });

        if (!response.ok) throw new Error('Failed to create conversation');
        const { conversationId } = await response.json();

        // Update current conversation
        setCurrentConversationId(conversationId);

        // Reload conversations list
        await loadConversations();

        return conversationId;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [loadConversations]
  );

  // Update existing conversation
  const updateConversation = useCallback(
    async (conversationId: number, messages: Message[]): Promise<void> => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });

        if (!response.ok) throw new Error('Failed to update conversation');

        // Reload conversations to update preview
        await loadConversations();
      } catch (error) {
        console.error('Failed to update conversation:', error);
      }
    },
    [loadConversations]
  );

  // Load a specific conversation
  const loadConversation = useCallback(
    async (id: number): Promise<ConversationWithMessages | null> => {
      try {
        const response = await fetch(`/api/conversations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch conversation');
        const { conversation } = await response.json();

        if (conversation) {
          setCurrentConversationId(id);
        }
        return conversation;
      } catch (error) {
        console.error('Failed to load conversation:', error);
        return null;
      }
    },
    []
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    async (id: number): Promise<void> => {
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete conversation');

        if (currentConversationId === id) {
          setCurrentConversationId(null);
        }
        await loadConversations();
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    },
    [currentConversationId, loadConversations]
  );

  // Start a new conversation (clear current)
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(
    async (id: number, title: string): Promise<void> => {
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        if (!response.ok)
          throw new Error('Failed to update conversation title');
        await loadConversations();
      } catch (error) {
        console.error('Failed to update conversation title:', error);
      }
    },
    [loadConversations]
  );

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    currentConversationId,
    currentConversation,
    isLoading,
    createConversation,
    updateConversation,
    loadConversation,
    deleteConversation,
    startNewConversation,
    updateConversationTitle,
    loadConversations,
  };
}
