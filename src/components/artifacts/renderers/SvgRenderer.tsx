'use client';

import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Download, Copy, CheckCircle2 } from 'lucide-react';
import { Artifact } from '@/types/artifacts';

interface SvgRendererProps {
  artifact: Artifact;
}

export const SvgRenderer = memo(function SvgRenderer({
  artifact,
}: SvgRendererProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy SVG content:', error);
    }
  }, [artifact.content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([artifact.content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [artifact.content, artifact.title]);

  // Parse SVG to get dimensions
  const getSvgInfo = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(artifact.content, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (svgElement) {
        const width = svgElement.getAttribute('width') || 'auto';
        const height = svgElement.getAttribute('height') || 'auto';
        const viewBox = svgElement.getAttribute('viewBox') || 'none';

        return { width, height, viewBox };
      }
    } catch (error) {
      console.error('Error parsing SVG:', error);
    }

    return { width: 'unknown', height: 'unknown', viewBox: 'none' };
  };

  const svgInfo = getSvgInfo();

  return (
    <div className="space-y-4">
      {/* Header with info and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            SVG
          </Badge>
          <span className="text-xs text-muted-foreground">
            {svgInfo.width} × {svgInfo.height}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
          >
            {copied ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tabs for preview/code */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'preview' | 'code')}
      >
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="preview" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            <Code className="h-3 w-3 mr-1" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <div className="p-6 bg-white dark:bg-gray-50 rounded-lg border border-border flex items-center justify-center min-h-[200px]">
            <div
              dangerouslySetInnerHTML={{ __html: artifact.content }}
              className="max-w-full max-h-96 flex items-center justify-center"
            />
          </div>

          {svgInfo.viewBox !== 'none' && (
            <div className="mt-2 text-xs text-muted-foreground">
              ViewBox: {svgInfo.viewBox}
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <div className="relative">
            <pre className="bg-muted/50 rounded-lg border border-border p-4 text-xs overflow-x-auto max-h-96">
              <code className="text-foreground">{artifact.content}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});
