import { ArtifactMeta, VALID_ARTIFACT_TYPES, TYPE_MAPPINGS } from './types';
import { ArtifactType, ParsedArtifact } from '@/types/artifacts';

const ARTIFACT_BLOCK_REGEX = /```artifact:([^\n]+)\n([\s\S]*?)```/g;
const ALT_ARTIFACT_REGEX = /```artifact:([^`]*?)```/g;

export function parseArtifactBlocks(content: string): ParsedArtifact[] {
  const artifacts: ParsedArtifact[] = [];

  // Try main pattern first
  let match;
  while ((match = ARTIFACT_BLOCK_REGEX.exec(content)) !== null) {
    const [, metaString, artifactContent] = match;
    const meta = parseArtifactMeta(metaString);

    if (meta?.type && meta?.title) {
      artifacts.push({
        type: meta.type,
        title: meta.title,
        language: meta.language,
        content: artifactContent.trim(),
        dependencies: meta.dependencies,
      });
    }
  }

  // Fallback to alternative pattern if no artifacts found
  if (artifacts.length === 0) {
    ARTIFACT_BLOCK_REGEX.lastIndex = 0;

    while ((match = ALT_ARTIFACT_REGEX.exec(content)) !== null) {
      const [, metaAndContent] = match;
      const parsed = parseMetaAndContent(metaAndContent);

      if (parsed) {
        artifacts.push(parsed);
      }
    }
  }

  return artifacts;
}

function parseArtifactMeta(metaString: string): ArtifactMeta | null {
  try {
    const meta: Record<string, string> = {};

    // Parse key=value pairs with proper quote handling
    const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
    let match;

    while ((match = regex.exec(metaString)) !== null) {
      const [, key, quotedValue, singleQuotedValue, unquotedValue] = match;
      const value = quotedValue || singleQuotedValue || unquotedValue;
      if (key && value !== undefined) {
        meta[key] = value;
      }
    }

    if (!meta.type) return null;

    const normalizedType = normalizeArtifactType(meta.type);
    if (!normalizedType) return null;

    return {
      type: normalizedType,
      title: meta.title || 'Untitled Artifact',
      language: meta.language,
      dependencies: meta.dependencies?.split(','),
      ...(meta.id && { id: meta.id }),
    };
  } catch {
    return null;
  }
}

function parseMetaAndContent(metaAndContent: string): ParsedArtifact | null {
  // Try to split by first < character (for XML/HTML/SVG)
  const contentStartIndex = metaAndContent.indexOf('<');

  if (contentStartIndex > 0) {
    const metaLine = metaAndContent.substring(0, contentStartIndex).trim();
    const artifactContent = metaAndContent.substring(contentStartIndex).trim();
    const meta = parseArtifactMeta(metaLine);

    if (meta?.type && meta?.title) {
      return {
        type: meta.type,
        title: meta.title,
        language: meta.language,
        content: artifactContent,
        dependencies: meta.dependencies,
      };
    }
  }

  // Fallback: split by lines
  const lines = metaAndContent.split('\n');
  const firstLine = lines[0];
  const contentLines = lines.slice(1);
  const meta = parseArtifactMeta(firstLine);

  if (meta?.type && meta?.title) {
    return {
      type: meta.type,
      title: meta.title,
      language: meta.language,
      content: contentLines.join('\n').trim(),
      dependencies: meta.dependencies,
    };
  }

  return null;
}

function normalizeArtifactType(type: string): ArtifactType | null {
  const lowercaseType = type.toLowerCase();

  if (VALID_ARTIFACT_TYPES.includes(lowercaseType as ArtifactType)) {
    return lowercaseType as ArtifactType;
  }

  return TYPE_MAPPINGS[lowercaseType] || null;
}
