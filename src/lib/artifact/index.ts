// Main artifact detection functionality
export { ArtifactDetector } from '../artifactDetection';

// Individual modules for custom usage
export { parseArtifactBlocks } from './parser';
export { extractCodeBlocks } from './codeExtractor';
export { shouldCreateArtifact } from './rules';
export { inferArtifactType, generateTitle } from './inference';
export { VALID_ARTIFACT_TYPES, TYPE_MAPPINGS } from './types';
export type { CodeBlock, ArtifactMeta } from './types';
