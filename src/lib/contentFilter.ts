/**
 * Client-side content filtering utility for Apple App Store compliance
 * This filter runs 100% locally - no content is ever sent to servers
 */

// Common objectionable patterns (kept minimal and generic)
const OBJECTIONABLE_PATTERNS = [
  // Explicit slurs and hate speech patterns
  /\b(n[i1]gg[e3]r|f[a4]gg[o0]t|k[i1]ke|sp[i1]c|ch[i1]nk)\b/gi,
  // Threats of violence
  /\b(kill\s+you|murder\s+you|gonna\s+die|i('ll|'m\s+going\s+to)\s+(kill|murder|hurt))\b/gi,
  // Child exploitation references
  /\b(cp|pedo|child\s+porn|underage)\b/gi,
];

// Less severe patterns that warrant a warning
const WARNING_PATTERNS = [
  // General profanity
  /\b(fuck|shit|ass|bitch|damn|crap|bastard)\b/gi,
  // Mild threats
  /\b(hate\s+you|screw\s+you)\b/gi,
];

export interface ContentFilterResult {
  isBlocked: boolean;
  hasWarning: boolean;
  reason?: string;
}

/**
 * Filters content for objectionable material
 * Returns whether content should be blocked, warned, or allowed
 */
export const filterContent = (content: string): ContentFilterResult => {
  const normalizedContent = content.toLowerCase();

  // Check for severely objectionable content (block)
  for (const pattern of OBJECTIONABLE_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      return {
        isBlocked: true,
        hasWarning: false,
        reason: "This message contains content that violates our community guidelines.",
      };
    }
  }

  // Check for warning-level content
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      return {
        isBlocked: false,
        hasWarning: true,
        reason: "This message may contain inappropriate language.",
      };
    }
  }

  return {
    isBlocked: false,
    hasWarning: false,
  };
};

/**
 * Sanitizes content by replacing objectionable words with asterisks
 * Used for display purposes only
 */
export const sanitizeContent = (content: string): string => {
  let sanitized = content;

  // Replace objectionable patterns with asterisks
  for (const pattern of [...OBJECTIONABLE_PATTERNS, ...WARNING_PATTERNS]) {
    sanitized = sanitized.replace(pattern, (match) => "*".repeat(match.length));
  }

  return sanitized;
};

/**
 * Quick check if content likely contains issues
 * Lighter weight than full filter for performance
 */
export const hasContentIssues = (content: string): boolean => {
  const normalizedContent = content.toLowerCase();
  
  return [...OBJECTIONABLE_PATTERNS, ...WARNING_PATTERNS].some(
    (pattern) => pattern.test(normalizedContent)
  );
};
