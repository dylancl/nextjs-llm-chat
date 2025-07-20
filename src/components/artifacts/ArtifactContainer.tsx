'use client';

import { memo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Code, Play, Copy, Check } from 'lucide-react';
import { Artifact } from '@/types/artifacts';
import { ArtifactRenderer } from './ArtifactRenderer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';
import {
  duotoneDark,
  duotoneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ArtifactContainerProps {
  artifact: Artifact;
  onUpdate?: (id: string, updates: Partial<Artifact>) => void;
  onDelete?: (id: string) => void;
  onExport?: (
    id: string,
    format: 'file' | 'gist' | 'codepen' | 'codesandbox'
  ) => void;
}

export const ArtifactContainer = memo(function ArtifactContainer({
  artifact,
  onUpdate,
  onDelete,
  onExport,
}: ArtifactContainerProps) {
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  void onUpdate;
  void onDelete;
  void onExport;

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    setTimeout(() => setIsExecuting(false), 1000);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy artifact content:', error);
    }
  }, [artifact.content]);

  const getTypeColor = (type: string) => {
    const colorMap = {
      'react-component':
        'bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 border-blue-200 dark:from-blue-400/10 dark:to-blue-500/10 dark:text-blue-300 dark:border-blue-800',
      html: 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-700 border-orange-200 dark:from-orange-400/10 dark:to-red-400/10 dark:text-orange-300 dark:border-orange-800',
      code: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-200 dark:from-green-400/10 dark:to-emerald-400/10 dark:text-green-300 dark:border-green-800',
      json: 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 border-purple-200 dark:from-purple-400/10 dark:to-violet-400/10 dark:text-purple-300 dark:border-purple-800',
      markdown:
        'bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-slate-700 border-slate-200 dark:from-slate-400/10 dark:to-gray-400/10 dark:text-slate-300 dark:border-slate-800',
      svg: 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-pink-700 border-pink-200 dark:from-pink-400/10 dark:to-rose-400/10 dark:text-pink-300 dark:border-pink-800',
      chart:
        'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-700 border-yellow-200 dark:from-yellow-400/10 dark:to-amber-400/10 dark:text-yellow-300 dark:border-yellow-800',
    };
    return (
      colorMap[type as keyof typeof colorMap] ||
      'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-700 border-gray-200 dark:from-gray-400/10 dark:to-slate-400/10 dark:text-gray-300 dark:border-gray-800'
    );
  };

  return (
    <Card className="artifact-container w-full border-border/50 overflow-hidden min-h-[600px] h-full flex flex-col shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-background via-muted/30 to-background backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Badge
            variant="secondary"
            className={`text-xs font-medium border shadow-sm ${getTypeColor(
              artifact.type
            )}`}
          >
            {artifact.type}
          </Badge>
          <h3 className="font-semibold text-base truncate text-foreground/90">
            {artifact.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Tabs
            value={activeView}
            onValueChange={(value) =>
              setActiveView(value as 'preview' | 'code')
            }
            className="h-8"
          >
            <TabsList className="h-8 bg-muted/50 border border-border/30">
              <TabsTrigger
                value="preview"
                className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Eye className="h-3 w-3 mr-1.5" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Code className="h-3 w-3 mr-1.5" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-6 w-px bg-border/30 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group"
            title={copied ? 'Copied!' : 'Copy content'}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            )}
          </Button>

          {artifact.isExecutable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting}
              className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group disabled:opacity-50"
              title="Execute"
            >
              <Play
                className={`h-4 w-4 ${
                  isExecuting ? 'animate-pulse' : 'group-hover:scale-110'
                } transition-transform duration-200`}
              />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as 'preview' | 'code')}
          className="h-full flex flex-col"
        >
          <TabsContent
            value="preview"
            className={`flex-1 overflow-y-auto m-0 ${
              artifact.type === 'html' ? 'p-4' : 'p-6'
            }`}
          >
            <div className="w-full h-full">
              <ArtifactRenderer
                artifact={artifact}
                minHeight={artifact.type === 'html' ? '600px' : '400px'}
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-y-auto m-0 p-6">
            <div className="w-full">
              <SyntaxHighlighter
                style={theme === 'dark' ? duotoneDark : duotoneLight}
                language={artifact.language || 'text'}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  width: '100%',
                  background: 'transparent',
                }}
                wrapLongLines={true}
              >
                {artifact.content}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
});
