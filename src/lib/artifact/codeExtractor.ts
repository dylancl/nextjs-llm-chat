import { CodeBlock } from './types';

const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let match;

  const regex = new RegExp(CODE_BLOCK_REGEX.source, CODE_BLOCK_REGEX.flags);

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, language = '', code] = match;
    blocks.push({
      language: language.toLowerCase(),
      code: code.trim(),
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    });
  }

  return blocks;
}
