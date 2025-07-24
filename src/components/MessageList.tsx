import { memo, useEffect, useRef } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { Message } from './Message';
import { ConversationStarters } from './ConversationStarters';
import { ActivityIndicatorComponent } from './ActivityIndicatorComponent';
import { Message as MessageType } from '@/hooks/useChat';
import { ConversationStarter } from '@/hooks/useConversationStarters';
import {
  ActivityIndicator,
  RagIndicatorData,
  ScrapingIndicatorData,
} from '@/types/activityIndicators';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  messages: MessageType[];
  activityIndicators: {
    indicators: ActivityIndicator[];
    addRagIndicator: (associatedMessageId: string, query: string) => string;
    addScrapingIndicator: (associatedMessageId: string, url: string) => string;
    updateRagIndicator: (
      indicatorId: string,
      updates: Partial<RagIndicatorData>,
      status?: ActivityIndicator['status']
    ) => void;
    updateScrapingIndicator: (
      indicatorId: string,
      updates: Partial<ScrapingIndicatorData>,
      status?: ActivityIndicator['status']
    ) => void;
    removeIndicator: (indicatorId: string) => void;
    removeIndicatorsForMessage: (messageId: string) => void;
    clearAllIndicators: () => void;
    getIndicatorsForMessage: (messageId: string) => ActivityIndicator[];
  };
  onCopyMessage: (content: string) => void;
  onRefreshLastResponse?: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  conversationStarters?: ConversationStarter[];
  isLoadingStarters?: boolean;
  onStarterClick?: (prompt: string) => void;
  onRefreshStarters?: () => void;
  isLoading: boolean;
}

export const MessageList = memo(function MessageList({
  messages,
  activityIndicators,
  onCopyMessage,
  onRefreshLastResponse,
  onEditMessage,
  conversationStarters = [],
  isLoadingStarters = false,
  onStarterClick,
  onRefreshStarters,
  isLoading,
}: MessageListProps) {
  const {
    scrollContainerRef,
    contentRef, // Use this new ref
    showScrollToBottom,
    stickToBottom,
  } = useAutoScroll();

  const lastMessageIdRef = useRef<string | null>(null);

  // This effect determines when to force the scroll to the bottom.
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    // Check if a new message has been added to the list.
    if (lastMessage && lastMessage.id !== lastMessageIdRef.current) {
      // Always scroll down when the user sends a new message.
      if (lastMessage.role === 'user') {
        stickToBottom();
      }
      // Also scroll down when the assistant's response *starts* streaming.
      // The `isLoading` flag confirms that we're waiting for a response.
      else if (lastMessage.role === 'assistant' && isLoading) {
        stickToBottom();
      }
    }
    // Keep track of the last message ID to avoid re-scrolling on every render.
    if (lastMessage) {
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [messages, isLoading, stickToBottom]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-4xl w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Start your conversation
          </h2>
          <p className="text-foreground/60 leading-relaxed mb-8">
            Start a conversation with your AI assistant. Configure your API
            settings in the sidebar and begin exploring the possibilities.
          </p>

          {/* Conversation Starters */}
          {onStarterClick && onRefreshStarters && (
            <ConversationStarters
              starters={conversationStarters}
              isLoading={isLoadingStarters}
              onStarterClick={onStarterClick}
              onRefresh={onRefreshStarters}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4 py-6 space-y-6"
      >
        <div ref={contentRef} className="max-w-4xl mx-auto space-y-6 w-full">
          {messages.map((message, index) => {
            // Show refresh button only for user messages that are followed by an assistant message
            // or are the last user message with at least one response in the conversation
            const isUserMessage = message.role === 'user';
            const hasSubsequentAssistantMessage = messages
              .slice(index + 1)
              .some((msg) => msg.role === 'assistant');
            const shouldShowRefresh =
              isUserMessage &&
              hasSubsequentAssistantMessage &&
              onRefreshLastResponse;

            const messageIndicators = isUserMessage
              ? activityIndicators.getIndicatorsForMessage(message.id)
              : [];

            return (
              <div key={message.id}>
                <Message
                  message={message}
                  onCopy={onCopyMessage}
                  onRefresh={
                    shouldShowRefresh ? onRefreshLastResponse : undefined
                  }
                  onEdit={
                    message.role === 'user' && onEditMessage
                      ? (newContent: string) =>
                          onEditMessage(message.id, newContent)
                      : undefined
                  }
                />

                {/* Render activity indicators after user messages */}
                {isUserMessage && messageIndicators.length > 0 && (
                  <div className="space-y-3">
                    {messageIndicators.map((indicator) => (
                      <ActivityIndicatorComponent
                        key={indicator.id}
                        indicator={indicator}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll to bottom button - only show when user is not at bottom */}
      {showScrollToBottom && (
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={stickToBottom}
            size="sm"
            variant="secondary"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});
