/**
 * Deterministic Posting Safety Gate
 * Analyzes untrusted job posting text before sending to LLM.
 * Detects prompt injections, hidden instructions, zero-width characters, and script anomalies.
 */

export interface IntegrityCheckResult {
  status: 'SAFE' | 'FLAGGED' | 'REJECTED';
  findings: string[];
  cleanedText: string;
}

// Patterns commonly used in prompt injection attempts
const INJECTION_PATTERNS: Array<{ pattern: RegExp; description: string; severe?: boolean }> = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    description: 'Instruction override attempt ("ignore previous instructions")',
    severe: true,
  },
  {
    pattern: /system\s+prompt/i,
    description: 'System prompt reference detected',
  },
  {
    pattern: /you\s+must\s+(give|score|rate)\s+(a\s+)?100/i,
    description: 'Forced perfect score manipulation',
  },
  {
    pattern: /recommendation\s*:\s*["']?apply["']?/i,
    description: 'Forced JSON recommendation injection',
  },
  {
    pattern: /as\s+an\s+ai\s+language\s+model|as\s+claude|as\s+chatgpt|as\s+gemini/i,
    description: 'Persona hijacking / LLM address attempt',
  },
  {
    pattern: /output\s+(only|in)\s+json\s+with\s+score\s+100/i,
    description: 'JSON format hijacking',
    severe: true,
  },
  {
    pattern: /send\s+(this|user|profile|data|secret|token)\s+to\s+https?:\/\//i,
    description: 'Data exfiltration attempt via URL',
    severe: true,
  },
  {
    pattern: /base64\s*:\s*[A-Za-z0-9+/=]{30,}/i,
    description: 'Suspicious Base64 encoded payload',
  },
];

// Invisible / zero-width characters often used for steganographic injections
const INVISIBLE_CHARS_REGEX = /[\u200B\u200C\u200D\uFEFF\u00A0\u200E\u200F\u202A-\u202E]/g;

/**
 * Strips HTML tags and script/style tags while extracting text.
 */
export function stripHtml(html: string): string {
  // Remove script and style elements and their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

  // Remove common hidden HTML elements (e.g. style="display:none")
  text = text.replace(/<[^>]*style\s*=\s*["'][^"']*(?:display\s*:\s*none|font-size\s*:\s*0|opacity\s*:\s*0)[^"']*["'][^>]*>.*?<\/[^>]+>/gi, ' ');

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize excessive whitespaces
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Runs deterministic security inspection on job posting raw text.
 */
export function inspectPostingIntegrity(rawContent: string): IntegrityCheckResult {
  const findings: string[] = [];
  let isRejected = false;

  // 1. Clean HTML if present
  let cleaned = stripHtml(rawContent);

  // 2. Check for invisible / zero-width characters
  const invisibleMatches = cleaned.match(INVISIBLE_CHARS_REGEX);
  if (invisibleMatches && invisibleMatches.length > 5) {
    findings.push(`Contains ${invisibleMatches.length} anomalous zero-width/invisible characters.`);
    // Strip them
    cleaned = cleaned.replace(INVISIBLE_CHARS_REGEX, '');
  }

  // 3. Check for Prompt Injection signatures
  for (const item of INJECTION_PATTERNS) {
    if (item.pattern.test(cleaned)) {
      findings.push(item.description);
      if (item.severe) {
        isRejected = true;
      }
    }
  }

  // 4. Excessive length check (DoS prevention)
  if (cleaned.length > 50000) {
    findings.push('Job description length exceeds 50,000 characters limit; truncated.');
    cleaned = cleaned.slice(0, 50000);
  }

  // 5. Determine overall integrity status
  let status: 'SAFE' | 'FLAGGED' | 'REJECTED' = 'SAFE';
  if (isRejected) {
    status = 'REJECTED';
  } else if (findings.length > 0) {
    status = 'FLAGGED';
  }

  return {
    status,
    findings,
    cleanedText: cleaned,
  };
}
