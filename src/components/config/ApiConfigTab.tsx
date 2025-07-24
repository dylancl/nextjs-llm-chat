'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Config } from '@/hooks/useApiConfig';
import { ApiUsageSummary } from '../ApiUsageSummary';
import { BonzaiUsageIndicator } from '../BonzaiUsageIndicator';
import { BraveUsageIndicator } from '../BraveUsageIndicator';

interface ApiConfigTabProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
  availableModels: string[];
}

export function ApiConfigTab({
  config,
  onConfigChange,
  availableModels,
}: ApiConfigTabProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">API Key</label>
        <div className="relative">
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => onConfigChange({ apiKey: e.target.value })}
            placeholder="Enter your Bonzai API key"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!config.apiKey && (
          <p className="text-xs text-muted-foreground">
            API key is required for non-mock mode
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Model</label>
        <select
          value={config.model}
          onChange={(e) => onConfigChange({ model: e.target.value })}
          className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Selected model affects capabilities and pricing
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          System Prompt
        </label>
        <Textarea
          value={config.systemPrompt}
          onChange={(e) => onConfigChange({ systemPrompt: e.target.value })}
          placeholder="Enter system prompt to define the AI's behavior and context..."
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Define how the AI should behave and respond to queries
        </p>
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          API Usage Monitoring
        </h3>
        <div className="space-y-3">
          <ApiUsageSummary />
          <BonzaiUsageIndicator />
          <BraveUsageIndicator />
        </div>
      </div>
    </div>
  );
}
