'use client';

import { useState, forwardRef, memo, useCallback, KeyboardEvent } from 'react';
import { ChatInputAnimations } from './ChatInputAnimations';
import { StreamingBorder } from './StreamingBorder';
import { StreamingStatus } from './StreamingStatus';
import { ActionButtons } from './ActionButtons';
// ...existing code...
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
  onStop: () => void;
  isLoading: boolean;
  hasMessages: boolean;
  hasApiKey: boolean;
  mockMode?: boolean;
  // Streaming indicator props
  isStreaming?: boolean;
  tokensPerSecond?: number;
  totalTokens?: number;
  totalConversationTokens?: number;
}

const ChatInputComponent = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      value,
      onChange,
      onSend,
      onClear,
      onStop,
      isLoading,
      hasMessages,
      hasApiKey,
      mockMode = false,
      isStreaming = false,
      tokensPerSecond = 0,
      totalTokens = 0,
      totalConversationTokens = 0,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Enhanced streaming border config with more sophisticated animations
    const getStreamingBorderConfig = (tokensPerSecond: number) => {
      if (tokensPerSecond >= 200) {
        return {
          borderColor: 'border-emerald-400',
          bgColor: 'bg-emerald-500',
          glowColor: 'shadow-emerald-500/50',
          ringColor: 'ring-emerald-500/30',
          animation: 'animate-streaming-fast',
          bgGlow: 'bg-emerald-50/30 dark:bg-emerald-950/30',
          pulseColor: 'emerald',
          glowAnimation: 'animate-aurora-fast',
          primaryColor: '#10b981',
          secondaryColor: '#059669',
          accentColor: '#34d399',
          intensity: 'high',
          speed: '1.5s',
        };
      } else if (tokensPerSecond >= 100) {
        return {
          borderColor: 'border-blue-400',
          bgColor: 'bg-blue-500',
          glowColor: 'shadow-blue-500/50',
          ringColor: 'ring-blue-500/30',
          animation: 'animate-streaming-medium',
          bgGlow: 'bg-blue-50/30 dark:bg-blue-950/30',
          pulseColor: 'blue',
          glowAnimation: 'animate-aurora-medium',
          primaryColor: '#3b82f6',
          secondaryColor: '#2563eb',
          accentColor: '#60a5fa',
          intensity: 'medium',
          speed: '2s',
        };
      } else if (tokensPerSecond >= 50) {
        return {
          borderColor: 'border-amber-400',
          bgColor: 'bg-amber-500',
          glowColor: 'shadow-amber-500/50',
          ringColor: 'ring-amber-500/30',
          animation: 'animate-streaming-medium',
          bgGlow: 'bg-amber-50/30 dark:bg-amber-950/30',
          pulseColor: 'amber',
          glowAnimation: 'animate-aurora-medium',
          primaryColor: '#f59e0b',
          secondaryColor: '#d97706',
          accentColor: '#fbbf24',
          intensity: 'medium',
          speed: '2.5s',
        };
      } else if (tokensPerSecond >= 20) {
        return {
          borderColor: 'border-orange-400',
          bgColor: 'bg-orange-500',
          glowColor: 'shadow-orange-500/50',
          ringColor: 'ring-orange-500/30',
          animation: 'animate-streaming-slow',
          bgGlow: 'bg-orange-50/30 dark:bg-orange-950/30',
          pulseColor: 'orange',
          glowAnimation: 'animate-aurora-slow',
          primaryColor: '#f97316',
          secondaryColor: '#ea580c',
          accentColor: '#fb923c',
          intensity: 'low',
          speed: '3s',
        };
      } else {
        return {
          borderColor: 'border-slate-400',
          bgColor: 'bg-slate-500',
          glowColor: 'shadow-slate-500/40',
          ringColor: 'ring-slate-500/20',
          animation: 'animate-streaming-slow',
          bgGlow: 'bg-slate-50/20 dark:bg-slate-950/20',
          pulseColor: 'slate',
          glowAnimation: 'animate-aurora-slow',
          primaryColor: '#6b7280',
          secondaryColor: '#4b5563',
          accentColor: '#9ca3af',
          intensity: 'low',
          speed: '4s',
        };
      }
    };

    const streamingConfig = getStreamingBorderConfig(tokensPerSecond);

    const handleKeyPress = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      },
      [onSend]
    );

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    // In mock mode, we don't need an API key
    const canSendMessage = mockMode || hasApiKey;

    return (
      <div className="relative">
        {/* Enhanced gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />

        {/* Animation styles for streaming effects */}
        <ChatInputAnimations active={isStreaming} />

        <div className="relative bg-background/95 backdrop-blur-md border-t border-border/50">
          <div className="px-6 py-6">
            {!canSendMessage && (
              <Alert className="mb-6 border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:border-amber-800/50 dark:from-amber-950/50 dark:to-orange-950/50 shadow-sm">
                <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                  Please configure your API key in the settings or enable mock
                  mode to start chatting.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 items-end">
              {/* Input area with streaming border and send/stop buttons */}
              <div className="flex-1 relative group">
                <div className="relative">
                  {/* Multi-layered streaming animation */}
                  {isStreaming && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                      <StreamingBorder streamingConfig={streamingConfig} />
                    </div>
                  )}

                  <Textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                    className={`min-h-[72px] max-h-40 resize-none pr-16 pb-14 pt-4 px-4 text-base leading-relaxed transition-all duration-700 ease-in-out rounded-xl relative z-10 ${
                      isStreaming
                        ? `border-0 bg-background/95 backdrop-blur-lg ${streamingConfig.bgGlow}`
                        : isFocused
                        ? 'ring-4 ring-primary/20 border-primary border-2 shadow-lg bg-background'
                        : 'border-border/60 border-2 hover:border-border shadow-sm bg-background/80 hover:bg-background group-hover:shadow-md'
                    } backdrop-blur-sm`}
                    style={
                      isStreaming
                        ? {
                            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `0 0 20px ${streamingConfig.primaryColor}15, 
                                       0 0 40px ${streamingConfig.primaryColor}08, 
                                       0 4px 20px rgba(0, 0, 0, 0.1)`,
                          }
                        : undefined
                    }
                    disabled={isLoading || !canSendMessage}
                  />

                  {/* Enhanced status overlay */}
                  <StreamingStatus
                    isStreaming={isStreaming}
                    tokensPerSecond={tokensPerSecond}
                    totalTokens={totalTokens}
                    streamingConfig={streamingConfig}
                  />

                  {/* Send/Stop buttons absolutely positioned in input area */}
                  <div className="absolute right-3 bottom-3 flex gap-2 z-20">
                    {isLoading && (
                      <button
                        type="button"
                        onClick={onStop}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                        aria-label="Stop"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onSend}
                      disabled={!value.trim() || isLoading || !canSendMessage}
                      className="h-9 w-9 p-0 bg-primary hover:bg-primary/90 disabled:bg-muted transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 rounded-lg shadow-sm hover:shadow-md flex items-center justify-center"
                      aria-label="Send"
                    >
                      <svg
                        className="h-4 w-4 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              {/* Delete button and total token count, right-aligned */}
              <ActionButtons
                hasMessages={hasMessages}
                onClear={onClear}
                totalConversationTokens={totalConversationTokens}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ChatInputComponent.displayName = 'ChatInput';

export const ChatInput = memo(ChatInputComponent);

ChatInput.displayName = 'ChatInput';
