import { useCallback } from "react";
import { MockConfig, DEFAULT_MOCK_CONFIG } from "@/types/mockConfig";
import { Config } from "@/hooks/useApiConfig";

interface UseMockConfigProps {
  config: Config;
  onConfigChange: (updates: Partial<Config>) => void;
}

export function useMockConfig({ config, onConfigChange }: UseMockConfigProps) {
  // Ensure mockConfig exists with fallback
  const mockConfig = config.mockConfig || DEFAULT_MOCK_CONFIG;

  const updateMockConfig = useCallback(
    (updates: Partial<MockConfig>) => {
      onConfigChange({
        mockConfig: {
          ...mockConfig,
          ...updates,
        },
      });
    },
    [mockConfig, onConfigChange]
  );

  const toggleMockMode = useCallback(
    (enabled: boolean) => {
      onConfigChange({ mockMode: enabled });
    },
    [onConfigChange]
  );

  return {
    mockConfig,
    updateMockConfig,
    toggleMockMode,
  };
}
