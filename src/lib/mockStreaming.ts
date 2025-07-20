import { MockConfig, DEFAULT_MOCK_CONFIG } from '@/types/mockConfig';
import { WORD_BANKS } from '../data/wordBanks';
import { SENTENCE_STARTERS } from '../data/sentenceStartes';
import { RESPONSE_TEMPLATES_SIMPLE } from '../data/responseTemplates';

export function getRandomMockResponse(
  config: Partial<MockConfig> = {}
): string {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };

  // Determine response length
  let wordCount: number;
  switch (mockConfig.responseLength) {
    case 'short':
      wordCount = Math.floor(Math.random() * 50) + 20; // 20-70 words
      break;
    case 'medium':
      wordCount = Math.floor(Math.random() * 200) + 100; // 100-300 words
      break;
    case 'long':
      wordCount = Math.floor(Math.random() * 500) + 300; // 300-800 words
      break;
    case 'variable':
    default:
      wordCount = Math.floor(Math.random() * 400) + 50; // 50-450 words
      break;
  }

  // Use response template if specified
  if (
    mockConfig.responseTemplate !== 'random' &&
    mockConfig.responseTemplate !== 'custom'
  ) {
    return generateTemplatedResponse(
      mockConfig.responseTemplate,
      mockConfig.responseStyle
    );
  }

  if (mockConfig.responseTemplate === 'custom' && mockConfig.customTemplate) {
    return generateCustomTemplatedResponse(mockConfig.customTemplate);
  }

  // Generate response based on style
  const wordBank =
    WORD_BANKS[mockConfig.responseStyle] || WORD_BANKS.professional;
  const starters =
    SENTENCE_STARTERS[mockConfig.responseStyle] ||
    SENTENCE_STARTERS.professional;

  let response = '';
  let wordsUsed = 0;

  // Add variety with different sentence structures
  while (wordsUsed < wordCount) {
    const remainingWords = wordCount - wordsUsed;

    if (remainingWords > 15 && Math.random() > 0.3) {
      // Add a sentence starter
      const starter = starters[Math.floor(Math.random() * starters.length)];
      response += (response ? ' ' : '') + starter;
      wordsUsed += starter.split(' ').length;
    }

    // Add words from word bank
    const chunkSize = Math.min(
      Math.floor(Math.random() * 8) + 3,
      remainingWords
    );
    for (let i = 0; i < chunkSize && wordsUsed < wordCount; i++) {
      const word = wordBank[Math.floor(Math.random() * wordBank.length)];
      response += (response ? ' ' : '') + word;
      wordsUsed++;
    }

    // Add punctuation
    if (wordsUsed < wordCount && Math.random() > 0.7) {
      response += '.';
    } else if (wordsUsed < wordCount && Math.random() > 0.8) {
      response += ',';
    }
  }

  return response + '.';
}

function generateTemplatedResponse(template: string, style: string): string {
  const templates =
    RESPONSE_TEMPLATES_SIMPLE[
      template as keyof typeof RESPONSE_TEMPLATES_SIMPLE
    ];
  if (!templates)
    return getRandomMockResponse({
      responseLength: 'medium',
      responseStyle: style as keyof typeof WORD_BANKS,
    });

  const selectedTemplate =
    templates[Math.floor(Math.random() * templates.length)];
  const wordBank =
    WORD_BANKS[style as keyof typeof WORD_BANKS] || WORD_BANKS.professional;

  // Replace template variables with random words
  return selectedTemplate.replace(/\{\{(\w+)\}\}/g, () => {
    const numWords = Math.floor(Math.random() * 3) + 1;
    return Array.from(
      { length: numWords },
      () => wordBank[Math.floor(Math.random() * wordBank.length)]
    ).join(' ');
  });
}

function generateCustomTemplatedResponse(template: string): string {
  // Simple template variable replacement
  return template.replace(/\{\{(\w+)\}\}/g, () => {
    const words = [
      'custom',
      'template',
      'variable',
      'content',
      'placeholder',
      'dynamic',
    ];
    return words[Math.floor(Math.random() * words.length)];
  });
}

export async function createMockStream(
  fullResponse: string,
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal,
  config: Partial<MockConfig> = {}
): Promise<void> {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };

  // Check for error simulation
  if (
    mockConfig.errorSimulationEnabled &&
    Math.random() * 100 < mockConfig.errorRate
  ) {
    const delay =
      Math.random() *
        (mockConfig.initialDelay.max - mockConfig.initialDelay.min) +
      mockConfig.initialDelay.min;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const errorTypes = Object.entries(mockConfig.errorTypes).filter(
      ([, enabled]) => enabled
    );
    if (errorTypes.length > 0) {
      const [errorType] =
        errorTypes[Math.floor(Math.random() * errorTypes.length)];
      throw new Error(`Mock ${errorType} error simulation`);
    }
  }

  // Initial delay with abort check
  const initialDelay =
    Math.random() *
      (mockConfig.initialDelay.max - mockConfig.initialDelay.min) +
    mockConfig.initialDelay.min;

  await new Promise<void>((resolve) => {
    const timeoutId = setTimeout(() => {
      if (abortSignal?.aborted) return resolve();
      resolve();
    }, initialDelay);

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        resolve();
      });
    }
  });

  // Check again after initial delay
  if (abortSignal?.aborted) {
    return;
  }

  // Split the response into words for streaming
  const words = fullResponse.split(' ');
  let currentIndex = 0;

  const streamChunk = async () => {
    if (abortSignal?.aborted) {
      return;
    }

    if (currentIndex >= words.length) {
      return;
    }

    // Determine chunk size based on pattern
    let chunkSize: number;
    switch (mockConfig.streamingPattern) {
      case 'steady':
        chunkSize = Math.floor(
          (mockConfig.chunkSize.min + mockConfig.chunkSize.max) / 2
        );
        break;
      case 'burst':
        chunkSize =
          Math.random() > 0.7
            ? mockConfig.chunkSize.max
            : mockConfig.chunkSize.min;
        break;
      case 'irregular':
        chunkSize =
          Math.floor(
            Math.random() *
              (mockConfig.chunkSize.max - mockConfig.chunkSize.min + 1)
          ) + mockConfig.chunkSize.min;
        break;
      case 'realistic':
      default:
        // Vary chunk size with some natural patterns
        if (Math.random() > 0.8) chunkSize = 1; // Occasional single words
        else if (Math.random() > 0.6) chunkSize = mockConfig.chunkSize.max;
        else chunkSize = mockConfig.chunkSize.min;
        break;
    }

    const chunk = words.slice(currentIndex, currentIndex + chunkSize).join(' ');
    const isLastChunk = currentIndex + chunkSize >= words.length;

    onChunk(chunk + (isLastChunk ? '' : ' '));
    currentIndex += chunkSize;

    if (!isLastChunk) {
      // Calculate delay based on pattern
      let delay: number;
      switch (mockConfig.streamingPattern) {
        case 'steady':
          delay =
            (mockConfig.streamingDelay.min + mockConfig.streamingDelay.max) / 2;
          break;
        case 'burst':
          delay =
            chunkSize === mockConfig.chunkSize.max
              ? mockConfig.streamingDelay.min
              : mockConfig.streamingDelay.max;
          break;
        case 'irregular':
          delay =
            Math.random() *
              (mockConfig.streamingDelay.max - mockConfig.streamingDelay.min) +
            mockConfig.streamingDelay.min;
          break;
        case 'realistic':
        default:
          // Add natural variations and occasional pauses
          if (Math.random() > 0.9) delay = mockConfig.streamingDelay.max * 2;
          // Occasional longer pause
          else if (Math.random() > 0.7)
            delay = mockConfig.streamingDelay.min; // Sometimes faster
          else
            delay =
              Math.random() *
                (mockConfig.streamingDelay.max -
                  mockConfig.streamingDelay.min) +
              mockConfig.streamingDelay.min;
          break;
      }

      const timeoutPromise = new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          if (abortSignal?.aborted) return resolve();
          resolve();
        }, delay);

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            resolve();
          });
        }
      });

      await timeoutPromise;

      // Check again after delay
      if (abortSignal?.aborted) {
        return;
      }

      await streamChunk();
    }
  };

  // Start streaming
  await streamChunk();
}

export function createMockStreamingResponse(
  fullResponse: string,
  config: Partial<MockConfig> = {},
  abortSignal?: AbortSignal
): ReadableStream<Uint8Array> {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };
  const encoder = new TextEncoder();
  let currentIndex = 0;
  const words = fullResponse.split(' ');

  return new ReadableStream({
    async start(controller) {
      let timeoutIds: NodeJS.Timeout[] = [];

      // Set up abort signal handler
      if (abortSignal) {
        const onAbort = () => {
          // Clear any pending timeouts
          timeoutIds.forEach((id) => clearTimeout(id));
          timeoutIds = [];
          controller.close();
        };

        if (abortSignal.aborted) {
          controller.close();
          return;
        }

        abortSignal.addEventListener('abort', onAbort);

        // Clean up the event listener when the stream closes
        const originalClose = controller.close.bind(controller);
        controller.close = () => {
          abortSignal.removeEventListener('abort', onAbort);
          timeoutIds.forEach((id) => clearTimeout(id));
          originalClose();
        };
      }

      // Check for error simulation
      if (
        mockConfig.errorSimulationEnabled &&
        Math.random() * 100 < mockConfig.errorRate
      ) {
        const errorTypes = Object.entries(mockConfig.errorTypes).filter(
          ([, enabled]) => enabled
        );
        if (errorTypes.length > 0) {
          const [errorType] =
            errorTypes[Math.floor(Math.random() * errorTypes.length)];
          controller.error(new Error(`Mock ${errorType} error simulation`));
          return;
        }
      }

      // Initial delay
      const initialDelay =
        Math.random() *
          (mockConfig.initialDelay.max - mockConfig.initialDelay.min) +
        mockConfig.initialDelay.min;

      const streamNextChunk = () => {
        // Check if the request has been aborted
        if (abortSignal?.aborted) {
          controller.close();
          return;
        }

        if (currentIndex >= words.length) {
          // Send the final [DONE] message
          const doneData = encoder.encode('data: [DONE]\n\n');
          controller.enqueue(doneData);
          controller.close();
          return;
        }

        // Determine chunk size based on configuration
        let chunkSize: number;
        switch (mockConfig.streamingPattern) {
          case 'steady':
            chunkSize = Math.floor(
              (mockConfig.chunkSize.min + mockConfig.chunkSize.max) / 2
            );
            break;
          case 'burst':
            chunkSize =
              Math.random() > 0.7
                ? mockConfig.chunkSize.max
                : mockConfig.chunkSize.min;
            break;
          case 'irregular':
            chunkSize =
              Math.floor(
                Math.random() *
                  (mockConfig.chunkSize.max - mockConfig.chunkSize.min + 1)
              ) + mockConfig.chunkSize.min;
            break;
          case 'realistic':
          default:
            if (Math.random() > 0.8) chunkSize = 1;
            else if (Math.random() > 0.6) chunkSize = mockConfig.chunkSize.max;
            else chunkSize = mockConfig.chunkSize.min;
            break;
        }

        const chunk = words
          .slice(currentIndex, currentIndex + chunkSize)
          .join(' ');
        const isLastChunk = currentIndex + chunkSize >= words.length;

        // Format as OpenAI-style streaming response
        const response = {
          choices: [
            {
              delta: {
                content: chunk + (isLastChunk ? '' : ' '),
              },
            },
          ],
        };

        const data = encoder.encode(`data: ${JSON.stringify(response)}\n\n`);
        controller.enqueue(data);

        currentIndex += chunkSize;

        if (!isLastChunk) {
          // Calculate delay based on pattern
          let delay: number;
          switch (mockConfig.streamingPattern) {
            case 'steady':
              delay =
                (mockConfig.streamingDelay.min +
                  mockConfig.streamingDelay.max) /
                2;
              break;
            case 'burst':
              delay =
                chunkSize === mockConfig.chunkSize.max
                  ? mockConfig.streamingDelay.min
                  : mockConfig.streamingDelay.max;
              break;
            case 'irregular':
              delay =
                Math.random() *
                  (mockConfig.streamingDelay.max -
                    mockConfig.streamingDelay.min) +
                mockConfig.streamingDelay.min;
              break;
            case 'realistic':
            default:
              if (Math.random() > 0.9)
                delay = mockConfig.streamingDelay.max * 2;
              else if (Math.random() > 0.7)
                delay = mockConfig.streamingDelay.min;
              else
                delay =
                  Math.random() *
                    (mockConfig.streamingDelay.max -
                      mockConfig.streamingDelay.min) +
                  mockConfig.streamingDelay.min;
              break;
          }

          const timeoutId = setTimeout(streamNextChunk, delay);
          timeoutIds.push(timeoutId);
        } else {
          // Send [DONE] after a short delay
          const timeoutId = setTimeout(() => {
            if (abortSignal?.aborted) return;
            const doneData = encoder.encode('data: [DONE]\n\n');
            controller.enqueue(doneData);
            controller.close();
          }, 50);
          timeoutIds.push(timeoutId);
        }
      };

      // Start streaming after initial delay
      const initialTimeoutId = setTimeout(() => {
        if (abortSignal?.aborted) return;
        streamNextChunk();
      }, initialDelay);
      timeoutIds.push(initialTimeoutId);
    },
  });
}

// Enhanced token estimation
export function estimateTokens(
  text: string,
  config: Partial<MockConfig> = {}
): number {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };
  const words = text.split(/\s+/).length;

  const baseTokens = words * mockConfig.averageTokensPerWord;

  switch (mockConfig.tokenEstimationAccuracy) {
    case 'precise':
      return Math.round(baseTokens);
    case 'realistic':
      // Add some variation to simulate real token counting
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      return Math.round(baseTokens * (1 + variation));
    case 'variable':
      // More significant variation
      const bigVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
      return Math.round(baseTokens * (1 + bigVariation));
    default:
      return Math.round(baseTokens);
  }
}

// Simulate API errors
export class MockApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: string
  ) {
    super(message);
    this.name = 'MockApiError';
  }
}

export function simulateApiError(
  config: Partial<MockConfig> = {}
): MockApiError | null {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };

  if (
    !mockConfig.errorSimulationEnabled ||
    Math.random() * 100 >= mockConfig.errorRate
  ) {
    return null;
  }

  const enabledErrors = Object.entries(mockConfig.errorTypes).filter(
    ([, enabled]) => enabled
  );
  if (enabledErrors.length === 0) return null;

  const [errorType] =
    enabledErrors[Math.floor(Math.random() * enabledErrors.length)];

  switch (errorType) {
    case 'timeout':
      return new MockApiError('Request timeout', 408, 'timeout');
    case 'rateLimited':
      return new MockApiError('Rate limit exceeded', 429, 'rate_limited');
    case 'serverError':
      return new MockApiError('Internal server error', 500, 'server_error');
    case 'networkError':
      return new MockApiError('Network connection error', 0, 'network_error');
    default:
      return new MockApiError('Unknown error', 500, 'unknown');
  }
}
