/**
 * Security Checks — Secret Management (SEC-001 to SEC-006)
 */

import type { SecurityCheck, CodeFiles } from "../types";
import {
  anyMatch,
  HARDCODED_SECRET_PATTERNS,
  isPlaceholder,
  ENV_VAR_USAGE_PATTERN,
  DOTENV_IMPORT_PATTERN,
  SECRET_IN_LOG_PATTERNS,
  CONSOLE_LOG_PATTERN,
  SECRET_STARTUP_VALIDATION_PATTERNS,
  SANITIZE_ERROR_FN_PATTERN,
  TOKEN_REDACTION_PATTERN,
} from "../patterns";

// ─── SEC-001: No Hardcoded Secrets ────────────────────────────────────────────

export function checkHardcodedSecrets(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  // Find any match that is NOT a placeholder / .env.example value
  const foundSecrets: string[] = [];

  for (const pattern of HARDCODED_SECRET_PATTERNS) {
    const re = new RegExp(pattern.source, "gim");
    const matches = code.match(re) ?? [];
    for (const m of matches) {
      if (!isPlaceholder(m)) {
        foundSecrets.push(m.slice(0, 60) + (m.length > 60 ? "…" : ""));
      }
    }
  }

  // Also check .env.example — placeholders there are fine
  // We only flag code files

  const passed = foundSecrets.length === 0;

  return {
    id: "SEC-001",
    name: "No Hardcoded Secrets",
    category: "Secret Management",
    severity: "critical",
    passed,
    notApplicable: false,
    message: passed
      ? "No hardcoded secrets detected in source code."
      : `Found ${foundSecrets.length} potential hardcoded secret(s) in source code.`,
    details: passed ? undefined : `Suspicious patterns: ${foundSecrets.slice(0, 3).join(" | ")}`,
    recommendation: passed
      ? undefined
      : "Move all secrets to environment variables using process.env.VAR_NAME. Never commit real credentials to source.",
  };
}

// ─── SEC-002: Environment Variable Usage ─────────────────────────────────────

export function checkEnvironmentVariables(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasEnvUsage = ENV_VAR_USAGE_PATTERN.test(code);
  // Reset lastIndex after test
  ENV_VAR_USAGE_PATTERN.lastIndex = 0;

  const hasDotenv = DOTENV_IMPORT_PATTERN.test(code);

  // If no env vars needed at all (pure local server), this is N/A.
  // Only check for process.env / dotenv — do NOT scan the code body for keywords
  // like "token" / "secret" because sanitizeError() always contains those words
  // in its own regex pattern, which caused constant false positives.
  const noEnvNeeded = !hasEnvUsage && !hasDotenv;

  if (noEnvNeeded) {
    return {
      id: "SEC-002",
      name: "Environment Variable Usage",
      category: "Secret Management",
      severity: "high",
      passed: true,
      notApplicable: true,
      message: "No external secrets required — environment variables not applicable.",
    };
  }

  const passed = hasEnvUsage;

  return {
    id: "SEC-002",
    name: "Environment Variable Usage",
    category: "Secret Management",
    severity: "high",
    passed,
    notApplicable: false,
    message: passed
      ? "Secrets loaded from environment variables via process.env."
      : "Secrets should be loaded from environment variables, not hardcoded.",
    recommendation: passed
      ? undefined
      : "Use process.env.YOUR_SECRET and add the key to .env.example.",
  };
}

// ─── SEC-003: No Secrets in Logs ─────────────────────────────────────────────

export function checkNoSecretsInLogs(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  // Check for console.log (stdout) — corrupts JSON-RPC
  const consoleLogMatches = code.match(new RegExp(CONSOLE_LOG_PATTERN.source, "g")) ?? [];
  const hasConsoleLog = consoleLogMatches.length > 0;

  // Check for logging secret values
  const logsSecrets = anyMatch(SECRET_IN_LOG_PATTERNS, code);

  const passed = !hasConsoleLog && !logsSecrets;

  let details: string | undefined;
  if (hasConsoleLog) {
    details = `Found ${consoleLogMatches.length} console.log() call(s). Use console.error() only — console.log writes to stdout and corrupts the JSON-RPC protocol.`;
  } else if (logsSecrets) {
    details = "Detected potential secret value being passed to a logging call.";
  }

  return {
    id: "SEC-003",
    name: "No Secrets in Logs",
    category: "Secret Management",
    severity: "high",
    passed,
    notApplicable: false,
    message: passed
      ? "No secrets or console.log() calls detected in logging."
      : hasConsoleLog
        ? "console.log() found — corrupts JSON-RPC stdout; use console.error()."
        : "Potential secret value passed to a logging call.",
    details,
    recommendation: passed
      ? undefined
      : hasConsoleLog
        ? "Replace all console.log() with console.error() to avoid corrupting the MCP JSON-RPC stream."
        : "Never log secret values. Use partial disclosure: apiKey.slice(0, 4) + '…'.",
  };
}

// ─── SEC-004: .env.example Exists & Populated ────────────────────────────────

export function checkEnvExample(files: CodeFiles): SecurityCheck {
  const envExample = files.envExample ?? "";

  const hasFile = envExample.trim().length > 0;
  const isEmpty = envExample.trim() === "" || /^#.*$/.test(envExample.trim());

  // Check that every process.env reference in index.ts has a matching key in .env.example
  const envVarRefs =
    files.indexTs.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g) ?? [];
  const envKeys = envVarRefs.map((ref) => ref.replace("process.env.", ""));
  const uniqueKeys = [...new Set(envKeys)];

  const missingKeys = uniqueKeys.filter(
    (key) => !envExample.includes(key)
  );

  const passed = hasFile && !isEmpty && missingKeys.length === 0;

  // If no env vars used, this is N/A
  if (uniqueKeys.length === 0) {
    return {
      id: "SEC-004",
      name: ".env.example Populated",
      category: "Secret Management",
      severity: "medium",
      passed: true,
      notApplicable: true,
      message: "No environment variables referenced — .env.example not required.",
    };
  }

  return {
    id: "SEC-004",
    name: ".env.example Populated",
    category: "Secret Management",
    severity: "medium",
    passed,
    notApplicable: false,
    message: passed
      ? `.env.example present with all ${uniqueKeys.length} required variable(s).`
      : !hasFile || isEmpty
        ? ".env.example is missing or empty."
        : `${missingKeys.length} env variable(s) missing from .env.example: ${missingKeys.join(", ")}`,
    recommendation: passed
      ? undefined
      : `Add these keys to .env.example with placeholder values: ${missingKeys.join(", ")}`,
  };
}

// ─── SEC-005: Secret Validation at Startup ───────────────────────────────────

export function checkSecretStartupValidation(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasEnvUsage = ENV_VAR_USAGE_PATTERN.test(code);
  ENV_VAR_USAGE_PATTERN.lastIndex = 0;

  if (!hasEnvUsage) {
    return {
      id: "SEC-005",
      name: "Secret Validation at Startup",
      category: "Secret Management",
      severity: "medium",
      passed: true,
      notApplicable: true,
      message: "No environment variables used — startup validation not applicable.",
    };
  }

  const hasValidation = anyMatch(SECRET_STARTUP_VALIDATION_PATTERNS, code);

  return {
    id: "SEC-005",
    name: "Secret Validation at Startup",
    category: "Secret Management",
    severity: "medium",
    passed: hasValidation,
    notApplicable: false,
    message: hasValidation
      ? "Required secrets are validated at startup before the server starts."
      : "No startup validation detected for required environment variables.",
    recommendation: hasValidation
      ? undefined
      : 'Add a startup check: if (!process.env.API_KEY) throw new Error("API_KEY environment variable is required");',
  };
}

// ─── SEC-006: sanitizeError Redacts Auth Tokens ───────────────────────────────

export function checkAuthTokenRedaction(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasSanitizeFn = SANITIZE_ERROR_FN_PATTERN.test(code);
  const hasTokenRedaction = TOKEN_REDACTION_PATTERN.test(code);
  const hasIpRedaction = /\[IP\]|\[REDACTED\]|\[PATH\]/.test(code);

  const passed = hasSanitizeFn && (hasTokenRedaction || hasIpRedaction);

  return {
    id: "SEC-006",
    name: "Auth Token Redaction in Errors",
    category: "Secret Management",
    severity: "low",
    passed,
    notApplicable: false,
    message: passed
      ? "sanitizeError() function present and redacts sensitive data from error messages."
      : hasSanitizeFn
        ? "sanitizeError() exists but missing token/IP redaction patterns."
        : "No sanitizeError() function found — error messages may leak sensitive data.",
    recommendation: passed
      ? undefined
      : "Implement sanitizeError() that strips file paths ([PATH]), IPs ([IP]) and secret values ([REDACTED]) from error messages.",
  };
}
