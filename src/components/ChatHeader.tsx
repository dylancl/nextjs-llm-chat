'use client';

import React, { memo, useState, useEffect } from 'react';
import { Archive, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ConnectionStatus, Config } from '@/hooks/useApiConfig';
import { ThemeToggle } from './ThemeToggle';
import { ArtifactGallery } from './artifacts/ArtifactGallery';
import { useArtifactContext } from '@/contexts/ArtifactContext';
import { ConfigModal } from './ConfigModal';

// Animation component for conversation title
const ConversationTitle = memo(function ConversationTitle({
  currentConversation,
  messageCount,
}: {
  currentConversation?: ConversationPreview | null;
  messageCount: number;
}) {
  const [displayText, setDisplayText] = useState('New Conversation');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);

  const getCurrentText = () => {
    if (!currentConversation) {
      return 'New Conversation';
    }

    // If we have a conversation with a proper generated title
    const hasGeneratedTitle =
      currentConversation.title &&
      currentConversation.title.length > 0 &&
      !currentConversation.title.startsWith('Conversation') &&
      !currentConversation.title.includes('#');

    if (hasGeneratedTitle) {
      return currentConversation.title;
    }

    // Show generating state when we have messages but no proper title yet
    if (messageCount >= 1) {
      return 'Generating title...';
    }

    return 'New Conversation';
  };

  const currentText = getCurrentText();
  const isGenerating = currentText === 'Generating title...';
  const isNewTitle =
    currentText !== 'New Conversation' &&
    currentText !== 'Generating title...' &&
    currentText !== displayText;

  useEffect(() => {
    if (currentText !== displayText) {
      setIsAnimating(true);

      // If transitioning to a real title, show typewriter effect
      if (isNewTitle) {
        setShowTypewriter(true);
      }

      // Fade out and slide down current text
      setTimeout(() => {
        setDisplayText(currentText);
        // Fade in and slide up new text after a brief pause
        setTimeout(() => {
          setIsAnimating(false);
          if (showTypewriter) {
            // Reset typewriter after animation
            setTimeout(() => setShowTypewriter(false), 1000);
          }
        }, 200);
      }, 200);
    }
  }, [currentText, displayText, isNewTitle, showTypewriter]);

  return (
    <p className="text-sm text-muted-foreground min-h-[1.25rem] relative overflow-hidden">
      <span
        className={`inline-block transition-all duration-200 ease-out transform ${
          isAnimating
            ? 'opacity-0 translate-y-2 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
        } ${isGenerating ? 'text-blue-400' : ''} ${
          showTypewriter && !isAnimating ? '' : ''
        }`}
        style={{
          willChange: 'transform, opacity',
        }}
      >
        {displayText}
        {showTypewriter && !isAnimating && (
          <span className="animate-ping inline-block w-0.5 h-3 bg-blue-400 ml-1" />
        )}
      </span>
    </p>
  );
});

interface ConversationPreview {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastUserMessage?: string;
}

interface ChatHeaderProps {
  model: string;
  connectionStatus: ConnectionStatus;
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
  messageCount: number;
  availableModels: string[];
  lastTestedModel?: string;
  onTestConnection?: () => void;
  onClearCache?: () => void;
  onOpenConversations?: () => void;
  currentConversation?: ConversationPreview | null;
}

export const ChatHeader = memo(function ChatHeader({
  model,
  connectionStatus,
  config,
  onConfigChange,
  messageCount,
  availableModels,
  lastTestedModel,
  onTestConnection,
  onClearCache,
  onOpenConversations,
  currentConversation,
}: ChatHeaderProps) {
  const { artifacts, deleteArtifact, exportArtifact } = useArtifactContext();

  const handleExport = async (
    id: string,
    format: 'file' | 'gist' | 'codepen' | 'codesandbox'
  ) => {
    try {
      await exportArtifact(id, format);
    } catch (error) {
      console.error('Failed to export artifact:', error);
    }
  };

  return (
    <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                AI Playground
              </h1>
              <ConversationTitle
                currentConversation={currentConversation}
                messageCount={messageCount}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant={
                connectionStatus === 'connected' ? 'default' : 'secondary'
              }
              className="font-medium"
            >
              {model}
            </Badge>
            {onOpenConversations && (
              <Button variant="outline" size="sm" onClick={onOpenConversations}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversations
              </Button>
            )}
            <ConfigModal
              config={config}
              onConfigChange={onConfigChange}
              connectionStatus={connectionStatus}
              messageCount={messageCount}
              availableModels={availableModels}
              lastTestedModel={lastTestedModel}
              onTestConnection={onTestConnection}
              onClearCache={onClearCache}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Gallery ({artifacts.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[80vh] h-full min-w-[90vw]">
                <div className="overflow-auto h-full">
                  <ArtifactGallery
                    artifacts={artifacts}
                    onExport={handleExport}
                    onDelete={deleteArtifact}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
});
