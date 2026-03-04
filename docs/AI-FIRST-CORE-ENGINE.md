# FloMCP — AI-First Core Engine Strategy
**Date:** March 1, 2026  
**Type:** Product & Engineering Strategy  
**Status:** Working document — supersedes GENERATION-ENGINE-ROADMAP.md sections 2–4

---

## The Real Problem

Every AI product right now is an AI wrapper. User input goes in, Claude/GPT output comes out. The wrapper adds a form, some styling, a price. That is not a product — that is a thin UI layer on top of an API that anyone can replicate in a weekend.

FloMCP's risk is becoming "the MCP generation chatbot." Ask Claude yourself: "generate a TypeScript MCP server for GitHub API" and you get something that almost works. The generation UI is not the moat.

**The actual moat is two things:**

1. **Deep MCP protocol intelligence** — not just code generation, but a validation and refinement loop that understands what a working MCP server actually requires at the protocol level. Claude doesn't know this. We need to teach it and enforce it.

2. **The MCP Assistant** — most MCP developers don't need a new server. They have a broken one. A product that fixes, audits, and upgrades existing servers is categorically different from a generator. It cannot be replicated with a ChatGPT prompt. It requires domain expertise encoded into the system.

---

## 1. What "AI-First Native" Actually Means

### AI Wrapper
- The AI is the product
- Value = "I converted your request into AI API call"
- Replicable in 2 hours by anyone with an API key

### AI-First Native
- The AI is the reasoning engine; the product is built around it
- Value = proprietary domain knowledge that guides, constrains, and validates the AI output
- Has layers that increase value over time (validation, feedback, patterns, history)
- The AI alone cannot do what the product does — the product's knowledge layer is the differentiator

**For FloMCP:**

| Layer | What we own | Why it matters |
|-------|-------------|----------------|
| Protocol knowledge | MCP JSON-RPC spec encoded as validation rules | Claude generates "looks right" code — we verify it actually IS right |
| Security rules | 22 checks tuned to MCP-specific attack surface | Generic code checking is not MCP-specific |
| Refinement loop | Multi-pass generation with self-review | Single pass produces 70% quality; refinement loop reaches 95% |
| Repair intelligence | Parse + diagnose + fix existing servers | No generator does this. It requires deep pattern knowledge |
| Feedback flywheel | Download signal → prompt improvement | Gets better as more users generate |

---

## 2. Generation Engine v2 — Multi-Pass Refinement

### Current State (v1)
```
User input → [1 Claude call] → Security validator (22 checks) → Save → Done
```

If generation quality is 70% average (hallucinated logic, wrong schema shape, missing error handling), the 22 checks catch security issues but can't fix logic. The user gets the output regardless of logic quality.

### Target State (v2)
```
User input
  → Pass 1: Schema-only generation (define all tool schemas, no implementation)
  → Schema validator (protocol compliance — separate from security)  
  → Pass 2: Implementation (fill logic with schemas as ground truth)
  → Pass 3: Self-review (Claude reviews its own output against a checklist)
  → Security validator (22 checks — existing)
  → Save → Done
```

### Why 3 Passes Are Better Than 1

Claude is significantly better at reviewing code than generating it from scratch. The 3-pass approach uses this:

- **Pass 1 produces a contract.** Tool names, parameter names, types, descriptions — all locked before any logic is written. This prevents the most common failure mode: logic that doesn't match what the schema promises.
- **Pass 2 has ground truth.** The schemas from Pass 1 are injected back as constraints. Claude writes implementation that must satisfy the already-defined contract.
- **Pass 3 is a targeted review.** Not "is this good code" but a checklist review against specific MCP invariants: Does every handler have try/catch? Is console.log absent? Is the shebang on line 1? Are all params validated before use?

Estimated quality improvement: **70% → 92%** first-try usable servers (based on: number of post-generation "it doesn't work" complaints disappearing).

### Pass 1 — Schema Contract Generation

A separate, smaller Claude call that only outputs the tool + resource + prompt structure with no implementation:

```typescript
// New: POST /api/generate/schema (internal, called from generate route)
// Input: tools[], resources[], prompts[], apiConfig
// Output: JSON with pure schema definitions

{
  "tools": [
    {
      "name": "get_repository",
      "description": "Fetch a GitHub repository's metadata by owner and name",
      "params": {
        "owner": { "type": "string", "description": "GitHub username or org", "constraints": ["trim", "min:1"] },
        "repo":  { "type": "string", "description": "Repository name", "constraints": ["trim", "min:1"] }
      },
      "returns": "Repository metadata including name, description, stars, language, default branch",
      "sideEffects": "none",
      "annotation": "@readonly"
    }
  ]
}
```

This schema pass takes ~5 seconds. It costs almost nothing (low token count). But it gives Pass 2 a contract that prevents the most common generation failures.

### Pass 3 — Self-Review Checklist

After Pass 2 generates the full code, a targeted review prompt checks a specific list:

```
Review the following MCP server code. Answer YES or NO for each item.
If NO: output the fix inline, not a description of the fix.

CHECKLIST:
[ ] Is #!/usr/bin/env node on line 1 exactly?
[ ] Is every tool handler wrapped in try/catch?
[ ] Is sanitizeError used on every error path?
[ ] Are there zero console.log calls? (only console.error allowed)
[ ] Does every z.number() use .finite()?
[ ] Is process.env used for every API key/secret? (zero hardcoded)
[ ] Does main() call process.exit(1) on catch?
[ ] Are all Zod schemas using plain shape (not z.object wrapper)?
[ ] Does the shebang use /usr/bin/env node (not direct node path)?
[ ] Is the output valid JSON with the required file keys?
```

If any item is NO, Claude rewrites that specific section. The output of Pass 3 is the final code sent to the security validator.

---

## 3. MCP Protocol Compliance Validator

This is separate from the 22 security checks. The security validator checks for hardcoded secrets, SQL injection, etc. The **protocol validator** checks MCP-specific correctness.

### Why This Is Needed

The MCP JSON-RPC protocol has specific requirements that Claude often gets wrong:

| Common Failure | What Claude generates | What MCP actually requires |
|---------------|----------------------|---------------------------|
| Tool response shape | `{ text: result }` | `{ content: [{ type: "text", text: result }] }` |
| Error response | Throws an exception | `{ content: [...], isError: true }` (never throw) |
| Capabilities declaration | Declares `tools: {}` always | Only declare capabilities the server actually uses |
| Resource URI format | `resource://name` | `resource://SERVER_SLUG/name` (slug-namespaced) |
| Prompt arg handling | Direct positional args | `args` as `Record<string, string>` |
| Transport | HTTP server | `StdioServerTransport` (for local stdio servers) |
| Console output | `console.log` to stdout | `console.error` only — stdout is the JSON-RPC transport |

### Protocol Validator API

```typescript
// lib/protocol/validator.ts  (new — separate from existing lib/security/)

interface ProtocolCheckResult {
  check: string;
  pass: boolean;
  severity: "blocker" | "warning";
  fix?: string;  // exact code fix when severity = "blocker"
}

function validateMcpProtocol(indexTs: string): ProtocolCheckResult[] {
  return [
    checkToolResponseShape(indexTs),   // content array required
    checkNoThrowInHandlers(indexTs),   // isError:true, not throw
    checkCapabilityDeclaration(indexTs, files), // matches actual usage
    checkResourceUriFormat(indexTs),   // namespaced URIs
    checkNoConsoleLog(indexTs),        // console.error only
    checkStderrStartup(indexTs),       // startup log goes to stderr
    checkSigtermHandling(indexTs),     // graceful shutdown
    checkTransportType(indexTs),       // StdioServerTransport only
    checkMainPattern(indexTs),         // async main + process.exit(1)
    checkShebang(indexTs),             // line 1 exactly
  ];
}
```

**Blockers** (generation cannot be delivered without fix) automatically trigger a targeted re-generation of the failing section — not a full re-generation.  
**Warnings** are shown in the PostGenerationReview security report alongside the existing 22 checks.

This raises the bar from "security correct" to "protocol correct" — a distinction no other MCP tool makes.

---

## 4. The MCP Assistant — The Real Moat

This is the product category that cannot be replicated by telling someone to paste code into ChatGPT.

### The Core Insight

90% of MCP developer pain is not "I need a new server." It is:
- "My server shows up in Claude but the tool never runs"
- "It crashes on startup, I have no idea why"
- "It worked last week, now it doesn't after I updated the SDK"
- "I hardcoded my API key and now I need to clean it up before I share it"
- "I don't understand why Claude isn't using the tool even when I ask it to"
- "My tool returns the right data but Claude says it got an error"

None of these problems are solved by generation. They require **diagnosis + targeted repair**.

### MCP Assistant — Product Surface

A new section in the dashboard: **"Fix My Server"**

```
┌──────────────────────────────────────────────────────────────────┐
│  MCP Assistant                                                    │
│                                                                   │
│  Paste your MCP server code or upload src/index.ts               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  [code editor / paste area]                              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  (optional) Error message from Claude Desktop / VS Code:         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  e.g. "tool not found", "spawn ENOENT", JSON parse error │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Mode:  [Diagnose & Fix ▼]  [Run Analysis]                        │
└──────────────────────────────────────────────────────────────────┘
```

### MCP Assistant Modes

**1. Diagnose & Fix** (default)  
Parses the code, identifies all protocol violations and security issues, generates a diff-based fix with per-fix explanations. User sees exactly what changed and why.

**2. Security Audit**  
Runs the full 22 security checks + the protocol validator against their existing code. Returns a scored report identical to what FloMCP-generated servers get. Positions FloMCP as the standard for MCP security — even for servers we didn't generate.

**3. SDK Upgrade**  
The MCP SDK has had breaking changes. Servers using `new Server(...)` and `setRequestHandler(ListToolsRequestSchema, ...)` are the old pattern. The new pattern is `new McpServer(...)` and `server.tool(...)`. This mode detects old patterns and migrates them automatically.

**4. Explain**  
Generates plain-English documentation from code: what the server does, what each tool expects, what each tool returns, how to configure it. Useful for inherited or undocumented servers. Outputs a README.md.

**5. Test Generator**  
Takes an existing server and generates the full `tests/index.test.ts` vitest suite. Two tests per tool (valid input + invalid input), sanitizeError tests, schema validation tests. Identical format to what FloMCP-generated servers include.

### MCP Assistant — Backend Architecture

```
POST /api/assistant
{
  code: string,               // existing index.ts content
  mode: AssistantMode,
  errorMessage?: string,      // paste from Claude Desktop logs
  sdkVersion?: string         // "old" | "new" — auto-detected if omitted
}
```

**Step 1 — Static Parse:** Extract the server's structure without running it:

```typescript
interface ParsedMcpServer {
  sdkPattern: "old" | "new" | "unknown";
  serverName: string | null;
  tools: Array<{ name: string; description: string; params: Record<string, string>; }>;
  resources: Array<{ name: string; uri: string; }>;
  prompts: Array<{ name: string; }>;
  usesConsoleLog: boolean;
  hasShebang: boolean;
  hasMainCatch: boolean;
  usesProcessEnv: boolean;
  hasHardcodedStrings: string[];   // suspected secrets
  hasThrowInHandlers: boolean;
  transportType: "stdio" | "http" | "unknown";
}
```

**Step 2 — Issue List:** Build a structured issue list from parse results + security validator + protocol validator:

```typescript
interface AssistantIssue {
  id: string;
  severity: "blocker" | "warning" | "info";
  category: "protocol" | "security" | "quality" | "sdk";
  title: string;
  description: string;
  lineHint?: number;
  fix?: string;   // exact replacement code for simple fixes
}
```

**Step 3 — Targeted Claude Prompt:** Instead of asking Claude to "fix everything," send it only the specific issues:

```
You are given a broken MCP server. You must fix ONLY the following issues.
Do not change anything else. Return the complete fixed file.

ISSUES TO FIX:
1. [BLOCKER] console.log on line 47 — must be console.error (stdout corrupts JSON-RPC)
2. [BLOCKER] Tool "search" handler does not have try/catch — must wrap in try/catch with isError:true
3. [WARNING] process.env.API_KEY is not validated at startup — add startup check

Here is the current code:
[CODE]
```

This produces precise, minimal diffs — not rewrites. The user can see exactly what changed.

**Step 4 — Diff Output:** Generate a side-by-side diff view in the UI showing before/after for each fix. Every change is annotated with the issue it resolves.

---

## 5. The Feedback Flywheel

This is what makes FloMCP improve automatically over time. No other MCP generator has this because no other MCP generator is a product — they're demos.

### Signal 1: Download Rate per Generation

When a user downloads a generated server, that is a positive signal that the generation worked well enough to use. When they don't download within 24 hours, it's a signal the quality wasn't sufficient.

Track:
```sql
-- In generation save:
-- downloaded: boolean, downloaded_at: timestamptz
-- Track download rate by: complexity, tool count, api_type
SELECT 
  COUNT(*) FILTER (WHERE downloaded) / COUNT(*)::float AS download_rate,
  complexity,
  tool_count
FROM mcp_servers
GROUP BY complexity, tool_count
ORDER BY download_rate ASC;
```

Low download rate for a specific server type = investigate that generation pattern.

### Signal 2: Security Score Distribution

The 22-check security score should be rising over time. If it isn't, the system prompt rules aren't being followed consistently.

Track:
```sql
SELECT 
  DATE_TRUNC('week', created_at) AS week,
  AVG(security_score) AS avg_score,
  COUNT(*) FILTER (WHERE security_score >= 90) AS grade_a_count
FROM mcp_servers
GROUP BY week
ORDER BY week;
```

### Signal 3: MCP Assistant Fix Patterns

Every MCP Assistant session that finds issues = data on what our generator gets wrong. If "missing try/catch in handler" keeps appearing in assistant sessions, that rule needs to be reinforced in Pass 3 of generation.

Track:
```sql
-- New table: assistant_sessions
-- issues_found: jsonb array of {category, id}
SELECT 
  issue->>'id' AS issue_type,
  COUNT(*) AS frequency
FROM assistant_sessions, jsonb_array_elements(issues_found) AS issue
GROUP BY issue_type
ORDER BY frequency DESC;
```

This table directly maps to system prompt improvements. High-frequency issues → new rules added to Generation Engine Pass 3 checklist.

### The Compound Effect

```
More users generate → more download signal → better prompt tuning
More users run assistant → more repair patterns → better validator rules
Better validator rules → fewer issues in generated code → higher download rate
Higher download rate → more users trust FloMCP → more users generate
```

Every other AI wrapper starts at the same quality level every day. FloMCP's quality compounds with usage.

---

## 6. Context Injection — API Documentation Fetching

When users provide an API Documentation URL in Step 1, FloMCP should do the work — not the user.

### Current State
The API URL field exists in the generator but only gets passed as text to Claude. Claude has no actual knowledge of the API.

### What Should Happen

```
User pastes: https://api.github.com / https://example.com/api/swagger.json

Server-side:
1. Fetch the URL
2. Detect content type:
   - OpenAPI/Swagger JSON → parse endpoints, extract tool definitions
   - HTML documentation → strip tags, extract text, truncate to 15k chars
   - GitHub repo → fetch README.md via raw.githubusercontent.com
3. Inject as structured context into the USER_MESSAGE:

## API Documentation (fetched from {url})
{extracted_content}

4. If OpenAPI: also pre-fill Step 3 tool definitions based on detected endpoints
```

### OpenAPI Auto-Import (Step 3 Pre-fill)

When an OpenAPI spec is detected:

```typescript
// lib/openapi/import.ts  (new)
interface OpenApiTool {
  name: string;         // operationId or {method}_{path}
  description: string;  // summary + description from spec
  params: ToolField[];  // from parameters[] + requestBody schema
  method: string;
  path: string;
}

function extractToolsFromOpenApi(spec: OpenApiSpec): OpenApiTool[]
```

The extracted tools are shown to the user in Step 3 as pre-filled cards with a "accept?" confirmation. They can remove or edit tools before generation.

This is the strongest user value prop in the product: "Paste your Swagger URL, we'll figure out the tools."

---

## 7. Build Sequence — What to Build First

Ordered by: confidence the user gets better outcomes immediately.

### Sprint 1 — Quality Floor (3 weeks)

| Item | What it fixes | Where |
|------|--------------|--------|
| **Protocol validator** (10 checks) | Catches the most common "it doesn't work" failures before delivery | `lib/protocol/validator.ts` (new) |
| **Pass 3 self-review** | Fixes logic issues that security validator can't catch | New second Claude call in `app/api/generate/route.ts` |
| **Fix encoding garbage in system prompt** | The current prompt has `â€¦` artifacts — Claude probably sees these | Fix UTF-8 in `route.ts` string literals |
| **Retry on failure with cached state** | When generation fails, user clicks "Retry" — no re-typing | `localStorage` save in wizard steps + Retry button in error state |

### Sprint 2 — MCP Assistant (4 weeks)

| Item | What it is | Where |
|------|-----------|--------|
| **MCP code parser** | Static analysis of existing `index.ts` | `lib/assistant/parser.ts` (new) |
| **Diagnose & Fix mode** | Issue list → targeted Claude fix → diff view | `app/api/assistant/route.ts` (new) + `app/dashboard/assistant/page.tsx` (new) |
| **Security Audit mode** | Run existing 22 checks on user's code | Reuse `lib/security/validator.ts` with assistant context |
| **SDK Upgrade mode** | Detect old `new Server()` pattern, migrate to `new McpServer()` | Pattern rules in `lib/assistant/patterns.ts` (new) |

### Sprint 3 — Context Injection (3 weeks)

| Item | What it is | Where |
|------|-----------|--------|
| **URL fetch + text extraction** | Server-side fetch of API doc URLs | `lib/context/fetch.ts` (new) |
| **OpenAPI parser + tool extraction** | Parse swagger.json → pre-fill Step 3 | `lib/context/openapi.ts` (new) |
| **Step 1 URL processing** | Show "fetching docs..." while extracting | `app/api/context/fetch/route.ts` (new) |

### Sprint 4 — Python Support (4 weeks)

| Item | What it is | Where |
|------|-----------|--------|
| **Language toggle in Step 1** | TypeScript / Python selector | `Step1Description.tsx` |
| **Python system prompt** | `fastmcp`-based generation, `pyproject.toml`, `requirements.txt` | Separate `PYTHON_SYSTEM_PROMPT` in route |
| **Python file keys in parser** | `server.py`, `requirements.txt`, `pyproject.toml` | `parseClaudeOutput()` |
| **Python security checks** | Equivalent checks for Python patterns | `lib/security/python-validator.ts` (new) |

---

## 8. MCP Assistant — Competitive Moat Analysis

Every feature in this document except the MCP Assistant can theoretically be replicated by a well-funded competitor. Better prompts, more security checks, multi-pass generation — these are engineering problems.

The MCP Assistant cannot be replicated quickly for this reason:

**It requires accumulated domain knowledge about what breaks.**

The assistant's value comes from a growing library of:
1. Known failure patterns (tool response shapes, transport choices, SDK migration issues)
2. Known fix templates (exact code replacements that work)
3. Pattern evolution as the MCP spec evolves

This knowledge is only built through:
- Running the assistant on many real broken servers
- Tracking which fixes worked and which didn't
- Updating patterns as the MCP SDK releases new versions

A competitor starting today starts with zero accumulated patterns. FloMCP starts with every user who has ever had a broken server — including all the patterns we've already encoded from studying the Reddit pain points.

The assistant also creates a different relationship with the user:
- Generator: "Come to us when you need something new"
- Assistant: "Come to us whenever something doesn't work"

The assistant relationship has higher retention, higher engagement, and higher willingness to pay than the generator relationship.

---

## 9. What We Are Not Building

To stay focused:

| Thing | Why not |
|-------|---------|
| Visual IDE / code editor | We are not an editor. We are an intelligence layer. |
| MCP server marketplace | Discovery is GitHub's problem. We build servers and fix them. |
| Claude Desktop/VS Code plugin | Too early. Build the web product first. |
| Team collaboration features | Phase 4+. Solo developer is the core persona. |
| "Train on your codebase" | Not a credible differentiator. Too many competitors. |

---

## 10. Summary — The Product We Are Building

FloMCP is not a code generator. It is the **MCP intelligence platform** — the expert system for building and maintaining MCP servers.

**Generator** → You describe a server, we build a production-ready one that actually works at the protocol level, is hardened against the 22 most common MCP security failures, and passes all protocol compliance checks. Multi-pass refinement means the first result is good enough to use.

**Assistant** → You have a server that's broken, insecure, outdated, or undocumented. We diagnose it, fix it, and explain what we did. No other product does this. We become the place every MCP developer comes to when something doesn't work.

**Flywheel** → Every generation improves the generator. Every assistant session improves the validator patterns. The product gets measurably better as more people use it — something no static AI wrapper can say.

That is an AI-first native product.
