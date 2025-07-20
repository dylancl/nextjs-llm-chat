'use client';

import { memo, useState } from 'react';
import {
  Copy,
  Download,
  Edit,
  ExternalLink,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Code,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Artifact } from '@/types/artifacts';

interface ArtifactHeaderProps {
  artifact: Artifact;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: () => void;
  onExecute?: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onOpenInNewTab?: () => void;
  onClose?: () => void;
  isExecuting?: boolean;
  currentIndex?: number;
  totalArtifacts?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  activeView?: 'preview' | 'code';
  onViewChange?: (view: 'preview' | 'code') => void;
}

export const ArtifactHeader = memo(function ArtifactHeader({
  artifact,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onExecute,
  onCopy,
  onExport,
  onRefresh,
  onOpenInNewTab,
  onClose,
  isExecuting = false,
  currentIndex,
  totalArtifacts,
  onPrevious,
  onNext,
  activeView = 'preview',
  onViewChange,
}: ArtifactHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-background via-muted/30 to-background backdrop-blur-sm">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {totalArtifacts && totalArtifacts > 1 && currentIndex !== undefined && (
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              className="h-7 w-7 p-0 hover:bg-background/80 transition-all duration-200"
              title="Previous artifact (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-background/50 rounded border border-border/30 min-w-[60px] text-center">
              {currentIndex + 1} of {totalArtifacts}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="h-7 w-7 p-0 hover:bg-background/80 transition-all duration-200"
              title="Next artifact (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Badge
            variant="secondary"
            className={`text-xs font-medium border shadow-sm ${getTypeColor(
              artifact.type
            )}`}
          >
            {artifact.type}
          </Badge>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm truncate text-foreground/90">
              {artifact.title}
            </h2>
            {artifact.description && (
              <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                {artifact.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onViewChange && (
          <Tabs
            value={activeView}
            onValueChange={(value) => onViewChange(value as 'preview' | 'code')}
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
        )}

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
            <Copy className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
          )}
        </Button>

        {artifact.type === 'html' && onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group"
            title="Refresh HTML preview"
          >
            <RotateCcw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
          </Button>
        )}

        {artifact.type === 'html' && onOpenInNewTab && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenInNewTab}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        )}

        {artifact.isExecutable && onExecute && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExecute}
            disabled={isExecuting}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group disabled:opacity-50"
            title="Execute"
          >
            <Play
              className={`h-3 w-3 ${
                isExecuting ? 'animate-pulse' : 'group-hover:scale-110'
              } transition-transform duration-200`}
            />
          </Button>
        )}

        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group"
            title="Edit artifact"
          >
            <Edit className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        )}

        {onExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group"
            title="Export artifact"
          >
            <Download className="h-3 w-3 group-hover:translate-y-0.5 transition-transform duration-200" />
          </Button>
        )}

        <div className="h-6 w-px bg-border/30 mx-1" />

        {onToggleExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 px-3 hover:bg-muted/60 transition-all duration-200 group"
            title={isExpanded ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3 group-hover:scale-90 transition-transform duration-200" />
            ) : (
              <Maximize2 className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
            )}
          </Button>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
            title="Close"
          >
            <X className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        )}
      </div>
    </div>
  );
});
