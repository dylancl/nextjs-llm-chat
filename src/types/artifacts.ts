export interface ArtifactMeta {
  id: string;
  type: ArtifactType;
  title: string;
  description?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
  messageId: string;
  version: number;
}

export type ArtifactType =
  | 'code'
  | 'html'
  | 'react-component'
  | 'markdown'
  | 'json'
  | 'chart'
  | 'svg';

export interface Artifact extends ArtifactMeta {
  content: string;
  dependencies?: string[];
  isExecutable: boolean;
  previewUrl?: string;
}

export interface ArtifactCandidate {
  type: ArtifactType;
  language: string;
  code: string;
  title?: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedArtifact {
  type: ArtifactType;
  title: string;
  language?: string;
  content: string;
  dependencies?: string[];
  id?: string; // Optional id for updates/patches
}

export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  logs?: string[];
  executionTime?: number;
}

export interface InputRequirement {
  prompt: string;
  suggestion: string;
}

export interface PythonInputRequest {
  id: string;
  prompt: string;
  resolve: (value: string) => void;
  reject: (reason?: Error) => void;
}

export interface SandboxOptions {
  timeout?: number;
  allowedApis?: string[];
  restrictions?: string[];
  onInputRequest?: (request: PythonInputRequest) => void;
}

export type ExportFormat = 'file' | 'gist' | 'codepen' | 'codesandbox';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
