/**
 * Security Validation Engine — Regex Pattern Library
 *
 * Centralised patterns used by the 22 security checks.
 * Each exported function returns a *new* RegExp instance so callers
 * can use .test() safely (no lastIndex state leakage between calls).
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Count how many non-overlapping matches a pattern has in text. */
export function countMatches(pattern: RegExp, text: string): number {
  const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
  return (text.match(new RegExp(pattern.source, flags)) ?? []).length;
}

/** Return true if any of the patterns match in text. */
export function anyMatch(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => new RegExp(p.source, p.flags).test(text));
}

// ─── SEC-001: Hardcoded Secrets ───────────────────────────────────────────────

/**
 * Patterns that signal a hard-coded secret value in source code.
 * We look for assignment patterns where the RHS is a non-empty string literal
 * that isn't "process.env" and doesn't look like a placeholder.
 */
export const HARDCODED_SECRET_PATTERNS: RegExp[] = [
  // OpenAI key
  /sk-[a-zA-Z0-9]{20,}/,
  // Anthropic key
  /sk-ant-[a-zA-Z0-9_-]{20,}/,
  // GitHub personal access tokens
  /ghp_[a-zA-Z0-9]{36}/,
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/,
  // AWS access key ID
  /AKIA[0-9A-Z]{16}/,
  // AWS secret (typically 40 chars base64)
  /(?:aws[_-]?secret|secretaccesskey)\s*[:=]\s*["'][a-zA-Z0-9/+]{40}["']/i,
  // Generic api_key = "literal"  (not process.env)
  /(?:api[_\-]?key|apikey)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/i,
  // password = "literal"
  /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'<>]{4,}["']/i,
  // token/secret = "literal"
  /(?:secret|token)\s*[:=]\s*["'][a-zA-Z0-9_\-./+]{8,}["']/i,
  // const/let SECRET = "literal"  (caps name strongly suggests a secret)
  /(?:const|let|var)\s+[A-Z_]{3,}(?:KEY|SECRET|TOKEN|PASSWORD|PASS)\s*=\s*["'][^"']{6,}["']/,
  // Hardcoded Bearer token in fetch headers
  /['"]\s*Bearer\s+[a-zA-Z0-9_\-.=]{10,}\s*['"]/i,
  // MongoDB / Postgres connection strings with embedded credentials
  /(?:mongodb|postgresql|postgres|mysql|redis):\/\/[^:@\s]+:[^@\s]{4,}@/i,
  // Stripe keys
  /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}/,
  // Twilio auth token
  /[a-f0-9]{32}(?:\s*\/\/\s*twilio)/i,
  // SendGrid/Resend API keys
  /SG\.[a-zA-Z0-9._-]{22,}/,
  // Generic 32+ char hex string assigned to a secret-sounding variable
  /(?:secret|token|key|apikey|api_key)\s*[:=]\s*["'][0-9a-f]{32,}["']/i,
];

/** Placeholder strings that are NOT real secrets (safe to allow) */
export const PLACEHOLDER_PATTERNS: RegExp[] = [
  /your[_-]?(?:api[_-]?)?(?:key|token|secret|password)/i,
  /replace[_-]?(?:with|me)/i,
  /xxx+/i,
  /\*{4,}/,
  /<[a-z_]+>/i,
  /\[your[^\]]*\]/i,
  /placeholder/i,
  /changeme/i,
  /insert[_-]?here/i,
  /example[_-]?key/i,
  /dummy/i,
  /fill[_-]?this/i,
];

/** Returns true if the matched string looks like a placeholder, not a real secret. */
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => new RegExp(p.source, p.flags).test(value));
}

// ─── SEC-002: Environment Variables ──────────────────────────────────────────

export const ENV_VAR_USAGE_PATTERN = /process\.env\.[A-Z_][A-Z0-9_]*/g;
export const DOTENV_IMPORT_PATTERN =
  /import\s+.*['"]dotenv['"]|require\s*\(\s*['"]dotenv['"]\s*\)|config\(\)/;

// ─── SEC-003: Secrets in Logs ─────────────────────────────────────────────────

/** Detects console.error/log/warn calls that may leak secret values */
export const SECRET_IN_LOG_PATTERNS: RegExp[] = [
  // Direct process.env value in a log call
  /console\.\w+\s*\([^)]*process\.env\.[A-Z_]+[^)]*\)/,
  // Logging variables named after secrets
  /console\.\w+\s*\([^)]*\b(?:apiKey|api_key|password|token|secret|bearer|auth|credential)[^)]*\)/i,
  // Template literal with process.env
  /console\.\w+\s*\(`[^`]*\$\{process\.env\.[^}]+\}[^`]*`\)/,
];

/** console.log (stdout) usage – corrupts JSON-RPC; should be console.error */
export const CONSOLE_LOG_PATTERN = /\bconsole\.log\s*\(/g;

// ─── SEC-005: Secret Validation at Startup ───────────────────────────────────

/** Patterns indicating a secret is validated for existence before use */
export const SECRET_STARTUP_VALIDATION_PATTERNS: RegExp[] = [
  /if\s*\(!.*(?:process\.env\.[A-Z_]+|\bapi[Kk]ey\b|\btoken\b|\bsecret\b).*\)\s*\{?\s*(?:throw|process\.exit)/,
  /throw\s+new\s+Error\s*\([^)]*(?:required|missing|not\s+(?:set|found|configured|defined))[^)]*\)/i,
  /process\.exit\s*\(\s*1\s*\)\s*;/,
];

// ─── SEC-006: Auth Token Redaction in sanitizeError ───────────────────────────

export const SANITIZE_ERROR_FN_PATTERN =
  /function\s+sanitizeError\s*\(|const\s+sanitizeError\s*=\s*(?:function|\()/;
export const TOKEN_REDACTION_PATTERN =
  /\(key|token|secret|password\)\s*=\s*[^\s&]*/i;

// ─── VAL-001: Zod Schema Validation ──────────────────────────────────────────

export const ZOD_IMPORT_PATTERN = /(?:import|require)\s*.*['"](zod)['"]/;
export const ZOD_SCHEMA_PATTERNS: RegExp[] = [
  /z\.(string|number|boolean|object|array|enum|union|literal|record|tuple|any)\s*\(/,
  /z\.object\s*\(\s*\{/,
  /\.safeParse\s*\(/,
  /\.parse\s*\(/,
];

// ─── VAL-002: TypeScript Strict Mode ─────────────────────────────────────────

export const TS_STRICT_PATTERNS: RegExp[] = [
  /"strict"\s*:\s*true/,
  /'strict'\s*:\s*true/,
];

// ─── VAL-003: Boundary Checks ─────────────────────────────────────────────────

export const BOUNDARY_CHECK_PATTERNS: RegExp[] = [
  /\.min\s*\(\s*\d/,
  /\.max\s*\(\s*\d/,
  /\.minLength\s*\(/,
  /\.maxLength\s*\(/,
  /\.length\s*\(\s*\d/,
  /\.url\s*\(\s*\)/,
  /\.email\s*\(\s*\)/,
  /\.regex\s*\(/,
  /\.refine\s*\(/,
  /\.finite\s*\(\s*\)/,
  /\.int\s*\(\s*\)/,
  /\.positive\s*\(\s*\)/,
  /\.nonnegative\s*\(\s*\)/,
];

// ─── VAL-004: Input Sanitization ─────────────────────────────────────────────

export const INPUT_TRIM_PATTERNS: RegExp[] = [
  /z\.string\s*\(\s*\)\.trim\s*\(\)/,
  /\.trim\s*\(\)/,
];

export const PATH_TRAVERSAL_CHECK_PATTERNS: RegExp[] = [
  /\.\./,        // literally double-dot
  /\.\.\/|\.\.\\/, // directory traversal
];

export const REFINE_PATH_SAFETY_PATTERNS: RegExp[] = [
  /refine\s*\([^)]*\.\./,
  /refine\s*\([^)]*isAbsolute/,
  /refine\s*\([^)]*path/i,
  /path\.isAbsolute/,
  /includes\s*\(\s*['"]\.\.['"]\s*\)/,
];

// ─── VAL-005: Required Fields ─────────────────────────────────────────────────

export const REQUIRED_FIELD_PATTERNS: RegExp[] = [
  // Zod: no .optional() on parameters
  /z\.(string|number|boolean)\s*\(\s*\)(?!\.optional)/,
];

// ─── SSRF-001: URL Allowlist ──────────────────────────────────────────────────

export const URL_ALLOWLIST_PATTERNS: RegExp[] = [
  /ALLOWED_DOMAINS|allowedDomains|ALLOWED_HOSTS|allowedHosts/i,
  /ALLOWED_URLS|allowedUrls|urlAllowlist|URL_ALLOWLIST/i,
  /allowlist|whitelist/i,
];

export const URL_ALLOWLIST_CHECK_PATTERNS: RegExp[] = [
  /\.includes\s*\([^)]*(?:hostname|domain|host)[^)]*\)/,
  /allowedDomains\s*\.\s*(?:includes|has)\s*\(/i,
  /ALLOWED_DOMAINS\s*\.\s*(?:includes|has)\s*\(/i,
  /validateURL|isAllowedURL|checkURL/i,
];

// ─── SSRF-002: Metadata Endpoint Blocking ────────────────────────────────────

export const METADATA_ENDPOINT_PATTERNS: RegExp[] = [
  /169\.254\.169\.254/, // AWS/Azure/GCP IMDS
  /metadata\.google\.internal/,
  /169\.254\.170\.2/, // ECS metadata
  /fd00:ec2::254/,
];

export const METADATA_BLOCK_PATTERNS: RegExp[] = [
  /169\.254\.169\.254['"]\s*\)/, // throws/blocks on this IP
  /metadata\.google\.internal['"]/,
  /[Mm]etadata\s+endpoint/,
  /[Mm]etadata.*not\s+allowed/i,
];

// ─── SSRF-003: Internal IP Blocking ──────────────────────────────────────────

export const INTERNAL_IP_PATTERNS: RegExp[] = [
  /\blocalhost\b/,
  /127\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /192\.168\.\d{1,3}\.\d{1,3}/,
  /172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
  /\[::1\]|^::1$/,
  /0\.0\.0\.0/,
  /fc[0-9a-f]{2}:|fd[0-9a-f]{2}:/i, // ULA IPv6
];

export const INTERNAL_IP_BLOCK_PATTERNS: RegExp[] = [
  /[Ii]nternal\s+IP/,
  /[Ii]nternal.*not\s+allowed/i,
  /\blocalhost.*not\s+allowed/i,
  /internalPatterns|localPatterns|privateIp/i,
  /127\.\d+\.\d+\.\d+[^0-9].*throw|throw.*127\.\d+\.\d+\.\d+/,
  /10\.\d+[^0-9].*throw|throw.*10\.\d+/,
  /192\.168[^0-9].*throw|throw.*192\.168/,
];

// ─── SSRF-004: fetchWithTimeout ───────────────────────────────────────────────

export const FETCH_WITH_TIMEOUT_PATTERNS: RegExp[] = [
  /fetchWithTimeout\s*\(/,
  /AbortSignal\.timeout\s*\(/,
  /AbortController\b/,
  /signal\s*:\s*AbortSignal\.timeout/,
];

export const RAW_FETCH_WITHOUT_TIMEOUT_PATTERN =
  /\bfetch\s*\(\s*(?!.*AbortSignal|.*controller)/;

// ─── CMD-001: Shell Execution ─────────────────────────────────────────────────

export const DANGEROUS_EXEC_PATTERNS: RegExp[] = [
  /exec\s*\([^)]*shell\s*:\s*true/,
  /spawn\s*\([^)]*shell\s*:\s*true/,
  /execSync\s*\(/,
  /spawnSync\s*\(/,
  /child_process/,
];

// Benign exec pattern that does NOT use shell:true
export const SAFE_EXEC_PATTERN = /exec\s*\([^)]*\)/;

// ─── CMD-002: No eval / Function Constructor ──────────────────────────────────

export const EVAL_PATTERNS: RegExp[] = [
  /\beval\s*\(/,
  /new\s+Function\s*\(/,
  /setTimeout\s*\(\s*["'`]/,
  /setInterval\s*\(\s*["'`]/,
  /vm\.runIn(?:New)?Context\s*\(/,
  /vm\.Script\s*\(/,
];

// ─── CMD-003: Timeouts ────────────────────────────────────────────────────────

export const TIMEOUT_PATTERNS: RegExp[] = [
  /fetchWithTimeout\s*\(/,
  /timeoutMs\s*[:=?]/,
  /AbortSignal\.timeout\s*\(/,
  /AbortController\b/,
  /setTimeout\s*\(\s*(?!["'`])/,  // setTimeout with non-string first arg
  /Promise\.race\s*\(\s*\[/,
];

// ─── ERR-001: sanitizeError ───────────────────────────────────────────────────

export const SANITIZE_ERROR_USAGE_PATTERNS: RegExp[] = [
  /sanitizeError\s*\(/,
];

export const SANITIZE_ERROR_DEFINITION_PATTERNS: RegExp[] = [
  /function\s+sanitizeError/,
  /const\s+sanitizeError\s*=/,
  /sanitizeError\s*=\s*(?:function|\()/,
];

// ─── ERR-002: Try-Catch ───────────────────────────────────────────────────────

export const TRY_CATCH_PATTERN = /\btry\s*\{/g;

// ─── DEP-001: Known Vulnerable Packages ──────────────────────────────────────

/**
 * Packages with known critical CVEs that should not appear in generated code.
 * This is a lightweight allowlist check — not a full audit.
 */
export const VULNERABLE_PACKAGE_PATTERNS: RegExp[] = [
  /"node-serialize"\s*:/, // CVE-2017-5941
  /"serialize-javascript"\s*:\s*"(?:[0-2]\.|3\.0)/, // <3.1 has CVE-2019-16769
  /"lodash"\s*:\s*"(?:[0-3]\.|4\.[01]\.|4\.1[0-6]\.)/, // <4.17.21 multiple CVEs
  /"lodash\.merge"\s*:\s*"(?:[0-3]\.|4\.[0-3]\.)/, // CVE-2018-3721
  /"moment"\s*:/, // deprecated; moment had CVE-2022-31129
  /"axios"\s*:\s*"(?:0\.|1\.0\.)/, // <1.1 had CVE-2023-45857
  /"got"\s*:\s*"(?:[0-9]\.|1[01]\.)/, // got <12 deprecated
  /"request"\s*:/, // deprecated, unmaintained
  /"event-stream"\s*:/, // CVE-2018-21269 supply chain attack
  /"flatmap-stream"\s*:/, // CVE-2018-16462
  /"jsonwebtoken"\s*:\s*"(?:[0-8]\.|9\.0\.0)/, // CVE-2022-23529 <9.0.0
  /"vm2"\s*:/, // CVE-2023-29017, CVE-2023-32314 — critically broken
  /"eval"\s*:/, // always dangerous
];

// ─── DEP-002: HTTP Calls Detection (determines if SSRF checks apply) ─────────

export const HTTP_CALL_PATTERNS: RegExp[] = [
  /\bfetch\s*\(/,
  /fetchWithTimeout\s*\(/,
  /https?\.(?:get|post|put|delete|request)\s*\(/,
  /axios\./,
  /node-fetch/,
  /"node-fetch"/,
  /"axios"/,
  /"got"/,
  /"superagent"/,
  /"undici"/,
];

// ─── DEP-002: Minimal Dependencies ───────────────────────────────────────────

/** Packages that are always expected / safe for FloMCP-generated servers */
export const EXPECTED_PACKAGES: string[] = [
  "@modelcontextprotocol/sdk",
  "zod",
  "dotenv",
  "@types/node",
  "typescript",
  "tsx",
  "vitest",
  "@types/react",
  "@types/react-dom",
  "next",
];

/**
 * Returns package names from a parsed package.json object.
 * Combines dependencies + devDependencies.
 */
export function extractPackageNames(packageJsonText: string): string[] {
  try {
    const pkg = JSON.parse(packageJsonText) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
  } catch {
    return [];
  }
}

/** Max number of production dependencies before we flag "excessive" */
export const MAX_EXPECTED_PROD_DEPS = 8;
