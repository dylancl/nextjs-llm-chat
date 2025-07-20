'use client';

import { useState } from 'react';
import { Search, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RAGIndicatorProps {
  isSearching?: boolean;
  searchQuery?: string;
  resultsCount?: number;
  sources?: Array<{
    title: string;
    url: string;
  }>;
  braveUsage?: {
    requestsThisMonth: number;
    monthlyLimit: number;
    requestsRemaining: number;
  };
  scrapingUsed?: boolean;
  scrapedSource?: {
    title: string;
    url: string;
    contentLength: number;
  };
  className?: string;
}

export function RAGIndicator({
  isSearching = false,
  searchQuery,
  resultsCount,
  sources = [],
  braveUsage,
  scrapingUsed = false,
  className = '',
}: RAGIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show indicator if searching or if we have results
  if (!isSearching && !resultsCount && !braveUsage && sources.length === 0) {
    return null;
  }

  const hasSourcesData = sources.length > 0;
  const showDropdown = hasSourcesData && !isSearching;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Search className={`h-3 w-3 ${isSearching ? 'animate-spin' : ''}`} />
          {isSearching && (
            <span className="animate-pulse">Searching web...</span>
          )}
          {!isSearching && resultsCount && resultsCount > 0 && (
            <>
              <span>
                Found {resultsCount} result{resultsCount !== 1 ? 's' : ''}
              </span>
              {scrapingUsed && (
                <Badge variant="secondary" className="text-xs ml-2">
                  Scraped
                </Badge>
              )}
            </>
          )}
        </div>

        {searchQuery && !isSearching && (
          <div className="group relative">
            <a
              href={`https://search.brave.com/search?q=${encodeURIComponent(
                searchQuery
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-2 w-2 mr-1 flex-shrink-0" />
                {searchQuery.length > 30
                  ? `${searchQuery.slice(0, 30)}...`
                  : searchQuery}
              </Badge>
            </a>
            {searchQuery.length > 30 && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap text-xs">
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-2 w-2 flex-shrink-0" />
                  {searchQuery}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Sources Button */}
        {showDropdown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-5 px-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View sources
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        )}
      </div>

      {/* Expandable Sources Section */}
      {isExpanded && showDropdown && (
        <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border">
          {/* Other Search Results */}
          {(!scrapingUsed || sources.length > 1) && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-foreground mb-2">
                {scrapingUsed ? 'Other Search Results' : 'Search Results'}
              </div>
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate font-medium group-hover:underline">
                    {source.title}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Brave API Usage if available */}
          {braveUsage && (
            <div className="mt-3 pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                API Usage: {braveUsage.requestsThisMonth}/
                {braveUsage.monthlyLimit} this month
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
