/**
 * Security Checks — SSRF Prevention (SSRF-001 to SSRF-004)
 */

import type { SecurityCheck, CodeFiles } from "../types";
import {
  anyMatch,
  HTTP_CALL_PATTERNS,
  URL_ALLOWLIST_PATTERNS,
  URL_ALLOWLIST_CHECK_PATTERNS,
  METADATA_ENDPOINT_PATTERNS,
  METADATA_BLOCK_PATTERNS,
  INTERNAL_IP_PATTERNS,
  INTERNAL_IP_BLOCK_PATTERNS,
  FETCH_WITH_TIMEOUT_PATTERNS,
} from "../patterns";

/** Returns true if the server code makes any outbound HTTP calls. */
function makesHttpCalls(code: string): boolean {
  return anyMatch(HTTP_CALL_PATTERNS, code);
}

// ─── SSRF-001: URL Allowlist Defined ─────────────────────────────────────────

export function checkURLAllowlist(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  if (!makesHttpCalls(code)) {
    return {
      id: "SSRF-001",
      name: "URL Allowlist",
      category: "SSRF Prevention",
      severity: "critical",
      passed: true,
      notApplicable: true,
      message: "No outbound HTTP calls detected — URL allowlist not applicable.",
    };
  }

  const hasAllowlist = anyMatch(URL_ALLOWLIST_PATTERNS, code);
  const hasAllowlistCheck = anyMatch(URL_ALLOWLIST_CHECK_PATTERNS, code);

  const passed = hasAllowlist || hasAllowlistCheck;

  return {
    id: "SSRF-001",
    name: "URL Allowlist",
    category: "SSRF Prevention",
    severity: "critical",
    passed,
    notApplicable: false,
    message: passed
      ? "URL allowlist defined and checked before outbound requests."
      : "No URL allowlist found — outbound requests may be made to arbitrary URLs.",
    recommendation: passed
      ? undefined
      : `Define ALLOWED_DOMAINS = ['api.example.com'] and validate every URL before fetching:
  function validateURL(url: string) {
    const parsed = new URL(url);
    if (!ALLOWED_DOMAINS.includes(parsed.hostname)) throw new Error('Domain not allowed');
  }`,
  };
}

// ─── SSRF-002: Metadata Endpoint Blocking ────────────────────────────────────

export function checkMetadataEndpointBlocking(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  if (!makesHttpCalls(code)) {
    return {
      id: "SSRF-002",
      name: "Cloud Metadata Endpoint Blocking",
      category: "SSRF Prevention",
      severity: "critical",
      passed: true,
      notApplicable: true,
      message: "No outbound HTTP calls detected — metadata endpoint blocking not applicable.",
    };
  }

  // Flag if the code references a metadata IP without also blocking it
  const hasMention = anyMatch(METADATA_ENDPOINT_PATTERNS, code);
  const hasBlocking = anyMatch(METADATA_BLOCK_PATTERNS, code);

  // Safe if: either no mention at all, or it mentions AND blocks
  const passed = !hasMention || hasBlocking;

  return {
    id: "SSRF-002",
    name: "Cloud Metadata Endpoint Blocking",
    category: "SSRF Prevention",
    severity: "critical",
    passed,
    notApplicable: false,
    message: passed
      ? "Cloud metadata endpoints (169.254.169.254 etc.) are blocked in URL validation."
      : "Cloud metadata endpoint IP (169.254.169.254) not blocked — SSRF could leak cloud credentials.",
    recommendation: passed
      ? undefined
      : `Add to validateURL():
  if (parsed.hostname === '169.254.169.254' || parsed.hostname === 'metadata.google.internal') {
    throw new Error('Cloud metadata endpoints are not allowed');
  }`,
  };
}

// ─── SSRF-003: Internal IP Blocking ──────────────────────────────────────────

export function checkInternalIPBlocking(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  if (!makesHttpCalls(code)) {
    return {
      id: "SSRF-003",
      name: "Internal IP Blocking",
      category: "SSRF Prevention",
      severity: "critical",
      passed: true,
      notApplicable: true,
      message: "No outbound HTTP calls detected — internal IP blocking not applicable.",
    };
  }

  const hasInternalMention = anyMatch(INTERNAL_IP_PATTERNS, code);
  const hasInternalBlocking = anyMatch(INTERNAL_IP_BLOCK_PATTERNS, code);

  // Also check for an ALLOWED_DOMAINS pattern which implicitly blocks all others including internal
  const hasAllowlist = anyMatch(
    [/ALLOWED_DOMAINS|allowedDomains/i],
    code
  );

  const passed = !hasInternalMention || hasInternalBlocking || hasAllowlist;

  return {
    id: "SSRF-003",
    name: "Internal IP Blocking",
    category: "SSRF Prevention",
    severity: "critical",
    passed,
    notApplicable: false,
    message: passed
      ? "Internal IPs (localhost, 127.x, 10.x, 192.168.x) are blocked in URL validation."
      : "Internal IP addresses not explicitly blocked — server may be tricked into accessing internal services.",
    recommendation: passed
      ? undefined
      : `Add to validateURL():
  const internalPatterns = [/^localhost$/i, /^127\\./, /^10\\./, /^192\\.168\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./];
  if (internalPatterns.some(p => p.test(parsed.hostname))) {
    throw new Error('Internal IPs are not allowed');
  }`,
  };
}

// ─── SSRF-004: fetchWithTimeout Used (not raw fetch) ─────────────────────────

export function checkFetchWithTimeout(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  if (!makesHttpCalls(code)) {
    return {
      id: "SSRF-004",
      name: "Fetch Timeout Enforcement",
      category: "SSRF Prevention",
      severity: "medium",
      passed: true,
      notApplicable: true,
      message: "No outbound HTTP calls detected — fetch timeout not applicable.",
    };
  }

  const hasTimeout = anyMatch(FETCH_WITH_TIMEOUT_PATTERNS, code);

  // Check for raw fetch() without any timeout mechanism
  const rawFetchCount = (code.match(/\bfetch\s*\(/g) ?? []).length;
  const timeoutFetchCount = (code.match(/fetchWithTimeout\s*\(/g) ?? []).length;
  const abortSignalCount = (code.match(/AbortSignal\.timeout\s*\(/g) ?? []).length;

  // If there are raw fetch() calls not covered by a timeout wrapper, that's a risk
  const uncoveredFetch = rawFetchCount > 0 && !hasTimeout;

  const passed = hasTimeout && !uncoveredFetch;

  return {
    id: "SSRF-004",
    name: "Fetch Timeout Enforcement",
    category: "SSRF Prevention",
    severity: "medium",
    passed,
    notApplicable: false,
    message: passed
      ? `Fetch calls use timeout wrappers (fetchWithTimeout: ${timeoutFetchCount}, AbortSignal: ${abortSignalCount}).`
      : rawFetchCount > 0
        ? `${rawFetchCount} raw fetch() call(s) without timeout — hanging requests can block the server.`
        : "HTTP calls detected but no timeout mechanism (fetchWithTimeout / AbortSignal.timeout) found.",
    details: passed
      ? undefined
      : `Raw fetch calls: ${rawFetchCount}. Timeout wrappers found: ${timeoutFetchCount + abortSignalCount}.`,
    recommendation: passed
      ? undefined
      : `Replace raw fetch() with fetchWithTimeout():
  async function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
    const { timeoutMs = 10000, ...rest } = options;
    const res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
    return res;
  }`,
  };
}
