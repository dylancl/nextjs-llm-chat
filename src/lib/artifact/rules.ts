// Simplified rules for what constitutes an artifact-worthy code block
export function shouldCreateArtifact(code: string, language: string): boolean {
  // Must be at least 100 characters
  if (code.length < 100) return false;

  // Check by language type
  const lang = language.toLowerCase();

  // Always create artifacts for these languages (if substantial)
  const alwaysInclude = [
    'html',
    'jsx',
    'tsx',
    'vue',
    'svelte',
    'javascript',
    'js',
    'typescript',
    'ts',
    'python',
    'py',
    'css',
    'scss',
    'sass',
    'sql',
    'xml',
    'svg',
  ];

  if (alwaysInclude.includes(lang)) {
    return isSubstantialCode(code);
  }

  // Special handling for data formats - require larger size
  if (['json', 'yaml', 'yml'].includes(lang)) {
    return code.length > 300 && hasComplexStructure(code);
  }

  // For markdown, require substantial content
  if (['markdown', 'md'].includes(lang)) {
    return code.length > 500 && hasMarkdownStructure(code);
  }

  // For unknown/empty language, use pattern detection
  if (!lang) {
    return hasCodePatterns(code);
  }

  return false;
}

function isSubstantialCode(code: string): boolean {
  const lines = code.split('\n').filter((line) => line.trim().length > 0);

  // Must have at least 5 meaningful lines
  if (lines.length < 5) return false;

  // Look for function/class/component patterns
  const patterns = [
    /^function\s+\w+/m,
    /^(const|let|var)\s+\w+\s*=\s*\(/m,
    /^class\s+\w+/m,
    /^export\s+(default\s+)?(function|class|const)/m,
    /^def\s+\w+/m,
    /<\w+[^>]*>/, // JSX/HTML tags
  ];

  return patterns.some((pattern) => pattern.test(code));
}

function hasComplexStructure(code: string): boolean {
  try {
    const parsed = JSON.parse(code);
    if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);
      return keys.length > 5 || JSON.stringify(parsed).length > 300;
    }
  } catch {
    // If not JSON, check for YAML-like complexity
    const lines = code.split('\n').filter((line) => line.trim().length > 0);
    return lines.length > 10;
  }
  return false;
}

function hasMarkdownStructure(code: string): boolean {
  const lines = code.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 20) return false;

  const hasHeaders = lines.some((line) => line.trim().startsWith('#'));
  const hasLists = lines.some((line) => /^[\s]*[-*+]\s/.test(line));
  const hasCodeBlocks = (code.match(/```/g) || []).length > 2;

  return hasHeaders && (hasLists || hasCodeBlocks);
}

function hasCodePatterns(code: string): boolean {
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /class\s+\w+/,
    /import\s+.+\s+from/,
    /def\s+\w+\s*\(/,
    /<\w+[^>]*>/,
    /document\.|console\./,
  ];

  return codePatterns.some((pattern) => pattern.test(code));
}
