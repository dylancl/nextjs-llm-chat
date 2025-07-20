'use client';

import { memo, Suspense } from 'react';
import { Artifact } from '@/types/artifacts';
import { CodeRenderer } from './renderers/CodeRenderer';
import { HtmlRenderer } from './renderers/HtmlRenderer';
import { ReactComponentRenderer } from './renderers/ReactComponentRenderer';
import { JsonRenderer } from './renderers/JsonRenderer';
import { MarkdownRenderer } from './renderers/MarkdownRenderer';
import { SvgRenderer } from './renderers/SvgRenderer';
import { ChartRenderer } from './renderers/ChartRenderer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ArtifactRendererProps {
  artifact: Artifact;
  refreshTrigger?: number;
  minHeight?: string;
}

export const ArtifactRenderer = memo(function ArtifactRenderer({
  artifact,
  refreshTrigger,
  minHeight = '400px',
}: ArtifactRendererProps) {
  const renderContent = () => {
    switch (artifact.type) {
      case 'code':
        return <CodeRenderer artifact={artifact} />;

      case 'html':
        return (
          <HtmlRenderer artifact={artifact} refreshTrigger={refreshTrigger} />
        );

      case 'react-component':
        return <ReactComponentRenderer artifact={artifact} />;

      case 'json':
        return <JsonRenderer artifact={artifact} />;

      case 'markdown':
        return <MarkdownRenderer artifact={artifact} />;

      case 'svg':
        return <SvgRenderer artifact={artifact} />;

      case 'chart':
        return <ChartRenderer artifact={artifact} />;

      default:
        return (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Unsupported artifact type: {artifact.type}
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="artifact-content w-full h-full" style={{ minHeight }}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        }
      >
        <div className="w-full h-full">{renderContent()}</div>
      </Suspense>
    </div>
  );
});
