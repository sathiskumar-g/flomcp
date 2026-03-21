/**
 * MCP Protocol Compliance Validator
 *
 * Runs 10 MCP-specific protocol checks on generated TypeScript code.
 * Separate from the 22 OWASP-security checks in lib/security/.
 *
 * Checks:
 *   PROTO-001  Tool response shape — content: [{ type, text }] required       (blocker)
 *   PROTO-002  No throw in handlers — isError: true pattern only               (blocker)
 *   PROTO-003  Capability declaration matches actual feature usage             (warning)
 *   PROTO-004  Resource URI format — scheme-namespaced                        (warning)
 *   PROTO-005  No console.log — console.error only                             (blocker)
 *   PROTO-006  Stderr startup logging present                                  (warning)
 *   PROTO-007  SIGTERM / SIGINT handler registered                             (warning)
 *   PROTO-008  StdioServerTransport used (not SSE / HTTP-Streamable)          (blocker)
 *   PROTO-009  async main() defined + process.exit(1) on fatal catch          (blocker)
 *   PROTO-010  Shebang on line 1 exactly                                      (blocker)
 *
 * Usage:
 *   import { runProtocolValidation, buildProtocolFixPrompt } from "@/lib/protocol/validator";
 *   const report = runProtocolValidation(indexTs);
 *   if (report.hadBlockers) { ...targeted re-gen using buildProtocolFixPrompt... }
 */

import type { ProtocolCheck, ProtocolReport } from "./types";

// ─── PROTO-001: Tool response shape ──────────────────────────────────────────
// Every tool handler must return { content: [{ type: "text", text: ... }] }
// Missing the content array is the #1 cause of silent tool failures in Claude.

function checkToolResponseShape(code: string): ProtocolCheck {
  const hasContentArray = /return\s*\{\s*content\s*:\s*\[/.test(code);
  const hasTypeText = /type\s*:\s*["']text["']/.test(code);
  const hasTextProp = /\btext\s*:/.test(code);

  const passed = hasContentArray && hasTypeText && hasTextProp;

  return {
    id: "PROTO-001",
    name: "Tool Response Shape",
    severity: "blocker",
    passed,
    notApplicable: false,
    message: passed
      ? "Tool handlers return correct MCP response shape: { content: [{ type, text }] }."
      : "Tool handlers do not return the required MCP response shape.",
    details: passed
      ? undefined
      : 'MCP requires every tool return { content: [{ type: "text", text: string }] }. Missing the content array causes Claude to silently discard the response.',
    recommendation: passed
      ? undefined
      : `Every tool handler must return this exact shape:

// Success:
return { content: [{ type: "text" as const, text: String(result) }] };

// Error:
return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };`,
  };
}

// ─── PROTO-002: No throw in tool handlers ─────────────────────────────────────
// MCP tool handlers must NOT throw — they must return { isError: true } instead.
// A throw that escapes a handler crashes the JSON-RPC transport connection.

function checkNoThrowInHandlers(code: string): ProtocolCheck {
  // Strip the sanitizeError utility body to avoid matching its internal logic.
  const stripped = code.replace(
    /function\s+sanitizeError\b[^{]*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/,
    "/* sanitizeError */"
  );

  // Count throw statements (outside of sanitizeError)
  const throwMatches = stripped.match(/\bthrow\s+(new\s+\w+|error\b|err\b|\w+Error\b)/g) ?? [];
  const hasIsErrorReturns = /isError\s*:\s*true/.test(code);

  // Hard fail: throws present AND no isError: true error returns at all.
  const strictFail = throwMatches.length > 0 && !hasIsErrorReturns;

  return {
    id: "PROTO-002",
    name: "No Throw in Tool Handlers",
    severity: "blocker",
    passed: !strictFail,
    notApplicable: false,
    message: strictFail
      ? `Found ${throwMatches.length} throw statement(s) with no isError: true error return pattern.`
      : hasIsErrorReturns
        ? "Error paths use isError: true return pattern correctly."
        : "No throw statements detected in tool handlers.",
    details: strictFail
      ? "MCP tool handlers must never throw. An uncaught throw tears down the JSON-RPC connection. Return { content: ..., isError: true } instead."
      : undefined,
    recommendation: strictFail
      ? `Replace throw statements with isError returns inside tool handlers:

// ❌ Wrong — breaks the JSON-RPC connection:
throw new Error("Something failed");

// ✅ Correct — reports the error to the client gracefully:
return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };`
      : undefined,
  };
}

// ─── PROTO-003: Capability declaration matches actual feature usage ────────────
// If server.resource() or server.prompt() is used, the corresponding capability
// must be declared. (Modern SDK 1.x auto-discovers tools; explicit caps needed for
// resources and prompts.)

function checkCapabilityDeclaration(code: string): ProtocolCheck {
  const hasResourceUsage = /server\.resource\s*\(/.test(code);
  const hasPromptUsage = /server\.prompt\s*\(/.test(code);

  // If neither resources nor prompts are used, capabilities are auto-handled.
  if (!hasResourceUsage && !hasPromptUsage) {
    return {
      id: "PROTO-003",
      name: "Capability Declaration Matches Usage",
      severity: "warning",
      passed: true,
      notApplicable: true,
      message: "N/A — server uses tools only (SDK auto-declares tool capability).",
    };
  }

  // Detect explicit capabilities block in the McpServer constructor
  const hasResourceCap =
    /capabilities\s*:[^}]*resources\s*:/.test(code) ||
    /new\s+McpServer\s*\(\s*\{[^}]*resources\s*:/.test(code);
  const hasPromptCap =
    /capabilities\s*:[^}]*prompts\s*:/.test(code) ||
    /new\s+McpServer\s*\(\s*\{[^}]*prompts\s*:/.test(code);

  const issues: string[] = [];
  if (hasResourceUsage && !hasResourceCap) issues.push("resources used but not declared in capabilities");
  if (hasPromptUsage && !hasPromptCap) issues.push("prompts used but not declared in capabilities");

  const passed = issues.length === 0;

  return {
    id: "PROTO-003",
    name: "Capability Declaration Matches Usage",
    severity: "warning",
    passed,
    notApplicable: false,
    message: passed
      ? "Capabilities declared correctly match feature usage."
      : `Capability mismatch: ${issues.join("; ")}.`,
    details: passed
      ? undefined
      : "Undeclared capabilities may cause Claude Desktop to reject or silently ignore resources and prompts.",
    recommendation: passed
      ? undefined
      : `Declare capabilities matching your feature usage in the McpServer constructor:

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},  // add when using server.resource()
    prompts: {},    // add when using server.prompt()
  },
});`,
  };
}

// ─── PROTO-004: Resource URI format ──────────────────────────────────────────
// Resource URIs must use a namespaced scheme: scheme://name (e.g. resource://my-server/users).
// Plain names without a scheme prefix are not valid MCP resource URIs.

function checkResourceUriFormat(code: string): ProtocolCheck {
  const hasResources = /server\.resource\s*\(/.test(code);

  if (!hasResources) {
    return {
      id: "PROTO-004",
      name: "Resource URI Format",
      severity: "warning",
      passed: true,
      notApplicable: true,
      message: "N/A — no resources defined.",
    };
  }

  // Look for the scheme pattern in the code  (template literals and string literals)
  // The generated pattern is: `resource://SERVER_SLUG/${name}` which is correct.
  const hasSchemeUri =
    /resource:\/\/[a-z][a-z0-9-]*\//.test(code) ||
    /["'`][a-z][a-z0-9+\-.]*:\/\/[^"'`\s]+["'`]/.test(code);

  // Find string-literal URIs directly in server.resource() calls (no template literal = must have scheme)
  const directStringUris = [
    ...code.matchAll(/server\.resource\s*\(\s*["']([^'"]+)["']\s*,\s*["']([^'"]+)["']/g),
  ].map((m) => ({ name: m[1], uri: m[2] }));

  const invalidLiterals = directStringUris.filter(
    ({ uri }) => !/^[a-z][a-z0-9+\-.]*:\/\//.test(uri)
  );

  const passed = hasSchemeUri || (directStringUris.length === 0 && hasResources);

  return {
    id: "PROTO-004",
    name: "Resource URI Format",
    severity: "warning",
    passed: passed && invalidLiterals.length === 0,
    notApplicable: false,
    message:
      invalidLiterals.length > 0
        ? `${invalidLiterals.length} resource URI(s) missing scheme prefix: ${invalidLiterals.map((u) => `"${u.uri}"`).join(", ")}.`
        : passed
          ? "Resource URIs use correct scheme://name format."
          : "Could not confirm resource URI format — verify URIs use scheme://path pattern.",
    details:
      invalidLiterals.length > 0
        ? 'Resource URIs must use a namespaced scheme (e.g. "resource://my-server/users"). A plain name like "users" is not a valid MCP URI.'
        : undefined,
    recommendation:
      invalidLiterals.length > 0
        ? `Use scheme://path format for resource URIs:

// ❌ Wrong:
server.resource("users", "users", ...);

// ✅ Correct:
const uri = \`resource://my-server/\${name}\`;
server.resource(name, uri, ...);`
        : undefined,
  };
}

// ─── PROTO-005: No console.log ────────────────────────────────────────────────
// MCP STDIO servers communicate via stdout. console.log() writes to stdout and
// corrupts the JSON-RPC framing, causing the client to lose sync immediately.

function checkNoConsoleLog(code: string): ProtocolCheck {
  const matches = code.match(/console\.log\s*\(/g) ?? [];
  const passed = matches.length === 0;

  return {
    id: "PROTO-005",
    name: "No console.log (console.error only)",
    severity: "blocker",
    passed,
    notApplicable: false,
    message: passed
      ? "No console.log calls found — stdout is clean for JSON-RPC."
      : `Found ${matches.length} console.log() call(s) that will corrupt JSON-RPC stdout.`,
    details: passed
      ? undefined
      : "console.log() writes to stdout. For STDIO MCP servers stdout is the JSON-RPC channel. Any non-JSON writes break the protocol framing and immediately disconnect the client.",
    recommendation: passed
      ? undefined
      : "Replace every console.log() with console.error() — stderr is the correct channel for all logging.",
  };
}

// ─── PROTO-006: Stderr startup logging ───────────────────────────────────────
// The server should write at least one startup confirmation log to stderr so
// developers can verify the process started successfully before connecting.

function checkStartupLogging(code: string): ProtocolCheck {
  // Direct startup message patterns
  const hasExplicitStartup =
    /console\.error\s*\(\s*["'][^'"]*(?:running|started|listening|ready|connect|stdio)[^'"]*["']\s*\)/i.test(
      code
    );
  // Any console.error anywhere (minimum bar)
  const hasAnyConsoleError = /console\.error\s*\(/.test(code);

  const passed = hasExplicitStartup || hasAnyConsoleError;

  return {
    id: "PROTO-006",
    name: "Stderr Startup Logging",
    severity: "warning",
    passed,
    notApplicable: false,
    message: passed
      ? "Startup logging to stderr confirmed."
      : "No startup logging to stderr detected.",
    details: passed
      ? undefined
      : "Without a startup log it is impossible to tell whether the server process started correctly. This is the #1 debugging aid when a server fails to connect.",
    recommendation: passed
      ? undefined
      : `Add a startup confirmation log in main() after server.connect():

async function main() {
  const server = new McpServer({ ... });
  // ... register tools ...
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}`,
  };
}

// ─── PROTO-007: SIGTERM / SIGINT handling ─────────────────────────────────────
// Without signal handlers the server process cannot shut down cleanly, leaving
// zombie processes when Claude Desktop or the host terminates.

function checkSigtermHandling(code: string): ProtocolCheck {
  const hasSigterm = /process\.on\s*\(\s*["']SIGTERM["']/.test(code);
  const hasSigint = /process\.on\s*\(\s*["']SIGINT["']/.test(code);
  const passed = hasSigterm || hasSigint;

  const signals = [hasSigterm && "SIGTERM", hasSigint && "SIGINT"].filter(Boolean).join(", ");

  return {
    id: "PROTO-007",
    name: "SIGTERM / SIGINT Signal Handler",
    severity: "warning",
    passed,
    notApplicable: false,
    message: passed
      ? `Signal handler(s) registered: ${signals}.`
      : "No SIGTERM or SIGINT handler registered.",
    details: passed
      ? undefined
      : "Without signal handlers the server process cannot shut down cleanly when the host process exits, leaving a zombie process consuming resources.",
    recommendation: passed
      ? undefined
      : `Register signal handlers for graceful shutdown (typically just before main()):

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT",  () => process.exit(0));`,
  };
}

// ─── PROTO-008: StdioServerTransport used ────────────────────────────────────
// Generated STDIO servers must use StdioServerTransport. Using SSE or the newer
// HTTP-Streamable transport produces a server that won't work with Claude Desktop
// or standard npx invocation.

function checkTransport(code: string): ProtocolCheck {
  const hasStdio = /StdioServerTransport/.test(code);
  const hasSSE = /SSEServerTransport/.test(code);
  const hasStreamable = /StreamableHTTPServerTransport/.test(code);

  const noTransport = !hasStdio && !hasSSE && !hasStreamable;
  const wrongTransport = !hasStdio && (hasSSE || hasStreamable);

  const wrongNames = [hasSSE && "SSEServerTransport", hasStreamable && "StreamableHTTPServerTransport"]
    .filter(Boolean)
    .join(", ");

  if (noTransport) {
    return {
      id: "PROTO-008",
      name: "StdioServerTransport Used",
      severity: "blocker",
      passed: false,
      notApplicable: false,
      message: "No transport found — server will not connect to any client.",
      details: "server.connect(transport) with a StdioServerTransport is required for STDIO servers.",
      recommendation: `Add transport setup in main():

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);`,
    };
  }

  return {
    id: "PROTO-008",
    name: "StdioServerTransport Used",
    severity: "blocker",
    passed: hasStdio && !wrongTransport,
    notApplicable: false,
    message:
      hasStdio && !wrongTransport
        ? "StdioServerTransport correctly used."
        : wrongTransport
          ? `Wrong transport for STDIO server: ${wrongNames}.`
          : `StdioServerTransport present alongside wrong transport: ${wrongNames}.`,
    details:
      wrongTransport
        ? "This server was generated as a STDIO server. SSE and HTTP-Streamable transports require a running HTTP server and won't work with Claude Desktop or npx."
        : undefined,
    recommendation:
      wrongTransport
        ? `Replace with StdioServerTransport:

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);`
        : undefined,
  };
}

// ─── PROTO-009: async main() + process.exit(1) on catch ──────────────────────
// The async main() / main().catch(process.exit(1)) pattern is required by the
// MCP SDK. Without it, fatal startup errors are silently swallowed.

function checkMainFunction(code: string): ProtocolCheck {
  const hasAsyncMain = /async\s+function\s+main\s*\(/.test(code);
  const hasMainCall = /\bmain\s*\(\s*\)/.test(code);
  const hasProcessExit1 = /process\.exit\s*\(\s*1\s*\)/.test(code);

  const issues: string[] = [];
  if (!hasAsyncMain) issues.push("missing async function main()");
  if (!hasMainCall) issues.push("main() is never called");
  if (!hasProcessExit1) issues.push("process.exit(1) missing from error catch");

  const passed = hasAsyncMain && hasMainCall && hasProcessExit1;

  return {
    id: "PROTO-009",
    name: "async main() + process.exit(1) on Catch",
    severity: "blocker",
    passed,
    notApplicable: false,
    message: passed
      ? "async main() defined, called, and exits with code 1 on fatal errors."
      : `Missing: ${issues.join("; ")}.`,
    details: passed
      ? undefined
      : "Without async main() + process.exit(1), fatal startup errors are silently swallowed. Claude Desktop shows no error; the server just never connects.",
    recommendation: passed
      ? undefined
      : `Use this exact entry-point pattern at the bottom of src/index.ts:

async function main(): Promise<void> {
  // ... server setup and server.connect(transport) ...
  console.error("MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});`,
  };
}

// ─── PROTO-010: Shebang on line 1 ────────────────────────────────────────────
// #!/usr/bin/env node must be the very first line. Without it, running the server
// directly with npx tsx fails with a parse error on the shebang.

function checkShebang(code: string): ProtocolCheck {
  const lines = code.split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  const correct = "#!/usr/bin/env node";

  const hasCorrect = firstLine === correct;
  const hasWrongShebang = !hasCorrect && firstLine.startsWith("#!");
  const shebangElsewhere =
    !hasCorrect && lines.slice(1).some((l) => l.trim() === correct);

  let message: string;
  let details: string | undefined;

  if (hasCorrect) {
    message = `"${correct}" present on line 1.`;
  } else if (hasWrongShebang) {
    message = `Incorrect shebang: "${firstLine}".`;
    details = `Must be exactly "${correct}" — no version specifiers, no direct node path.`;
  } else if (shebangElsewhere) {
    message = `Shebang found but not on line 1 (found on line ${lines.findIndex((l) => l.trim() === correct) + 1}).`;
    details = "The shebang must be the very first line — before imports, before comments.";
  } else {
    message = "Missing shebang on line 1.";
    details =
      "Without the shebang, running the server directly with `npx tsx src/index.ts` will fail.";
  }

  return {
    id: "PROTO-010",
    name: "Shebang on Line 1",
    severity: "blocker",
    passed: hasCorrect,
    notApplicable: false,
    message,
    details: hasCorrect ? undefined : details,
    recommendation: hasCorrect
      ? undefined
      : `Make this the very first line of src/index.ts (before any imports or comments):\n\n#!/usr/bin/env node`,
  };
}

// ─── Targeted re-generation prompt ────────────────────────────────────────────

/**
 * Builds the user prompt for a targeted Claude call that fixes only the
 * failing PROTO-* blocker issues. Used by the generate route when hadBlockers.
 */
export function buildProtocolFixPrompt(
  indexTs: string,
  failedBlockers: ProtocolCheck[]
): string {
  const issueList = failedBlockers
    .map(
      (c, i) =>
        `${i + 1}. [${c.id}] ${c.name}\n   Problem: ${c.message}${
          c.recommendation
            ? `\n   Required fix:\n${c.recommendation
                .split("\n")
                .map((l) => `   ${l}`)
                .join("\n")}`
            : ""
        }`
    )
    .join("\n\n");

  return `Fix ONLY the following MCP protocol compliance issues in the TypeScript MCP server below. Do not change anything else. Return the COMPLETE corrected src/index.ts with no prose, no explanation, no markdown headers.

ISSUES TO FIX:
${issueList}

CURRENT CODE (src/index.ts):
\`\`\`typescript
${indexTs}
\`\`\`

Return ONLY the corrected TypeScript, starting with #!/usr/bin/env node on line 1.`;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

/**
 * Run all 10 MCP protocol compliance checks against the generated src/index.ts.
 * Returns a ProtocolReport with check-level detail.
 *
 * @param indexTs  Content of src/index.ts
 * @param autoFixed  Pass true when calling after a targeted re-generation fixed
 *                   blockers — sets the autoFixed flag in the returned report.
 */
export function runProtocolValidation(
  indexTs: string,
  autoFixed = false
): ProtocolReport {
  const checks: ProtocolCheck[] = [
    checkToolResponseShape(indexTs),
    checkNoThrowInHandlers(indexTs),
    checkCapabilityDeclaration(indexTs),
    checkResourceUriFormat(indexTs),
    checkNoConsoleLog(indexTs),
    checkStartupLogging(indexTs),
    checkSigtermHandling(indexTs),
    checkTransport(indexTs),
    checkMainFunction(indexTs),
    checkShebang(indexTs),
  ];

  const applicable = checks.filter((c) => !c.notApplicable);
  const passed = applicable.filter((c) => c.passed).length;
  const failed = applicable.filter((c) => !c.passed);
  const na = checks.filter((c) => c.notApplicable).length;

  const failedBlockers = failed.filter((c) => c.severity === "blocker");
  const failedWarnings = failed.filter((c) => c.severity === "warning");

  return {
    totalChecks: checks.length,
    passedChecks: passed,
    failedChecks: failed.length,
    naChecks: na,
    blockerCount: failedBlockers.length,
    warningCount: failedWarnings.length,
    checks,
    hadBlockers: failedBlockers.length > 0,
    autoFixed,
    timestamp: new Date().toISOString(),
  };
}
