import { useCallback, useRef } from 'react';
import { useMessages } from './useMessages';
import { usePerMessageStreamingMetrics } from './usePerMessageStreamingMetrics';
import { useActivityIndicators } from './useActivityIndicators';
import { useArtifactContext } from '@/contexts/ArtifactContext';
import { ChatRequestConfig } from '@/lib/chatApiService';
import { StreamingResponseHandler } from '@/lib/streamingHandler';

export function useChatOperations() {
  const {
    messages,
    addMessage,
    updateMessage,
    updateMessageContent,
    editMessage,
    setMessageStreaming,
    removeMessagesAfter,
    clearMessages,
    getLastUserMessage,
    setMessages,
  } = useMessages();

  const abortControllerRef = useRef<AbortController | null>(null);
  const indicatorIdsRef = useRef<
    Map<string, { ragId?: string; scrapingId?: string }>
  >(new Map());
  const streamingMetrics = usePerMessageStreamingMetrics();
  const activityIndicators = useActivityIndicators();
  const artifacts = useArtifactContext();

  const createAssistantMessage = useCallback(
    (userMessageId: string, userContent: string, config: ChatRequestConfig) => {
      const assistantMessageId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: config.streaming,
      });

      // Store indicator IDs to reference them later
      const indicatorIds: { ragId?: string; scrapingId?: string } = {};

      // Create activity indicators if RAG or scraping are enabled
      if (config.useRag) {
        indicatorIds.ragId = activityIndicators.addRagIndicator(
          userMessageId,
          userContent.trim()
        );
      }

      // Only create scraping indicator if both RAG and web scraping are enabled
      if (config.useRag && config.useWebScraping) {
        // Add scraping indicator - we'll update it with the URL once we get ragInfo
        indicatorIds.scrapingId = activityIndicators.addScrapingIndicator(
          userMessageId,
          ''
        );
      }

      // Store the indicator IDs for later reference using the user message ID
      indicatorIdsRef.current.set(userMessageId, indicatorIds);

      return assistantMessageId;
    },
    [addMessage, activityIndicators]
  );

  const handleStreamingResponse = useCallback(
    async (response: Response, messageId: string, userMessageId: string) => {
      const handler = new StreamingResponseHandler(messageId, {
        onContentUpdate: updateMessageContent,
        onTokenUpdate: (id, newContent, previousContent) => {
          streamingMetrics.updateTokenCount(id, newContent, previousContent);
        },
        onRagInfo: (id, ragInfo) => {
          // Update indicators as soon as we get RAG info (this happens early in streaming)

          if (ragInfo) {
            // Get the stored indicator IDs for this user message
            const indicatorIds = indicatorIdsRef.current.get(userMessageId);

            // Update RAG indicator if exists
            if (indicatorIds?.ragId) {
              activityIndicators.updateRagIndicator(
                indicatorIds.ragId,
                {
                  query: ragInfo.query,
                  resultsCount: ragInfo.resultsCount || 0,
                  sources: ragInfo.sources || [],
                  braveUsage: ragInfo.braveUsage,
                  scrapingUsed: ragInfo.scrapingUsed,
                  scrapedSource: ragInfo.scrapedSource,
                },
                'completed'
              );
            }

            // Update scraping indicator if scraping was used
            if (indicatorIds?.scrapingId) {
              if (ragInfo.scrapingUsed && ragInfo.scrapedSource) {
                activityIndicators.updateScrapingIndicator(
                  indicatorIds.scrapingId,
                  {
                    url: ragInfo.scrapedSource.url,
                    title: ragInfo.scrapedSource.title,
                    status: 'completed',
                    contentLength: ragInfo.scrapedSource.contentLength,
                  },
                  'completed'
                );
              } else if (ragInfo.scrapingUsed === false) {
                // If scraping was attempted but failed, update the indicator to show error
                activityIndicators.updateScrapingIndicator(
                  indicatorIds.scrapingId,
                  {
                    status: 'error',
                    errorMessage:
                      'Scraping failed, fell back to search results',
                  },
                  'error'
                );
              }
            }
          }
        },
        onComplete: (id, finalContent, ragInfo) => {
          const metrics = streamingMetrics.getMessageMetrics(id);
          updateMessage(id, {
            content: finalContent,
            streamingMetrics: metrics,
          });

          // Get the stored indicator IDs for this user message
          const indicatorIds = indicatorIdsRef.current.get(userMessageId);

          if (ragInfo) {
            // Only update if indicators exist and are still in "searching" state (meaning onRagInfo wasn't called)
            if (indicatorIds?.ragId) {
              // Check current state of the indicator
              const ragIndicator = activityIndicators.indicators.find(
                (ind) => ind.id === indicatorIds.ragId
              );
              if (ragIndicator?.status === 'searching') {
                activityIndicators.updateRagIndicator(
                  indicatorIds.ragId,
                  {
                    query: ragInfo.query,
                    resultsCount: ragInfo.resultsCount || 0,
                    sources: ragInfo.sources || [],
                    braveUsage: ragInfo.braveUsage,
                    scrapingUsed: ragInfo.scrapingUsed,
                    scrapedSource: ragInfo.scrapedSource,
                  },
                  'completed'
                );
              }
            }

            if (indicatorIds?.scrapingId) {
              const scrapingIndicator = activityIndicators.indicators.find(
                (ind) => ind.id === indicatorIds.scrapingId
              );
              if (scrapingIndicator?.status === 'searching') {
                if (ragInfo.scrapingUsed && ragInfo.scrapedSource) {
                  activityIndicators.updateScrapingIndicator(
                    indicatorIds.scrapingId,
                    {
                      url: ragInfo.scrapedSource.url,
                      title: ragInfo.scrapedSource.title,
                      status: 'completed',
                      contentLength: ragInfo.scrapedSource.contentLength,
                    },
                    'completed'
                  );
                } else if (ragInfo.scrapingUsed === false) {
                  activityIndicators.updateScrapingIndicator(
                    indicatorIds.scrapingId,
                    {
                      status: 'error',
                      errorMessage:
                        'Scraping failed, fell back to search results',
                    },
                    'error'
                  );
                }
              }
            }
          } else {
            // No ragInfo received - complete any pending indicators as "not used"
            if (indicatorIds?.ragId) {
              const ragIndicator = activityIndicators.indicators.find(
                (ind) => ind.id === indicatorIds.ragId
              );
              if (ragIndicator?.status === 'searching') {
                activityIndicators.updateRagIndicator(
                  indicatorIds.ragId,
                  {
                    resultsCount: 0,
                    sources: [],
                  },
                  'error'
                );
              }
            }

            if (indicatorIds?.scrapingId) {
              const scrapingIndicator = activityIndicators.indicators.find(
                (ind) => ind.id === indicatorIds.scrapingId
              );
              if (scrapingIndicator?.status === 'searching') {
                activityIndicators.updateScrapingIndicator(
                  indicatorIds.scrapingId,
                  {
                    status: 'error',
                    errorMessage: 'RAG/Scraping was not used for this request',
                  },
                  'error'
                );
              }
            }
          }
        },
        onArtifactsDetected: (id, detectedArtifacts) => {
          console.log(
            `Processing ${detectedArtifacts.length} detected artifacts for message ${id}`
          );

          // Add artifacts to the artifact manager
          detectedArtifacts.forEach((artifact) => {
            try {
              // The artifact already contains the content, so we just need to add it to the manager
              const createdArtifact = artifacts.createArtifact(
                {
                  id: artifact.id,
                  type: artifact.type,
                  title: artifact.title,
                  description: artifact.description,
                  language: artifact.language,
                  createdAt: artifact.createdAt,
                  updatedAt: artifact.updatedAt,
                  messageId: artifact.messageId,
                  version: artifact.version,
                },
                artifact.content
              );
              console.log(
                `Successfully processed artifact: ${createdArtifact.id} (${createdArtifact.type})`
              );
            } catch (error) {
              console.error(`Failed to create artifact ${artifact.id}:`, error);
            }
          });

          // Update the message to include the artifacts
          updateMessage(id, {
            artifacts: detectedArtifacts,
          });
        },
      });

      await handler.handleStreamingResponse(
        response,
        () => {
          console.log('Starting streaming for message:', messageId);
          setMessageStreaming(messageId, true);
          streamingMetrics.startStreaming(messageId);
        },
        () => {
          console.log('Stopping streaming for message:', messageId);
          setMessageStreaming(messageId, false);
          streamingMetrics.stopStreaming(messageId);
        }
      );
    },
    [
      updateMessageContent,
      updateMessage,
      setMessageStreaming,
      streamingMetrics,
      activityIndicators,
      artifacts,
    ]
  );

  const handleNonStreamingResponse = useCallback(
    async (response: Response, messageId: string, userMessageId: string) => {
      const { content, ragInfo } =
        await StreamingResponseHandler.handleNonStreamingResponse(response);
      updateMessage(messageId, { content });

      // Get the stored indicator IDs for this user message
      const indicatorIds = indicatorIdsRef.current.get(userMessageId);

      if (ragInfo) {
        // Update RAG indicator
        if (indicatorIds?.ragId) {
          activityIndicators.updateRagIndicator(
            indicatorIds.ragId,
            {
              query: ragInfo.query,
              resultsCount: ragInfo.resultsCount || 0,
              sources: ragInfo.sources || [],
              braveUsage: ragInfo.braveUsage,
              scrapingUsed: ragInfo.scrapingUsed,
              scrapedSource: ragInfo.scrapedSource,
            },
            'completed'
          );
        }

        // Update scraping indicator if scraping was used
        if (indicatorIds?.scrapingId) {
          if (ragInfo.scrapingUsed && ragInfo.scrapedSource) {
            activityIndicators.updateScrapingIndicator(
              indicatorIds.scrapingId,
              {
                url: ragInfo.scrapedSource.url,
                title: ragInfo.scrapedSource.title,
                status: 'completed',
                contentLength: ragInfo.scrapedSource.contentLength,
              },
              'completed'
            );
          } else if (ragInfo.scrapingUsed === false) {
            // If scraping was attempted but failed, update the indicator to show error
            activityIndicators.updateScrapingIndicator(
              indicatorIds.scrapingId,
              {
                status: 'error',
                errorMessage: 'Scraping failed, fell back to search results',
              },
              'error'
            );
          }
        }
      } else {
        // No ragInfo received - complete any pending indicators as "not used"
        if (indicatorIds?.ragId) {
          activityIndicators.updateRagIndicator(
            indicatorIds.ragId,
            {
              resultsCount: 0,
              sources: [],
            },
            'error'
          );
        }

        if (indicatorIds?.scrapingId) {
          activityIndicators.updateScrapingIndicator(
            indicatorIds.scrapingId,
            {
              status: 'error',
              errorMessage: 'RAG/Scraping was not used for this request',
            },
            'error'
          );
        }
      }
    },
    [updateMessage, activityIndicators]
  );

  const setupAbortController = useCallback(() => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  const clearAbortController = useCallback(() => {
    abortControllerRef.current = null;
  }, []);

  const handleApiError = useCallback(
    (error: unknown, userMessageId?: string) => {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }

      console.error('Chat error:', error);

      // Complete any pending indicators with error state
      if (userMessageId) {
        const indicatorIds = indicatorIdsRef.current.get(userMessageId);
        if (indicatorIds?.ragId) {
          const ragIndicator = activityIndicators.indicators.find(
            (ind) => ind.id === indicatorIds.ragId
          );
          if (ragIndicator?.status === 'searching') {
            activityIndicators.updateRagIndicator(
              indicatorIds.ragId,
              {
                resultsCount: 0,
                sources: [],
              },
              'error'
            );
          }
        }

        if (indicatorIds?.scrapingId) {
          const scrapingIndicator = activityIndicators.indicators.find(
            (ind) => ind.id === indicatorIds.scrapingId
          );
          if (scrapingIndicator?.status === 'searching') {
            activityIndicators.updateScrapingIndicator(
              indicatorIds.scrapingId,
              {
                status: 'error',
                errorMessage: 'Request failed',
              },
              'error'
            );
          }
        }
      }

      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your request.
        Please try again later or check your API key and model settings.
        Error details: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    },
    [addMessage, activityIndicators]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      clearAbortController();

      // Stop streaming for any currently streaming messages
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.isStreaming) {
            streamingMetrics.stopStreaming(msg.id);
            return { ...msg, isStreaming: false };
          }
          return msg;
        })
      );
    }
  }, [clearAbortController, setMessages, streamingMetrics]);

  const clearAllMessages = useCallback(() => {
    clearMessages();
    streamingMetrics.clearAllMetrics();
    activityIndicators.clearAllIndicators();
    indicatorIdsRef.current.clear(); // Clear the indicator IDs map
  }, [clearMessages, streamingMetrics, activityIndicators]);

  return {
    // State
    messages,
    activityIndicators,
    setMessages,

    // Message operations
    addMessage,
    updateMessage,
    updateMessageContent,
    editMessage,
    removeMessagesAfter,
    getLastUserMessage,

    // Chat operations
    createAssistantMessage,
    handleStreamingResponse,
    handleNonStreamingResponse,
    setupAbortController,
    clearAbortController,
    handleApiError,
    stopGeneration,
    clearAllMessages,

    // Streaming metrics
    streamingMetrics,
  };
}
