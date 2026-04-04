import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit, recordGeneration } from "@/lib/rate-limiter";
import { createServerClient } from "@/lib/supabase-server";
import { validateGeneratorStep1 } from "@/lib/validate-input";
import { runSecurityValidation } from "@/lib/security/validator";
import { runProtocolValidation, buildProtocolFixPrompt } from "@/lib/protocol/validator";
import type { ProtocolReport } from "@/lib/protocol/types";
import {
  buildPass1System, buildPass1User,
  buildPass3System, buildPass3User,
  parseSchemaContract, extractReviewedCode,
  type SchemaContract,
} from "@/lib/generation/passes";
import { estimateCredits, validateInputLimits } from "@/lib/credits";
import { ensureCreditRow, deductCredits, getBalance } from "@/lib/credits-service";
import { sendEmail } from "@/lib/email";
import type { ToolDefinition, ResourceDefinition, PromptDefinition, ApiConfig } from "@/lib/stores/generator-store";

// Allow this route up to 5 minutes on Vercel Pro/Enterprise (streaming response)
export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// â”€â”€â”€ SSE helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function encode(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Robust Claude JSON extractor ────────────────────────────────────────────
// Stage 1: strip fence → direct parse
// Stage 2: find outermost { … } → parse
// Stage 3: per-file regex extraction (handles JSON truncated mid-string)
// Stage 4: throw – never silently swallow a parse failure

const KNOWN_FILE_KEYS = [
  "src/index.ts",
  "index.js",
  "package.json",
  "tsconfig.json",
  ".env.example",
  "README.md",
  "tests/index.test.ts",
] as const;

function parseClaudeOutput(
  raw: string
): { files?: Record<string, string>; tools?: object[] } {
  // Stage 1 – strip optional markdown fence(s), direct parse (BUG-018: global flag handles nested fences)
  const cleaned = raw
    .replace(/^```(?:json)?\r?\n?/gm, "")
    .replace(/\r?\n?```$/gm, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch { /* fall through */ }

  // Stage 2 – locate outermost { … }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch { /* fall through */ }
  }

  // Stage 3 – per-file regex extraction (handles truncated JSON strings)
  // Matches: "key": "...JSON-escaped content..." including partially truncated values
  const files: Record<string, string> = {};
  for (const key of KNOWN_FILE_KEYS) {
    // Escape special regex chars in the key (handles slashes, dots)
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");
    // Try complete string first (unescaped closing quote)
    const completeRe = new RegExp(`"${escapedKey}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
    const completeMatch = cleaned.match(completeRe);
    if (completeMatch) {
      try { files[key] = JSON.parse(`"${completeMatch[1]}"`); }
      catch {
        // JSON.parse failed (e.g. embedded special chars) — manually unescape
        files[key] = completeMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      continue;
    }
    // Partial: value runs to end-of-string (truncated response)
    const partialRe = new RegExp(`"${escapedKey}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)$`, "s");
    const partialMatch = cleaned.match(partialRe);
    if (partialMatch) {
      // Always manually unescape — JSON.parse is unreliable on partial content
      files[key] = partialMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }
  // BUG-008: Generic fallback — extract ALL "key": "value" pairs missed by known-key loop
  const genericRe = new RegExp('"([^"\\\\]+)"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"', 'gs');
  let gm: RegExpExecArray | null;
  while ((gm = genericRe.exec(cleaned)) !== null) {
    const k = gm[1];
    if (!(k in files)) {
      try { files[k] = JSON.parse(`"${gm[2]}"`); }
      catch { files[k] = gm[2]; }
    }
  }

  if (Object.keys(files).length > 0) {
    return { files };
  }

  // Stage 4 – complete failure, surface details for debugging
  const snippet = raw.slice(0, 300).replace(/\n/g, " ");
  throw new Error(
    `Claude returned unparseable output. First 300 chars: ${snippet}`
  );
}

// â”€â”€â”€ Route â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// ─── Content sanitizer ────────────────────────────────────────────────────────
// Strips characters that break TypeScript string-literal embedding when Claude
// outputs the generated code as a JSON string value.
// Triple-backtick code fences → plain content (avoids backtick delimiter conflict)
// Remaining lone backticks → single quotes (avoids template literal collision)
function sanitizeContentForEmbedding(content: string): string {
  // Remove fenced code blocks, keep the inner content
  let safe = content.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1');
  // Replace lone backticks with single-quote
  safe = safe.replace(/`/g, "'");
  return safe.trim();
}

export async function POST(req: NextRequest) {
  // getUser() validates the JWT against Supabase servers — prevents revoked token bypass
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // BUG-007: Check email verification via session rather than denormalised column
  if (!user.email_confirmed_at) {
    return new Response(
      JSON.stringify({ error: "Please verify your email address before generating.", code: "EMAIL_UNVERIFIED" }),
      { status: 403 }
    );
  }

  const body = await req.json();
  const { description, serverName = "", apiConfig, tools = [], resources = [], prompts = [], apiDocContext = null } = body;

  // BUG-001: Guard — tools must be a non-empty array
  if (!Array.isArray(tools) || tools.length === 0) {
    return new Response(
      JSON.stringify({ error: "At least one tool is required", code: "INVALID_INPUT" }),
      { status: 422 }
    );
  }

  // — Input quality guard — rejects gibberish before spending any Claude tokens —
  const inputCheck = validateGeneratorStep1(serverName, description);
  if (!inputCheck.valid) {
    return new Response(
      JSON.stringify({ error: inputCheck.reason ?? "Invalid input", code: "INVALID_INPUT" }),
      { status: 422 }
    );
  }

  // ── Hard input limits (>20 tools, oversized content, etc.) ──
  const limitErrors = validateInputLimits({
    tools:       tools       as ToolDefinition[],
    resources:   resources   as ResourceDefinition[],
    prompts:     prompts     as PromptDefinition[],
    description: String(description ?? ""),
  });
  if (limitErrors.length > 0) {
    return new Response(
      JSON.stringify({
        error: limitErrors[0].message,
        code:  limitErrors[0].code,
        allErrors: limitErrors.map((e) => ({ field: e.field, code: e.code, message: e.message })),
      }),
      { status: 422 }
    );
  }

  // ── Rate limit (anti-abuse: hourly/daily/cooldown) ──
  const rateCheck = await checkRateLimit(supabase, user.id);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: rateCheck.reason ?? "Rate limit exceeded" }),
      { status: 429 }
    );
  }

  // ── Credit check — balance only, deduction happens post-generation ──
  // Credits are NOT deducted upfront. No refund RPC is ever needed — if any pass
  // fails the user's balance is untouched. Deduction runs after all passes succeed.
  await ensureCreditRow(user.id);
  const creditEstimate = estimateCredits({
    tools:       tools       as ToolDefinition[],
    resources:   resources   as ResourceDefinition[],
    prompts:     prompts     as PromptDefinition[],
    apiConfig:   apiConfig   as ApiConfig,
    description: description as string,
  });
  const creditCost = creditEstimate.cost;
  // Pass 2 generates ONLY src/index.ts — boilerplate files are built programmatically.
  // Token budgets reflect index.ts-only output: ~1,500 / ~4,000 / ~9,000 tokens max per tier.
  const pass2MaxTokens = creditEstimate.tier === 3 ? 14000 : creditEstimate.tier === 2 ? 8000 : 5000;
  const pass2TimeoutMs = creditEstimate.tier === 3 ? 260000 : creditEstimate.tier === 2 ? 165000 : 105000;

  const skipCredits = process.env.DISABLE_CREDIT_DEDUCTION === "true";

  if (!skipCredits) {
    const balance = await getBalance(user.id);
    const currentTotal = balance?.total ?? 0;
    if (currentTotal < creditCost) {
      return new Response(
        JSON.stringify({
          error: `Not enough credits. This generation costs ${creditCost} credit${creditCost > 1 ? "s" : ""}. Your balance: ${currentTotal}.`,
          code: "INSUFFICIENT_CREDITS",
          balance: currentTotal,
          cost: creditCost,
        }),
        { status: 402 }
      );
    }
  }

  // ── SSE stream ──
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(new TextEncoder().encode(encode(data)));

      try {
        // Build tool list string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolList = tools.map((t: any, i: number) =>
          `${i + 1}. ${t.name}: ${t.description}${
            t.fields?.length
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? `\n   Parameters: ${t.fields.map((f: any) => `${f.name} (${f.type}${f.required ? ", required" : ""})`).join(", ")}`
              : ""
          }${t.exampleOutput?.trim() ? `\n   Expected output: ${t.exampleOutput.trim()}` : ""}`
        ).join("\n");

        const apiSection = apiConfig?.enabled
          ? `API Integration:\n- Base URL: ${apiConfig.baseUrl}\n- Auth type: ${apiConfig.authType}${apiConfig.apiDocUrl ? `\n- Docs: ${apiConfig.apiDocUrl}` : ""}`
          : "No external API â€” local tools only.";

        // If the user pre-fetched API documentation, inject it into the context
        const apiSectionFull =
          apiDocContext && typeof apiDocContext === "string" && apiDocContext.length > 0
            ? `${apiSection}\n\n### Fetched API Documentation\n${apiDocContext.slice(0, 12000)}${apiDocContext.length > 12000 ? "\n[truncated]" : ""}`
            : apiSection;

        // Build resources section
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resourceList = resources.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? resources.map((r: any, i: number) =>
              `${i + 1}. "${r.name}" (${r.mimeType})\n   Description: ${r.description || "(none)"}\n   Content length: ${r.content?.length ?? 0} chars`
            ).join("\n")
          : "None";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resourceEmbeds = resources.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? resources.map((r: any) =>
              `  "${r.name}": {\n    text: ${JSON.stringify(sanitizeContentForEmbedding(r.content ?? ""))},\n    mimeType: "${r.mimeType}",\n    description: ${JSON.stringify(r.description ?? "")}\n  }`
            ).join(",\n")
          : "";

        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // SYSTEM PROMPT â€” TypeScript single-file MCP server (core engine)
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const SYSTEM_PROMPT = `You are FloMCP Generator â€” the core engine for generating production-quality LOCAL STDIO MCP servers in TypeScript.
Your output runs on the developer's machine and connects to VS Code (GitHub Copilot) or Claude Desktop.
Output ONLY valid JSON. No markdown code fences around the JSON. No prose. No explanation outside the JSON object.
TOKEN BUDGET: ${pass2MaxTokens} tokens (~${Math.round(pass2MaxTokens * 3.5)} chars) for src/index.ts — the ONLY file.
WORKING > COMPLEX: A simple server that runs is ALWAYS better than a complex server that truncates or breaks.
WRITE IN THIS ORDER — budget per section:
  [1] MCP ARCHITECTURE  ~15% (~${Math.round(pass2MaxTokens * 0.15)} tk): imports, new McpServer(), sanitizeError(), fetchWithTimeout() only if API used
  [2] TOOLS             ~55% (~${Math.round(pass2MaxTokens * 0.55)} tk): ALL server.tool() calls with complete inline logic
  [3] RESOURCES         ~10% (~${Math.round(pass2MaxTokens * 0.10)} tk): RESOURCE_CONTENT + server.resource() loop — omit entirely if no resources
  [4] PROMPTS           ~10% (~${Math.round(pass2MaxTokens * 0.10)} tk): server.prompt() registrations
  [5] MAIN              ~10% (~${Math.round(pass2MaxTokens * 0.10)} tk): main(), SIGTERM/SIGINT handlers, main().catch()
SIMPLIFICATION RULE: If a section is exceeding its budget, SIMPLIFY logic in that section — shorter conditionals, fewer optional validations, inline logic — but NEVER truncate a function mid-body or skip a section. Every section must be syntactically complete.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ARCHITECTURE: TypeScript Â· Single file Â· No build step
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
All code goes in ONE src/index.ts.
Run immediately after download: npm install && npx tsx src/index.ts
No separate tool files. No utils/ imports. No types.ts. Everything inline.
================================================================
CODE STYLE (mandatory -- every violation is a failure)
================================================================

INDENTATION: 2 spaces everywhere -- no tabs, no 4-space, no compressed single-line blocks
BLANK LINES:
  - One blank line between every top-level function/const declaration
  - One blank line before and after every server.tool(), server.resource(), server.prompt() call
  - One blank line between logical sections inside a function (validation, logic, return)
NEVER write multiple statements on one line to save space
NEVER omit opening/closing braces on if/else blocks, even single-line ones
Use consistent single-quoted strings unless the string contains a quote
REGEX PATTERNS: Keep them concise -- maximum 12-15 keywords per pattern. Do NOT write exhaustive keyword lists with 100+ words. Use representative examples only. A regex like /\b(create|update|delete|list|get)\b/ is correct. A regex with 200 terms is a CRITICAL token waste failure.
FUNCTION LENGTH: No helper function may exceed 20 lines. No server.tool() handler may exceed 30 lines. Avoid scoring engines, classifiers, or keyword analyzers — they waste tokens on complexity that Claude already handles. Simple direct logic is always correct.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CANONICAL src/index.ts STRUCTURE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer(
  { name: "SERVER_SLUG", version: "1.0.0" },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// â”€â”€ Security helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function sanitizeError(error: unknown): string {
  if (error instanceof z.ZodError)
    return "Validation error: " + error.errors.map((e) => \`\${e.path.join(".")}: \${e.message}\`).join(", ");
  if (error instanceof Error) {
    return error.message
      .replace(/\\/[^\\s"']+/g, "[PATH]")
      .replace(/\\b\\d{1,3}(\\.\\d{1,3}){3}\\b/g, "[IP]")
      .replace(/(key|token|secret|password)=[^\\s&]*/gi, "$1=[REDACTED]");
  }
  return "An unexpected error occurred";
}

// Uncomment for API servers:
// async function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
//   const { timeoutMs = 10000, ...rest } = options;
//   const res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
//   if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
//   return res;
// }

// â”€â”€ Resources (embedded content) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Inline the user's text content as typed constants.
const RESOURCE_CONTENT: Record<string, { text: string; mimeType: string; description: string }> = {
  "example-resource": {
    text: "Content here",
    mimeType: "text/plain",
    description: "Example resource description",
  },
};

for (const [name, resource] of Object.entries(RESOURCE_CONTENT)) {
  const uri = \`resource://SERVER_SLUG/\${name}\`;
  server.resource(
    name,
    uri,
    async (resourceUri) => ({
      contents: [{ uri: resourceUri.href, text: resource.text, mimeType: resource.mimeType }],
    })
  );
}

// â”€â”€ Tools â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// One server.tool() per tool â€” all inline, complete business logic.

/** @readonly â€” this tool only reads data */
server.tool(
  "add",
  "Add two numbers",
  {
    a: z.number().finite().describe("First number"),
    b: z.number().finite().describe("Second number"),
  },
  async ({ a, b }) => {
    try {
      return { content: [{ type: "text" as const, text: String(a + b) }] };
    } catch (error) {
      return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };
    }
  }
);

// â”€â”€ Prompts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
server.prompt(
  "usage_guide",
  "Show all tools, resources, and prompts with concrete examples",
  [],
  () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: "List every tool in this MCP server. For each: name, description, parameters (with types), and a concrete usage example with sample input and expected output. Also list any resources available.",
      },
    }],
  })
);

// â”€â”€ Start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SERVER_SLUG MCP server running on stdio");
  process.on("SIGTERM", () => { server.close(); process.exit(0); });
  process.on("SIGINT",  () => { server.close(); process.exit(0); });
}
main().catch((error: unknown) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
TOOL RULES
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

server.tool(name: string, description: string, zodShape: ZodRawShape, handler):
- 3rd arg: PLAIN { param: z.type() } shape â€” NOT z.object({}) wrapper
- Zod types: z.string().trim(), z.number().finite(), z.boolean(), z.enum([...])
- Optional params: z.string().optional().default("") â€” always provide a safe default
- Every handler wrapped in try/catch
- Success: return { content: [{ type: "text" as const, text: String(result) }] }
- Error:   return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true }
- Write COMPLETE real logic â€” zero TODO, zero placeholder comments
- NEVER abbreviate, condense, or stub helper functions — if a check has 10 cases write all 10; comments like "expanded in full implementation" or "simplified version" are a CRITICAL failure
- Add JSDoc annotation above each tool: /** @readonly */ or /** @destructive */ or /** @creates */

TOOL ANNOTATION TYPES (comment only â€” not passed to the SDK):
  /** @readonly */    â€” Query/Read: fetches or lists, no side effects
  /** @creates */     â€” Create: adds new data/record/resource
  /** @modifies */    â€” Update: changes existing data
  /** @destructive */ â€” Delete: removes or destroys data
  /** @executes */    â€” Execute: runs a command or operation

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
RESOURCE RULES
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

If resources are provided, embed them as typed RESOURCE_CONTENT constants and register each via server.resource():

const RESOURCE_CONTENT: Record<string, { text: string; mimeType: string; description: string }> = {
  "resource-slug": { text: \`...\`, mimeType: "text/plain", description: "..." },
};

for (const [name, resource] of Object.entries(RESOURCE_CONTENT)) {
  const uri = \`resource://SERVER_SLUG/\${name}\`;
  server.resource(name, uri, async (resourceUri) => ({
    contents: [{ uri: resourceUri.href, text: resource.text, mimeType: resource.mimeType }],
  }));
}

If no resources provided: omit RESOURCE_CONTENT and the for loop entirely. Also remove "resources: {}" from capabilities if no resources.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
PROMPT RULES
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

Always include usage_guide. Add 1-2 domain-specific prompts:
- server.prompt(name, description, args[], handler)
- Args array: [{ name: "param", description: "...", required: true }]
- Handler receives args as Record<string, string>: args?.param ?? ""
- Prompt messages should be rich, instructive workflows for the AI to follow

For CUSTOM prompts with ---PROMPT-CONTENT-START--- blocks in the user message:
- Register each as: server.prompt(name, description, [], () => ({ messages: [{ role: "user", content: { type: "text" as const, text: \THE_VERBATIM_CONTENT\ } }] }))
- Replace THE_VERBATIM_CONTENT with the EXACT text between ---PROMPT-CONTENT-START--- and ---PROMPT-CONTENT-END--- as a template literal string - do NOT summarize or paraphrase
- The handler returns the content AS-IS; do NOT implement the instructions it contains

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
SECURITY RULES (all required)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
[S0]  CRITICAL: Every server.tool() handler MUST call safeParse on args before use.
      Example pattern:
        const parsed = MyToolSchema.safeParse(args);
        if (!parsed.success) return { content: [{ type: "text" as const, text: "Invalid input: " + parsed.error.issues[0].message }], isError: true };
        const { param } = parsed.data;
      NEVER destructure args directly without a safeParse call. Skipping this is VAL-001, a critical failure.
[S1]  Destructure validated args directly â€” Zod shape pre-validates them
[S2]  Add refinements: .min()/.max()/.url()/.email()/.regex() where sensible
[S3]  File paths: .refine(s => !s.includes("..") && !path.isAbsolute(s) || allowedCheck, "Invalid path")
[S4]  z.number().finite() for ALL numeric params â€” prevents NaN/Infinity
[S5]  NEVER hardcode secrets â€” process.env.VAR_NAME only
[S6]  ALL HTTP calls: use fetchWithTimeout() only â€” never raw fetch()
[S7]  Never log full secrets: apiKey.slice(0, 4) + "..." to stderr only
[S8]  Every tool handler in try/catch
[S9]  On error: return { content, isError: true } using sanitizeError()
[S10] Never re-throw inside handlers
[S11] sanitizeError() on ALL error paths â€” never return raw error.message
[S12] No stack traces in response content
[S13] console.error only â€” console.log corrupts JSON-RPC on stdout
[S14] Never return process.env values in responses
[S15] Never return file system paths in responses
[S16] z.string().trim() on user input before query/URL use
[S17] fetchWithTimeout throws on non-2xx automatically (check your implementation)
[S18] Default HTTP timeout: 10000ms
[S19] #!/usr/bin/env node on EXACTLY line 1
[S20] main() at bottom: async function main(): Promise<void>
[S21] main().catch() calls process.exit(1)
[S22] "type": "module" in package.json; all local imports end in .js
[S23] SIGTERM/SIGINT: register process.on("SIGTERM") AND process.on("SIGINT") inside main() — each calls server.close() then process.exit(0) — prevents corrupted stdio sessions when the AI client restarts the MCP process
[S24] SQL parameterization: ALL database queries MUST use parameterized form — pg: $1/$2, sqlite3/better-sqlite3: ?, mysql2: ? — NEVER string concatenation in SQL — injection prevention, this is non-negotiable
[S25] OAuth2: when OAuth is required, implement the COMPLETE token refresh flow — check expiry, call refresh endpoint, store updated token, retry request. NEVER leave TODO or placeholder comments in auth code — the refresh flow must be fully functional

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CORRECT IMPORTS â€” only these three
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
  import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
  import { z } from "zod"

Add only if file operations needed:
  import path from "path"
  import fs from "fs/promises"

FORBIDDEN:
  âœ— @modelcontextprotocol/sdk/server/index.js
  âœ— new Server(...) / setRequestHandler(...)
  âœ— ListToolsRequestSchema / CallToolRequestSchema
  âœ— Express / http / https / Fastify
  âœ— console.log(...) anywhere â€” use console.error() only
  âœ— Any import from ./tools/ ./utils/ ./types.ts

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
REQUIRED JSON OUTPUT â€” return ONLY this object, no prose, no fences
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

{
  "files": {
    "src/index.ts": "<COMPLETE TypeScript â€” all tools + resources + prompts inline>"
  },
  "tools": [
    {
      "id": "snake_id",
      "name": "tool_name",
      "description": "one sentence",
      "annotation": "query|create|update|delete|search|execute",
      "fields": [{ "name": "param", "type": "string|number|boolean", "required": true }]
    }
  ]
}

PRE-OUTPUT CHECKLIST â€” verify ALL before emitting JSON:
âœ“ src/index.ts line 1 is: #!/usr/bin/env node
âœ“ TypeScript: uses "as const" for object literals where needed, all vars typed
âœ“ Every tool has REAL implemented logic â€” zero TODO, zero placeholder
âœ“ Every tool has the JSDoc @readonly/@creates/@modifies/@destructive/@executes annotation
âœ“ RESOURCE_CONTENT defined if resources provided; omitted if no resources
âœ“ usage_guide prompt included; at least one domain-specific prompt
âœ main() registers both process.on("SIGTERM") and process.on("SIGINT") handlers calling server.close() then process.exit(0)
âœ All database/SQL queries use parameterized form --- zero string concatenation in SQL
âœ If OAuth2 used: token refresh flow is COMPLETE --- no TODO comments in auth code
NOTE: package.json, tsconfig.json, .env.example, README.md, and tests/ are generated automatically - do NOT include them in your JSON output.
TOKEN REMINDER: ${pass2MaxTokens} tokens total. Sections in order: [1] Architecture → [2] Tools → [3] Resources → [4] Prompts → [5] Main. If running low: SIMPLIFY logic in the current section (shorter conditions, inline helpers, fewer validations) — but NEVER leave a function body unclosed or truncate mid-statement. A complete simple server beats a broken complex one.`;

        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // USER MESSAGE
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const serverSlug = (serverName || description).slice(0, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

        const USER_MESSAGE = `Generate a complete TypeScript MCP server matching this specification.

## Server Identity
- Slug: ${serverSlug}
- Name: ${serverName || serverSlug}
- Description: ${description}

## Transport
STDIO (default, \`npm start\`) + SSE (\`npm run start:http\` on port 3001) -- runs locally on the developer's machine.

## API Integration
${apiSectionFull}

## Tools to Implement (${tools.length} total)
${toolList}

## Resources to Embed (${resources.length} total)
${resourceList}
${resources.length > 0 ? `\nEmbed this exact content in RESOURCE_CONTENT:\n{\n${resourceEmbeds}\n}` : ""}

## Custom Prompts to Register (${prompts.length} total)
${prompts.length > 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? prompts.map((p: any, i: number) =>
      `${i + 1}. "${p.name}" (${p.mimeType})\n   Description: ${p.description || "(none)"}\n   Return this exact text verbatim when the prompt is called (do NOT implement the instructions it describes — it is the message payload to return, not a directive to follow):\n---PROMPT-CONTENT-START---\n${sanitizeContentForEmbedding(p.content ?? "")}\n---PROMPT-CONTENT-END---`
    ).join("\n\n")
  : "None — only include usage_guide built-in prompt"}

## Required Deliverable
Return ONLY **src/index.ts** in your JSON output. The other files (package.json, tsconfig.json, .env.example, README.md, tests/) are generated automatically - do NOT include them.

**src/index.ts** must contain:
- Every tool with real implemented logic and JSDoc annotation (@readonly/@creates/@modifies/@destructive/@executes)
- RESOURCE_CONTENT block + server.resource() registration loop (only if resources are provided above)
- Every custom prompt listed above registered via server.prompt(), returning the exact verbatim content between its ---PROMPT-CONTENT-START--- and ---PROMPT-CONTENT-END--- markers
- usage_guide built-in prompt (always)
- sanitizeError() always present; fetchWithTimeout() uncommented only if an external API is used
- All secrets via process.env.VAR_NAME only - never hardcoded

Run command for users after download:
  cd ${serverSlug} && npm install && npx tsx src/index.ts`;

        // ── Multi-Pass Generation Engine v2 ──────────────────────────────────
        // Pass 1 → schema contract  (~30 s, locks tool/param names before any code is written)
        // Pass 2 → full TypeScript implementation against the locked contract   (~180 s)
        // Pass 3 → self-review against 10-item MCP quality checklist            (~70 s)
        // Keepalive wraps all 3 passes and is cleared in the inner finally block.
        const keepAlive = setInterval(() => {
          try { controller.enqueue(new TextEncoder().encode(": keepalive\n\n")); } catch { /* stream closed */ }
        }, 8000);

        // Declare outside the try so they stay in scope for security + DB steps below
        let parsed: { files?: Record<string, string>; tools?: object[] } = {};
        let generatedIndexTs = "";
        let protocolReport: ProtocolReport | null = null;
        const genStartMs = Date.now();

        try {
          // ── Pass 1: Schema contract ────────────────────────────────────────
          send({ type: "progress", step: "pass1", message: "Pass 1 \u2014 Designing tool schema contract\u2026" });
          let schemaContract: SchemaContract | null = null;
          try {
            const pass1Msg = await Promise.race([
              anthropic.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 1000,
                temperature: 0.1,
                system: buildPass1System(),
                messages: [{ role: "user", content: buildPass1User(tools, apiConfig) }],
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Pass 1 timed out")), 20000)
              ),
            ]);
            const pass1Raw = pass1Msg.content[0].type === "text" ? pass1Msg.content[0].text : "";
            schemaContract = parseSchemaContract(pass1Raw);
          } catch {
            // Non-fatal — Pass 2 runs without a schema contract if Pass 1 fails
            schemaContract = null;
          }

          // ── Pass 2: Full TypeScript implementation ─────────────────────────
          send({ type: "progress", step: "pass2", message: "Pass 2 \u2014 Writing TypeScript implementation\u2026" });

          // Inject the locked schema contract from Pass 1 into the user message as a hard constraint
          let pass2UserMessage = USER_MESSAGE;
          if (schemaContract && schemaContract.tools.length > 0) {
            const contractJson =
              "\n\n## Schema Contract from Pass 1 (LOCKED \u2014 implement these exact tool names, param names, and types)\n" +
              "```json\n" + JSON.stringify(schemaContract, null, 2) + "\n```";
            pass2UserMessage = USER_MESSAGE.replace(
              "## Required Deliverable",
              contractJson + "\n\n## Required Deliverable"
            );
          }

          const pass2Msg = await Promise.race([
            anthropic.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: pass2MaxTokens,
              temperature: 0.3,
              system: SYSTEM_PROMPT,
              messages: [{ role: "user", content: pass2UserMessage }],
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Generation timed out \u2014 please try again")), pass2TimeoutMs)
            ),
          ]);

          const pass2Raw = pass2Msg.content[0].type === "text" ? pass2Msg.content[0].text : "";
          if (!pass2Raw) throw new Error("Claude returned an empty response");

          parsed = parseClaudeOutput(pass2Raw);

          generatedIndexTs = parsed.files?.["src/index.ts"] ?? parsed.files?.["index.js"] ?? "";
          if (!generatedIndexTs.trim()) {
            throw new Error(
              "Generation failed: src/index.ts is empty. " +
              "Claude may have returned malformed JSON. Please try again."
            );
          }

          // ── Pass 3: Self-review quality checklist ──────────────────────────
          // Skip Pass 3 if we're already past 200s — leave headroom for DB save + security checks
          const elapsedMs = Date.now() - genStartMs;
          if (elapsedMs < 200000) {
            send({ type: "progress", step: "pass3", message: "Pass 3 \u2014 Running quality checklist\u2026" });
            try {
              const pass3Msg = await Promise.race([
                anthropic.messages.create({
                  model: "claude-sonnet-4-6",
                  max_tokens: 2000,
                  temperature: 0.1,
                  system: buildPass3System(),
                  messages: [{ role: "user", content: buildPass3User(generatedIndexTs) }],
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("Pass 3 timed out")), 20000)
                ),
              ]);
              const pass3Raw = pass3Msg.content[0].type === "text" ? pass3Msg.content[0].text : "";
              const reviewedCode = extractReviewedCode(pass3Raw);
              if (reviewedCode && reviewedCode.trim()) {
                // Pass 3 identified and corrected quality issues — use the fixed code
                generatedIndexTs = reviewedCode;
                if (parsed.files) parsed.files["src/index.ts"] = reviewedCode;
              }
            } catch {
              // Non-fatal — use Pass 2 output as-is if Pass 3 fails or times out
            }
          }

          // ── Protocol compliance validation ─────────────────────────────
          send({ type: "progress", step: "protocol", message: "Checking MCP protocol compliance\u2026" });
          protocolReport = runProtocolValidation(generatedIndexTs);
          if (protocolReport.hadBlockers) {
            // Targeted re-gen: fix only the failing protocol blockers (non-fatal)
            try {
              const failedBlockers = protocolReport.checks.filter(
                (c) => !c.notApplicable && !c.passed && c.severity === "blocker"
              );
              const fixMsg = await Promise.race([
                anthropic.messages.create({
                  model: "claude-sonnet-4-6",
                  max_tokens: 2000,
                  temperature: 0.1,
                  messages: [{ role: "user", content: buildProtocolFixPrompt(generatedIndexTs, failedBlockers) }],
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("Protocol fix timed out")), 20000)
                ),
              ]);
              const fixedCode = fixMsg.content[0].type === "text" ? fixMsg.content[0].text.trim() : "";
              if (fixedCode) {
                generatedIndexTs = fixedCode;
                if (parsed.files) parsed.files["src/index.ts"] = fixedCode;
                // Re-run with autoFixed flag so the report reflects the correction
                protocolReport = runProtocolValidation(generatedIndexTs, true);
              }
            } catch {
              // Non-fatal — keep original code and protocol report if fix call fails
            }
          }
        } finally {
          clearInterval(keepAlive);
        }

        // ── Run 22-check security validation ──────────────────────────────────
        send({ type: "progress", step: "security", message: "Running 22 security checks…" });

        // ── Build boilerplate files programmatically ──────────────────────────
        // Pass 2 generates only src/index.ts — these 5 files are built from known
        // specs + signals extracted from the generated code. Saves ~2,500 output
        // tokens and eliminates truncation risk for large (Premium) servers.
        if (!parsed.files) parsed.files = {};
        const _pkgDeps: Record<string, string> = { "@modelcontextprotocol/sdk": "^1.12.0", "zod": "^3.23.0" };
        if (/from ['"]node-fetch['"]/.test(generatedIndexTs)) _pkgDeps["node-fetch"] = "^3.3.0";
        if (/from ['"]axios['"]/.test(generatedIndexTs)) _pkgDeps["axios"] = "^1.7.0";
        parsed.files["package.json"] = JSON.stringify({
          name: `${serverSlug}-mcp-server`, version: "1.0.0",
          description: description.slice(0, 200), type: "module",
          scripts: { start: "npx tsx src/index.ts", "start:http": "npx tsx src/index.ts --http", build: "tsc", test: "vitest run" },
          dependencies: _pkgDeps,
          devDependencies: { typescript: "^5.6.0", tsx: "^4.19.0", "@types/node": "^22.0.0", vitest: "^2.0.0" },
        }, null, 2);
        parsed.files["tsconfig.json"] = JSON.stringify({
          compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", outDir: "./dist", rootDir: "./src", strict: true, skipLibCheck: true, esModuleInterop: true, declaration: true },
          include: ["src/**/*"], exclude: ["tests", "node_modules", "dist"],
        }, null, 2);
        const _envVarNames = [...new Set([...generatedIndexTs.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)].map(m => m[1]))];
        parsed.files[".env.example"] = _envVarNames.length > 0
          ? _envVarNames.map(v => `${v}=`).join("\n") + "\n"
          : "# No environment variables required\n";
        const _rTools = tools as ToolDefinition[];
        parsed.files["README.md"] = [
          `# ${serverName || serverSlug} MCP Server`, ``, description, ``,
          `## What It Does`, ``, `| Component | Name | Description |`, `|-----------|------|-------------|`,
          ..._rTools.map(t => `| \uD83D\uDD27 Tool | \`${t.name}\` | ${t.description} |`),
          ...(resources as ResourceDefinition[]).map(r => `| \uD83D\uDCC4 Resource | \`${r.name}\` | ${r.description} |`),
          ...(prompts as PromptDefinition[]).map(p => `| \uD83D\uDCAC Prompt | \`${p.name}\` | ${p.description} |`),
          `| \uD83D\uDCAC Prompt | \`usage_guide\` | Show all tools with examples |`, ``,
          `## Quick Start`, ``, "```bash", `npm install`, `npx tsx src/index.ts`, "```", ``,
          ...(_envVarNames.length > 0 ? [`## Environment Variables`, ``, "```bash", `cp .env.example .env`, "```", ``] : []),
          `## Add to VS Code (GitHub Copilot)`, ``,
          "```json", `{`, `  "servers": {`, `    "${serverSlug}": {`,
          `      "type": "stdio",`, `      "command": "npx",`,
          `      "args": ["tsx", "/path/to/${serverSlug}/src/index.ts"]`,
          `    }`, `  }`, `}`, "```", ``,
          `## Add to Claude Desktop`, ``,
          "```json", `{`, `  "mcpServers": {`, `    "${serverSlug}": {`,
          `      "command": "npx",`,
          `      "args": ["tsx", "/path/to/${serverSlug}/src/index.ts"]`,
          `    }`, `  }`, `}`, "```", ``,
          `Replace the path with your actual folder path. **Restart Claude Desktop** after saving.`, ``,
          `## Using the Tools`, ``,
          ..._rTools.map(t => `- "${t.description}"`), ``,
          `## Running Tests`, ``, "```bash", `npm test`, "```", ``, `## License`, ``, `MIT`, ``,
        ].join("\n");
        parsed.files["tests/index.test.ts"] = [
          `import { describe, it, expect } from "vitest";`, `import { z } from "zod";`, ``,
          `describe("sanitizeError", () => {`,
          `  it("hides file paths", () => {`,
          `    const msg = "Error at /home/user/.env line 3";`,
          `    const sanitized = msg.replace(/\\/[^\\s"']+/g, "[PATH]");`,
          `    expect(sanitized).not.toContain("/home");`,
          `    expect(sanitized).toContain("[PATH]");`,
          `  });`, ``,
          `  it("hides IP addresses", () => {`,
          `    const msg = "Connection to 192.168.1.1 refused";`,
          `    const sanitized = msg.replace(/\\b\\d{1,3}(\\.\\d{1,3}){3}\\b/g, "[IP]");`,
          `    expect(sanitized).not.toContain("192.168");`,
          `  });`,
          `});`, ``,
          `describe("Tool schemas", () => {`,
          ..._rTools.flatMap(t => {
            const n = t.name.replace(/"/g, '\\"');
            return [
              `  it("${n}: accepts valid input", () => {`,
              `    const schema = z.object({ input: z.string() });`,
              `    expect(schema.safeParse({ input: "test" }).success).toBe(true);`,
              `  });`,
              `  it("${n}: rejects missing params", () => {`,
              `    const schema = z.object({ input: z.string() });`,
              `    expect(schema.safeParse({}).success).toBe(false);`,
              `  });`, ``,
            ];
          }),
          `});`, ``,
        ].join("\n");
        const generatedPackageJson = parsed.files?.["package.json"] ?? "{}";
        const generatedTsconfig = parsed.files?.["tsconfig.json"] ?? null;
        const generatedEnvExample = parsed.files?.[".env.example"] ?? null;

        const securityReport = runSecurityValidation({
          indexTs: generatedIndexTs,
          packageJson: generatedPackageJson,
          tsconfig: generatedTsconfig ?? undefined,
          envExample: generatedEnvExample ?? undefined,
        });

        // Embed protocol report into the combined report (no DB schema change needed)
        const combinedReport = { ...securityReport, protocolReport: protocolReport ?? undefined };

        // Send score to client immediately so UI can react
        send({
          type: "security",
          score: combinedReport.score,
          grade: combinedReport.grade,
          passedChecks: combinedReport.passedChecks,
          failedChecks: combinedReport.failedChecks,
          blockDownload: combinedReport.blockDownload,
          report: combinedReport,
        });

        send({ type: "progress", step: "saving", message: "Saving your server…" });
        await delay(400);

        // ── Persist to DB ──
        const adminClient = createAdminClient();

        const { data: insertedRow, error: dbError } = await adminClient
          .from("mcp_servers")
          .insert({
            user_id: user.id,
            name: (serverName || description).slice(0, 60),
            description,
            generated_code: generatedIndexTs,
            package_json: generatedPackageJson,
            readme: parsed.files?.["README.md"] ?? "",
            tsconfig: generatedTsconfig,
            env_example: generatedEnvExample,
            api_config: apiConfig ?? null,
            status: "generated",
            security_score: combinedReport.score,
            security_report: combinedReport,
            generation_input: {
              serverName: serverName || (description).slice(0, 60),
              description,
              apiConfig: apiConfig ?? null,
              tools: (tools as ToolDefinition[]).map(t => ({
                name: t.name,
                description: t.description,
                annotation: t.annotation,
                fields: t.fields?.map(f => ({ name: f.name, type: f.type, required: f.required, description: f.description })),
              })),
              resources: (resources as ResourceDefinition[]).map(r => ({
                name: r.name,
                description: r.description,
                mimeType: r.mimeType,
                contentLength: r.content?.length ?? 0,
              })),
              prompts: (prompts as PromptDefinition[]).map(p => ({
                name: p.name,
                description: p.description,
                mimeType: p.mimeType,
                contentLength: p.content?.length ?? 0,
              })),
            },
          })
          .select("id")
          .single();

        if (dbError) throw new Error(`DB save failed: ${dbError.message}`);

        await recordGeneration(supabase, user.id);

        // ── Deduct credits after successful generation ──
        // Only charged on success — any error before this point costs the user nothing.
        if (!skipCredits) {
          const deductResult = await deductCredits(
            user.id,
            creditCost,
            insertedRow.id,
            String(creditCost) as "1" | "2" | "3"
          );
          if (!deductResult.ok) {
            // Race condition: another concurrent request consumed the last credit between our
            // balance check and now. The SQL RPC is atomic so no double-spend occurred.
            // Throw so the catch block sends type:"error" — server is already saved in DB but
            // the user will be told to retry rather than silently getting a free generation.
            console.error(`[generate] post-generation credit deduction failed — error=${deductResult.error} cost=${creditCost} userId=${user.id}${deductResult.rawError ? ` rawError="${deductResult.rawError}"` : ""}`);
            throw new Error("Credit deduction failed after generation — your server was saved. Please contact support if credit was not deducted.");
          } else if (deductResult.balanceAfter === 2 || deductResult.balanceAfter === 1) {
            const remaining = deductResult.balanceAfter;
            adminClient.from("notifications").insert({
              user_id: user.id,
              type: "security_alert",
              title: "Low Credit Balance",
              body: `You have ${remaining} generation${remaining === 1 ? "" : "s"} remaining. Upgrade to Pro for unlimited generations.`,
            }).then();
          }
        }

        // Notify user their server is ready — fire-and-forget (non-critical)
        adminClient.from("notifications").insert({
          user_id: user.id,
          type: "generation_complete",
          title: "MCP Server Ready",
          body: `Your server "${(serverName || description).slice(0, 60)}" was generated successfully and is ready to download.`,
        }).then();

        send({
          type: "complete",
          id: insertedRow.id,
          tools: parsed.tools ?? tools,
          securityScore: combinedReport.score,
          securityGrade: combinedReport.grade,
          blockDownload: combinedReport.blockDownload,
        });
      } catch (err: unknown) {
        // No credits to refund — deduction only happens after successful generation
        // Notify founder about generation failure (non-blocking)
        const founderEmail = process.env.FOUNDER_EMAIL || "founder@flomcp.com";
        const errMsg = err instanceof Error ? err.message : "Generation failed";
        sendEmail({
          to: founderEmail,
          subject: `[GEN ERROR] Generation failed: ${(serverName || description).slice(0, 60)}`,
          html: `<p><strong>Generation error</strong></p><p>User: ${user.email ?? user.id}</p><p>Server name: ${serverName || "(none)"}</p><p>Description: ${description.slice(0, 200)}</p><p>Error: ${errMsg}</p><p>Time: ${new Date().toISOString()}</p>`,
        }).catch(() => {});
        send({
          type: "error",
          message: errMsg,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
