'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { Artifact } from '@/types/artifacts';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface HtmlRendererProps {
  artifact: Artifact;
  refreshTrigger?: number;
}

export const HtmlRenderer = memo(function HtmlRenderer({
  artifact,
  refreshTrigger,
}: HtmlRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = () => {
    if (!iframeRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const iframe = iframeRef.current;

      // Create sandboxed HTML content
      const sandboxedContent = createSandboxedHTML(artifact.content);

      iframe.srcdoc = sandboxedContent;

      // Handle iframe load
      iframe.onload = () => {
        setIsLoading(false);
      };

      iframe.onerror = () => {
        setError('Failed to load HTML content');
        setIsLoading(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [artifact.content, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    loadContent();
  };

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Preview - Takes up remaining space */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full border border-border rounded-lg overflow-hidden bg-white">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            </div>
          )}

          {error ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 text-sm mb-2">
                  {error}
                </div>
                <Button size="sm" variant="outline" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title={`HTML Preview: ${artifact.title}`}
            />
          )}
        </div>
      </div>
    </div>
  );
});

function createSandboxedHTML(content: string): string {
  // Extract existing content if it's a complete HTML document
  let htmlContent = content;

  // If it's not a complete HTML document, wrap it
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

  // Add basic security measures
  return htmlContent
    .replace(/<script[^>]*src=[^>]*>/gi, '<!-- External script blocked -->')
    .replace(/javascript:/gi, '# javascript: blocked #');
}
