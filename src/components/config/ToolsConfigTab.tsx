'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Config } from '@/hooks/useApiConfig';
import { BUILT_IN_TOOLS, ToolName } from '@/types/tools';

interface ToolsConfigTabProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
}

export function ToolsConfigTab({
  config,
  onConfigChange,
}: ToolsConfigTabProps) {
  const handleToolToggle = (toolName: ToolName, enabled: boolean) => {
    if (enabled) {
      // Add tool to available tools
      const newTools = [...(config.availableTools || []), toolName];
      onConfigChange({ availableTools: newTools });
    } else {
      // Remove tool from available tools
      const newTools = (config.availableTools || []).filter(
        (t) => t !== toolName
      );
      onConfigChange({ availableTools: newTools });
    }
  };

  const handleToolChoiceChange = (value: string) => {
    onConfigChange({ toolChoice: value as 'auto' | 'none' | string });
  };

  return (
    <div className="space-y-6">
      {/* Enable Tools Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-foreground">
              Enable Tool Calling
            </Label>
            <p className="text-xs text-muted-foreground">
              Allow the AI to call external tools and functions
            </p>
          </div>
          <Switch
            checked={config.useTools}
            onCheckedChange={(checked) => onConfigChange({ useTools: checked })}
          />
        </div>
      </div>

      {config.useTools && (
        <>
          <Separator />

          {/* Tool Selection */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                Available Tools
              </Label>
              <p className="text-xs text-muted-foreground">
                Select which tools the AI can use
              </p>
            </div>

            <div className="grid gap-3">
              {BUILT_IN_TOOLS.map((tool) => (
                <Card key={tool.name} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">
                          {tool.name
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          Function
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                    <Switch
                      checked={
                        config.availableTools?.includes(tool.name) || false
                      }
                      onCheckedChange={(checked) =>
                        handleToolToggle(tool.name, checked)
                      }
                      className="ml-3"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tool Choice Strategy */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                Tool Choice Strategy
              </Label>
              <p className="text-xs text-muted-foreground">
                How the AI should decide when to use tools
              </p>
            </div>

            <select
              value={config.toolChoice}
              onChange={(e) => handleToolChoiceChange(e.target.value)}
              className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="auto">
                Auto - Let AI decide when to use tools
              </option>
              <option value="none">None - Never use tools automatically</option>
            </select>
          </div>

          {/* Tool Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Tool Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {config.availableTools?.length === 0 ? (
                <Badge variant="secondary">No tools selected</Badge>
              ) : (
                config.availableTools?.map((toolName) => (
                  <Badge key={toolName} variant="default" className="text-xs">
                    {toolName
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
