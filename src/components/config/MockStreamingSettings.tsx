"use client";

import { Input } from "@/components/ui/input";
import { MockConfig } from "@/types/mockConfig";

interface MockStreamingSettingsProps {
  mockConfig: MockConfig;
  onUpdate: (updates: Partial<MockConfig>) => void;
}

export function MockStreamingSettings({
  mockConfig,
  onUpdate,
}: MockStreamingSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">
        Streaming Configuration
      </h3>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Streaming Pattern
        </label>
        <select
          value={mockConfig.streamingPattern}
          onChange={(e) =>
            onUpdate({
              streamingPattern: e.target
                .value as MockConfig["streamingPattern"],
            })
          }
          className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        >
          <option value="realistic">Realistic (variable timing)</option>
          <option value="steady">Steady (consistent pace)</option>
          <option value="burst">Burst (rapid chunks)</option>
          <option value="irregular">Irregular (random pauses)</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Controls how text is streamed to simulate different typing patterns
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Chunk Size (words)
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                max="10"
                value={mockConfig.chunkSize.min}
                onChange={(e) =>
                  onUpdate({
                    chunkSize: {
                      ...mockConfig.chunkSize,
                      min: Math.max(1, parseInt(e.target.value) || 1),
                    },
                  })
                }
                className="text-xs"
                placeholder="Min"
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                max="10"
                value={mockConfig.chunkSize.max}
                onChange={(e) =>
                  onUpdate({
                    chunkSize: {
                      ...mockConfig.chunkSize,
                      max: Math.max(
                        mockConfig.chunkSize.min,
                        parseInt(e.target.value) || 3
                      ),
                    },
                  })
                }
                className="text-xs"
                placeholder="Max"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Words per streaming chunk
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Delay (ms)
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                max="1000"
                step="10"
                value={mockConfig.streamingDelay.min}
                onChange={(e) =>
                  onUpdate({
                    streamingDelay: {
                      ...mockConfig.streamingDelay,
                      min: Math.max(0, parseInt(e.target.value) || 20),
                    },
                  })
                }
                className="text-xs"
                placeholder="Min"
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                max="1000"
                step="10"
                value={mockConfig.streamingDelay.max}
                onChange={(e) =>
                  onUpdate({
                    streamingDelay: {
                      ...mockConfig.streamingDelay,
                      max: Math.max(
                        mockConfig.streamingDelay.min,
                        parseInt(e.target.value) || 100
                      ),
                    },
                  })
                }
                className="text-xs"
                placeholder="Max"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Delay between chunks
          </p>
        </div>
      </div>
    </div>
  );
}
