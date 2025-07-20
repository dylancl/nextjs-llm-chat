"use client";

import { Button } from "@/components/ui/button";
import { MOCK_SCENARIOS, MockConfig } from "@/types/mockConfig";

interface MockScenariosProps {
  onScenarioSelect: (config: Partial<MockConfig>) => void;
}

export function MockScenarios({ onScenarioSelect }: MockScenariosProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Quick Scenarios
      </label>
      <div className="grid grid-cols-2 gap-2">
        {MOCK_SCENARIOS.map((scenario) => (
          <Button
            key={scenario.id}
            variant="outline"
            size="sm"
            className="text-xs p-3 h-auto flex flex-col items-start gap-1 hover:bg-muted/50 transition-colors"
            onClick={() => onScenarioSelect(scenario.config)}
          >
            <span className="font-medium text-left">{scenario.name}</span>
            <span className="text-muted-foreground text-left text-wrap leading-tight">
              {scenario.description}
            </span>
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Click a scenario to quickly configure mock behavior
      </p>
    </div>
  );
}
