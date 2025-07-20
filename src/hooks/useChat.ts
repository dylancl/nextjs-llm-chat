import { useState, useCallback, useEffect, useRef } from 'react';
import { useChatOperations } from './useChatOperations';
import { ChatApiService } from '@/lib/chatApiService';
import { MockConfig } from '@/types/mockConfig';
import { Message, StreamingMetrics } from './useMessages';
import { useConversations } from './useConversations';

// Re-export types for backwards compatibility
export type { Message, StreamingMetrics };

interface UseChatProps {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;
  mockMode: boolean;
  mockConfig: MockConfig;
  useRag: boolean;
  ragSearchResults: number;
  useWebScraping: boolean;
}

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [conversationCreated, setConversationCreated] = useState(false);
  const creatingConversationRef = useRef(false);

  const {
    messages,
    activityIndicators,
    addMessage,
    editMessage,
    removeMessagesAfter,
    createAssistantMessage,
    handleStreamingResponse,
    handleNonStreamingResponse,
    setupAbortController,
    clearAbortController,
    handleApiError,
    stopGeneration,
    clearAllMessages,
    getLastUserMessage,
    streamingMetrics,
    setMessages,
  } = useChatOperations();

  const {
    currentConversationId,
    currentConversation,
    createConversation,
    updateConversation,
    loadConversation,
    startNewConversation,
  } = useConversations();

  // Reset conversation created flag when starting new conversation
  useEffect(() => {
    if (!currentConversationId) {
      setConversationCreated(false);
      creatingConversationRef.current = false;
    }
  }, [currentConversationId]);

  // Helper function to save conversation after message completion
  const saveConversationAfterMessage = useCallback(
    async (config: UseChatProps, finalMessages: Message[]) => {
      try {
        // Get only complete (non-streaming) messages
        const completeMessages = finalMessages.filter((m) => !m.isStreaming);
        const userMessages = completeMessages.filter((m) => m.role === 'user');

        // Check if we already have a conversation or if we're already creating one
        if (currentConversationId) {
          // Update existing conversation
          await updateConversation(currentConversationId, completeMessages);
          console.log('Updated conversation:', currentConversationId);
        } else if (
          userMessages.length === 1 &&
          completeMessages.length >= 2 &&
          !conversationCreated &&
          !creatingConversationRef.current
        ) {
          // Create new conversation when we have first user+assistant exchange
          // and haven't created one yet
          setConversationCreated(true);
          creatingConversationRef.current = true;
          const firstUserMessage = userMessages[0].content;

          try {
            await createConversation(
              firstUserMessage,
              completeMessages,
              config.apiKey
            );
            console.log('Created new conversation');
          } finally {
            creatingConversationRef.current = false;
          }
        }
      } catch (error) {
        console.error('Failed to save conversation:', error);
        // Reset flags on error so user can try again
        setConversationCreated(false);
        creatingConversationRef.current = false;
      }
    },
    [
      currentConversationId,
      createConversation,
      updateConversation,
      conversationCreated,
    ]
  );

  const sendMessage = useCallback(
    async (content: string, config: UseChatProps) => {
      if (!content.trim() || isLoading) return;
      if (!ChatApiService.validateConfig(config)) return;

      setIsLoading(true);
      const abortController = setupAbortController();
      let userMessageId: string | undefined;

      try {
        // Add user message
        userMessageId = addMessage({
          role: 'user',
          content: content.trim(),
        });

        // Create assistant message with activity indicators
        const assistantMessageId = createAssistantMessage(
          userMessageId,
          content.trim(),
          config
        );

        // Make API request
        const response = await ChatApiService.sendChatRequest({
          messages: [
            ...messages,
            { role: 'user', content: content.trim() },
          ].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          config,
          signal: abortController.signal,
        });

        if (!response.ok && !config.mockMode) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle response based on streaming mode
        if (config.streaming && response.body) {
          await handleStreamingResponse(
            response,
            assistantMessageId,
            userMessageId
          );
        } else {
          await handleNonStreamingResponse(
            response,
            assistantMessageId,
            userMessageId
          );
        }

        // Save conversation after successful completion
        // Use a simple delay to let state settle
        setTimeout(async () => {
          setMessages((currentMessages) => {
            const finalMessages = currentMessages.filter((m) => !m.isStreaming);
            // Only save if we have a complete conversation and haven't saved yet
            if (finalMessages.length >= 2) {
              saveConversationAfterMessage(config, finalMessages);
            }
            return currentMessages; // Return unchanged to avoid re-render
          });
        }, 500);
      } catch (error) {
        handleApiError(error, userMessageId);
      } finally {
        setIsLoading(false);
        clearAbortController();
      }
    },
    [
      isLoading,
      messages,
      addMessage,
      createAssistantMessage,
      handleStreamingResponse,
      handleNonStreamingResponse,
      setupAbortController,
      clearAbortController,
      handleApiError,
      saveConversationAfterMessage,
      setMessages,
    ]
  );

  const refreshLastResponse = useCallback(
    async (config: UseChatProps) => {
      if (isLoading) return;

      const lastUserMessage = getLastUserMessage();
      if (!lastUserMessage) return;

      // Remove messages after the last user message and clear their metrics
      const removedMessages = removeMessagesAfter(lastUserMessage.id);
      removedMessages.forEach((msg) => {
        streamingMetrics.clearMessageMetrics(msg.id);
        // Also remove activity indicators for removed messages
        activityIndicators.removeIndicatorsForMessage(msg.id);
      });

      setIsLoading(true);
      const abortController = setupAbortController();

      try {
        // Create new assistant message
        const assistantMessageId = createAssistantMessage(
          lastUserMessage.id,
          lastUserMessage.content,
          config
        );

        // Get messages up to the user message for the API call
        const messagesToSend = messages
          .slice(0, messages.findIndex((m) => m.id === lastUserMessage.id) + 1)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        // Make API request
        const response = await ChatApiService.sendChatRequest({
          messages: messagesToSend,
          config,
          signal: abortController.signal,
        });

        if (!response.ok && !config.mockMode) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle response
        if (config.streaming && response.body) {
          await handleStreamingResponse(
            response,
            assistantMessageId,
            lastUserMessage.id
          );
        } else {
          await handleNonStreamingResponse(
            response,
            assistantMessageId,
            lastUserMessage.id
          );
        }
      } catch (error) {
        handleApiError(error, lastUserMessage.id);
      } finally {
        setIsLoading(false);
        clearAbortController();
      }
    },
    [
      isLoading,
      messages,
      getLastUserMessage,
      removeMessagesAfter,
      streamingMetrics,
      activityIndicators,
      createAssistantMessage,
      handleStreamingResponse,
      handleNonStreamingResponse,
      setupAbortController,
      clearAbortController,
      handleApiError,
    ]
  );

  const editAndRefetch = useCallback(
    async (messageId: string, newContent: string, config: UseChatProps) => {
      if (isLoading) return;

      // Edit the message content
      editMessage(messageId, newContent);

      // Find the message being edited
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Remove all messages after this one
      const removedMessages = removeMessagesAfter(messageId);
      removedMessages.forEach((msg) => {
        streamingMetrics.clearMessageMetrics(msg.id);
        // Also remove activity indicators for removed messages
        activityIndicators.removeIndicatorsForMessage(msg.id);
      });

      setIsLoading(true);
      const abortController = setupAbortController();

      try {
        // Create new assistant message
        const assistantMessageId = createAssistantMessage(
          messageId,
          newContent,
          config
        );

        // Get messages up to and including the edited message for the API call
        // Use the current messages and manually update the edited one for the API call
        const messagesToSend = messages
          .slice(0, messageIndex + 1)
          .map((m, index) => {
            if (index === messageIndex) {
              return {
                role: m.role,
                content: newContent, // Use the new content
              };
            }
            return {
              role: m.role,
              content: m.content,
            };
          });

        // Make API request
        const response = await ChatApiService.sendChatRequest({
          messages: messagesToSend,
          config,
          signal: abortController.signal,
        });

        if (!response.ok && !config.mockMode) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle response
        if (config.streaming && response.body) {
          await handleStreamingResponse(
            response,
            assistantMessageId,
            messageId
          );
        } else {
          await handleNonStreamingResponse(
            response,
            assistantMessageId,
            messageId
          );
        }
      } catch (error) {
        handleApiError(error, messageId);
      } finally {
        setIsLoading(false);
        clearAbortController();
      }
    },
    [
      isLoading,
      messages,
      editMessage,
      removeMessagesAfter,
      streamingMetrics,
      activityIndicators,
      createAssistantMessage,
      handleStreamingResponse,
      handleNonStreamingResponse,
      setupAbortController,
      clearAbortController,
      handleApiError,
    ]
  );

  // Load a conversation
  const loadConversationMessages = useCallback(
    async (conversationId: number) => {
      try {
        const conversation = await loadConversation(conversationId);
        if (conversation) {
          setMessages(conversation.messages);
        }
      } catch (error) {
        console.error('Failed to load conversation messages:', error);
      }
    },
    [loadConversation, setMessages]
  );

  // Clear messages and start new conversation
  const clearAndStartNew = useCallback(() => {
    clearAllMessages();
    startNewConversation();
  }, [clearAllMessages, startNewConversation]);

  return {
    messages,
    activityIndicators,
    isLoading,
    sendMessage,
    clearMessages: clearAndStartNew,
    stopGeneration,
    refreshLastResponse,
    editAndRefetch,
    streamingMetrics,
    // Conversation management
    currentConversationId,
    currentConversation,
    loadConversationMessages,
  };
}
