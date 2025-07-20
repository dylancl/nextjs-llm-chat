import { useState, useCallback, useEffect } from 'react';
import { Artifact, ArtifactMeta, ExportFormat } from '@/types/artifacts';

const ARTIFACTS_STORAGE_KEY = 'ai-playground-artifacts';

function loadArtifactsFromStorage(): Map<string, Artifact> {
  if (typeof window === 'undefined') return new Map();

  try {
    const stored = localStorage.getItem(ARTIFACTS_STORAGE_KEY);
    if (stored) {
      const artifactsArray: Artifact[] = JSON.parse(stored);
      // Convert dates back from strings
      const processedArtifacts = artifactsArray.map((artifact) => ({
        ...artifact,
        createdAt: new Date(artifact.createdAt),
        updatedAt: new Date(artifact.updatedAt),
      }));
      return new Map(
        processedArtifacts.map((artifact) => [artifact.id, artifact])
      );
    }
  } catch (error) {
    console.warn('Failed to load artifacts from storage:', error);
  }
  return new Map();
}

function saveArtifactsToStorage(artifacts: Map<string, Artifact>) {
  if (typeof window === 'undefined') return;

  try {
    const artifactsArray = Array.from(artifacts.values());
    localStorage.setItem(ARTIFACTS_STORAGE_KEY, JSON.stringify(artifactsArray));
  } catch (error) {
    console.warn('Failed to save artifacts to storage:', error);
  }
}

export function useArtifacts() {
  const [artifacts, setArtifacts] = useState<Map<string, Artifact>>(() =>
    loadArtifactsFromStorage()
  );

  // Save to localStorage whenever artifacts change
  useEffect(() => {
    saveArtifactsToStorage(artifacts);
  }, [artifacts]);

  const createArtifact = useCallback(
    (meta: ArtifactMeta, content: string): Artifact => {
      // Check if an artifact with this ID already exists
      const existingArtifact = artifacts.get(meta.id);

      if (existingArtifact) {
        // If content is different, update the existing artifact
        const normalizedExisting = existingArtifact.content
          .trim()
          .replace(/\r\n/g, '\n');
        const normalizedNew = content.trim().replace(/\r\n/g, '\n');

        if (normalizedExisting !== normalizedNew) {
          console.log(`Updating existing artifact ${meta.id} with new content`);
          const updatedArtifact: Artifact = {
            ...existingArtifact,
            ...meta,
            content,
            updatedAt: new Date(),
            version: existingArtifact.version + 1,
            isExecutable:
              (meta.type === 'code' &&
                (meta.language === 'javascript' ||
                  meta.language === 'js' ||
                  meta.language === 'python' ||
                  meta.language === 'py')) ||
              meta.type === 'html' ||
              meta.type === 'react-component',
          };

          setArtifacts((prev) => {
            const newMap = new Map(prev);
            newMap.set(meta.id, updatedArtifact);
            return newMap;
          });

          return updatedArtifact;
        } else {
          console.log(
            `Artifact ${meta.id} already exists with identical content - skipping creation`
          );
          return existingArtifact;
        }
      }

      // Create new artifact
      const artifact: Artifact = {
        ...meta,
        content,
        isExecutable:
          (meta.type === 'code' &&
            (meta.language === 'javascript' ||
              meta.language === 'js' ||
              meta.language === 'python' ||
              meta.language === 'py')) ||
          meta.type === 'html' ||
          meta.type === 'react-component',
        dependencies: [],
      };

      console.log(`Creating new artifact ${meta.id} of type ${meta.type}`);
      setArtifacts((prev) => {
        const newMap = new Map(prev);
        newMap.set(artifact.id, artifact);
        return newMap;
      });
      return artifact;
    },
    [artifacts, setArtifacts]
  );

  const updateArtifact = useCallback(
    (id: string, updates: Partial<Artifact>) => {
      setArtifacts((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(id);
        if (existing) {
          newMap.set(id, {
            ...existing,
            ...updates,
            updatedAt: new Date(),
            version: existing.version + 1,
          });
        }
        return newMap;
      });
    },
    []
  );

  const deleteArtifact = useCallback((id: string) => {
    setArtifacts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getArtifactsByMessage = useCallback(
    (messageId: string): Artifact[] => {
      return Array.from(artifacts.values()).filter(
        (artifact) => artifact.messageId === messageId
      );
    },
    [artifacts]
  );

  const exportArtifact = useCallback(
    async (id: string, format: ExportFormat = 'file') => {
      const artifact = artifacts.get(id);
      if (!artifact) {
        throw new Error('Artifact not found');
      }

      switch (format) {
        case 'file': {
          const blob = new Blob([artifact.content], {
            type: getContentType(artifact.type, artifact.language),
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${artifact.title}.${getFileExtension(
            artifact.type,
            artifact.language
          )}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          break;
        }
        case 'gist':
          // TODO: Implement GitHub Gist integration
          console.log('Gist export not implemented yet');
          break;
        case 'codepen':
          // TODO: Implement CodePen integration
          console.log('CodePen export not implemented yet');
          break;
        case 'codesandbox':
          // TODO: Implement CodeSandbox integration
          console.log('CodeSandbox export not implemented yet');
          break;
      }
    },
    [artifacts]
  );

  const getArtifact = useCallback(
    (id: string): Artifact | undefined => {
      return artifacts.get(id);
    },
    [artifacts]
  );

  const getAllArtifacts = useCallback((): Artifact[] => {
    return Array.from(artifacts.values());
  }, [artifacts]);

  const clearArtifacts = useCallback(() => {
    setArtifacts(new Map());
  }, []);

  return {
    artifacts: Array.from(artifacts.values()),
    createArtifact,
    updateArtifact,
    deleteArtifact,
    getArtifactsByMessage,
    getArtifact,
    getAllArtifacts,
    exportArtifact,
    clearArtifacts,
  };
}

function getContentType(type: string, language?: string): string {
  switch (type) {
    case 'html':
      return 'text/html';
    case 'json':
      return 'application/json';
    case 'svg':
      return 'image/svg+xml';
    case 'markdown':
      return 'text/markdown';
    case 'code':
      switch (language?.toLowerCase()) {
        case 'javascript':
        case 'js':
          return 'text/javascript';
        case 'typescript':
        case 'ts':
          return 'text/typescript';
        case 'css':
          return 'text/css';
        case 'python':
        case 'py':
          return 'text/x-python';
        default:
          return 'text/plain';
      }
    default:
      return 'text/plain';
  }
}

function getFileExtension(type: string, language?: string): string {
  switch (type) {
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'svg':
      return 'svg';
    case 'markdown':
      return 'md';
    case 'react-component':
      return 'tsx';
    case 'code':
      switch (language?.toLowerCase()) {
        case 'javascript':
        case 'js':
          return 'js';
        case 'typescript':
        case 'ts':
          return 'ts';
        case 'jsx':
          return 'jsx';
        case 'tsx':
          return 'tsx';
        case 'css':
          return 'css';
        case 'python':
        case 'py':
          return 'py';
        default:
          return 'txt';
      }
    default:
      return 'txt';
  }
}
