'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useApiConfig } from '@/hooks/useApiConfig';
import { useConversationStarters } from '@/hooks/useConversationStarters';
import { useRealTimeStreamingMetrics } from '@/hooks/useRealTimeStreamingMetrics';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ArtifactViewer } from './artifacts/ArtifactViewer';
import { ConversationSidebar } from './ConversationSidebar';

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    config,
    updateConfig,
    connectionStatus,
    availableModels,
    lastTestedModel,
    testConnection,
    clearConnectionCache,
  } = useApiConfig();

  const {
    messages,
    activityIndicators,
    isLoading,
    sendMessage,
    clearMessages,
    stopGeneration,
    refreshLastResponse,
    editAndRefetch,
    streamingMetrics,
    currentConversation,
    loadConversationMessages,
  } = useChat();

  // Get real-time streaming metrics
  const { isStreaming, currentMetrics } = useRealTimeStreamingMetrics(
    messages,
    streamingMetrics.getMessageMetrics
  );

  const {
    starters,
    isLoading: isLoadingStarters,
    refreshStarters,
  } = useConversationStarters();

  const handleSendMessage = useCallback(
    async (messageContent?: string) => {
      const content = messageContent || input;
      if (!content.trim()) return;
      if (messageContent) {
        // If message content is provided (e.g., from conversation starter), don't clear input
      } else {
        setInput('');
      }
      await sendMessage(content, config);
    },
    [input, sendMessage, config]
  );

  const handleStarterClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  const handleRefreshStarters = useCallback(() => {
    refreshStarters(config.apiKey);
  }, [refreshStarters, config.apiKey]);

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleSend = useCallback(() => {
    handleSendMessage();
  }, [handleSendMessage]);

  const handleRefreshLastResponse = useCallback(async () => {
    await refreshLastResponse(config);
  }, [refreshLastResponse, config]);

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      await editAndRefetch(messageId, newContent, config);
    },
    [editAndRefetch, config]
  );

  // Conversation handling
  const handleConversationSelect = useCallback(
    async (conversationId: number) => {
      await loadConversationMessages(conversationId);
      setConversationSidebarOpen(false);
    },
    [loadConversationMessages]
  );

  const handleNewConversation = useCallback(() => {
    clearMessages();
    setConversationSidebarOpen(false);
  }, [clearMessages]);

  // Focus input after LLM response
  // TODO: this is bad, it should be handled by the chat input component itself
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isStreaming) {
        const inputElement = document.querySelector('textarea');
        if (inputElement) {
          (inputElement as HTMLTextAreaElement).focus();
        }
      }
    }
  }, [isLoading, messages]);

  // Calculate total conversation tokens
  const totalConversationTokens = messages.reduce((total, message) => {
    if (message.streamingMetrics?.totalTokens) {
      return total + message.streamingMetrics.totalTokens;
    }
    // Estimate tokens for messages without metrics (rough estimation)
    const wordCount = message.content.trim().split(/\s+/).length;
    return total + Math.ceil(wordCount * 0.75);
  }, 0);

  // Get all artifacts from messages for the sidebar
  const allArtifacts = messages.flatMap((message) => message.artifacts || []);
  const hasArtifacts = allArtifacts.length > 0;

  return (
    <div className="flex h-[100vh] bg-background text-foreground">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        isOpen={conversationSidebarOpen}
        onOpenChange={setConversationSidebarOpen}
      />

      {/* Main Chat Area */}
      <div
        className={`flex flex-col min-w-0 transition-all duration-300 ease-out ${
          hasArtifacts ? 'w-1/2' : 'w-full'
        }`}
      >
        <ChatHeader
          model={config.model}
          connectionStatus={connectionStatus}
          config={config}
          onConfigChange={updateConfig}
          messageCount={messages.length}
          availableModels={availableModels}
          lastTestedModel={lastTestedModel}
          onTestConnection={testConnection}
          onClearCache={clearConnectionCache}
          onOpenConversations={() => setConversationSidebarOpen(true)}
          currentConversation={currentConversation}
        />

        <div className="flex-1 flex flex-col max-w-none mx-auto w-full overflow-hidden">
          <MessageList
            messages={messages}
            activityIndicators={activityIndicators}
            onCopyMessage={handleCopyMessage}
            onRefreshLastResponse={handleRefreshLastResponse}
            conversationStarters={starters}
            isLoadingStarters={isLoadingStarters}
            onStarterClick={handleStarterClick}
            onRefreshStarters={handleRefreshStarters}
            onEditMessage={handleEditMessage}
            isLoading={isLoading}
          />

          <div className="shrink-0">
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onSend={handleSend}
              onClear={clearMessages}
              onStop={stopGeneration}
              isLoading={isLoading}
              hasMessages={messages.length > 0}
              hasApiKey={!!config.apiKey}
              mockMode={config.mockMode}
              isStreaming={isStreaming}
              tokensPerSecond={currentMetrics?.tokensPerSecond || 0}
              totalTokens={currentMetrics?.totalTokens || 0}
              totalConversationTokens={totalConversationTokens}
            />
          </div>
        </div>
      </div>

      {/* Artifacts Sidebar */}
      <div
        className={`
        bg-muted/30 border-l border-border transition-all duration-300 ease-out
        ${
          hasArtifacts
            ? 'w-1/2 opacity-100 translate-x-0'
            : 'w-0 opacity-0 translate-x-full overflow-hidden'
        }
      `}
      >
        {hasArtifacts && (
          <ArtifactViewer artifacts={allArtifacts} className="h-full" />
        )}
      </div>
    </div>
  );
}
