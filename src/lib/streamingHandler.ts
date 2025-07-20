import { RagInfo } from '@/lib/api/types';
import { ArtifactDetector } from '@/lib/artifactDetection';
import { Artifact, ArtifactMeta } from '@/types/artifacts';

export interface StreamingHandlerCallbacks {
  onContentUpdate: (messageId: string, content: string) => void;
  onTokenUpdate: (
    messageId: string,
    newContent: string,
    previousContent: string
  ) => void;
  onRagInfo: (messageId: string, ragInfo: RagInfo) => void;
  onArtifactsDetected: (messageId: string, artifacts: Artifact[]) => void;
  onComplete: (
    messageId: string,
    finalContent: string,
    ragInfo?: RagInfo
  ) => void;
}

interface StreamingChunk {
  ragInfo?: RagInfo;
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

export class StreamingResponseHandler {
  private decoder = new TextDecoder();
  private accumulatedContent = '';
  private messageRagInfo: RagInfo | undefined = undefined;
  private lastArtifactCheck = '';
  private detectedArtifacts: Map<string, Artifact> = new Map();

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

    const content = parsed.choices?.[0]?.delta?.content || '';

    if (content) {
      const previousContent = this.accumulatedContent;
      this.accumulatedContent += content;

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
