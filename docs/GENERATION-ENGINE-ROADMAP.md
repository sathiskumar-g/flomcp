# FloMCP — Generation Engine Improvements & Build Roadmap
**Date:** Feb 28 2026  
**Type:** Engineering Strategy Document  
**Audience:** Engineering + Product

---

## 1. Reddit / Community MCP Pain Points (Synthesised)

These are the top recurring frustrations from MCP developers on Reddit (r/ClaudeAI, r/GithubCopilot, r/cursor, r/LocalLLaMA) and the Anthropic Discord:

| Pain Point | Frequency | Quote Examples |
|------------|-----------|----------------|
| "I spent 3 hours just getting the schema right" | Very High | "ZodError hell — took longer than writing the actual logic" |
| "My server works locally but Claude can't use it" | High | "Tool not showing up in Claude Desktop — no idea why" |
| "No Python support — everything is TypeScript" | High | "Why is every MCP tutorial TypeScript only? I only know Python" |
| "MCP servers break when input is slightly wrong" | High | "One null input crashes the whole server, Claude gets confused" |
| "I can't figure out how to add image/file input" | High | "How do I pass an image path and have the tool process it?" |
| "No way to test without restarting Claude 20 times" | Very High | "Testing loop is brutal — restart, wait, check, repeat" |
| "Security — I have my API keys hardcoded in the server" | Medium | "Is this safe? My key is in the .ts file" |
| "Multi-file projects are hard beyond hello world" | Medium | "When do I need a tools/ directory vs single file?" |
| "How do I make the server call a URL / scrape a page?" | High | "I want a tool that fetches a URL and summarises it" |
| "Generated code doesn't handle auth properly" | High | "Bearer tokens, OAuth — the AI just leaves a TODO comment" |

---

## 2. Core Engine Improvements (Technical)

### 2.1 — Multi-file Generation (tools/ directory per spec)
**Effort:** Medium | **Impact:** High

Currently all code goes in one `src/index.ts`. This works for small servers but breaks down for complex integrations with 5+ tools.  

**What to build:**
- Detect when tool count > 4 or total estimated lines > 400
- Generate a structured layout:
  ```
  src/
    index.ts          ← server entry, imports tools
    tools/
      tool-a.ts
      tool-b.ts
    utils/
      auth.ts
      http.ts
  ```
- Update `KNOWN_FILE_KEYS` in the parser and the system prompt accordingly
- Show multi-file output in the PostGenerationReview with a file tree viewer

**Unique value:** No other MCP generator produces clean multi-file output — they all dump everything in one file.

---

### 2.2 — Python MCP Server Generation
**Effort:** High | **Impact:** High

Python is the #1 requested missing feature. A huge portion of the MCP developer audience are data engineers, ML engineers, and Python-first developers.

**Technical approach:**
- Add `language: "typescript" | "python"` toggle to Step 1
- Maintain a separate `PYTHON_SYSTEM_PROMPT` that generates **`fastmcp`** or the official **`mcp`** PyPI package
- Python canonical structure:
  ```python
  # src/server.py
  from mcp.server.fastmcp import FastMCP
  
  mcp = FastMCP("server-name")
  
  @mcp.tool()
  def tool_name(param: str) -> str:
      """Tool description"""
      return result
  
  if __name__ == "__main__":
      mcp.run()
  ```
- Python `package.json` equivalent: generate `pyproject.toml` + `requirements.txt`
- ZIP output: `server.py`, `requirements.txt`, `README.md` with `pip install -r requirements.txt && python src/server.py`

**Files to change:** `app/api/generate/route.ts` (prompt switch), `KNOWN_FILE_KEYS` (python files), `components/generator/Step1Description.tsx` (language toggle), `PostGenerationReview` (show `.py` files correctly)

---

### 2.3 — URL / Web Resource Fetching Support
**Effort:** Low–Medium | **Impact:** High

The most common use case missing: "fetch this URL and use it as context."

**What to build:**
- In **Step 1**, add an optional "API Documentation URL" field (already partially exists)
- Before sending to Claude, **server-side fetch** the URL content, extract text (strip HTML), and inject it into the system prompt as `## API DOCUMENTATION\n{content}`
- Cap at 20k tokens of injected content
- Support: REST API docs, GitHub repos (raw README), OpenAPI/Swagger JSON, Postman collections  
- Detect OpenAPI JSON automatically and parse tools/endpoints directly → pre-fill Step 3

**Unique value:** Other generators ask you to manually describe the API. FloMCP reads the API docs itself and generates tools from them automatically.

---

### 2.4 — Image / File Input Support in Tools
**Effort:** Medium | **Impact:** High

Users want to pass images to MCP tools (screenshot analysis, document processing, diagram understanding).

**What to build:**
- Add `inputType: "text" | "file_path" | "image_path" | "base64"` to the tool field definition in Step 3
- The system prompt should generate tools that:
  - Accept a file path parameter
  - Read the file using `fs.readFileSync()`
  - Convert to base64 if needed for downstream API calls
  - For image processing: integrate with Claude Vision API inline in the generated server
- Show a "Supports image input" badge on generated servers in the library

---

### 2.5 — Streaming Generation Progress Bar (Real)
**Effort:** Low | **Impact:** Medium

Currently the progress bar sends fake steps before Claude even starts. Replace with real progress:

```
Stage 1: Validating input          [■■□□□□□□]  ← instant
Stage 2: Analyzing requirements    [■■■■□□□□]  ← Claude chunk 1
Stage 3: Writing tool schemas      [■■■■■■□□]  ← Claude chunk 2
Stage 4: Writing implementation    [■■■■■■■□]  ← Claude chunk 3
Stage 5: Security validation       [■■■■■■■■]  ← post-processing
```

Use the actual Anthropic streaming chunks to drive the progress — detect keywords like "schema", "tool", "error" in the streamed output to advance the bar.

---

### 2.6 — Retry / Regenerate Failed Generations
**Effort:** Low | **Impact:** High

When generation fails (timeout, parse error, rate limit), the user has no recovery path — they have to start from Step 1.

**What to build:**
- Save generation state (Steps 1–5 form values) to `localStorage` on each step advance
- On error in `PostGenerationReview`, show: "Something went wrong. [Retry with same config] or [Edit inputs]"
- `Retry` button calls `/api/generate` again with cached step data — no re-typing needed
- Also add: "Regenerate" button on existing servers in the servers list to re-run generation with the original config

---

### 2.7 — OpenAPI / Swagger Auto-Import
**Effort:** Medium | **Impact:** Very High

**What to build:**
- In Step 2, add "Import from OpenAPI spec" button
- Accept: URL to swagger.json, pasted JSON, or file upload
- Parse the spec: extract endpoints → auto-create tool definitions in Step 3
- Each API endpoint becomes one tool with correct parameter types from the spec schema
- This is a 10-minute server build for any REST API with docs — no manual tool definition needed

**Unique value proposition:** Nobody else does this for MCP. Zapier-style "connect your API" but for AI assistants.

---

### 2.8 — Custom Prompt Templates (saved per user)
**Effort:** Low | **Impact:** Medium

Power users repeatedly describe similar servers (e.g. "always add OAuth 2.0 with bearer token auth").

**What to build:**
- "Save as template" button in Step 1
- Stores the full step 1–3 config in `user_templates` Supabase table
- Templates shown as cards in a "Start from template" section above the wizard
- System-level templates: "REST API with auth", "Local file processor", "Database read-only query"

---

### 2.9 — MCP Server Health Check Integration
**Effort:** Medium | **Impact:** High

Developers frequently have broken servers that don't connect to Claude/Copilot. No way to debug.

**What to build:**
- After generation: "Test your server" section in PostGenerationReview
- User pastes their local server's stdio output (or we provide a test harness script)
- FloMCP's `/api/validate/health` endpoint checks:
  - Tool schema validity (JSON Schema compliance)
  - MCP protocol compliance (correct response shape)
  - Common config mistakes (wrong transport, missing shebang)
- Returns a checklist with green/red status for each check

---

### 2.10 — Secure API Key Injection (Environment Variables Helper)
**Effort:** Low | **Impact:** High

The #1 security failure in the wild: hardcoded API keys in MCP server code.

**What to build:**
- During generation: detect when an API key/token is needed
- Generate code that reads from `process.env.API_KEY` (already done partially)
- Add a UI step: "This server needs these environment variables:" with fields to enter values
- Generate a filled `.env` file (not committed) AND a `.env.example` with placeholders
- Add to README: "Never commit `.env` to git. Add to `.gitignore`."

---

## 3. Prioritised Build Plan

| # | Feature | Effort | Impact | When |
|---|---------|--------|--------|------|
| 1 | Retry/regenerate on failure | Low | High | Sprint 1 |
| 2 | Real streaming progress | Low | Medium | Sprint 1 |
| 3 | URL fetch + inject into prompt | Low–Med | High | Sprint 1 |
| 4 | OpenAPI auto-import | Medium | Very High | Sprint 2 |
| 5 | Python MCP generation | High | High | Sprint 2 |
| 6 | Multi-file generation | Medium | High | Sprint 2 |
| 7 | Image/file path tool inputs | Medium | High | Sprint 3 |
| 8 | Custom prompt templates | Low | Medium | Sprint 3 |
| 9 | MCP health check | Medium | High | Sprint 3 |
| 10 | Secure env var helper UI | Low | High | Sprint 1 |

---

## 4. Unique Value Propositions (Engineering Differentiation)

These are things no current MCP generator does. Each one becomes a marketing point:

1. **"Reads your API docs"** — paste a Swagger URL, get tools automatically
2. **"Python-first option"** — only generator to support TypeScript AND Python natively  
3. **"Security hardened from day 1"** — OWASP audit built into every generation, not optional
4. **"Multi-file when you need it"** — scales from toy server to production project structure
5. **"Knows MCP patterns"** — trained on the official spec, not generic code patterns
6. **"Retry in one click"** — generation fails gracefully, recovers without losing your work
7. **"Import, don't type"** — OpenAPI → MCP tools with zero manual schema writing

---

## 5. System Prompt Quality Improvements

Current system prompt issues to fix:

- **No resource cleanup** — generated servers never call `server.close()` or handle `SIGTERM`
- **No stdio error separation** — `console.log` and `console.error` go to stdout which breaks MCP stdio transport; should redirect all logs to `stderr`
- **Auth token validation gap** — OAuth2 refresh flow is left as a TODO in generated code
- **No TypeScript strict mode** — generated code doesn't enable `"strict": true` in tsconfig, allowing silent type errors
- **Missing input sanitisation for SQL tools** — parameterised queries aren't always used; injection risk remains

Each of these should be added as a rule in the system prompt and verified by the security validator.
