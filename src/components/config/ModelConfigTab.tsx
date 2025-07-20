'use client';

import { Bot } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Config } from '@/hooks/useApiConfig';
import { formatTemperature, formatTokenCount } from '@/lib/configUtils';

interface ModelConfigTabProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
}

export function ModelConfigTab({
  config,
  onConfigChange,
}: ModelConfigTabProps) {
  return (
    <div className="space-y-6">
      {/* Temperature Control */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Temperature: {formatTemperature(config.temperature)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature}
          onChange={(e) =>
            onConfigChange({ temperature: parseFloat(e.target.value) })
          }
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Higher values make output more creative but less focused
        </p>
      </div>

      {/* Max Tokens Control */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Max Tokens: {formatTokenCount(config.maxTokens)}
        </label>
        <input
          type="range"
          min="4000"
          max="128000"
          step="4000"
          value={config.maxTokens}
          onChange={(e) =>
            onConfigChange({ maxTokens: parseInt(e.target.value) })
          }
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>4000</span>
          <span>8000</span>
          <span>16000</span>
          <span>32000</span>
          <span>64000</span>
          <span>128000</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Maximum length of the AI response
        </p>
      </div>

      {/* Core Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <div>
            <label className="text-sm font-medium text-foreground">
              Streaming
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time response streaming for better UX
            </p>
          </div>
          <Switch
            checked={config.streaming}
            onCheckedChange={(checked) =>
              onConfigChange({ streaming: checked })
            }
          />
        </div>
      </div>

      <Separator />

      {/* RAG Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Bot className="h-4 w-4" />
          RAG (Retrieval-Augmented Generation)
        </h3>

        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <div>
            <label className="text-sm font-medium text-foreground">
              Enable RAG
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search web for context before answering questions
            </p>
          </div>
          <Switch
            checked={config.useRag}
            onCheckedChange={(checked) => onConfigChange({ useRag: checked })}
          />
        </div>

        {config.useRag && (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Search Results: {config.ragSearchResults}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.ragSearchResults}
                onChange={(e) =>
                  onConfigChange({
                    ragSearchResults: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Number of search results to include as context
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Enable Web Scraping
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use AI to select and scrape the most relevant search result
                  for better context
                </p>
              </div>
              <Switch
                checked={config.useWebScraping}
                onCheckedChange={(checked) =>
                  onConfigChange({ useWebScraping: checked })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
