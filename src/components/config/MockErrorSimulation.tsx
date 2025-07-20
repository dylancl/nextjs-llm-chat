"use client";

import { Switch } from "@/components/ui/switch";
import { MockConfig } from "@/types/mockConfig";
import { formatErrorType } from "@/lib/configUtils";

interface MockErrorSimulationProps {
  mockConfig: MockConfig;
  onUpdate: (updates: Partial<MockConfig>) => void;
}

export function MockErrorSimulation({
  mockConfig,
  onUpdate,
}: MockErrorSimulationProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Error Simulation
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test error handling and resilience
          </p>
        </div>
        <Switch
          checked={mockConfig.errorSimulationEnabled}
          onCheckedChange={(checked) =>
            onUpdate({ errorSimulationEnabled: checked })
          }
        />
      </div>

      {mockConfig.errorSimulationEnabled && (
        <div className="space-y-4 pl-4 border-l-2 border-destructive/20">
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Error Rate: {mockConfig.errorRate}%
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={mockConfig.errorRate}
              onChange={(e) =>
                onUpdate({
                  errorRate: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Never</span>
              <span>25%</span>
              <span>Half</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Percentage of requests that will result in an error
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Error Types
            </label>
            <div className="space-y-2">
              {Object.entries(mockConfig.errorTypes).map(
                ([errorType, enabled]) => (
                  <div
                    key={errorType}
                    className="flex items-center justify-between p-2 bg-background rounded border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="text-sm text-foreground">
                        {formatErrorType(errorType)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {getErrorDescription(errorType)}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        onUpdate({
                          errorTypes: {
                            ...mockConfig.errorTypes,
                            [errorType]: checked,
                          },
                        })
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getErrorDescription(errorType: string): string {
  const descriptions: Record<string, string> = {
    networkError: "Connection timeouts and network failures",
    rateLimited: "API rate limit exceeded responses",
    serverError: "Internal server error (500) responses",
    authError: "Authentication and authorization failures",
    validationError: "Invalid request parameter errors",
  };

  return descriptions[errorType] || "Simulated error condition";
}
