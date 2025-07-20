import { ArtifactCandidate } from '@/types/artifacts';
import { parseArtifactBlocks } from './artifact/parser';
import { extractCodeBlocks } from './artifact/codeExtractor';
import { shouldCreateArtifact } from './artifact/rules';
import { inferArtifactType, generateTitle } from './artifact/inference';

export class ArtifactDetector {
  static detectArtifacts(messageContent: string): ArtifactCandidate[] {
    const candidates: ArtifactCandidate[] = [];
    console.log(
      `[ArtifactDetector] Analyzing message content of ${messageContent.length} characters`
    );

    // First, look for explicit artifact blocks
    const artifactBlocks = parseArtifactBlocks(messageContent);
    console.log(
      `[ArtifactDetector] Found ${artifactBlocks.length} explicit artifact blocks`
    );

    // Add explicit artifacts
    artifactBlocks.forEach((artifact) => {
      candidates.push({
        type: artifact.type,
        language: artifact.language || '',
        code: artifact.content,
        title: artifact.title,
        startIndex: 0,
        endIndex: artifact.content.length,
      });
    });

    // Check for implicit code blocks
    const codeBlocks = extractCodeBlocks(messageContent);
    console.log(`[ArtifactDetector] Found ${codeBlocks.length} code blocks`);

    codeBlocks.forEach((block, index) => {
      // Skip if already captured as explicit artifact
      const alreadyCaptured = candidates.some(
        (candidate) => candidate.code.trim() === block.code.trim()
      );

      const shouldCreate = shouldCreateArtifact(block.code, block.language);
      console.log(
        `[ArtifactDetector] Code block ${index}: language=${block.language}, length=${block.code.length}, shouldCreate=${shouldCreate}, alreadyCaptured=${alreadyCaptured}`
      );

      if (!alreadyCaptured && shouldCreate) {
        const inferredType = inferArtifactType(block.language, block.code);
        const title = generateTitle(block.language, block.code, inferredType);

        candidates.push({
          type: inferredType,
          language: block.language,
          code: block.code,
          title,
          startIndex: block.startIndex,
          endIndex: block.endIndex,
        });

        console.log(
          `[ArtifactDetector] Added candidate: type=${inferredType}, title="${title}"`
        );
      }
    });

    console.log(
      `[ArtifactDetector] Final result: ${candidates.length} artifact candidates`
    );
    return candidates;
  }
}
