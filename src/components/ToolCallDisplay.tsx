'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  FileText,
  Copy,
  Check,
  Loader,
} from 'lucide-react';
import { ToolCall, ToolResult } from '@/types/tools';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Main parent component
export function ToolCallDisplay({
  toolCalls,
  toolResults,
}: {
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
}) {
  const getToolResult = (callId: string) => {
    return toolResults?.find((result) => result.toolCallId === callId);
  };

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div
      className="ml-2 mt-4 mb-2 space-y-0"
      role="region"
      aria-label="Tool Executions Timeline"
    >
      {toolCalls.map((toolCall, index) => (
        <ToolCallTimelineItem
          key={toolCall.id}
          toolCall={toolCall}
          result={getToolResult(toolCall.id)}
          index={index}
          isLast={index === toolCalls.length - 1}
        />
      ))}
    </div>
  );
}

// Individual item in the timeline
function ToolCallTimelineItem({
  toolCall,
  result,
  index,
  isLast,
}: {
  toolCall: ToolCall;
  result?: ToolResult;
  index: number;
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const hasError = result?.error;
  const isComplete = !!result;
  const isRunning = !isComplete && !hasError;

  const getStatusInfo = () => {
    if (hasError) {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        ringColor: 'ring-red-500/30',
        lineColor: 'bg-red-200 dark:bg-red-500/20',
        badgeVariant: 'destructive' as const,
        label: 'Failed',
      };
    }
    if (isComplete) {
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        ringColor: 'ring-green-500/30',
        lineColor: 'bg-green-200 dark:bg-green-500/20',
        badgeVariant: 'default' as const,
        label: 'Completed',
      };
    }
    if (isRunning) {
      // If the tool call is still running, show a loading state
      return {
        icon: Loader,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        ringColor: 'ring-yellow-500/30',
        lineColor: 'bg-yellow-200 dark:bg-yellow-500/20',
        badgeVariant: 'secondary' as const,
        label: 'Running',
        animation: 'animate-spin',
      };
    }
    return {
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      ringColor: 'ring-blue-500/30',
      lineColor: 'bg-blue-200 dark:bg-blue-500/20',
      badgeVariant: 'secondary' as const,
      label: 'Running',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatToolName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatArguments = (argsString: string) => {
    try {
      if (!argsString || argsString.trim() === '') return 'No arguments';
      const args = JSON.parse(argsString);
      const entries = Object.entries(args);
      if (entries.length === 0) return 'No arguments';
      const summary = entries
        .map(([key, value]) => {
          const valStr =
            typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
          return `${key}=${valStr}`;
        })
        .join(', ');
      return summary.length > 80 ? summary.substring(0, 80) + '...' : summary;
    } catch {
      return argsString || 'Invalid arguments';
    }
  };

  const formatJson = (jsonString: string) => {
    try {
      if (!jsonString || jsonString.trim() === '')
        return 'No arguments provided';
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonString;
    }
  };

  const formatResult = (res: ToolResult) => {
    if (res.error) return res.error;
    if (typeof res.result === 'string') {
      try {
        // Try to parse and re-format if it's a JSON string
        return JSON.stringify(JSON.parse(res.result), null, 2);
      } catch {
        // Return as-is if not a valid JSON string
        return res.result;
      }
    }
    return JSON.stringify(res.result, null, 2);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className={cn(
        'relative flex gap-4 transition-opacity duration-500 ease-out',
        'opacity-0',
        isVisible && 'opacity-100'
      )}
      style={{
        transitionDelay: isVisible ? `${index * 50}ms` : '0ms',
      }}
    >
      {/* Timeline Line and Icon */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full ring-4',
            statusInfo.bgColor,
            statusInfo.ringColor,
            'transition-colors duration-300 ease-in-out',
            statusInfo.animation ? statusInfo.animation : ''
          )}
        >
          <StatusIcon className={cn('h-5 w-5', statusInfo.color)} />
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-grow', statusInfo.lineColor)}></div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-8 pt-1', isLast && 'pb-2')}>
        <div
          className="group cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="font-semibold text-sm text-foreground">
                {formatToolName(toolCall.function.name)}
              </p>
              <Badge
                variant={statusInfo.badgeVariant}
                className="h-5 text-xs font-medium"
              >
                {statusInfo.label}
              </Badge>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground',
                isExpanded && 'rotate-180'
              )}
            />
          </div>
          {!isExpanded && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
              {formatArguments(toolCall.function.arguments)}
            </p>
          )}
        </div>

        {/* Collapsible Content */}
        <div
          ref={contentRef}
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
          }}
        >
          <div className="overflow-hidden">
            <div className="mt-4 space-y-4">
              <DetailSection
                title="Arguments"
                icon={Code2}
                content={formatJson(toolCall.function.arguments)}
                onCopy={() =>
                  copyToClipboard(
                    formatJson(toolCall.function.arguments),
                    'args'
                  )
                }
                isCopied={copiedField === 'args'}
              />
              {result && (
                <DetailSection
                  title={!!hasError ? 'Error Details' : 'Result'}
                  icon={FileText}
                  content={formatResult(result)}
                  onCopy={() => copyToClipboard(formatResult(result), 'result')}
                  isCopied={copiedField === 'result'}
                  isError={!!hasError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// A helper component for displaying Argument/Result sections
function DetailSection({
  title,
  icon: Icon,
  content,
  onCopy,
  isCopied,
  isError = false,
}: {
  title: string;
  icon: React.ElementType;
  content: string;
  onCopy: () => void;
  isCopied: boolean;
  isError?: boolean | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          className="h-6 w-6"
          title={`Copy ${title.toLowerCase()}`}
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>
      <pre
        className={cn(
          'text-xs font-mono p-3 rounded-md border',
          'bg-background/50 text-foreground',
          'overflow-x-auto max-h-60 custom-scrollbar',
          isError &&
            'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-700/50 text-red-900 dark:text-red-200'
        )}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}
