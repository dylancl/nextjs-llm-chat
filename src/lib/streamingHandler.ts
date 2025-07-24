import { RagInfo } from '@/lib/api/types';
import { ArtifactDetector } from '@/lib/artifactDetection';
import { Artifact, ArtifactMeta } from '@/types/artifacts';
import { ToolCall, ToolName, ToolResult } from '@/types/tools';

export interface StreamingHandlerCallbacks {
  onContentUpdate: (messageId: string, content: string) => void;
  onTokenUpdate: (
    messageId: string,
    newContent: string,
    previousContent: string
  ) => void;
  onRagInfo: (messageId: string, ragInfo: RagInfo) => void;
  onArtifactsDetected: (messageId: string, artifacts: Artifact[]) => void;
  onToolCalls: (messageId: string, toolCalls: ToolCall[]) => void;
  onToolResults: (messageId: string, toolResults: ToolResult[]) => void;
  onComplete: (
    messageId: string,
    finalContent: string,
    ragInfo?: RagInfo
  ) => void;
  // New callbacks for chronological parts
  onAddContentPart: (messageId: string, content: string) => void;
  onAddToolCallsPart: (messageId: string, toolCalls: ToolCall[]) => void;
  onAddToolResultsPart: (messageId: string, toolResults: ToolResult[]) => void;
  onUpdateLastContentPart: (messageId: string, content: string) => void;
}

interface StreamingChunk {
  ragInfo?: RagInfo;
  toolResults?: ToolResult[];
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: string;
        function?: {
          name?: ToolName;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

export class StreamingResponseHandler {
  private decoder = new TextDecoder();
  private accumulatedContent = '';
  private messageRagInfo: RagInfo | undefined = undefined;
  private lastArtifactCheck = '';
  private detectedArtifacts: Map<string, Artifact> = new Map();
  private collectedToolCalls: Map<number, ToolCall> = new Map();
  private toolCallsCollected = false;
  private currentContentPart = '';
  private hasInitialContent = false;
  private accumulatedToolResults: ToolResult[] = [];

  constructor(
    private messageId: string,
    private callbacks: StreamingHandlerCallbacks
  ) {}

  async handleStreamingResponse(
    response: Response,
    onStreamingStart: () => void,
    onStreamingEnd: () => void
  ): Promise<void> {
    if (!response.body) {
      throw new Error('No response body available for streaming');
    }

    const reader = response.body.getReader();
    this.accumulatedContent = '';
    this.messageRagInfo = undefined;

    onStreamingStart();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = this.decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              this.processStreamingChunk(parsed);
            } catch (e) {
              console.warn('Failed to parse streaming data:', e);
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      onStreamingEnd();

      // Detect artifacts in final content
      this.detectAndCreateArtifacts();

      this.callbacks.onComplete(
        this.messageId,
        this.accumulatedContent,
        this.messageRagInfo
      );
    }
  }

  private processStreamingChunk(parsed: StreamingChunk): void {
    // Check for RAG info in the first chunk
    if (parsed.ragInfo && !this.messageRagInfo) {
      console.log('Found RAG info in streaming chunk:', parsed.ragInfo);
      this.messageRagInfo = parsed.ragInfo;
      this.callbacks.onRagInfo(this.messageId, this.messageRagInfo);
    }

    // Check for tool results
    if (parsed.toolResults && parsed.toolResults.length > 0) {
      console.log('Found tool results in streaming chunk:', parsed.toolResults);

      // Append new results to the accumulated list
      this.accumulatedToolResults.push(...parsed.toolResults);

      // Process each tool result individually for the chronological UI
      parsed.toolResults.forEach((toolResult) => {
        this.callbacks.onAddToolResultsPart(this.messageId, [toolResult]);
      });

      // For the legacy callback, send the entire accumulated list
      this.callbacks.onToolResults(this.messageId, this.accumulatedToolResults);

      // Reset for any follow-up content after tool results
      this.currentContentPart = '';
      this.hasInitialContent = false;
      this.collectedToolCalls.clear();
      this.toolCallsCollected = false;

      return;
    }

    // Handle tool calls - allow multiple tool calls to be collected
    if (parsed.choices?.[0]?.delta?.tool_calls) {
      this.handleToolCallsDelta(parsed.choices[0].delta.tool_calls);
    }

    // Check for finish_reason to detect when tool calls are complete
    if (
      parsed.choices?.[0]?.finish_reason &&
      this.collectedToolCalls.size > 0 &&
      !this.toolCallsCollected
    ) {
      this.checkAndSendCompleteToolCalls();
    }

    const content = parsed.choices?.[0]?.delta?.content || '';

    if (content) {
      const previousContent = this.accumulatedContent;
      this.accumulatedContent += content;
      this.currentContentPart += content;

      // If this is the first content and we haven't created an initial content part, create one
      if (!this.hasInitialContent) {
        this.callbacks.onAddContentPart(
          this.messageId,
          this.currentContentPart
        );
        this.hasInitialContent = true;
      } else {
        // Update the current content part
        this.callbacks.onUpdateLastContentPart(
          this.messageId,
          this.currentContentPart
        );
      }

      this.callbacks.onContentUpdate(this.messageId, this.accumulatedContent);
      this.callbacks.onTokenUpdate(
        this.messageId,
        this.accumulatedContent,
        previousContent
      );

      // Check for new artifacts during streaming (with debouncing)
      this.checkForStreamingArtifacts();
    }
  }

  private handleToolCallsDelta(
    toolCallDeltas: Array<{
      index?: number;
      id?: string;
      type?: string;
      function?: {
        name?: ToolName;
        arguments?: string;
      };
    }>
  ): void {
    for (const delta of toolCallDeltas) {
      if (delta.index !== undefined) {
        // Initialize tool call if it doesn't exist
        if (!this.collectedToolCalls.has(delta.index)) {
          this.collectedToolCalls.set(delta.index, {
            id: delta.id || `call_${Date.now()}_${delta.index}`,
            type: 'function',
            function: {
              name: ToolName.NONE,
              arguments: '',
            },
          });
        }

        const toolCall = this.collectedToolCalls.get(delta.index)!;

        // Update tool call ID if provided
        if (delta.id) {
          toolCall.id = delta.id;
        }

        // Handle function name - be more careful about concatenation
        if (delta.function?.name !== undefined) {
          if (delta.function.name === '') {
            // Empty string means we're starting fresh
            toolCall.function.name = ToolName.NONE;
          } else {
            const currentName = toolCall.function.name;
            const newPart = delta.function.name;

            if (currentName === ToolName.NONE) {
              // First part of the name
              toolCall.function.name = newPart;
            } else {
              // Check if this looks like a continuation or a new complete name
              if (
                newPart.includes('_') &&
                newPart.length > currentName.length
              ) {
                // This looks like a complete function name, replace
                toolCall.function.name = newPart;
              } else if (
                currentName.endsWith(
                  newPart.substring(0, Math.min(newPart.length, 3))
                )
              ) {
                // Avoid duplication - this part might already be included
                const overlap = this.findOverlap(currentName, newPart);
                if (overlap > 0) {
                  toolCall.function.name = (currentName +
                    newPart.substring(overlap)) as ToolName;
                } else {
                  toolCall.function.name = (toolCall.function.name +
                    newPart) as ToolName;
                }
              } else {
                // Normal concatenation
                toolCall.function.name = (toolCall.function.name +
                  newPart) as ToolName;
              }
            }
          }
        }

        // Handle function arguments with better logic
        if (delta.function?.arguments !== undefined) {
          if (delta.function.arguments === '') {
            // Empty string means starting fresh
            toolCall.function.arguments = '';
          } else {
            const currentArgs = toolCall.function.arguments;
            const newArgs = delta.function.arguments;

            if (currentArgs === '') {
              // First chunk of arguments
              toolCall.function.arguments = newArgs;
            } else {
              // Check for JSON object boundaries to detect separate tool calls
              const trimmedCurrent = currentArgs.trim();
              const trimmedNew = newArgs.trim();

              // If current ends with } and new starts with {, this is likely a new tool call
              if (trimmedCurrent.endsWith('}') && trimmedNew.startsWith('{')) {
                // Try to parse current as complete JSON
                try {
                  JSON.parse(trimmedCurrent);
                  // Current is complete, so new args are for a different tool call
                  // But since we're processing the same index, this might be an error
                  // Log it but still replace
                  console.warn('Detected potential tool call boundary issue');
                  toolCall.function.arguments = newArgs;
                } catch {
                  // Current isn't complete JSON, append normally
                  toolCall.function.arguments += newArgs;
                }
              } else {
                // Normal case - append the new arguments
                toolCall.function.arguments += newArgs;
              }
            }
          }
        }
      }
    }

    // Don't send tool calls to UI until they're complete
    this.checkAndSendCompleteToolCalls();
  }

  private findOverlap(str1: string, str2: string): number {
    let maxOverlap = 0;
    const maxCheck = Math.min(str1.length, str2.length, 10); // Limit check to avoid performance issues

    for (let i = 1; i <= maxCheck; i++) {
      if (str1.substring(str1.length - i) === str2.substring(0, i)) {
        maxOverlap = i;
      }
    }

    return maxOverlap;
  }

  private checkAndSendCompleteToolCalls(): void {
    if (this.toolCallsCollected) return;

    // Convert map to array
    const toolCallsArray = Array.from(this.collectedToolCalls.values());

    // Filter out incomplete tool calls and validate JSON
    const completeToolCalls = toolCallsArray.filter((tc) => {
      if (!tc || !tc.function.name || !tc.function.arguments.trim()) {
        return false;
      }

      // Validate that arguments is valid JSON
      try {
        JSON.parse(tc.function.arguments);
        return true;
      } catch {
        console.warn(
          `Invalid JSON in tool call ${tc.id}:`,
          tc.function.arguments
        );
        return false;
      }
    });

    // Only send if we have valid complete tool calls
    if (completeToolCalls.length > 0) {
      this.toolCallsCollected = true;

      // Create a separate chronological part for each tool call
      // This ensures each tool call gets its own UI card
      completeToolCalls.forEach((toolCall) => {
        // Create a unique part for each tool call to ensure separate UI cards
        this.callbacks.onAddToolCallsPart(this.messageId, [toolCall]);
      });

      // Send all tool calls together for backward compatibility
      // Use a longer timeout to ensure UI has time to process individual cards
      setTimeout(() => {
        this.callbacks.onToolCalls(this.messageId, completeToolCalls);
      }, 200);

      // Reset current content part for any follow-up content
      this.currentContentPart = '';
      this.hasInitialContent = false;
    }
  }

  private checkForStreamingArtifacts(): void {
    // Only check if we have significantly more content than last check
    if (this.accumulatedContent.length - this.lastArtifactCheck.length < 100) {
      return;
    }

    const candidates = ArtifactDetector.detectArtifacts(
      this.accumulatedContent
    );

    if (candidates.length > 0) {
      const newArtifacts: Artifact[] = [];

      candidates.forEach((candidate, index) => {
        const artifactId = `${this.messageId}-artifact-${index}`;

        // Check if this is a new or significantly updated artifact
        const existingArtifact = this.detectedArtifacts.get(artifactId);

        // Improved change detection: compare actual content, not just length
        const contentChanged =
          !existingArtifact ||
          this.hasSignificantContentChange(
            existingArtifact.content,
            candidate.code
          );

        if (contentChanged) {
          const artifactMeta: ArtifactMeta = {
            id: artifactId,
            type: candidate.type,
            title: candidate.title || `${candidate.type} artifact`,
            language: candidate.language,
            createdAt: existingArtifact?.createdAt || new Date(),
            updatedAt: new Date(),
            messageId: this.messageId,
            version: (existingArtifact?.version || 0) + 1,
          };

          const artifact: Artifact = {
            ...artifactMeta,
            content: candidate.code,
            isExecutable:
              (candidate.type === 'code' &&
                (candidate.language === 'javascript' ||
                  candidate.language === 'js' ||
                  candidate.language === 'python' ||
                  candidate.language === 'py')) ||
              candidate.type === 'html' ||
              candidate.type === 'react-component',
            dependencies: [],
          };

          this.detectedArtifacts.set(artifactId, artifact);
          newArtifacts.push(artifact);
        }
      });

      if (newArtifacts.length > 0) {
        console.log(
          `Streaming detected ${newArtifacts.length} new/updated artifacts in message ${this.messageId}`
        );
        this.callbacks.onArtifactsDetected(this.messageId, newArtifacts);
      }
    }

    this.lastArtifactCheck = this.accumulatedContent;
  }

  private hasSignificantContentChange(
    oldContent: string,
    newContent: string
  ): boolean {
    const oldTrimmed = oldContent.trim();
    const newTrimmed = newContent.trim();

    // If content is identical, no change
    if (oldTrimmed === newTrimmed) {
      return false;
    }

    // If length difference is more than 50 characters, consider it significant
    if (Math.abs(oldTrimmed.length - newTrimmed.length) > 50) {
      return true;
    }

    // For smaller changes, check if the difference ratio is significant
    const maxLength = Math.max(oldTrimmed.length, newTrimmed.length);
    if (maxLength === 0) return newTrimmed.length > 0;

    // Calculate similarity using simple character difference
    let differences = 0;
    const minLength = Math.min(oldTrimmed.length, newTrimmed.length);

    for (let i = 0; i < minLength; i++) {
      if (oldTrimmed[i] !== newTrimmed[i]) {
        differences++;
      }
    }

    // Add length difference to differences
    differences += Math.abs(oldTrimmed.length - newTrimmed.length);

    // Consider it significant if more than 10% of content changed
    return differences / maxLength > 0.1;
  }

  private detectAndCreateArtifacts(): void {
    // Check for new artifacts
    const candidates = ArtifactDetector.detectArtifacts(
      this.accumulatedContent
    );

    if (candidates.length > 0) {
      console.log(
        `Found ${candidates.length} artifact candidates in message ${this.messageId}`
      );

      const finalArtifacts: Artifact[] = candidates.map((candidate, index) => {
        const artifactId = `${this.messageId}-artifact-${index}`;
        const existingArtifact = this.detectedArtifacts.get(artifactId);

        const artifactMeta: ArtifactMeta = {
          id: artifactId,
          type: candidate.type,
          title: candidate.title || `${candidate.type} artifact`,
          language: candidate.language,
          createdAt: existingArtifact?.createdAt || new Date(),
          updatedAt: new Date(),
          messageId: this.messageId,
          version: (existingArtifact?.version || 0) + 1,
        };

        const artifact: Artifact = {
          ...artifactMeta,
          content: candidate.code,
          isExecutable:
            (candidate.type === 'code' &&
              (candidate.language === 'javascript' ||
                candidate.language === 'js' ||
                candidate.language === 'python' ||
                candidate.language === 'py')) ||
            candidate.type === 'html' ||
            candidate.type === 'react-component',
          dependencies: [],
        };

        this.detectedArtifacts.set(artifactId, artifact);
        return artifact;
      });

      // Properly check for changes by comparing content, not just existence
      const hasChanges = finalArtifacts.some((artifact) => {
        const existing = this.detectedArtifacts.get(artifact.id);
        return !existing || existing.content.trim() !== artifact.content.trim();
      });

      if (hasChanges) {
        console.log(
          `Notifying about ${finalArtifacts.length} artifacts with changes: ${hasChanges}`
        );
        this.callbacks.onArtifactsDetected(this.messageId, finalArtifacts);
      }
    } else {
      console.log(`No artifacts detected in message ${this.messageId}`);
    }
  }

  static async handleNonStreamingResponse(response: Response): Promise<{
    content: string;
    ragInfo?: RagInfo;
  }> {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response';
    const ragInfo = data.ragInfo;

    return { content, ragInfo };
  }
}
