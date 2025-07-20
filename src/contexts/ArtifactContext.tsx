'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useArtifacts } from '@/hooks/useArtifacts';
import { Artifact, ArtifactMeta, ExportFormat } from '@/types/artifacts';

interface ArtifactContextType {
  artifacts: Artifact[];
  createArtifact: (meta: ArtifactMeta, content: string) => Artifact;
  updateArtifact: (id: string, updates: Partial<Artifact>) => void;
  deleteArtifact: (id: string) => void;
  getArtifactsByMessage: (messageId: string) => Artifact[];
  getArtifact: (id: string) => Artifact | undefined;
  getAllArtifacts: () => Artifact[];
  exportArtifact: (id: string, format?: ExportFormat) => Promise<void>;
  clearArtifacts: () => void;
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(
  undefined
);

interface ArtifactProviderProps {
  children: ReactNode;
}

export function ArtifactProvider({ children }: ArtifactProviderProps) {
  const artifactHook = useArtifacts();

  return (
    <ArtifactContext.Provider value={artifactHook}>
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifactContext(): ArtifactContextType {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error(
      'useArtifactContext must be used within an ArtifactProvider'
    );
  }
  return context;
}
