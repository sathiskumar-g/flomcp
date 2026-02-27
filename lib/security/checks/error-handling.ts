/**
 * Security Checks — Error Handling (ERR-001 to ERR-002)
 */

import type { SecurityCheck, CodeFiles } from "../types";
import {
  anyMatch,
  SANITIZE_ERROR_USAGE_PATTERNS,
  SANITIZE_ERROR_DEFINITION_PATTERNS,
  TRY_CATCH_PATTERN,
} from "../patterns";

// ─── ERR-001: sanitizeError Used on All Error Paths ──────────────────────────

export function checkSanitizeErrorUsage(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasSanitizeDef = anyMatch(SANITIZE_ERROR_DEFINITION_PATTERNS, code);
  const hasSanitizeUsage = anyMatch(SANITIZE_ERROR_USAGE_PATTERNS, code);

  // Count catch blocks and sanitizeError calls
  const catchBlocks = (code.match(/}\s*catch\s*\(/g) ?? []).length;
  const sanitizeCalls = (code.match(/sanitizeError\s*\(/g) ?? []).length;

  // Strip the sanitizeError function body before checking for raw error.message
  // usage — otherwise the check matches its own body
  // ("return error.message.replace(...)" is valid INSIDE sanitizeError).
  // Regex handles up-to-2 levels of nested braces — sufficient for the
  // canonical sanitizeError shape.
  const codeForErrCheck = code.replace(
    /function\s+sanitizeError\b[^{]*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/,
    "/* sanitizeError */"
  );

  // Detect raw error.message in return statements (same-line, no semicolons)
  const hasRawErrorReturn = /return\s+[^;\n]*error\.message/i.test(codeForErrCheck);

  // Check for stack trace in responses
  const hasStackTrace = /error\.stack/.test(codeForErrCheck);

  const passed =
    hasSanitizeDef &&
    hasSanitizeUsage &&
    !hasRawErrorReturn &&
    !hasStackTrace;

  let message: string;
  let details: string | undefined;

  if (!hasSanitizeDef) {
    message = "sanitizeError() function not defined — raw errors may expose sensitive data.";
    details = "Without sanitizeError(), error messages may contain file paths, IP addresses, or secrets.";
  } else if (!hasSanitizeUsage) {
    message = "sanitizeError() defined but never called in catch blocks.";
    details = `${catchBlocks} catch block(s) found, 0 sanitizeError() calls.`;
  } else if (hasStackTrace) {
    message = "error.stack returned in response — exposes full stack trace to clients.";
    details = "Stack traces reveal internal file paths and function names.";
  } else if (hasRawErrorReturn) {
    message = "Raw error.message returned without sanitizeError() — may leak internal details.";
    details = "Some catch blocks return error.message directly.";
  } else {
    message = `sanitizeError() defined and called in error paths (${sanitizeCalls} usage(s) across ${catchBlocks} catch block(s)).`;
  }

  return {
    id: "ERR-001",
    name: "sanitizeError() on All Error Paths",
    category: "Error Handling",
    severity: "critical",
    passed,
    notApplicable: false,
    message,
    details,
    recommendation: passed
      ? undefined
      : !hasSanitizeDef
        ? `Define and use sanitizeError():
  function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
        .replace(/\\/[^\\s"']+/g, "[PATH]")
        .replace(/\\b\\d{1,3}(\\.\\d{1,3}){3}\\b/g, "[IP]")
        .replace(/(key|token|secret|password)=[^\\s&]*/gi, "$1=[REDACTED]");
    }
    return "An unexpected error occurred";
  }`
        : hasStackTrace
          ? "Remove error.stack from all responses. Use sanitizeError(error) instead."
          : "Replace direct error.message usage with sanitizeError(error) in all catch blocks.",
  };
}

// ─── ERR-002: Try-Catch Blocks Present ───────────────────────────────────────

export function checkTryCatchBlocks(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const tryCatchCount = (code.match(new RegExp(TRY_CATCH_PATTERN.source, "g")) ?? []).length;

  // Count async handler functions — tool handlers should all have try-catch
  const toolHandlerCount = (
    code.match(/server\.tool\s*\([^,]+,[^,]+,[^,]+,\s*async/g) ?? []
  ).length;

  // Any async function
  const asyncFnCount = (code.match(/async\s+(?:function|\(|(?:\w+)\s*=>)/g) ?? []).length;

  // If there's at least one try-catch per significant async operation, we're good
  const hasAdequateTryCatch =
    tryCatchCount > 0 &&
    (toolHandlerCount === 0 || tryCatchCount >= toolHandlerCount);

  return {
    id: "ERR-002",
    name: "Try-Catch in All Async Handlers",
    category: "Error Handling",
    severity: "high",
    passed: hasAdequateTryCatch,
    notApplicable: false,
    message: hasAdequateTryCatch
      ? `${tryCatchCount} try-catch block(s) wrapping ${toolHandlerCount || asyncFnCount} async handler(s) — unhandled rejections prevented.`
      : tryCatchCount === 0
        ? "No try-catch blocks detected — unhandled promise rejections will crash the server."
        : `Only ${tryCatchCount} try-catch block(s) for ${toolHandlerCount} tool handler(s) — some handlers may be unprotected.`,
    details:
      tryCatchCount === 0
        ? "Unhandled promise rejections in an MCP server cause the process to crash, making the server unavailable."
        : undefined,
    recommendation: hasAdequateTryCatch
      ? undefined
      : `Wrap every tool handler in try-catch:
  server.tool("name", "desc", schema, async (args) => {
    try {
      // ... your logic
      return { content: [{ type: "text" as const, text: result }] };
    } catch (error) {
      return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };
    }
  });`,
  };
}
