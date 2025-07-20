import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  RagIndicatorData,
  ScrapingIndicatorData,
} from '@/types/activityIndicators';

export function useActivityIndicators() {
  const [indicators, setIndicators] = useState<ActivityIndicator[]>([]);

  const addRagIndicator = useCallback(
    (associatedMessageId: string, query: string): string => {
      // First check if indicator already exists
      const existingRagIndicator = indicators.find(
        (indicator) =>
          indicator.associatedMessageId === associatedMessageId &&
          indicator.type === 'rag'
      );

      if (existingRagIndicator) {
        console.log(
          'RAG indicator already exists for message:',
          associatedMessageId
        );
        return existingRagIndicator.id;
      }

      // Create new indicator
      const indicator: ActivityIndicator = {
        id: `rag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'rag',
        timestamp: new Date(),
        associatedMessageId,
        status: 'searching',
        data: {
          query,
          resultsCount: 0,
          sources: [],
        } as RagIndicatorData,
      };

      console.log(
        'Created new RAG indicator:',
        indicator.id,
        'for message:',
        associatedMessageId
      );

      setIndicators((prev) => [...prev, indicator]);
      return indicator.id;
    },
    [indicators]
  );

  const addScrapingIndicator = useCallback(
    (associatedMessageId: string, url: string): string => {
      // First check if indicator already exists
      const existingScrapingIndicator = indicators.find(
        (indicator) =>
          indicator.associatedMessageId === associatedMessageId &&
          indicator.type === 'scraping'
      );

      if (existingScrapingIndicator) {
        console.log(
          'Scraping indicator already exists for message:',
          associatedMessageId
        );
        return existingScrapingIndicator.id;
      }

      // Create new indicator
      const indicator: ActivityIndicator = {
        id: `scraping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'scraping',
        timestamp: new Date(),
        associatedMessageId,
        status: 'searching',
        data: {
          url,
          status: 'fetching',
        } as ScrapingIndicatorData,
      };

      console.log(
        'Created new scraping indicator:',
        indicator.id,
        'for message:',
        associatedMessageId
      );

      setIndicators((prev) => [...prev, indicator]);
      return indicator.id;
    },
    [indicators]
  );

  const updateRagIndicator = useCallback(
    (
      indicatorId: string,
      updates: Partial<RagIndicatorData>,
      status?: ActivityIndicator['status']
    ) => {
      setIndicators((prev) =>
        prev.map((indicator) => {
          if (indicator.id === indicatorId && indicator.type === 'rag') {
            return {
              ...indicator,
              status: status || indicator.status,
              data: {
                ...indicator.data,
                ...updates,
              } as RagIndicatorData,
            };
          }
          return indicator;
        })
      );
    },
    []
  );

  const updateScrapingIndicator = useCallback(
    (
      indicatorId: string,
      updates: Partial<ScrapingIndicatorData>,
      status?: ActivityIndicator['status']
    ) => {
      setIndicators((prev) =>
        prev.map((indicator) => {
          if (indicator.id === indicatorId && indicator.type === 'scraping') {
            return {
              ...indicator,
              status: status || indicator.status,
              data: {
                ...indicator.data,
                ...updates,
              } as ScrapingIndicatorData,
            };
          }
          return indicator;
        })
      );
    },
    []
  );

  const removeIndicator = useCallback((indicatorId: string) => {
    setIndicators((prev) =>
      prev.filter((indicator) => indicator.id !== indicatorId)
    );
  }, []);

  const removeIndicatorsForMessage = useCallback((messageId: string) => {
    setIndicators((prev) =>
      prev.filter((indicator) => indicator.associatedMessageId !== messageId)
    );
  }, []);

  const clearAllIndicators = useCallback(() => {
    setIndicators([]);
  }, []);

  const getIndicatorsForMessage = useCallback(
    (messageId: string) => {
      return indicators.filter(
        (indicator) => indicator.associatedMessageId === messageId
      );
    },
    [indicators]
  );

  return {
    indicators,
    addRagIndicator,
    addScrapingIndicator,
    updateRagIndicator,
    updateScrapingIndicator,
    removeIndicator,
    removeIndicatorsForMessage,
    clearAllIndicators,
    getIndicatorsForMessage,
  };
}
