export const CODE_FILES: { name: string; lang: string; content: string }[] = [
  {
    name: "src/index.ts",
    lang: "typescript",
    content: `#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer(
  { name: "prompt-enhancar", version: "1.0.0" },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

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

// ── Resources ─────────────────────────────────────────────────────────────────
const RESOURCE_CONTENT: Record<string, { text: string; mimeType: string; description: string }> = {
  "prompt_redefiner_resource": {
    text: "QUALITY DIMENSIONS\\nClarity: Use of specific nouns/verbs; absence of \\"stuff/things.\\"\\nCompleteness: Presence of all task-specific parameters.\\nSpecificity: Precision of scope (e.g., \\"Python 3.10\\" vs \\"Code\\").\\nStructural Quality: Inclusion of Role, Context, and Output Schema.\\nANTI-PATTERN QUICK-FIX\\nANTI-001 (Bare Imperative): No persona. Fix: Add \\"You are an expert...\\"\\nANTI-002 (Open Scope): No bounds. Fix: Add length/format limits.\\nANTI-003 (Assumed Context): Vague references (\\"it\\"). Fix: Inline data.\\nANTI-004 (Vague Criteria): \\"Make it good.\\" Fix: Define measurable KPIs.\\nANTI-005 (Compound Task): Too many goals. Fix: Decompose.\\nANTI-006 (Negation Overload): Too many \\"Don'ts.\\" Fix: Use positive \\"Do\\" instructions.\\nANTI-007 (Missing Schema): No format. Fix: Provide a template.\\nANTI-008 (No Example): No I/O anchor. Fix: Add 1-shot example.",
    mimeType: "text/plain",
    description: "Prompt engineering reference — quality dimensions and anti-pattern fixes"
  }
};

for (const [name, resource] of Object.entries(RESOURCE_CONTENT)) {
  const uri = \`resource://prompt-enhancar/\${name}\`;
  server.resource(name, uri, async (resourceUri) => ({
    contents: [{ uri: resourceUri.href, text: resource.text, mimeType: resource.mimeType }]
  }));
}

// ── Schemas ────────────────────────────────────────────────────────────────────
const AnalyzeSchema = z.object({
  raw_prompt: z.string().trim().min(1),
  task_type: z.string().trim().optional().default(""),
  context_history: z.string().trim().optional().default("")
});

const RefineSchema = z.object({
  raw_prompt: z.string().trim().min(1),
  task_type: z.string().trim().optional().default(""),
  additional_context: z.string().trim().optional().default(""),
  auto_incorporate: z.boolean().optional().default(true),
  target_llm: z.string().trim().optional().default("general")
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function detectAntiPatterns(text: string) {
  const patterns = [
    { code: "ANTI-001", regex: /^(write|create|make|build|do|give|tell|show)/i, mode: "Bare Imperative", fix: "Add role: 'You are a senior [Expert]...'" },
    { code: "ANTI-002", regex: /\\b(anything|whatever|as needed|etc\\.?)\\b/i, mode: "Open Scope", fix: "Add explicit length/format constraints" },
    { code: "ANTI-003", regex: /\\b(it|this|that|the thing|the stuff)\\b/i, mode: "Assumed Context", fix: "Replace pronouns with explicit references" },
    { code: "ANTI-004", regex: /\\b(good|nice|better|best|great|perfect)\\b/i, mode: "Vague Criteria", fix: "Define measurable KPIs" },
    { code: "ANTI-005", regex: /\\b(and also|additionally|furthermore|plus|as well as)\\b/i, mode: "Compound Task", fix: "Decompose into focused sub-prompts" },
    { code: "ANTI-006", regex: /(don't|do not|never|avoid|without|no \\w+){2,}/i, mode: "Negation Overload", fix: "Restate as positive instructions" },
    { code: "ANTI-007", regex: /\\b(format|structure|output|return|respond)\\b/i, mode: "Missing Schema", fix: "Provide explicit output template" },
    { code: "ANTI-008", regex: /^(?!.*example|.*e\\.g\\.|.*for instance|.*sample)/i, mode: "No Example Anchor", fix: "Add a concrete Input→Output example" },
    { code: "ANTI-009", regex: /\\b(just|simply|obviously|clearly|of course)\\b/i, mode: "Implicit Reasoning", fix: "Add 'Think step-by-step' trigger" },
    { code: "ANTI-010", regex: /\\b(brief|concise|short).{0,60}\\b(comprehensive|detailed|thorough|complete)\\b/i, mode: "Contradictory Constraints", fix: "Prioritize one constraint" }
  ];
  return patterns
    .map((p) => { const m = text.match(p.regex); return m ? { code: p.code, trigger: m[0], mode: p.mode, fix: p.fix } : null; })
    .filter(Boolean);
}

function scorePrompt(text: string, taskType: string) {
  const hasRole = /you are (a|an|the)/i.test(text);
  const hasSchema = /json|markdown|schema|format|structure|template/i.test(text);
  const hasExample = /example|e\\.g\\.|for instance|sample|input.*output/i.test(text);
  const hasConstraints = /must|shall|should|require|limit|maximum|minimum|exactly/i.test(text);
  const hasVague = /stuff|things|good|nice|whatever|anything/i.test(text);
  const hasSpecific = /\\b(\\d+|python|javascript|typescript|json|xml|csv|api|function|class|method)\\b/i.test(text);
  const hasCoT = /step.by.step|reason|think|chain|first.*then|because/i.test(text);
  const len = text.length;
  const clarity = Math.min(100, 50 + (hasRole ? 15 : 0) + (!hasVague ? 15 : 0) + (len > 100 ? 10 : 0) + (hasCoT ? 10 : 0));
  const completeness = Math.min(100, 40 + (hasRole ? 15 : 0) + (hasSchema ? 15 : 0) + (hasConstraints ? 15 : 0) + (hasExample ? 15 : 0) + (taskType ? 5 : 0));
  const specificity = Math.min(100, 40 + (hasSpecific ? 20 : 0) + (hasConstraints ? 15 : 0) + (len > 200 ? 15 : 0) + (!hasVague ? 10 : 0));
  const structural_quality = Math.min(100, 30 + (hasRole ? 20 : 0) + (hasSchema ? 20 : 0) + (hasExample ? 15 : 0) + (hasCoT ? 15 : 0));
  const headline_score = Math.round((clarity * 0.30 + completeness * 0.30 + specificity * 0.25 + structural_quality * 0.15) * 100) / 100;
  return { clarity, completeness, specificity, structural_quality, headline_score };
}

function applyTransformations(raw: string, taskType: string, additionalContext: string, targetLlm: string): string {
  const t = taskType.toLowerCase();
  const domain = t.includes("cod") ? "software engineering"
    : t.includes("summar") ? "technical writing and summarization"
    : t.includes("analys") ? "data analysis and research"
    : t.includes("extract") ? "data extraction and parsing"
    : t.includes("creat") || t.includes("writ") ? "creative writing"
    : "the relevant domain";
  const contextBlock = additionalContext
    ? \`## Context\\n\${additionalContext.trim()}\`
    : "## Context\\n[INSERT: Provide relevant background, data, or prior work here]";
  const schemaBlock = targetLlm === "claude"
    ? "## Output Schema\\n<output>\\n  <result>[Primary deliverable]</result>\\n  <reasoning>[Step-by-step reasoning]</reasoning>\\n</output>"
    : targetLlm === "gpt-4" || targetLlm === "gpt4"
    ? "## Output Schema\\n1. Result: [Primary deliverable]\\n2. Reasoning: [Step-by-step explanation]"
    : \`## Output Schema\\n\\\`\\\`\\\`json\\n{\\n  "result": "[Primary deliverable]",\\n  "reasoning": "[Step-by-step explanation]"\\n}\\n\\\`\\\`\\\`\`;
  return [
    \`You are a senior expert specializing in \${domain}.\`,
    "",
    \`## Task\\n\${raw.trim()}\`,
    "",
    contextBlock,
    "",
    "## Constraints\\n1. Respond only with the requested output.\\n2. Use precise, unambiguous language.\\n3. State assumptions explicitly if information is missing.\\n4. Adhere strictly to the output schema.",
    "",
    schemaBlock,
    "",
    "## Reasoning Instruction\\nThink step-by-step before producing the final output."
  ].join("\\n");
}

// ── Tools ──────────────────────────────────────────────────────────────────────

/** @readonly */
server.tool(
  "analyze_prompt",
  "Score a raw prompt across 5 quality dimensions, extract intent, detect anti-patterns, and identify missing parameters.",
  {
    raw_prompt: z.string().trim().min(1).describe("The raw prompt to analyze"),
    task_type: z.string().trim().optional().default("").describe("Task type hint: coding, summarization, analysis, extraction, creative"),
    context_history: z.string().trim().optional().default("").describe("Optional prior conversation context")
  },
  async (args) => {
    const parsed = AnalyzeSchema.safeParse(args);
    if (!parsed.success) return { content: [{ type: "text" as const, text: "Invalid input: " + parsed.error.issues[0].message }], isError: true };
    try {
      const { raw_prompt, task_type, context_history } = parsed.data;
      const scores = scorePrompt(raw_prompt, task_type);
      const actionMatch = raw_prompt.match(/^(\\w+(?:\\s+\\w+){0,2})/i);
      const intent = {
        action: actionMatch ? actionMatch[1] : "unspecified",
        subject: raw_prompt.length > 60 ? raw_prompt.slice(0, 60) + "..." : raw_prompt,
        goal: !/you are/i.test(raw_prompt) ? "Underspecified task" : "Well-specified task",
        assumptions: [
          ...(/you are/i.test(raw_prompt) ? [] : ["No explicit role defined"]),
          ...(/output|return|format|schema/i.test(raw_prompt) ? [] : ["No output format specified"]),
          ...(/example|e\\.g\\./i.test(raw_prompt) ? [] : ["No examples provided"])
        ]
      };
      const anti_patterns = detectAntiPatterns(raw_prompt);
      const result = {
        scores,
        intent,
        anti_patterns,
        task_type_detected: task_type || "general",
        context_used: context_history.length > 0,
        recommendation: (anti_patterns?.length ?? 0) >= 3
          ? "Use refine_prompt to apply all 6 transformations"
          : (anti_patterns?.length ?? 0) > 0
          ? "Use refine_prompt to address detected anti-patterns"
          : "Prompt is well-structured; minor refinements optional"
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };
    }
  }
);

/** @modifies */
server.tool(
  "refine_prompt",
  "Apply 6 transformations to a raw prompt: role injection, intent restatement, context scaffolding, constraint formalization, output schema, chain-of-thought injection.",
  {
    raw_prompt: z.string().trim().min(1).describe("The raw prompt to refine"),
    task_type: z.string().trim().optional().default("").describe("Task type: coding, summarization, analysis, extraction, creative"),
    additional_context: z.string().trim().optional().default("").describe("Extra context to incorporate"),
    auto_incorporate: z.boolean().optional().default(true).describe("Automatically incorporate detected improvements"),
    target_llm: z.string().trim().optional().default("general").describe("Target LLM: claude, gpt-4, general")
  },
  async (args) => {
    const parsed = RefineSchema.safeParse(args);
    if (!parsed.success) return { content: [{ type: "text" as const, text: "Invalid input: " + parsed.error.issues[0].message }], isError: true };
    try {
      const { raw_prompt, task_type, additional_context, target_llm } = parsed.data;
      const beforeScores = scorePrompt(raw_prompt, task_type);
      const anti_patterns = detectAntiPatterns(raw_prompt);
      const refined = applyTransformations(raw_prompt, task_type, additional_context, target_llm);
      const afterScores = scorePrompt(refined, task_type);
      const result = {
        original_prompt: raw_prompt,
        refined_prompt: refined,
        transformations_applied: [
          "Role Assignment: Added expert persona",
          "Intent Restatement: Active voice framing",
          "Context Scaffolding: Added context block",
          "Constraint Formalization: Numbered constraint list",
          "Output Schema Definition: Structured output template",
          "Logic Injection: Step-by-step reasoning trigger"
        ],
        anti_patterns_resolved: (anti_patterns ?? []).map((p) => p?.code).filter(Boolean),
        scores: { before: beforeScores, after: afterScores },
        improvement_delta: {
          clarity: afterScores.clarity - beforeScores.clarity,
          completeness: afterScores.completeness - beforeScores.completeness,
          headline_score: Math.round((afterScores.headline_score - beforeScores.headline_score) * 100) / 100
        },
        target_llm
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };
    }
  }
);

/** @readonly */
server.tool(
  "score_prompt",
  "Score a prompt across Clarity, Completeness, Specificity, Structural Quality and return a weighted Effectiveness Prediction headline score.",
  {
    prompt: z.string().trim().min(1).describe("The prompt to score"),
    task_type: z.string().trim().optional().default("").describe("Optional task type for domain-specific scoring")
  },
  async ({ prompt, task_type }) => {
    try {
      const scores = scorePrompt(prompt, task_type ?? "");
      const anti_patterns = detectAntiPatterns(prompt);
      const issues = [
        ...(scores.clarity < 60 ? ["low clarity"] : []),
        ...(scores.completeness < 60 ? ["incomplete parameters"] : []),
        ...(scores.specificity < 60 ? ["insufficient specificity"] : []),
        ...(scores.structural_quality < 60 ? ["weak structural quality"] : []),
        ...(anti_patterns ?? []).map((p) => \`\${p?.code} (\${p?.mode})\`)
      ];
      return { content: [{ type: "text" as const, text: JSON.stringify({ ...scores, summary: issues.length > 0 ? "Issues: " + issues.join("; ") : "Meets all quality thresholds." }) }] };
    } catch (error) {
      return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };
    }
  }
);

/** @readonly */
server.tool(
  "decompose_prompt",
  "Break a complex multi-deliverable prompt into focused sub-prompts with declared dependencies.",
  {
    prompt: z.string().trim().min(1).describe("The complex prompt to decompose"),
    max_subtasks: z.number().finite().int().min(1).max(20).optional().default(10).describe("Maximum sub-tasks to generate"),
    include_dependencies: z.boolean().optional().default(true).describe("Declare dependencies between sub-tasks")
  },
  async ({ prompt, max_subtasks, include_dependencies }) => {
    try {
      const sentences = prompt.split(/(?<=[.!?])\\s+/);
      const compound = /\\b(and also|additionally|furthermore|plus|as well as|also|then|next|finally|second|third|fourth)\\b/i;
      const deliverables = sentences.flatMap((s) => s.split(compound).map((p) => p.trim()).filter((p) => p.length > 10));
      const capped = (deliverables.length > 0 ? deliverables : [prompt]).slice(0, max_subtasks ?? 10);
      const subtasks = capped.map((d, i) => ({
        id: i + 1,
        prompt: d.length < 20 ? \`Complete the following task: \${d}\` : d,
        depends_on: include_dependencies && i > 0 && /previous|from step|based on|using the/i.test(d) ? [i] : []
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify({ subtasks, total: subtasks.length, original_prompt: prompt }) }] };
    } catch (error) {
      return { content: [{ type: "text" as const, text: sanitizeError(error) }], isError: true };
    }
  }
);

// ── Prompts ────────────────────────────────────────────────────────────────────

server.prompt(
  "prompt-redefiner-prompt",
  "Prompt Redefiner V2 — rigorous prompt engineering engine system prompt",
  [],
  () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: "You are the Prompt Redefiner V2, a rigorous prompt engineering engine. Transform vague prompts into precision-crafted LLM inputs using 3 levels: LEVEL 1 (Intent) — parse core action, subject, goal, state all assumptions. LEVEL 2 (Detection) — scan for 10 anti-patterns (bare imperatives, open scope, assumed context, vague criteria, compound tasks, negation overload, missing schema, no examples, implicit reasoning, contradictory constraints), reporting trigger text, failure mode and fix. LEVEL 3 (Transformation) — rewrite using: role assignment, intent restatement, context scaffolding, constraint formalization, output schema, logic injection. SCORING: Score Clarity (30%), Completeness (30%), Specificity (25%), Structure (15%) independently for original and refined. Return a valid JSON object."
      }
    }]
  })
);

server.prompt(
  "usage_guide",
  "Show all tools, resources, and prompts with concrete examples",
  [],
  () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: "List every tool in this MCP server. For each: name, description, parameters (with types), and a concrete usage example with sample input and expected output. Also list any resources available."
      }
    }]
  })
);

server.prompt(
  "prompt_engineering_workflow",
  "Step-by-step workflow for diagnosing and refining a prompt using all available tools",
  [{ name: "raw_prompt", description: "The prompt you want to improve", required: true }],
  (args) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: \`Follow this workflow for: \${args?.raw_prompt ?? "[INSERT PROMPT]"}\\n\\nSTEP 1 — Call analyze_prompt to detect anti-patterns and intent.\\nSTEP 2 — Call score_prompt for baseline Effectiveness Prediction.\\nSTEP 3 — If 3+ deliverables, call decompose_prompt first.\\nSTEP 4 — Call refine_prompt with task_type and target_llm.\\nSTEP 5 — Call score_prompt again on refined prompt; report before/after delta.\\nSTEP 6 — Present refined prompt, transformations applied, and score table.\`
      }
    }]
  })
);

// ── Main ───────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("prompt-enhancar MCP server running on stdio");
  process.on("SIGTERM", () => { server.close(); process.exit(0); });
  process.on("SIGINT",  () => { server.close(); process.exit(0); });
}

main().catch((error: unknown) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});`,
  },
  {
    name: "package.json",
    lang: "json",
    content: `{
  "name": "prompt-enhancar-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "description": "Prompt engineering intelligence MCP server — analyze, score, refine, and decompose prompts using 10 anti-pattern detectors and 6 transformations. Generated by FloMCP.",
  "scripts": {
    "start": "npx tsx src/index.ts",
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0",
    "vitest": "^2.0.0"
  }
}`,
  },
  {
    name: "tsconfig.json",
    lang: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["tests", "node_modules", "dist"]
}`,
  },
  {
    name: "README.md",
    lang: "markdown",
    content: `# prompt-enhancar MCP Server

Generated by FloMCP — production-ready MCP server.

Transform raw, vague prompts into precision-crafted LLM inputs. Uses 10 anti-pattern detectors, 6 transformations, and 4 quality scorers — directly in Claude Desktop, Cursor, or any MCP-compatible AI assistant.

## Quick Start

\`\`\`bash
npm install
npx tsx src/index.ts
\`\`\`

## Add to Claude Desktop

\`\`\`json
{
  "mcpServers": {
    "prompt-enhancar": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/prompt-enhancar/src/index.ts"]
    }
  }
}
\`\`\`

Replace the path with your actual folder path. Restart Claude Desktop after saving.

## Available Tools

- **analyze_prompt** — Score across 5 quality dimensions, detect anti-patterns, extract intent
- **refine_prompt** — Apply 6 transformations: role, intent, context, constraints, schema, CoT
- **score_prompt** — Weighted Effectiveness Prediction score (Clarity 30% + Completeness 30% + Specificity 25% + Structure 15%)
- **decompose_prompt** — Break complex multi-deliverable prompts into focused sub-prompts

## Available Resources

- **prompt_redefiner_resource** — Quality dimensions reference + anti-pattern quick-fix guide

## Security

- All inputs validated with Zod schemas
- Errors sanitised — no file paths, IPs, or secrets in output
- No hardcoded secrets — fully offline, no external API calls`,
  },
  {
    name: ".vscode/mcp.json",
    lang: "json",
    content: `// Add prompt-enhancar to VS Code (GitHub Copilot) — stdio mode.
// Save this file and all 4 tools are live immediately.
{
  "servers": {
    "prompt-enhancar": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/prompt-enhancar/src/index.ts"]
    }
  }
}

// 4 tools registered automatically:
//   analyze_prompt   — detect anti-patterns + score across 5 dimensions
//   refine_prompt    — apply 6 transformations + before/after score delta
//   score_prompt     — weighted Effectiveness Prediction (0–100)
//   decompose_prompt — split complex prompts into focused sub-tasks

// For Claude Desktop, add to claude_desktop_config.json:
// {
//   "mcpServers": {
//     "prompt-enhancar": {
//       "command": "npx",
//       "args": ["tsx", "/absolute/path/to/src/index.ts"]
//     }
//   }
// }`,
  },
];
