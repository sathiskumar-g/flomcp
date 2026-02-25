/**
 * Input validation utilities for generator wizard.
 *
 * Detects gibberish / random keysmash and enforces quality gates before
 * allowing generation — preventing wasted Claude API calls.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason?: string; // human-readable error shown in the UI
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VOWELS = /[aeiou]/gi;
const CONSONANTS = /[bcdfghjklmnpqrstvwxyz]/gi;

/**
 * Returns the ratio of vowels to total letters (0–1).
 * English text sits around 0.35–0.50.
 * Gibberish like "wbfrifeuf" is often < 0.20.
 */
function vowelRatio(text: string): number {
  const letters = text.replace(/[^a-z]/gi, "");
  if (letters.length === 0) return 0.5;
  return (text.match(VOWELS) ?? []).length / letters.length;
}

/**
 * Returns the length of the longest consecutive consonant run.
 * Real English rarely exceeds 3 (e.g. "strength" = "ngth").
 * "wbfrifeuf" has runs of 4–5 which are a clear gibberish signal.
 */
function longestConsonantRun(text: string): number {
  const lower = text.toLowerCase();
  let max = 0;
  let cur = 0;
  for (const ch of lower) {
    if (CONSONANTS.test(ch)) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
    CONSONANTS.lastIndex = 0; // reset stateful regex
  }
  return max;
}

/**
 * Checks whether a word list looks like real English.
 * At least 2 words in a min corpus of common words must be present
 * when the input is long enough to judge.
 */
const COMMON = new Set([
  "the","a","an","to","for","with","that","this","and","or","in","of","is","it",
  "be","as","at","by","from","on","are","you","can","will","use","has","have",
  "create","build","make","server","api","tool","let","get","set","add","list",
  "search","read","write","data","user","mcp","claude","client","key","auth",
  "run","run","send","fetch","return","connect","request","response","endpoint",
  "allow","provide","support","access","manage","generate","which","should","also",
  "file","my","its","new","all","one","two","three","each","some","more","any",
  "like","include","using","when","then","if","just","need","want","do","show",
  "how","what","where","work","give","take","put","call","check","handle","test",
]);

function hasEnoughRealWords(words: string[]): boolean {
  if (words.length < 6) return true; // too short to judge
  const hits = words.filter((w) => COMMON.has(w.toLowerCase())).length;
  return hits >= 2;
}

// ─── Public validators ────────────────────────────────────────────────────────

/**
 * Validates a server name field.
 */
export function validateServerName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, reason: "Server name must be at least 3 characters." };
  }

  // A server name of 3+ chars is short enough that we only check for
  // all-consonant soup (e.g. "gfvuijrfbrf")
  const vr = vowelRatio(trimmed);
  if (trimmed.length >= 6 && vr < 0.15) {
    return {
      valid: false,
      reason:
        'Server name looks like random characters. Please use a meaningful name like "GitHub Assistant" or "Weather Tools".',
    };
  }

  const run = longestConsonantRun(trimmed);
  if (run >= 5) {
    return {
      valid: false,
      reason:
        "Server name doesn't look like a real word. Try something like 'Stripe Helper' or 'CSV Processor'.",
    };
  }

  return { valid: true };
}

/**
 * Validates the main description field.
 * More thorough than name validation because descriptions are longer.
 */
export function validateDescription(text: string): ValidationResult {
  const trimmed = text.trim();

  if (trimmed.length < 50) {
    return {
      valid: false,
      reason: "Please write at least 50 characters so Claude can understand what to build.",
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  // ── 1. Vowel ratio ─────────────────────────────────────────────────────────
  const vr = vowelRatio(trimmed);
  if (vr < 0.15) {
    return {
      valid: false,
      reason:
        "Your description appears to be random characters. Please describe what your MCP server should do in plain English.",
    };
  }

  // ── 2. Long consonant runs ──────────────────────────────────────────────────
  // Count occurrences of 5+ consecutive consonants — more than 2 is a red flag
  const clusters = (trimmed.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]{5,}/g) ?? []).length;
  if (clusters > 2) {
    return {
      valid: false,
      reason:
        "Description contains too many random character sequences. Please describe your server in plain English.",
    };
  }

  // ── 3. Average word length ──────────────────────────────────────────────────
  // English text averages 4–6 chars per word. Gibberish blobs push this high.
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgLen > 14) {
    return {
      valid: false,
      reason:
        "Description doesn't look like normal English text. Did you accidentally paste garbled text?",
    };
  }

  // ── 4. Common-word presence ─────────────────────────────────────────────────
  if (!hasEnoughRealWords(words)) {
    return {
      valid: false,
      reason:
        "Description doesn't contain enough recognisable English words. Please describe your MCP server clearly (e.g. what API, what tools, what auth method).",
    };
  }

  return { valid: true };
}

/**
 * Validates both fields together.
 * Returns the first failure, or { valid: true } if both pass.
 */
export function validateGeneratorStep1(
  serverName: string,
  description: string
): ValidationResult {
  const nameCheck = validateServerName(serverName);
  if (!nameCheck.valid) return nameCheck;

  const descCheck = validateDescription(description);
  if (!descCheck.valid) return descCheck;

  return { valid: true };
}
