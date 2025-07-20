'use client';

import {
  ActivityIndicator,
  RagIndicatorData,
  ScrapingIndicatorData,
} from '@/types/activityIndicators';
import { RAGIndicator } from './RAGIndicator';
import { memo } from 'react';
import { Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatTimestamp } from '@/lib/formatTimestamp';

interface ActivityIndicatorComponentProps {
  indicator: ActivityIndicator;
}

const ScrapingIndicator = memo(function ScrapingIndicator({
  indicator,
}: {
  indicator: ActivityIndicator;
}) {
  const data = indicator.data as ScrapingIndicatorData;

  const getIcon = () => {
    switch (indicator.status) {
      case 'searching':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'fetching':
        return 'Fetching webpage content...';
      case 'processing':
        return 'Processing scraped content...';
      case 'completed':
        return `Scraped ${
          data.contentLength
            ? `${Math.round(data.contentLength / 1000)}k characters from`
            : 'content from'
        } webpage`;
      case 'error':
        return `Failed to scrape: ${data.errorMessage || 'Unknown error'}`;
      default:
        return 'Processing webpage...';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Web Scraping
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-300">
            {formatTimestamp(indicator.timestamp, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
          {getStatusText()}
        </p>
        {data.title && (
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 truncate">
            {data.title}
          </p>
        )}
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 truncate">
          {data.url}
        </p>
      </div>
    </div>
  );
});

export const ActivityIndicatorComponent = memo(
  function ActivityIndicatorComponent({
    indicator,
  }: ActivityIndicatorComponentProps) {
    switch (indicator.type) {
      case 'rag':
        const ragData = indicator.data as RagIndicatorData;
        return (
          <div className="mb-3">
            <RAGIndicator
              isSearching={indicator.status === 'searching'}
              searchQuery={ragData.query}
              resultsCount={ragData.resultsCount}
              sources={ragData.sources}
              braveUsage={ragData.braveUsage}
              scrapingUsed={ragData.scrapingUsed}
            />
          </div>
        );

      case 'scraping':
        return (
          <div className="mb-3">
            <ScrapingIndicator indicator={indicator} />
          </div>
        );

      default:
        return null;
    }
  }
);
