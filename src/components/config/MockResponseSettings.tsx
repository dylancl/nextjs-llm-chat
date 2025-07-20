"use client";

import { Textarea } from "@/components/ui/textarea";
import { MockConfig } from "@/types/mockConfig";

interface MockResponseSettingsProps {
  mockConfig: MockConfig;
  onUpdate: (updates: Partial<MockConfig>) => void;
}

export function MockResponseSettings({
  mockConfig,
  onUpdate,
}: MockResponseSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Response Settings</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Length
          </label>
          <select
            value={mockConfig.responseLength}
            onChange={(e) =>
              onUpdate({
                responseLength: e.target.value as MockConfig["responseLength"],
              })
            }
            className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          >
            <option value="short">Short (1-2 sentences)</option>
            <option value="medium">Medium (paragraph)</option>
            <option value="long">Long (multiple paragraphs)</option>
            <option value="variable">Variable (random)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Style
          </label>
          <select
            value={mockConfig.responseStyle || "professional"}
            onChange={(e) =>
              onUpdate({
                responseStyle: e.target.value as MockConfig["responseStyle"],
              })
            }
            className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="technical">Technical</option>
            <option value="creative">Creative</option>
            <option value="concise">Concise</option>
            <option value="verbose">Verbose</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Template
        </label>
        <select
          value={mockConfig.responseTemplate || "random"}
          onChange={(e) =>
            onUpdate({
              responseTemplate: e.target
                .value as MockConfig["responseTemplate"],
            })
          }
          className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        >
          <option value="random">Random</option>
          <option value="technical">Technical</option>
          <option value="explanation">Explanation</option>
          <option value="listing">Listing</option>
          <option value="conversation">Conversation</option>
          <option value="custom">Custom</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Template structure for generated responses
        </p>
      </div>

      {mockConfig.responseTemplate === "custom" && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Template
          </label>
          <Textarea
            value={mockConfig.customTemplate}
            onChange={(e) => onUpdate({ customTemplate: e.target.value })}
            placeholder="Enter custom template with {{variables}}..."
            className="min-h-[80px] resize-none text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use variables like {`{{user_message}}`}, {`{{timestamp}}`},{" "}
            {`{{random_word}}`}
          </p>
        </div>
      )}
    </div>
  );
}
