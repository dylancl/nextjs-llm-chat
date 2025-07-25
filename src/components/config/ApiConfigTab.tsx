'use client';

import { useState } from 'react';
import { Eye, EyeOff, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Config } from '@/hooks/useApiConfig';
import { ApiUsageSummary } from '../ApiUsageSummary';
import { BonzaiUsageIndicator } from '../BonzaiUsageIndicator';
import { BraveUsageIndicator } from '../BraveUsageIndicator';
import { getAvailableVariables } from '@/lib/promptVariables';

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
  const [showVariables, setShowVariables] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const availableVariables = getAvailableVariables();

  const copyToClipboard = async (text: string, variableName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariable(variableName);
      setTimeout(() => setCopiedVariable(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            System Prompt
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowVariables(!showVariables)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Info className="h-3 w-3 mr-1" />
            Variables
          </Button>
        </div>
        <Textarea
          value={config.systemPrompt}
          onChange={(e) => onConfigChange({ systemPrompt: e.target.value })}
          placeholder="Enter system prompt to define the AI's behavior and context..."
          className="min-h-[120px] resize-none"
        />
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Define how the AI should behave and respond to queries. You can use
            template variables like{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              {'{{ date }}'}
            </code>{' '}
            or{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              {'{{ time }}'}
            </code>
          </p>
          {showVariables && (
            <div className="border rounded-md p-3 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Available Variables</h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {availableVariables.map((variable) => (
                  <div
                    key={variable.name}
                    className="flex items-center justify-between p-2 bg-background rounded border text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="font-mono bg-muted px-1 py-0.5 rounded">
                          {'{{ ' + variable.name + ' }}'}
                        </code>
                        <span className="text-muted-foreground truncate">
                          {variable.description}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1 truncate">
                        Example: {variable.example}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`{{ ${variable.name} }}`, variable.name)
                      }
                      className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                    >
                      {copiedVariable === variable.name ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
