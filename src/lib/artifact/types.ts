import { ArtifactType } from '@/types/artifacts';

export interface CodeBlock {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
}

export interface ArtifactMeta {
  type: ArtifactType;
  title: string;
  language?: string;
  dependencies?: string[];
  id?: string;
}

export const VALID_ARTIFACT_TYPES: ArtifactType[] = [
  'code',
  'html',
  'react-component',
  'markdown',
  'json',
  'chart',
  'svg',
];

export const TYPE_MAPPINGS: Record<string, ArtifactType> = {
  // Interactive UI elements -> react-component
  checkbox: 'react-component',
  button: 'react-component',
  form: 'react-component',
  input: 'react-component',
  modal: 'react-component',
  component: 'react-component',
  widget: 'react-component',
  ui: 'react-component',

  // Web content -> html
  webpage: 'html',
  page: 'html',
  website: 'html',
  document: 'html',

  // Code-related
  script: 'code',
  program: 'code',
  function: 'code',
  class: 'code',

  // Data formats
  data: 'json',
  config: 'json',
  schema: 'json',

  // Graphics
  diagram: 'svg',
  icon: 'svg',
  graphic: 'svg',
  image: 'svg',

  // Documentation
  text: 'markdown',
  doc: 'markdown',
  readme: 'markdown',
  documentation: 'markdown',
};
