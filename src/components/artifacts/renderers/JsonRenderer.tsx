'use client';

import { memo, useState, useMemo } from 'react';
import { Artifact } from '@/types/artifacts';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronRight, Copy, AlertTriangle } from 'lucide-react';

interface JsonRendererProps {
  artifact: Artifact;
}

export const JsonRenderer = memo(function JsonRenderer({
  artifact,
}: JsonRendererProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [copied, setCopied] = useState(false);

  const { parsedJson, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(artifact.content);
      return { parsedJson: parsed, error: null };
    } catch (err) {
      return {
        parsedJson: null,
        error: err instanceof Error ? err.message : 'Invalid JSON',
      };
    }
  }, [artifact.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (obj: unknown): string => {
    return JSON.stringify(obj, null, 2);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Invalid JSON:</strong> {error}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Raw Content:</h4>
          <pre className="p-4 bg-muted/50 rounded-lg border border-border text-sm overflow-x-auto">
            <code>{artifact.content}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={viewMode === 'formatted' ? 'default' : 'outline'}
          onClick={() => setViewMode('formatted')}
          className="h-8 px-3 text-xs"
        >
          Tree View
        </Button>

        <Button
          size="sm"
          variant={viewMode === 'raw' ? 'default' : 'outline'}
          onClick={() => setViewMode('raw')}
          className="h-8 px-3 text-xs"
        >
          Raw JSON
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 px-3 text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Content Display */}
      {viewMode === 'formatted' ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">JSON Tree:</h4>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <JsonTreeView data={parsedJson} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Formatted JSON:
          </h4>
          <pre className="p-4 bg-muted/50 rounded-lg border border-border text-sm overflow-x-auto">
            <code>{formatJson(parsedJson)}</code>
          </pre>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Size: {new Blob([artifact.content]).size} bytes</div>
        <div>
          Keys:{' '}
          {parsedJson && typeof parsedJson === 'object' && parsedJson !== null
            ? Object.keys(parsedJson).length
            : 'N/A'}
        </div>
      </div>
    </div>
  );
});

interface JsonTreeViewProps {
  data: unknown;
  level?: number;
}

function JsonTreeView({ data, level = 0 }: JsonTreeViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderValue = (value: unknown, key?: string): React.ReactNode => {
    const fullKey = key ? `${level}-${key}` : `${level}`;
    const isCollapsed = collapsed.has(fullKey);

    if (value === null) {
      return <span className="text-gray-500 italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className="text-blue-600 dark:text-blue-400">
          {String(value)}
        </span>
      );
    }

    if (typeof value === 'number') {
      return (
        <span className="text-green-600 dark:text-green-400">{value}</span>
      );
    }

    if (typeof value === 'string') {
      return (
        <span className="text-orange-600 dark:text-orange-400">
          &quot;{value}&quot;
        </span>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div>
          <button
            onClick={() => toggleCollapse(fullKey)}
            className="flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 mr-1" />
            )}
            Array[{value.length}]
          </button>
          {!isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-[2rem]">[{index}]:</span>
                  <JsonTreeView data={item} level={level + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      return (
        <div>
          <button
            onClick={() => toggleCollapse(fullKey)}
            className="flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 mr-1" />
            )}
            Object{`{${entries.length}}`}
          </button>
          {!isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              {entries.map(([objKey, objValue]) => (
                <div key={objKey} className="flex items-start gap-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium min-w-[4rem]">
                    &quot;{objKey}&quot;:
                  </span>
                  <JsonTreeView data={objValue} level={level + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
    );
  };

  return <div className="text-sm">{renderValue(data)}</div>;
}
