'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Config } from '@/hooks/useApiConfig';
import { RefreshCw, Trash2, Info } from 'lucide-react';

interface DebugConfigTabProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
  onTestConnection?: () => void;
  onClearCache?: () => void;
  lastTestedModel?: string;
}

export function DebugConfigTab({
  config,
  onConfigChange,
  onTestConnection,
  onClearCache,
  lastTestedModel,
}: DebugConfigTabProps) {
  return (
    <div className="space-y-6">
      {/* Connection Testing */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Connection Testing
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Smart Model Validation
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically test model availability when changing models
              </p>
            </div>
            <Switch
              checked={config.enableSmartConnectionStatus}
              onCheckedChange={(checked: boolean) =>
                onConfigChange({ enableSmartConnectionStatus: checked })
              }
            />
          </div>

          {lastTestedModel && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last tested model:</span>
              <Badge variant="secondary" className="text-xs">
                {lastTestedModel}
              </Badge>
            </div>
          )}

          <div className="flex gap-2">
            {onTestConnection && (
              <Button
                size="sm"
                variant="outline"
                onClick={onTestConnection}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Test Current Model
              </Button>
            )}

            {onClearCache && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClearCache}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cache
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Development Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Development Settings
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Development Mode
              </label>
              <p className="text-xs text-muted-foreground">
                Extended caching (5min) to reduce API calls during development
              </p>
            </div>
            <Switch
              checked={config.devMode}
              onCheckedChange={(checked: boolean) =>
                onConfigChange({ devMode: checked })
              }
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Cache Settings
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  {config.devMode
                    ? 'Development mode: Connection tests cached for 5 minutes'
                    : 'Production mode: Connection tests cached for 30 seconds'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
