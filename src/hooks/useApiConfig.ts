import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { MockConfig, DEFAULT_MOCK_CONFIG } from '@/types/mockConfig';

export interface Config {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;
  mockMode: boolean;
  mockConfig: MockConfig;
  useRag: boolean;
  ragSearchResults: number;
  useWebScraping: boolean;
  // New smart connection status settings
  enableSmartConnectionStatus: boolean;
  devMode: boolean;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'model-error';

const AVAILABLE_MODELS = [
  'claude-3-haiku',
  'claude-3-5-sonnet',
  'claude-3-7-sonnet',
  'claude-4-sonnet',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'o1',
  'o3',
  'o3-mini',
  'o4-mini',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
];

const DEFAULT_CONFIG: Config = {
  apiKey: process.env.NEXT_PUBLIC_BONZAI_API_KEY || '',
  model: 'claude-4-sonnet',
  temperature: 0.7,
  maxTokens: 4000,
  systemPrompt: 'You are a helpful AI assistant.',
  streaming: true,
  mockMode: false,
  mockConfig: DEFAULT_MOCK_CONFIG,
  useRag: false,
  ragSearchResults: 3,
  useWebScraping: false,
  enableSmartConnectionStatus: true,
  devMode: process.env.NODE_ENV === 'development',
};

export function useApiConfig() {
  const [config, setConfig] = useLocalStorage<Config>(
    'ai-playground-config',
    DEFAULT_CONFIG
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');
  const [lastTestedModel, setLastTestedModel] = useState<string>('');
  const [connectionCache, setConnectionCache] = useState<
    Map<string, { status: ConnectionStatus; timestamp: number }>
  >(new Map());

  // Cache duration: 5 minutes in dev mode, 30 seconds in prod
  const CACHE_DURATION = config.devMode ? 5 * 60 * 1000 : 30 * 1000;

  const getCacheKey = useCallback((apiKey: string, model: string) => {
    return `${apiKey}:${model}`;
  }, []);

  const testModelConnection = useCallback(
    async (model: string, apiKey?: string) => {
      const keyToUse = apiKey || config.apiKey;
      if (!keyToUse) {
        setConnectionStatus('error');
        return false;
      }

      // Check cache first (unless in dev mode and cache is disabled)
      const cacheKey = getCacheKey(keyToUse, model);
      const cached = connectionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setConnectionStatus(cached.status);
        setLastTestedModel(model);
        return cached.status === 'connected';
      }

      setConnectionStatus('connecting');
      setLastTestedModel(model);

      try {
        const response = await fetch(
          `/api/test-connection?model=${encodeURIComponent(model)}`,
          {
            method: 'GET',
            headers: {
              'x-api-key': keyToUse,
            },
          }
        );

        const result = await response.json();

        if (response.ok && result.status === 'connected') {
          setConnectionStatus('connected');
          setConnectionCache(
            (prev) =>
              new Map(
                prev.set(cacheKey, {
                  status: 'connected',
                  timestamp: Date.now(),
                })
              )
          );
          return true;
        } else {
          const status = result.isModelError ? 'model-error' : 'error';
          setConnectionStatus(status);
          setConnectionCache(
            (prev) =>
              new Map(prev.set(cacheKey, { status, timestamp: Date.now() }))
          );
          return false;
        }
      } catch (error) {
        console.error('Model connection test failed:', error);
        setConnectionStatus('error');
        setConnectionCache(
          (prev) =>
            new Map(
              prev.set(cacheKey, { status: 'error', timestamp: Date.now() })
            )
        );
        return false;
      }
    },
    [config.apiKey, connectionCache, getCacheKey, CACHE_DURATION]
  );

  const updateConfig = useCallback(
    (updates: Partial<Config>) => {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);

      // If model changed and smart connection status is enabled, test the new model
      if (
        updates.model &&
        updates.model !== config.model &&
        newConfig.enableSmartConnectionStatus &&
        !newConfig.mockMode
      ) {
        testModelConnection(updates.model, newConfig.apiKey);
      }
    },
    [config, setConfig, testModelConnection]
  );

  const testConnection = useCallback(async () => {
    return testModelConnection(config.model);
  }, [config.model, testModelConnection]);

  // Test connection on initialization if smart connection status is enabled
  const initRef = useRef(false);
  useEffect(() => {
    if (
      !initRef.current &&
      config.enableSmartConnectionStatus &&
      !config.mockMode &&
      config.apiKey
    ) {
      initRef.current = true;
      testModelConnection(config.model);
    }
  }, [
    config.enableSmartConnectionStatus,
    config.mockMode,
    config.apiKey,
    config.model,
    testModelConnection,
  ]);

  const clearConnectionCache = useCallback(() => {
    setConnectionCache(new Map());
  }, []);

  return {
    config,
    updateConfig,
    connectionStatus,
    testConnection,
    testModelConnection,
    clearConnectionCache,
    lastTestedModel,
    availableModels: AVAILABLE_MODELS,
  };
}
