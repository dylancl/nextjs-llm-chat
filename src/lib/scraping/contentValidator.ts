/**
 * Content validation and quality scoring utilities
 */

/**
 * Calculates a quality score for extracted content (0-1)
 */
export function calculateContentScore(content: string): number {
  if (!content || content.length < 100) return 0;

  const words = content.split(/\s+/).filter((word) => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 20);

  let score = 0;

  // Check for Wikipedia indicators (boost score)
  const isWikipedia =
    /wikipedia\.org/i.test(content) ||
    content.includes('From Wikipedia') ||
    /\[\d+\]/.test(content); // Wikipedia citation format
  if (isWikipedia) score += 0.2;

  // Length indicators (up to 0.3 points)
  if (words.length > 50) score += 0.1;
  if (words.length > 200) score += 0.1;
  if (words.length > 500) score += 0.1;

  // Structure indicators (up to 0.3 points)
  if (sentences.length > 5) score += 0.1;
  if (paragraphs.length > 2) score += 0.1;
  if (sentences.length / words.length > 0.03) score += 0.1; // More lenient sentence density

  // Content quality indicators (up to 0.4 points)
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (avgWordLength >= 3 && avgWordLength <= 10) score += 0.1; // More lenient word length

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const uniqueRatio = uniqueWords.size / words.length;
  if (uniqueRatio > 0.3) score += 0.1; // More lenient vocabulary diversity

  // Check for content indicators (expanded for Wikipedia)
  const contentIndicators =
    /\b(article|story|post|blog|news|guide|tutorial|review|analysis|research|study|report|encyclopedia|biography|history|list|category)\b/gi;
  if (contentIndicators.test(content)) score += 0.1;

  // Check for proper capitalization and punctuation
  const properSentences = sentences.filter(
    (s) => /^[A-Z]/.test(s.trim()) && /[.!?]$/.test(s.trim())
  );
  if (properSentences.length / sentences.length > 0.5) score += 0.1; // More lenient

  // Penalties for low-quality indicators (more lenient)
  const boilerplateRatio =
    (
      content.match(
        /\b(click|menu|nav|login|subscribe|follow|share|like|tweet|facebook|twitter|instagram|privacy|cookie|terms|copyright)\b/gi
      ) || []
    ).length / words.length;
  if (boilerplateRatio > 0.08) score -= boilerplateRatio * 1.5; // More lenient threshold

  // Penalty for excessive repetition (more lenient for Wikipedia)
  if (uniqueRatio < 0.2) score -= (0.2 - uniqueRatio) * 0.5; // Reduced penalty

  return Math.max(0, Math.min(1, score));
}

/**
 * Validates if content meets quality standards
 */
export function isValidContent(content: string): boolean {
  if (!content || content.length < 150) return false; // Reduced from 200

  const words = content.split(/\s+/).filter((word) => word.length > 0);
  if (words.length < 30) return false; // Reduced from 50

  // Check for content quality indicators
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length < 2) return false; // Reduced from 3

  // Calculate average word length (should be reasonable for natural text)
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (avgWordLength < 2.5 || avgWordLength > 20) return false; // More lenient range

  // Check for excessive repetition (more lenient for Wikipedia which has repeated section headers)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const uniqueRatio = uniqueWords.size / words.length;

  // More lenient uniqueness ratio for legitimate content sites like Wikipedia
  if (uniqueRatio < 0.2) return false; // Reduced from 0.3

  // Check for boilerplate indicators
  const boilerplateIndicators = [
    /loading/gi,
    /please wait/gi,
    /error/gi,
    /404/gi,
    /not found/gi,
    /javascript required/gi,
    /enable javascript/gi,
    /cookies required/gi,
  ];

  const boilerplateMatches = boilerplateIndicators.reduce((count, pattern) => {
    return count + (content.match(pattern) || []).length;
  }, 0);

  if (boilerplateMatches > words.length * 0.1) return false; // Too much boilerplate

  return true;
}
