'use client';

import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/hooks/useApiConfig';
import { ConnectionStatusIndicator } from '../ConnectionStatus';
import { RefreshCw } from 'lucide-react';

interface ConfigFooterProps {
  connectionStatus: ConnectionStatus;
  mockMode: boolean;
  messageCount: number;
  model: string;
  lastTestedModel?: string;
  enableSmartConnectionStatus?: boolean;
  onTestConnection?: () => void;
}

export function ConfigFooter({
  connectionStatus,
  mockMode,
  messageCount,
  model,
  lastTestedModel,
  enableSmartConnectionStatus = true,
  onTestConnection,
}: ConfigFooterProps) {
  const isModelMismatch =
    lastTestedModel && lastTestedModel !== model && !mockMode;
  const shouldShowTestButton =
    enableSmartConnectionStatus &&
    onTestConnection &&
    !mockMode &&
    (connectionStatus === 'error' ||
      connectionStatus === 'model-error' ||
      isModelMismatch);

  return (
    <div className="p-6 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            <ConnectionStatusIndicator
              status={connectionStatus}
              mockMode={mockMode}
            />
            {shouldShowTestButton && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onTestConnection}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {isModelMismatch && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border">
            Model changed to {model}. Last test: {lastTestedModel}
          </div>
        )}

        {connectionStatus === 'model-error' && (
          <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border">
            Selected model may not be available or supported
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Messages</span>
          <span className="text-sm font-medium text-foreground">
            {messageCount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Model</span>
          <span
            className="text-sm font-medium text-foreground truncate max-w-32"
            title={model}
          >
            {model}
          </span>
        </div>
      </div>
    </div>
  );
}
