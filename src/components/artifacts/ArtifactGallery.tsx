'use client';

import { memo, useState, useMemo } from 'react';
import { Search, Filter, Download, Trash2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Artifact, ArtifactType } from '@/types/artifacts';
import { ArtifactContainer } from './ArtifactContainer';

interface ArtifactGalleryProps {
  artifacts: Artifact[];
  onExport?: (
    id: string,
    format: 'file' | 'gist' | 'codepen' | 'codesandbox'
  ) => void;
  onDelete?: (id: string) => void;
}

export const ArtifactGallery = memo(function ArtifactGallery({
  artifacts,
  onExport,
  onDelete,
}: ArtifactGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ArtifactType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'title'>(
    'updated'
  );

  const filteredAndSortedArtifacts = useMemo(() => {
    let filtered = artifacts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (artifact) =>
          artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artifact.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artifact.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((artifact) => artifact.type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'updated':
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

    return filtered;
  }, [artifacts, searchQuery, typeFilter, sortBy]);

  const artifactTypes: ArtifactType[] = [
    'code',
    'html',
    'react-component',
    'json',
    'markdown',
    'svg',
    'chart',
  ];

  if (artifacts.length === 0) {
    return (
      <div className="min-h-[60vh] h-full flex items-center justify-center">
        <Card className="p-12 text-center max-w-xl mx-auto shadow-lg border-border/50 bg-gradient-to-br from-background via-muted/20 to-background">
          <div className="text-muted-foreground space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Search className="h-12 w-12 text-primary/60" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">
                No Artifacts Yet
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Artifacts will appear here as you create them through
                conversations with the AI. Start chatting to generate your first
                artifact!
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
          Artifact Gallery
        </h1>
        <p className="text-lg text-muted-foreground">
          {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} created
        </p>
      </div>

      <Card className="p-6 w-full shadow-lg border-border/50 bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search artifacts by title, content, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base w-full bg-background/50 border-border/30 focus:bg-background transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between min-w-[160px] bg-background/50 border-border/30 hover:bg-muted/60 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {typeFilter === 'all'
                      ? 'All Types'
                      : typeFilter.charAt(0).toUpperCase() +
                        typeFilter.slice(1)}
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[160px]">
                <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                  All Types
                </DropdownMenuItem>
                {artifactTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => setTypeFilter(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between min-w-[180px] bg-background/50 border-border/30 hover:bg-muted/60 transition-all duration-200"
                >
                  <span>
                    {sortBy === 'updated'
                      ? 'Recently Updated'
                      : sortBy === 'created'
                      ? 'Recently Created'
                      : 'Title A-Z'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                <DropdownMenuItem onClick={() => setSortBy('updated')}>
                  Recently Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')}>
                  Recently Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title')}>
                  Title A-Z
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {(searchQuery || typeFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-3 px-1">
          <span className="text-sm font-medium text-muted-foreground">
            Showing {filteredAndSortedArtifacts.length} of {artifacts.length}{' '}
            artifacts
          </span>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge
                variant="secondary"
                className="text-xs font-medium border border-border/30 bg-muted/50"
              >
                Search: &ldquo;{searchQuery}&rdquo;
              </Badge>
            )}
            {typeFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="text-xs font-medium border border-border/30 bg-muted/50"
              >
                Type: {typeFilter}
              </Badge>
            )}
          </div>
        </div>
      )}

      {filteredAndSortedArtifacts.length === 0 ? (
        <Card className="p-12 text-center shadow-lg border-border/50 bg-gradient-to-br from-background via-muted/20 to-background">
          <div className="text-muted-foreground space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Search className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Matching Artifacts</h3>
              <p className="text-sm max-w-md mx-auto">
                Try adjusting your search terms or filter criteria to find what
                you&rsquo;re looking for.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
              }}
              className="mt-4 bg-background/50 border-border/30 hover:bg-muted/60 transition-all duration-200"
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="w-full space-y-12">
          {filteredAndSortedArtifacts.map((artifact, index) => (
            <div
              key={artifact.id}
              className={`relative group animate-in fade-in slide-in-from-bottom-4 w-full ${
                artifact.type === 'html' ? 'min-h-[800px]' : 'min-h-[700px]'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-full h-full overflow-hidden">
                <ArtifactContainer
                  artifact={artifact}
                  onExport={onExport}
                  onDelete={onDelete}
                />
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {onExport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExport(artifact.id, 'file')}
                    className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-accent shadow-sm"
                    title="Export artifact"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(artifact.id)}
                    className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm border border-border/50 text-destructive hover:text-destructive hover:bg-destructive/10 shadow-sm"
                    title="Delete artifact"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
