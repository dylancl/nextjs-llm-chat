/**
 * Content extraction utilities for web scraping
 */

/**
 * Extracts main content from HTML by removing unwanted elements and boilerplate
 */
export function extractMainContent(html: string): string {
  // Remove unwanted elements first
  let content = html.replace(
    /<(script|style|noscript|iframe|embed|object|applet|link|meta|head|title)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    " "
  );

  // Remove comments
  content = content.replace(/<!--[\s\S]*?-->/g, " ");

  // Remove common non-content elements by tag patterns
  const unwantedTags = [
    "nav",
    "header",
    "footer",
    "aside",
    "sidebar",
    "menu",
    "breadcrumb",
    "advertisement",
    "ads",
    "social",
    "share",
    "related",
    "recommended",
    "comments",
    "form",
    "input",
    "button",
    "select",
    "textarea",
  ];

  unwantedTags.forEach((tag) => {
    const patterns = [
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"),
      new RegExp(
        `<\\w+[^>]*\\b(class|id)=[^>]*\\b${tag}\\b[^>]*>[\\s\\S]*?<\\/\\w+>`,
        "gi"
      ),
      new RegExp(
        `<\\w+[^>]*\\b(class|id)=[^>]*\\b${tag}[\\w-]*\\b[^>]*>[\\s\\S]*?<\\/\\w+>`,
        "gi"
      ),
    ];
    patterns.forEach((pattern) => {
      content = content.replace(pattern, " ");
    });
  });

  // Remove elements with common non-content class/id patterns
  const boilerplatePatterns = [
    /<[^>]*\b(class|id)=[^>]*\b(cookie|popup|modal|overlay|banner|alert|notice|widget|sidebar|nav|menu|header|footer|ad|advertisement|social|share|related|comment|form|search|breadcrumb)\b[^>]*>[\s\S]*?<\/[^>]+>/gi,
  ];

  boilerplatePatterns.forEach((pattern) => {
    content = content.replace(pattern, " ");
  });

  // Convert common block elements to preserve paragraph structure
  const blockElements = [
    "p",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "br",
    "hr",
  ];
  blockElements.forEach((tag) => {
    content = content.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "\n\n");
  });

  // Remove all remaining HTML tags
  content = content.replace(/<[^>]*>/g, " ");

  // Decode HTML entities
  content = decodeHtmlEntities(content);

  // Normalize Unicode characters
  content = normalizeUnicodeCharacters(content);

  // Clean and normalize whitespace while preserving paragraph structure
  content = normalizeWhitespace(content);

  // Remove common boilerplate text patterns
  content = removeBoilerplateText(content);

  // Remove lines that are too short or likely boilerplate
  content = filterContentLines(content);

  // Final cleanup
  content = content
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Normalize paragraph breaks
    .replace(/[ \t]+/g, " ") // Final space cleanup
    .trim();

  return content;
}

/**
 * Cleans extracted content by removing boilerplate and normalizing formatting
 */
export function cleanExtractedContent(content: string): string {
  if (!content) return "";

  // Remove excessive line breaks and normalize spacing
  let cleaned = content
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Normalize paragraph breaks
    .replace(/[ \t]+/g, " ") // Collapse spaces
    .trim();

  // Remove lines that are likely navigation, boilerplate, or low-value
  const lines = cleaned.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();

    // Skip empty or very short lines
    if (trimmed.length < 5) return false;

    // Skip lines that are just navigation or UI elements
    const navPatterns = [
      /^(menu|home|about|contact|login|register|search|subscribe|follow|share|like|tweet)$/i,
      /^(next|previous|back|continue|submit|cancel|close|ok|yes|no)$/i,
      /^(page \d+|more|less|show|hide|expand|collapse)$/i,
      /^[\d\s\/\-\.]+$/, // Just dates, numbers, or separators
      /^[^\w]+$/, // Just punctuation or symbols
    ];

    if (navPatterns.some((pattern) => pattern.test(trimmed))) return false;

    // Skip lines with excessive capitalization (likely headings of nav sections)
    const words = trimmed.split(/\s+/);
    const capitalizedWords = words.filter((word) => /^[A-Z][A-Z]+/.test(word));
    if (capitalizedWords.length > words.length * 0.5 && words.length < 8)
      return false;

    // Keep lines that look like content
    return true;
  });

  cleaned = filteredLines.join("\n");

  // Remove repeated phrases (common in scraped content)
  cleaned = removeRepeatedSentences(cleaned);

  return cleaned;
}

/**
 * Truncates content to a maximum length while preserving sentence boundaries
 */
export function truncateContent(
  content: string,
  maxLength: number = 8000
): string {
  if (content.length <= maxLength) return content;

  // Try to truncate at sentence boundaries for better readability
  const sentences = content.split(/[.!?]+/);
  let truncated = "";
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceWithPunc = sentence.trim() + ". ";
    if (currentLength + sentenceWithPunc.length > maxLength - 20) {
      // Leave room for ellipsis
      break;
    }
    truncated += sentenceWithPunc;
    currentLength += sentenceWithPunc.length;
  }

  if (truncated.length > 0) {
    return truncated.trim() + "...";
  } else {
    // Fallback to character truncation if sentence-based fails
    return content.substring(0, maxLength - 3) + "...";
  }
}

// Helper functions

function decodeHtmlEntities(content: string): string {
  const htmlEntities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&mdash;": "—",
    "&ndash;": "–",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&hellip;": "…",
    "&bull;": "•",
    "&middot;": "·",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&deg;": "°",
    "&plusmn;": "±",
  };

  Object.entries(htmlEntities).forEach(([entity, char]) => {
    content = content.replace(new RegExp(entity, "gi"), char);
  });

  // Handle numeric HTML entities
  content = content.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  content = content.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return content;
}

function normalizeUnicodeCharacters(content: string): string {
  const unicodeNormalizations: { [key: string]: string } = {
    // Smart quotes and dashes
    "\u201C": '"',
    "\u201D": '"',
    "\u2018": "'",
    "\u2019": "'",
    "\u2014": "-",
    "\u2013": "-",
    "\u2026": "...",
    // Various whitespace and special chars
    "\u00A0": " ", // Non-breaking space
    "\u2009": " ", // Thin space
    "\u200B": "", // Zero-width space
    "\u200C": "", // Zero-width non-joiner
    "\u200D": "", // Zero-width joiner
    "\uFEFF": "", // Zero-width no-break space
  };

  Object.entries(unicodeNormalizations).forEach(([char, replacement]) => {
    content = content.replace(new RegExp(char, "g"), replacement);
  });

  return content;
}

function normalizeWhitespace(content: string): string {
  return (
    content
      // Remove tabs and normalize line endings
      .replace(/\t/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Collapse multiple spaces but preserve single newlines
      .replace(/ +/g, " ")
      // Collapse multiple newlines to double newlines (paragraph breaks)
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      // Clean up space around newlines
      .replace(/ *\n */g, "\n")
      .trim()
  );
}

function removeBoilerplateText(content: string): string {
  const boilerplateTextPatterns = [
    // Navigation and UI text
    /\b(skip to content|skip navigation|main content|menu|home|about|contact|search|login|register|sign in|sign up)\b/gi,
    // Social media and sharing
    /\b(share|tweet|like|follow|subscribe|facebook|twitter|instagram|linkedin|youtube|pinterest)\b\s*\w*/gi,
    // Cookie and privacy notices
    /\b(cookies?|privacy policy|terms of service|terms of use|cookie policy|gdpr|data protection)\b[^\n]*/gi,
    // Common footer text
    /\b(copyright|all rights reserved|powered by|designed by|developed by|©|®|™)\b[^\n]*/gi,
    // Advertisements and promotions
    /\b(advertisement|sponsored|promoted|ads?)\b[^\n]*/gi,
    // Newsletter and subscription prompts
    /\b(newsletter|subscribe|email|updates?)\b[^\n]*/gi,
    // Comments and user interaction
    /\b(comments?|reply|post comment|leave a comment|add comment)\b[^\n]*/gi,
    // Read more and pagination
    /\b(read more|continue reading|next page|previous page|page \d+)\b[^\n]*/gi,
    // Related content suggestions
    /\b(related|recommended|you might also like|more from|similar)\b[^\n]*/gi,
  ];

  boilerplateTextPatterns.forEach((pattern) => {
    content = content.replace(pattern, "");
  });

  return content;
}

function filterContentLines(content: string): string {
  const lines = content.split("\n");
  const cleanLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length < 10) return false; // Too short
    if (/^\d+$/.test(trimmed)) return false; // Just numbers
    if (/^[^\w\s]+$/.test(trimmed)) return false; // Just symbols
    if (
      /^(yes|no|ok|cancel|submit|close|back|next|prev|previous|continue|more)$/i.test(
        trimmed
      )
    )
      return false; // Button text
    return true;
  });

  return cleanLines.join("\n");
}

function removeRepeatedSentences(content: string): string {
  const sentences = content.split(/[.!?]+/);
  const uniqueSentences = new Set();
  const filteredSentences = sentences.filter((sentence) => {
    const normalized = sentence.trim().toLowerCase();
    if (normalized.length < 10) return false;
    if (uniqueSentences.has(normalized)) return false;
    uniqueSentences.add(normalized);
    return true;
  });

  if (filteredSentences.length > 0) {
    let result = filteredSentences.join(". ").trim();
    if (
      !result.endsWith(".") &&
      !result.endsWith("!") &&
      !result.endsWith("?")
    ) {
      result += ".";
    }
    return result;
  }

  return content;
}
