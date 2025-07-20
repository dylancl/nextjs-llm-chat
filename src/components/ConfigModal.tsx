'use client';

import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Config, ConnectionStatus } from '@/hooks/useApiConfig';
import { ApiConfigTab } from './config/ApiConfigTab';
import { ModelConfigTab } from './config/ModelConfigTab';
import { MockConfigTab } from './config/MockConfigTab';
import { DebugConfigTab } from './config/DebugConfigTab';
import { ConfigFooter } from './config/ConfigFooter';

interface ConfigModalProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
  connectionStatus: ConnectionStatus;
  messageCount: number;
  availableModels: string[];
  lastTestedModel?: string;
  onTestConnection?: () => void;
  onClearCache?: () => void;
}

export function ConfigModal({
  config,
  onConfigChange,
  connectionStatus,
  messageCount,
  availableModels,
  lastTestedModel,
  onTestConnection,
  onClearCache,
}: ConfigModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center">
              <Settings className="h-3 w-3 text-primary-foreground" />
            </div>
            Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
          <Tabs defaultValue="api" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 h-8 flex-shrink-0">
              <TabsTrigger value="api" className="text-xs">
                API
              </TabsTrigger>
              <TabsTrigger value="model" className="text-xs">
                Model
              </TabsTrigger>
              <TabsTrigger value="mock" className="text-xs">
                Mock
              </TabsTrigger>
              <TabsTrigger value="debug" className="text-xs">
                Debug
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="api"
              className="mt-3 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="pr-2 space-y-4">
                <ApiConfigTab
                  config={config}
                  onConfigChange={onConfigChange}
                  availableModels={availableModels}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="model"
              className="mt-3 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="pr-2 space-y-4">
                <ModelConfigTab
                  config={config}
                  onConfigChange={onConfigChange}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="mock"
              className="mt-3 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="pr-2 space-y-4">
                <MockConfigTab
                  config={config}
                  onConfigChange={onConfigChange}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="debug"
              className="mt-3 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="pr-2 space-y-4">
                <DebugConfigTab
                  config={config}
                  onConfigChange={onConfigChange}
                  onTestConnection={onTestConnection}
                  onClearCache={onClearCache}
                  lastTestedModel={lastTestedModel}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border px-6 py-4">
          <ConfigFooter
            connectionStatus={connectionStatus}
            mockMode={config.mockMode}
            messageCount={messageCount}
            model={config.model}
            lastTestedModel={lastTestedModel}
            enableSmartConnectionStatus={config.enableSmartConnectionStatus}
            onTestConnection={onTestConnection}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
