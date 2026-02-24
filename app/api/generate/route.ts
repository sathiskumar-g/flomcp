import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit, recordGeneration } from "@/lib/rate-limiter";
import { createServerClient } from "@/lib/supabase-server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── SSE helper ───────────────────────────────────────────────────────────────

function encode(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { description, apiConfig, tools } = body;

  // ── Rate limit check ──
  const rateCheck = await checkRateLimit(supabase, user.id);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: rateCheck.reason ?? "Rate limit exceeded" }),
      { status: 429 }
    );
  }

  // ── Stream SSE ──
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(new TextEncoder().encode(encode(data)));

      try {
        // Step 1
        send({ type: "progress", step: "analyzing", message: "Analyzing your requirements…" });
        await delay(1200);

        // Step 2
        send({ type: "progress", step: "schema", message: "Designing tool schemas…" });
        await delay(1000);

        // Step 3 — actual Claude call
        send({ type: "progress", step: "coding", message: "Writing TypeScript code…" });

        const toolList = tools
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((t: any, i: number) =>
            `${i + 1}. ${t.name}: ${t.description}${
              t.fields?.length
                ? `\n   Parameters: ${t.fields
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((f: any) => `${f.name} (${f.type}${f.required ? ", required" : ""})`)
                    .join(", ")}`
                : ""
            }`
          )
          .join("\n");

        const apiSection = apiConfig?.enabled
          ? `\nAPI Integration:\n- Base URL: ${apiConfig.baseUrl}\n- Auth: ${apiConfig.authType}\n${apiConfig.apiDocUrl ? `- Docs: ${apiConfig.apiDocUrl}` : ""}`
          : "\nNo external API — local tools only.";

        // ─────────────────────────────────────────────────────────────────
        // SYSTEM PROMPT — operating contract (LangChain context engineering)
        //   Rules + concrete few-shot example here (episodic memory pattern)
        //   temperature: 0.1 = deterministic code, no hallucination
        //   User message = task spec only (no rule repetition)
        // ─────────────────────────────────────────────────────────────────
        const SYSTEM_PROMPT = `You are FloMCP Generator — an expert TypeScript MCP (Model Context Protocol) server engineer.
You generate LOCAL STDIO MCP servers that run on the user's machine.
You output ONLY valid JSON. No markdown fences. No prose. No explanation outside the JSON.

════════════════════════════════════════════════════════
CANONICAL PATTERN — copy this structure EXACTLY, no variations
════════════════════════════════════════════════════════

FILE: src/index.ts
───────────────────
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadAllTools } from "./tools/index.js";

const server = new McpServer(
  { name: "{{server-name}}", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const tools = await loadAllTools();
for (const tool of tools) {
  server.tool(tool.name, tool.description, tool.inputSchema.shape, async (args) => {
    return tool.handler(args);
  });
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("{{server-name}} MCP server started");

FILE: src/tools/index.ts
────────────────────────
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { ToolModule } from "../types.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function loadAllTools(): Promise<ToolModule[]> {
  const files = await readdir(__dirname);
  const tools: ToolModule[] = [];
  for (const file of files.filter(f => f.endsWith(".js") && f !== "index.js")) {
    const mod = await import(join(__dirname, file));
    if (mod.name && mod.inputSchema && mod.handler) tools.push(mod as ToolModule);
  }
  return tools;
}

FILE: src/types.ts
──────────────────
import type { z } from "zod";
export interface ToolModule {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
  handler: (args: unknown) => Promise<{ content: Array<{ type: "text"; text: string }>; isError: boolean }>;
}

FILE: src/tools/example-tool.ts  ← REPLICATE THIS PATTERN for each tool
────────────────────────────────
import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { sanitizeError } from "../utils/errors.js";

export const inputSchema = z.object({
  param1: z.string().describe("Description of param1"),
  limit: z.number().int().min(1).max(100).default(10).describe("Max results"),
});

export const name = "tool_name";
export const description = "What this tool does and when to call it.";
export const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
};

export async function handler(
  args: unknown
): Promise<{ content: Array<{ type: "text"; text: string }>; isError: boolean }> {
  try {
    const validated = inputSchema.parse(args);
    const result = { data: validated.param1, count: validated.limit };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: false,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, error.message);
    }
    return {
      content: [{ type: "text", text: sanitizeError(error) }],
      isError: true,
    };
  }
}

FILE: src/utils/errors.ts
──────────────────────────
import { z } from "zod";
export function sanitizeError(error: unknown): string {
  if (error instanceof z.ZodError) return \`Validation failed: \${error.message}\`;
  if (error instanceof Error) {
    return error.message
      .replace(/\\/[^\\s"']+/g, "[PATH]")
      .replace(/\\b\\d{1,3}(\\.\\d{1,3}){3}\\b/g, "[IP]")
      .replace(/(key|token|secret|password)=[^\\s&]*/gi, "$1=[REDACTED]");
  }
  return "An unexpected error occurred";
}

FILE: src/utils/fetch-with-timeout.ts  ← ONLY include when API calls exist
──────────────────────────────────────
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10000, ...rest } = options;
  const res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  return res;
}

════════════════════════════════════════════════════════
22 SECURITY RULES — never violate any of these
════════════════════════════════════════════════════════

INPUT VALIDATION:
[S1]  inputSchema.parse(args) MUST be the first call inside every handler function
[S2]  NEVER use raw args directly — only ever use the validated result from .parse()
[S3]  Add .min()/.max()/.url()/.email() Zod guards wherever the type allows it
[S4]  String params that become file paths: reject any containing ".." or null bytes

API / NETWORK:
[S5]  NEVER hardcode secrets — use process.env.VARIABLE_NAME exclusively
[S6]  ALL fetch calls must go through fetchWithTimeout() — never use raw fetch()
[S7]  Add Authorization header ONLY inside an if (process.env.API_KEY) guard
[S8]  When debug-logging API keys: use apiKey.slice(0, 4) + "..." never full value
[S9]  Check response.ok before calling response.json() — throw on non-2xx status
[S10] Set explicit timeouts on all external network calls (default 10 000 ms)

ERROR HANDLING:
[S11] Every handler body MUST be wrapped in try/catch — no exceptions
[S12] Throw McpError(ErrorCode.InvalidParams, ...) for bad user input (bad Zod parse)
[S13] Return { content: [...], isError: true } for runtime failures — never re-throw
[S14] ALWAYS call sanitizeError(error) — never return raw error.message to caller
[S15] NEVER include stack traces in any response content
[S16] Write full errors to console.error (stderr) — never to console.log (stdout)

OUTPUT / DATA:
[S17] NEVER return raw process.env values in any response
[S18] NEVER return internal file system paths in responses
[S19] Trim and sanitize all user-supplied strings before using in queries or URLs

STRUCTURE:
[S20] #!/usr/bin/env node MUST be the first line of src/index.ts
[S21] ALL console output goes to console.error — stdout carries only JSON-RPC
[S22] package.json MUST have "type": "module" — all imports MUST end in .js

════════════════════════════════════════════════════════
EXACT IMPORTS — use only these, never invent others
════════════════════════════════════════════════════════

CORRECT:
  "@modelcontextprotocol/sdk/server/mcp.js"   → McpServer
  "@modelcontextprotocol/sdk/server/stdio.js" → StdioServerTransport
  "@modelcontextprotocol/sdk/types.js"         → McpError, ErrorCode
  "zod"                                        → z

FORBIDDEN — these will break the server:
  ❌ @modelcontextprotocol/sdk/server/index.js  (old low-level API)
  ❌ new Server(...)                            (use McpServer instead)
  ❌ setRequestHandler(...)                    (use server.tool() instead)
  ❌ Express, Fastify, http, https             (STDIO only — no HTTP server)
  ❌ console.log(...)                          (use console.error for all logs)

IF UNSURE: copy the pattern exactly from the canonical example above. Do not guess.

════════════════════════════════════════════════════════
REQUIRED JSON OUTPUT SHAPE
════════════════════════════════════════════════════════

Return ONLY this JSON object. No wrapping. No markdown.

{
  "files": {
    "src/index.ts": "...",
    "src/tools/index.ts": "...",
    "src/tools/TOOLNAME.ts": "... (one entry per tool)",
    "src/utils/errors.ts": "...",
    "src/utils/fetch-with-timeout.ts": "... (only when API tools exist)",
    "src/types.ts": "...",
    "package.json": "...",
    "tsconfig.json": "...",
    ".env.example": "... (one VAR=description line per process.env used)",
    ".gitignore": "node_modules\\ndist\\n.env",
    "README.md": "..."
  },
  "tools": [{ "id": "...", "name": "...", "description": "...", "fields": [...] }]
}

package.json MUST contain:
  "type": "module"
  "scripts": { "build": "tsc", "start": "node dist/index.js", "dev": "tsx src/index.ts" }
  dependencies: @modelcontextprotocol/sdk, zod
  devDependencies: typescript, tsx, @types/node

tsconfig.json MUST contain:
  "module": "NodeNext", "moduleResolution": "NodeNext", "target": "ES2022"
  "outDir": "./dist", "rootDir": "./src", "strict": true`;

        // ─────────────────────────────────────────────────────────────────
        // USER MESSAGE — task specification only (rules live in system prompt)
        // ─────────────────────────────────────────────────────────────────
        const USER_MESSAGE = `Generate an MCP server with this exact specification:

## Server Description
${description}

## Transport
STDIO (local execution only — no HTTP, no Express, no OAuth)

## API Integration
${apiSection}

## Tools to Implement
${toolList}

## File Requirements
- src/index.ts — McpServer + StdioServerTransport entry point
- src/tools/index.ts — dynamic tool loader (loadAllTools)
- src/tools/<toolname>.ts — one file per tool above
- src/utils/errors.ts — sanitizeError function
${apiConfig?.enabled ? "- src/utils/fetch-with-timeout.ts — fetchWithTimeout for ALL HTTP calls" : ""}
- src/types.ts — ToolModule interface
- package.json, tsconfig.json, .env.example, .gitignore, README.md

Every tool handler must:
1. Call inputSchema.parse(args) as the very first line
2. Wrap entire body in try/catch
3. Return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: false }
4. On error: return { content: [{ type: "text", text: sanitizeError(error) }], isError: true }`;

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 8096,
          temperature: 0.3,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: USER_MESSAGE }],
        });

        const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        let parsed: { files?: Record<string, string>; tools?: object[] } = {};
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // If Claude wrapped in markdown, try harder
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        }

        // Step 4
        send({ type: "progress", step: "security", message: "Adding security best practices…" });
        await delay(800);

        // Step 5
        send({ type: "progress", step: "saving", message: "Saving your server…" });
        await delay(600);

        // ── Persist to database ──
        const adminClient = createAdminClient();

        const { data: insertedRow, error: dbError } = await adminClient
          .from("mcp_servers")
          .insert({
            user_id: user.id,
            name: description.slice(0, 60),
            description,
            // Map generated files to schema columns (multi-file → schema columns)
            generated_code: parsed.files?.["src/index.ts"] ?? parsed.files?.["index.ts"] ?? "",
            package_json: parsed.files?.["package.json"] ?? "{}",
            readme: parsed.files?.["README.md"] ?? "",
            tsconfig: parsed.files?.["tsconfig.json"] ?? null,
            env_example: parsed.files?.[".env.example"] ?? null,
            api_config: apiConfig ?? null,
            status: "generated",
          })
          .select("id")
          .single();

        if (dbError) throw new Error(`DB save failed: ${dbError.message}`);

        const serverId = insertedRow.id;

        await recordGeneration(supabase, user.id);

        // ── Done ──
        send({
          type: "complete",
          id: serverId,
          tools: parsed.tools ?? tools,
        });
      } catch (err: unknown) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Generation failed",
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
