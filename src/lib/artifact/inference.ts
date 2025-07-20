import { ArtifactType } from '@/types/artifacts';

export function inferArtifactType(
  language: string,
  code: string
): ArtifactType {
  const lang = language.toLowerCase();

  // Direct language mappings
  if (lang === 'html' || isCompleteHtml(code)) {
    return hasInteractiveElements(code) ? 'react-component' : 'html';
  }

  if (['jsx', 'tsx'].includes(lang) || isReactComponent(code)) {
    return 'react-component';
  }

  if (lang === 'json') return 'json';
  if (lang === 'markdown' || lang === 'md') return 'markdown';
  if (lang === 'svg' || code.trim().startsWith('<svg')) return 'svg';

  // Check for interactive patterns in any code
  if (hasInteractivePatterns(code)) {
    return 'react-component';
  }

  return 'code';
}

export function generateTitle(
  language: string,
  code: string,
  type: ArtifactType
): string {
  // Try to extract meaningful names from code
  if (type === 'react-component') {
    const componentMatch = code.match(/(?:function|const)\s+(\w+)/);
    if (componentMatch) {
      return `${componentMatch[1]} Component`;
    }
  }

  if (type === 'html') {
    const titleMatch = code.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1].trim()) {
      return titleMatch[1].trim();
    }
    return 'HTML Document';
  }

  if (type === 'code') {
    const functionMatch = code.match(/(?:function|def|class)\s+(\w+)/);
    if (functionMatch) {
      return `${functionMatch[1]} (${language || 'Code'})`;
    }
  }

  // Default titles
  const langDisplay = language || 'Code';
  const typeDisplay =
    type === 'code' ? 'Example' : type.charAt(0).toUpperCase() + type.slice(1);

  return `${
    langDisplay.charAt(0).toUpperCase() + langDisplay.slice(1)
  } ${typeDisplay}`;
}

function isReactComponent(code: string): boolean {
  const reactPatterns = [
    /import\s+React/,
    /from\s+['"]react['"]/,
    /export\s+default\s+function\s+\w+/,
    /const\s+\w+\s*=\s*\(\s*\)\s*=>/,
    /<\w+[^>]*>/,
    /useState|useEffect|useCallback|useMemo/,
  ];

  return reactPatterns.some((pattern) => pattern.test(code));
}

function isCompleteHtml(code: string): boolean {
  const trimmed = code.trim();
  return (
    trimmed.startsWith('<!DOCTYPE') ||
    (trimmed.startsWith('<html') && trimmed.includes('</html>'))
  );
}

function hasInteractiveElements(code: string): boolean {
  const interactivePatterns = [
    /<input[^>]*>/i,
    /<button[^>]*>/i,
    /<select[^>]*>/i,
    /<textarea[^>]*>/i,
    /<form[^>]*>/i,
    /onclick\s*=/i,
    /addEventListener/i,
  ];

  return interactivePatterns.some((pattern) => pattern.test(code));
}

function hasInteractivePatterns(code: string): boolean {
  const patterns = [
    /addEventListener|onClick|onChange|onSubmit/,
    /useState|useEffect|setState/,
    /document\.createElement|document\.querySelector/,
    /\.preventDefault\(\)|\.stopPropagation\(\)/,
  ];

  return patterns.some((pattern) => pattern.test(code));
}
