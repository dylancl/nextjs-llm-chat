"use client";

import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Config } from "@/hooks/useApiConfig";
import { useMockConfig } from "@/hooks/useMockConfig";
import { MockScenarios } from "./MockScenarios";
import { MockResponseSettings } from "./MockResponseSettings";
import { MockStreamingSettings } from "./MockStreamingSettings";
import { MockErrorSimulation } from "./MockErrorSimulation";
import { MockAdvancedSettings } from "./MockAdvancedSettings";

interface MockConfigTabProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
}

export function MockConfigTab({ config, onConfigChange }: MockConfigTabProps) {
  const { mockConfig, updateMockConfig, toggleMockMode } = useMockConfig({
    config,
    onConfigChange,
  });

  return (
    <div className="space-y-6">
      {/* Mock Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
        <div>
          <label className="text-sm font-medium text-foreground">
            Mock Mode
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use simulated responses for testing and development
          </p>
        </div>
        <Switch checked={config.mockMode} onCheckedChange={toggleMockMode} />
      </div>

      {config.mockMode && (
        <>
          <Separator />

          {/* Quick Scenarios */}
          <MockScenarios onScenarioSelect={updateMockConfig} />

          <Separator />

          {/* Response Configuration */}
          <MockResponseSettings
            mockConfig={mockConfig}
            onUpdate={updateMockConfig}
          />

          <Separator />

          {/* Streaming Configuration */}
          <MockStreamingSettings
            mockConfig={mockConfig}
            onUpdate={updateMockConfig}
          />

          <Separator />

          {/* Error Simulation */}
          <MockErrorSimulation
            mockConfig={mockConfig}
            onUpdate={updateMockConfig}
          />

          <Separator />

          {/* Advanced Features */}
          <MockAdvancedSettings
            mockConfig={mockConfig}
            onUpdate={updateMockConfig}
          />
        </>
      )}

      {!config.mockMode && (
        <div className="p-6 text-center bg-muted/30 rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Enable Mock Mode to access configuration options
          </p>
        </div>
      )}
    </div>
  );
}
