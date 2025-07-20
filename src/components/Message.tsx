'use client';

import { Bot, User, Copy, RotateCcw, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message as MessageType } from '@/hooks/useChat';
import { useEffect, useState, memo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';
import {
  duotoneDark,
  duotoneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { StreamingIndicator } from '@/components/StreamingIndicator';

interface MessageProps {
  message: MessageType;
  onCopy: (content: string) => void;
  onRefresh?: () => void;
  onEdit?: (newContent: string) => void;
}

export const Message = memo(function Message({
  message,
  onCopy,
  onRefresh,
  onEdit,
}: MessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [localContent, setLocalContent] = useState(message.content);
  const { theme } = useTheme();

  useEffect(() => {
    setEditContent(message.content);
    setLocalContent(message.content);
  }, [message.content]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleCopy = useCallback(() => {
    onCopy(message.content);
  }, [onCopy, message.content]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditContent(localContent); // Use current local content
  }, [localContent]);

  const handleSaveEdit = useCallback(async () => {
    const trimmedContent = editContent.trim();

    if (onEdit && trimmedContent !== message.content) {
      // Update local content immediately for UI
      setLocalContent(trimmedContent);
      setIsEditing(false);

      // Call the edit handler which will trigger the API call
      onEdit(trimmedContent);
    } else {
      setIsEditing(false);
    }
  }, [onEdit, editContent, message.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(localContent); // Reset to current local content instead of original message.content
  }, [localContent]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const isUser = message.role === 'user';

  return (
    <div
      className={`w-full transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className={`flex gap-3 mb-6 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* Avatar */}
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`group relative ${
            isUser ? 'max-w-[80%] w-full' : 'max-w-[80%]'
          } bg-transparent`}
        >
          {/* User messages - simple bubble or editing interface */}
          {isUser ? (
            isEditing ? (
              <div className="space-y-2 w-full">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[80px] resize-none text-sm w-full"
                  placeholder="Edit your message..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-7 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-7 px-2 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">{localContent}</div>
            )
          ) : (
            /* AI messages - markdown rendering */
            <div className="prose prose-sm max-w-none dark:prose-invert prose-neutral">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    return match ? (
                      <SyntaxHighlighter
                        style={
                          theme === 'dark' || theme === 'system'
                            ? duotoneDark
                            : duotoneLight
                        }
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: '1rem 0',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4">
                      {children}
                    </blockquote>
                  ),
                  pre: ({ children }) => (
                    <div className="relative group mb-4">{children}</div>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-primary hover:text-primary/80 underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full border-collapse border border-border rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-2 bg-muted font-medium text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2">
                      {children}
                    </td>
                  ),
                  p: ({ children }) => (
                    <p className="text-foreground leading-relaxed mb-4 last:mb-0">
                      {children}
                    </p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-semibold text-foreground mb-4 mt-6 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-foreground mb-2 mt-4 first:mt-0">
                      {children}
                    </h3>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground leading-relaxed mb-2">
                      {children}
                    </li>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-4">{children}</ol>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming cursor */}
              {message.isStreaming && (
                <span className="inline-flex items-center ml-1">
                  <span className="w-2 h-5 bg-primary rounded-sm animate-pulse" />
                </span>
              )}

              {/* Streaming Metrics for AI messages */}
              {!isUser && message.streamingMetrics && (
                <div className="mt-3">
                  <StreamingIndicator
                    tokensPerSecond={message.streamingMetrics.tokensPerSecond}
                    totalTokens={message.streamingMetrics.totalTokens}
                    elapsedTime={message.streamingMetrics.elapsedTime}
                    isActive={message.streamingMetrics.isActive}
                  />
                </div>
              )}
            </div>
          )}

          {/* Copy button, refresh button (for user messages), and timestamp */}
          <div
            className={`flex items-center justify-between mt-2 transition-opacity ${
              isUser
                ? 'opacity-70 group-hover:opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <span className="text-xs text-muted-foreground">
              {/* {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} */}
            </span>

            <div className="flex items-center gap-1">
              {/* Edit button for user messages */}
              {isUser && onEdit && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Edit message"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}

              {/* Refresh button for user messages */}
              {isUser && onRefresh && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Refresh response"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}

              {/* Copy button */}
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Copy message"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
