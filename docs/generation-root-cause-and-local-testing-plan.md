# FloMCP Generator — Root Cause Analysis & Local Testing Plan

**Date:** March 4, 2026
**Scope:** Why critical issues still appear in generated servers + plan for in-app local testing

---
---

## Part 2 — Local MCP Testing Inside the FloMCP App

### The Core Idea

Currently after generation, FloMCP shows: code files, security score, download button. The user has to download, run `npm install`, configure their client, and only then discover if the server actually works at the MCP protocol level.

The proposal: **test the generated server inside FloMCP before the user ever downloads it**, using the same stdio transport the server runs in production.

---

### What "Local Testing" Would Mean

Not running the code in a browser. Not a sandbox. The approach is:

1. User generates a server — files are saved to Supabase as usual
2. FloMCP spins up a **temporary Node.js child process** on the server running the generated `src/index.ts`
3. FloMCP communicates with it over its stdin/stdout using the MCP JSON-RPC protocol
4. FloMCP sends specific test calls, reads the responses, and shows a pass/fail report to the user
5. The child process is killed after the test run

This is the same thing Claude Desktop does when it connects to an MCP server — except FloMCP does it automatically on your behalf.

---

### What It Can Test

**Protocol-level checks (not covered by current 22 security checks):**

| Test | What it checks |
|------|----------------|
| Server initializes without crashing | `initialize` handshake completes |
| `tools/list` returns valid list | Tool names, descriptions, and schemas are present |
| Response shape is correct | Every tool response has `{ content: [{ type: "text", text: ... }] }` |
| Error responses use `isError: true` | Invalid inputs trigger `isError: true`, not a thrown exception |
| `resources/list` matches declared resources | Declared resources are actually accessible |
| `prompts/list` returns all prompts | Declared prompts are reachable |
| No stdout pollution | Startup doesn't write anything to stdout (which would corrupt JSON-RPC) |
| Server doesn't crash on unknown input | Sends a deliberately unknown method, expects a proper JSON-RPC error back |

These are the checks that the current security validator **cannot** do because it only reads static code — it doesn't run it.

---

### What It Cannot Test

- Real API calls (no API keys in the test environment)
- Business logic correctness (is the regex engine returning the right matches?)
- Performance under load
- Memory leaks over time

The scope is narrow but the value is high: **"does this server speak valid MCP when connected?"**

---

### What Is Needed

**Infrastructure:**

| Requirement | Why |
|-------------|-----|
| A server-side Node.js execution environment | FloMCP is deployed on Vercel (serverless) — Vercel functions can't `spawn()` child processes. Needs a separate execution worker (Fly.io, Railway, or a dedicated EC2/VPS) |
| File system access | The generated `src/index.ts` needs to be written to disk, `npm install` run, then `npx tsx src/index.ts` started |
| Process isolation | Each test run needs its own clean directory — no shared state between users |
| Timeout enforcement | The child process must be killed after N seconds regardless of outcome |
| Cleanup | Temp directories must be deleted after each run — no accumulation on disk |

**Application changes:**

| Change | What it adds |
|--------|-------------|
| New API route `/api/test-server` | Accepts a server ID, fetches files from Supabase, runs the test harness, returns results |
| Execution worker service | Separate from the Next.js app — handles the `spawn()`, stdin/stdout wiring, and timeout |
| Test result storage | Results saved alongside the server record (new `test_report` JSONB column) |
| UI: "Test Server" button | Appears on PostGenerationReview alongside the existing security score card |
| UI: Test results panel | Shows per-test pass/fail with specific failure messages ("response missing `content` array") |

---

### The Vercel Problem

This is the main blocker. **Vercel serverless functions cannot spawn child processes.** `child_process.spawn()` is not available in the Vercel runtime.

Three options:

| Option | Complexity | Cost | Reliability |
|--------|-----------|------|-------------|
| Dedicated execution worker (Fly.io/Railway container) | Medium | ~$5-20/mo | High — always-on, full Node.js |
| AWS Lambda with custom runtime | High | Pay-per-use | Medium — cold starts, 15min limit |
| Vercel Edge Function with WASM Node.js runner | Very high | Included | Low — WASM Node.js is incomplete |

**Recommended:** A small always-on Fly.io or Railway container running a simple Express app that: accepts file content, writes to a temp dir, runs the server, pipes stdio, returns results, cleans up. FloMCP's Next.js app calls this worker via HTTP.

---

### Test Flow (Detailed)

```
User hits "Test Server" in FloMCP
  ↓
POST /api/test-server { serverId }
  ↓
FloMCP fetches files from Supabase
  ↓
FloMCP POST → Execution Worker { files: { "src/index.ts": "...", "package.json": "..." } }
  ↓
Worker:
  1. Creates /tmp/{uuid}/ directory
  2. Writes all files to disk
  3. Runs: npm install --ignore-scripts (5s timeout)
  4. Spawns: npx tsx src/index.ts
  5. Sends: MCP initialize handshake via stdin
  6. Reads: response from stdout
  7. Sends: tools/list request
  8. Reads: tool list response
  9. Sends: one test call per tool with sample valid input
  10. Sends: one test call per tool with invalid input (expects isError:true)
  11. Sends: resources/list, prompts/list
  12. Kills the process
  13. Deletes /tmp/{uuid}/
  14. Returns structured test report
  ↓
FloMCP saves test_report to Supabase
  ↓
FloMCP shows results panel to user
```

---

### Where This Fits the AI-First Engine Roadmap

In the AI-FIRST-CORE-ENGINE document, Sprint 1 includes the **Protocol Validator** — static analysis of the generated code against MCP invariants.

Local testing is the **dynamic complement** to the static protocol validator:

| Approach | What it catches | When it runs |
|----------|----------------|--------------|
| Static protocol validator (Sprint 1) | Wrong response shapes, missing try/catch, console.log — detectable from code | During generation, before saving |
| Local test runner (Sprint 2+) | Runtime crashes, actual JSON-RPC handshake failures, real protocol violations | After saving, before user downloads |

They work together. Static analysis is fast and free. Dynamic testing is slower, costs real compute, but catches what static analysis cannot: a server that looks correct but crashes 0.5 seconds after startup.

---

### Priority Assessment

**Is this worth building before the MCP Assistant?**

No. The MCP Assistant addresses 10x more user pain ("my server is broken") than local test-on-generation does. Most failures users encounter are logic failures, not protocol failures — and local testing doesn't catch logic failures.

**Recommended sequence:**
1. Sprint 1: Fix the system prompt rules (the 8 root causes above) — zero infrastructure, immediate quality improvement
2. Sprint 2: MCP Assistant — the real moat
3. Sprint 3: Local test runner — once the assistant exists, the execution worker built for it can be reused for pre-download testing
