'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Artifact } from '@/types/artifacts';
import { ArtifactRenderer } from './ArtifactRenderer';
import { ArtifactHeader } from './ArtifactHeader';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';
import {
  duotoneDark,
  duotoneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ArtifactViewerProps {
  artifacts: Artifact[];
  onClose?: () => void;
  className?: string;
}

export const ArtifactViewer = memo(function ArtifactViewer({
  artifacts,
  onClose,
  className = '',
}: ArtifactViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { theme } = useTheme();

  const currentArtifact = artifacts[currentIndex];

  useEffect(() => {
    if (artifacts.length > 0) {
      if (currentIndex >= artifacts.length) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(artifacts.length - 1);
      }
    }
  }, [artifacts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : artifacts.length - 1));
  }, [artifacts.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < artifacts.length - 1 ? prev + 1 : 0));
  }, [artifacts.length]);

  const handleCopy = useCallback(async () => {
    if (!currentArtifact) return;
    try {
      await navigator.clipboard.writeText(currentArtifact.content);
    } catch (error) {
      console.error('Failed to copy artifact content:', error);
    }
  }, [currentArtifact]);

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    setTimeout(() => setIsExecuting(false), 1000);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    if (!currentArtifact || currentArtifact.type !== 'html') return;

    const createSandboxedHTML = (content: string): string => {
      let htmlContent = content;

      if (
        !content.trim().toLowerCase().startsWith('<!doctype') &&
        !content.trim().toLowerCase().startsWith('<html')
      ) {
        htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>HTML Preview</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: system-ui, -apple-system, sans-serif;
                  line-height: 1.6;
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `;
      }

      return htmlContent
        .replace(/<script[^>]*src=[^>]*>/gi, '<!-- External script blocked -->')
        .replace(/javascript:/gi, '# javascript: blocked #');
    };

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(createSandboxedHTML(currentArtifact.content));
      newWindow.document.close();
    }
  }, [currentArtifact]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, isFullscreen, onClose]);

  if (!currentArtifact) {
    return null;
  }

  const containerClasses = `
    ${className}
    ${
      isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'flex flex-col h-full'
    }
  `;

  return (
    <div className={containerClasses}>
      <Card className="flex flex-col h-full border-0 rounded-none bg-background shadow-xl">
        <ArtifactHeader
          artifact={currentArtifact}
          currentIndex={currentIndex}
          totalArtifacts={artifacts.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          activeView={activeView}
          onViewChange={setActiveView}
          onCopy={handleCopy}
          onRefresh={
            currentArtifact.type === 'html' ? handleRefresh : undefined
          }
          onOpenInNewTab={
            currentArtifact.type === 'html' ? handleOpenInNewTab : undefined
          }
          onExecute={currentArtifact.isExecutable ? handleExecute : undefined}
          isExecuting={isExecuting}
          onToggleExpand={toggleFullscreen}
          isExpanded={isFullscreen}
          onClose={onClose}
        />

        <div className="flex-1 overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
          <Tabs
            value={activeView}
            onValueChange={(value) =>
              setActiveView(value as 'preview' | 'code')
            }
            className="h-full flex flex-col"
          >
            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <div className="h-full overflow-auto p-6">
                <ArtifactRenderer
                  artifact={currentArtifact}
                  refreshTrigger={refreshTrigger}
                  minHeight="50rem"
                />
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
              <div className="h-full overflow-auto p-6">
                <div className="rounded-lg border border-border/20 overflow-hidden bg-muted/30">
                  <SyntaxHighlighter
                    style={theme === 'dark' ? duotoneDark : duotoneLight}
                    language={currentArtifact.language || 'text'}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      height: '100%',
                      background: 'transparent',
                    }}
                    wrapLongLines
                  >
                    {currentArtifact.content}
                  </SyntaxHighlighter>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
});
