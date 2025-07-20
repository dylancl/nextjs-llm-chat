"use client";

import { Switch } from "@/components/ui/switch";
import { MockConfig } from "@/types/mockConfig";

interface MockAdvancedSettingsProps {
  mockConfig: MockConfig;
  onUpdate: (updates: Partial<MockConfig>) => void;
}

export function MockAdvancedSettings({
  mockConfig,
  onUpdate,
}: MockAdvancedSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Advanced Features</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <div>
            <span className="text-sm font-medium text-foreground">
              Response Variety
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate different responses to identical inputs
            </p>
          </div>
          <Switch
            checked={mockConfig.responseVariety}
            onCheckedChange={(checked) =>
              onUpdate({ responseVariety: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <div>
            <span className="text-sm font-medium text-foreground">
              Context Awareness
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consider previous messages in conversation history
            </p>
          </div>
          <Switch
            checked={mockConfig.conversationContext}
            onCheckedChange={(checked) =>
              onUpdate({ conversationContext: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <div>
            <span className="text-sm font-medium text-foreground">
              Typing Indicator
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show realistic typing patterns and pauses
            </p>
          </div>
          <Switch
            checked={mockConfig.typingIndicator}
            onCheckedChange={(checked) =>
              onUpdate({ typingIndicator: checked })
            }
          />
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Enable these features for more realistic mock
          behavior during development and testing.
        </p>
      </div>
    </div>
  );
}
