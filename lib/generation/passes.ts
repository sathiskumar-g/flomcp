/**
 * lib/generation/passes.ts
 *
 * Multi-Pass Generation Engine v2 — prompt builders and output parsers.
 *
 * Pass 1 — Schema contract  : small Claude call that locks tool names, param names,
 *                              types, and constraints before any code is written.
 * Pass 3 — Self-review       : targeted Claude review against a 10-item MCP quality
 *                              checklist; rewrites only failing sections inline.
 *
 * Pass 2 (the full implementation) is driven directly from app/api/generate/route.ts
 * using the existing SYSTEM_PROMPT + USER_MESSAGE, augmented with the Pass 1 contract.
 */

// ─── Pass 3 quality checklist ─────────────────────────────────────────────────
// 10 items that cover the most common MCP generation failures.
// Encoded here (not inside the system prompt) so they can be extended independently
// without changing the main generation prompt.

export const PASS_3_CHECKLIST = [
  "Is #!/usr/bin/env node on line 1 exactly?",
  "Is every tool handler wrapped in try/catch?",
  "Is sanitizeError used on every error path?",
  "Are there zero console.log calls? (only console.error allowed)",
  "Does every z.number() use .finite()?",
  "Is process.env used for every API key/secret? (zero hardcoded)",
  "Does main() call process.exit(1) on catch?",
  "Are all Zod schemas using plain shape (not z.object wrapper)?",
  "Does the shebang use /usr/bin/env node (not direct node path)?",
  "Is the output valid TypeScript with no syntax errors?",
  "Does main() register both process.on('SIGTERM') and process.on('SIGINT') handlers that call server.close() then process.exit(0)?",
  "Are ALL database/SQL queries parameterized ($1/$2 for pg, ? for sqlite3/mysql2)? Zero string concatenation in SQL?",
] as const;

// ─── Pass 1 types ─────────────────────────────────────────────────────────────

export interface SchemaParam {
  type: string;
  description: string;
  constraints?: string[];
}

export interface SchemaTool {
  name: string;
  description: string;
  params: Record<string, SchemaParam>;
  returns: string;
  sideEffects: string;
  annotation: string;
}

export interface SchemaContract {
  tools: SchemaTool[];
}

// ─── Pass 1 — Schema contract ─────────────────────────────────────────────────

export function buildPass1System(): string {
  return `You are FloMCP Schema Architect. Design the MCP tool interface contract only — no implementation.
Output ONLY a JSON schema contract. No TypeScript code. No prose. No markdown prose outside the JSON.

Output this exact JSON shape:
{
  "tools": [
    {
      "name": "snake_case_tool_name",
      "description": "One clear sentence describing what this tool does",
      "params": {
        "param_name": {
          "type": "string|number|boolean",
          "description": "What this param represents",
          "constraints": ["trim", "min:1", "max:500", "url", "email", "finite"]
        }
      },
      "returns": "Exact description of what the tool returns",
      "sideEffects": "none|writes data|deletes data|sends HTTP request",
      "annotation": "@readonly|@creates|@modifies|@destructive|@executes"
    }
  ]
}

Rules:
- Tool names: snake_case, verb_noun format (get_user, create_order, delete_file, search_items)
- Every string param: include "trim" in constraints; URL params add "url"; email params add "email"
- Every number param: include "finite" in constraints (prevents NaN/Infinity)
- returns: be specific — describe the data shape returned (e.g. "User object with id, name, email")
- sideEffects: be honest — read-only tools say "none", API calls say "sends HTTP request"
- annotation: @readonly for reads, @creates for new records, @modifies for updates, @destructive for deletes`;
}

export function buildPass1User(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiConfig: any
): string {
  const toolDescriptions = tools
    .map(
      (t, i) =>
        `${i + 1}. ${t.name}: ${t.description}` +
        (t.fields?.length
          ? `\n   User-defined params: ${
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t.fields.map((f: any) => `${f.name} (${f.type}${f.required ? ", required" : ""})`).join(", ")
            }`
          : "")
    )
    .join("\n");

  return `Design the schema contract for these ${tools.length} MCP tools. Output ONLY the JSON contract.

Tools:
${toolDescriptions}

${apiConfig?.enabled ? `API context: ${apiConfig.baseUrl} (${apiConfig.authType} auth)` : "No external API — local tools only."}`;
}

export function parseSchemaContract(raw: string): SchemaContract | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\r?\n?/gm, "")
      .replace(/\r?\n?```$/gm, "")
      .trim();
    try {
      return JSON.parse(cleaned) as SchemaContract;
    } catch {
      /* fall through */
    }
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1)) as SchemaContract;
      } catch {
        /* fall through */
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Pass 3 — Self-review checklist ───────────────────────────────────────────

export function buildPass3System(): string {
  return `You are a TypeScript MCP server code quality reviewer.

Output format — follow exactly:
1. For each checklist item output one line: "YES" or "NO" followed by a brief justification
2. After all 10 items:
   - If ALL are YES → output exactly "ALL_CHECKS_PASSED" on its own line, nothing else after it
   - If ANY is NO → output the COMPLETE corrected src/index.ts enclosed exactly like this:

===CORRECTED_CODE_START===
[full corrected TypeScript file — fix ALL failing checklist items in one pass]
===CORRECTED_CODE_END===

No prose. No additional commentary beyond the checklist answers and either ALL_CHECKS_PASSED or the corrected code block.`;
}

export function buildPass3User(indexTs: string): string {
  const checklistItems = PASS_3_CHECKLIST.map((item, i) => `[${i + 1}] ${item}`).join("\n");
  return `Review this MCP server code. Answer YES or NO for each checklist item. If ANY item is NO, output the complete corrected src/index.ts with ALL issues fixed.

CHECKLIST:
${checklistItems}

CODE (src/index.ts):
\`\`\`typescript
${indexTs}
\`\`\``;
}

/**
 * Extracts the corrected src/index.ts from a Pass 3 response.
 * Returns null if all checks passed (caller keeps the Pass 2 output).
 */
export function extractReviewedCode(raw: string): string | null {
  const START = "===CORRECTED_CODE_START===";
  const END = "===CORRECTED_CODE_END===";
  const startIdx = raw.indexOf(START);
  const endIdx = raw.indexOf(END);
  if (startIdx !== -1 && endIdx > startIdx) {
    return raw.slice(startIdx + START.length, endIdx).trim();
  }
  // ALL_CHECKS_PASSED — original code is already correct
  if (raw.includes("ALL_CHECKS_PASSED")) {
    return null;
  }
  // Fallback: neither marker found — use Pass 2 output as-is
  return null;
}
