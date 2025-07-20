/**
 * Configuration utility functions for better organization and reusability
 */

export const formatTemperature = (value: number): string => value.toFixed(1);

export const formatTokenCount = (value: number): string =>
  value.toLocaleString();

export const getTemperatureLabel = (value: number): string => {
  if (value <= 0.3) return "Precise";
  if (value <= 0.7) return "Balanced";
  return "Creative";
};

export const getTokenRangeLabel = (value: number): string => {
  if (value <= 1000) return "Short";
  if (value <= 4000) return "Medium";
  return "Long";
};

export const formatErrorType = (errorType: string): string => {
  return errorType.replace(/([A-Z])/g, " $1").trim();
};

export const validateApiKey = (apiKey: string): boolean => {
  return apiKey.length > 0;
};

export const validateModel = (
  model: string,
  availableModels: string[]
): boolean => {
  return availableModels.includes(model);
};

// Configuration presets for quick setup
export const CONFIG_PRESETS = {
  creative: {
    temperature: 0.9,
    maxTokens: 2000,
    streaming: true,
  },
  balanced: {
    temperature: 0.7,
    maxTokens: 1500,
    streaming: true,
  },
  precise: {
    temperature: 0.1,
    maxTokens: 1000,
    streaming: false,
  },
} as const;

export type ConfigPreset = keyof typeof CONFIG_PRESETS;
