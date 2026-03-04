# FloMCP — Product Strategy & Planning Document
**Date:** Feb 28 2026  
**Type:** Product + Engineering Strategy  
**Covers:** MCP Assistant, Pricing, Pro Plan, Early Access, Rating System, Future Roadmap

---

## 1. MCP Assistant — Core Product Direction

> **This is the most important document in the codebase. Read before writing a line of code.**

### 1.1 Why MCP Generation Alone Is Not Enough

FloMCP today generates new MCP servers from scratch. But the market reality is:

- **Thousands of broken MCP servers already exist** — developers built them before best practices were established
- **Security vulnerabilities are everywhere** — the 8,000-server audit showed SSRF, injection, hardcoded secrets at scale
- **Developers struggle to debug why their server doesn't connect** — the MCP protocol is picky and error messages are cryptic
- **API changes break existing servers** — no maintenance tooling exists

**FloMCP needs to own the full MCP server lifecycle — not just creation.**

---

### 1.2 MCP Assistant — What It Is

The MCP Assistant is a second core product inside FloMCP. While the Generator creates servers from scratch, the **Assistant fixes, audits, and improves existing servers**.

**Core capabilities:**

#### A. Security Audit & Auto-Fix
- User pastes their existing MCP server code (or uploads a file)
- FloMCP scans for all known vulnerability classes:
  - Hardcoded API keys / secrets
  - Missing input validation (no Zod or equivalent)
  - SSRF vulnerabilities (URLs constructed from user input with no allowlist)
  - Command injection (shell execution with user input)
  - Path traversal (filesystem access with user-controlled paths)
  - Unbounded execution (no timeouts, no resource limits)
  - Information leakage (stack traces, file paths in error messages)
- For each issue: show severity, explain the risk in plain English, and offer a one-click fix
- Generate a "Security Report" card (like a pull request review) with overall score

**This is the "GitHub Copilot for MCP security" — nothing like it exists.**

#### B. Protocol Compliance Checker
- Validates that the server correctly implements MCP protocol:
  - Tool schemas match the JSON Schema spec
  - Resource URIs are valid
  - Response shapes match what Copilot/Claude expects
  - Stdio transport is correctly set up (common mistake: logging to stdout instead of stderr)
- Returns a green/red checklist the developer can run before deploying

#### C. MCP Server Upgrade Assistant
- User's server was built with an old `@modelcontextprotocol/sdk` version
- FloMCP detects the version from `package.json`, diffs against the latest SDK API, and generates a migration patch
- One-click: "Upgrade my server to SDK v1.x"

#### D. Tool Composer / Enhancer
- User has a working server with 2 tools — wants to add 3 more without starting over
- Show the existing server's tools
- Add new tools through the normal wizard flow
- Generate a diff/patch to apply to the existing file (not a full rewrite)

#### E. Natural Language Debugger
- User pastes the error message they got from Claude Desktop or VS Code
- FloMCP interprets the MCP protocol error and gives a specific fix
- "Server failed to connect" → check for stdout logging, wrong transport type
- "Tool not found" → check tool name casing, schema format
- "Input validation error" → show which parameter failed and why

---

### 1.3 MCP Assistant — Technical Architecture

```
/dashboard/assistant              ← new page
  /audit                          ← security audit tab
  /debug                          ← error debugger
  /upgrade                        ← version migration
  /composer                       ← add tools to existing server

/api/assistant/
  audit.ts                        ← runs security validator on pasted code
  debug.ts                        ← interprets MCP errors
  upgrade.ts                      ← SDK migration patches
  compose.ts                      ← tool addition / patch generation
```

**Claude prompt strategy for the Assistant:**
- Different system prompt from the Generator — focused on analysis and patching, not creation
- Input: existing code + problem description
- Output: annotated diff format (`--- original` / `+++ fixed`) for easy review

---

### 1.4 MCP Assistant — Page UI Design

```
┌─────────────────────────────────────────────────────────┐
│  MCP Assistant                                           │
│  Fix, audit, and improve your existing MCP servers       │
│                                                          │
│  [Security Audit] [Debug Error] [Add Tools] [Upgrade]   │
│                                                          │
│  ┌─ Paste your MCP server code ──────────────────────┐  │
│  │  (code editor with syntax highlighting)           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  [Run Security Audit →]                                  │
│                                                          │
│  Results:                                                │
│  ● Security Score: 62/100                               │
│  🔴 Hardcoded API key found on line 14                  │
│  🟠 No input validation on 'url' parameter              │
│  🟢 Error messages properly sanitised                   │
│                                                          │
│  [Auto-fix all issues] [Download fixed server]          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Pricing Strategy

### 2.1 Current Pricing Assessment

| Plan | Price | Main Limit | Problem |
|------|-------|------------|---------|
| Free | $0 | 2 generations/month | **Too low** — developers can't evaluate the product with 2 uses |
| Pro | $29/mo | Unlimited | **Price anchoring wrong** — $29 vs $0 is a big jump with no middle ground |

**Recommendation: Increase free tier, add a Starter plan, reframe Pro.**

---

### 2.2 Proposed Pricing Tiers

#### Free — $0/month
*For individuals exploring MCP development*

- **5 generations/month** (up from 2 — enough to actually evaluate the product)
- Security score on every server
- Download ready-to-deploy code
- MCP Library access (no login required)
- Community Discord access

**Why 5?** Research from PLG (product-led growth) companies shows 3–5 free actions is the minimum to feel the value before hitting a wall. 2 is not enough to evaluate. 5 is enough to generate, break, and fix.

---

#### Starter — $9/month (NEW TIER)
*For solo developers building regularly*

- **20 generations/month**
- MCP Assistant — security audit (5 audits/month)
- Priority generation queue
- Email support

**Why this tier?** $9 is the "impulse buy" price point. Solo developers trying FloMCP will convert here before deciding if $29 is worth it. This reduces churn and gives a migration path.

---

#### Pro — $29/month
*For developers shipping frequently*

- **Unlimited generations**
- Full MCP Assistant (unlimited audits, debug, upgrade, compose)
- Advanced security audit report (PDF export)
- Custom prompt templates (saved per user)
- Python MCP generation
- OpenAPI auto-import
- Multi-file generation
- **Team workspaces (up to 3 members)** — shared server library
- Priority support — 24h response
- Early access to new features

---

#### Team — $79/month (NEW — replaces per-user pricing)
*For engineering teams*

- Everything in Pro
- **Up to 10 team members**
- Shared server library with comments/versions
- Team-level usage analytics
- Admin dashboard (manage members, billing)
- SSO ready
- Dedicated Slack channel support

---

#### Enterprise — Custom
- Custom MCP server built to spec
- Private codebase delivery
- Security review + documentation
- SLA + dedicated support
- On-premise option

---

### 2.3 Key Pricing Decisions

**Is $29 right for Pro?** — Yes, if the MCP Assistant is included. Without the Assistant, $29 for "unlimited generations" is hard to justify for many developers. With the Assistant (security audits, debugging, upgrade tool), $29/month is clearly valuable — it replaces hours of manual debugging.

**Is 2 free generations enough?** — No. Increase to 5 immediately. This is a low-cost, high-conversion change.

**Team workspaces positioning:** Don't put team workspaces in the base Pro tier — put them in a separate Team tier at $79. This anchors Pro at $29 and gives teams a clear upgrade path.

---

## 3. Pro Plan — Early Access Interest Form

Instead of a disabled "Coming Soon" button, capture intent and build the waitlist.

### 3.1 What the Button Should Do

When a user clicks **"Upgrade to Pro (Coming Soon)"** on the pricing section:

1. Open a modal with a short form:

```
┌─────────────────────────────────────────────────────────┐
│  Get early access to FloMCP Pro                          │
│                                                          │
│  Pro users get unlimited generation, the MCP Assistant,  │
│  Python support, and priority support. Early access      │
│  users get 30 days free + dedicated onboarding.         │
│                                                          │
│  Your email                                              │
│  [user@example.com            ]                         │
│                                                          │
│  What kind of MCP servers are you building?             │
│  [                               ] (free text, 1 line)  │
│                                                          │
│  How many MCP servers do you expect to build per month? │
│  ○ 1–3   ○ 4–10   ○ 10+   ○ Not sure yet               │
│                                                          │
│  What would unlock Pro for you?                         │
│  ☐ Python support                                       │
│  ☐ Unlimited generations                                │
│  ☐ MCP security audit                                   │
│  ☐ Team collaboration                                   │
│  ☐ API auto-import                                      │
│                                                          │
│  [Join Early Access List →]                             │
└─────────────────────────────────────────────────────────┘
```

2. On submit: store in Supabase `pro_interest` table (email, use_case, volume, features_wanted, submitted_at)
3. Show confirmation: "You're on the list! We'll email you when Pro launches — early access users get 30 days free."
4. Email them via Resend with a confirmation + "you're #N in line"

### 3.2 What This Gives You

- Validated demand signal before building Pro features
- Priority list for beta outreach
- Feature priority signal (which checkboxes get ticked most → build those first)
- Social proof: "Join 247 developers on the early access list"

### 3.3 Technical Implementation

```
/api/pro-interest/route.ts        ← POST endpoint
supabase table: pro_interest      ← email, use_case, volume, features[], created_at
app/page.tsx                      ← ProInterestModal component
```

---

## 4. MCP Library — Rating / Upvote System

### 4.1 Spec

- **Scope:** Library page only (`/library`) — official servers + FloMCP-generated examples
- **Who can vote:** Any visitor (no login required) — store in `localStorage` + count in DB
- **What counts:** One upvote per server per browser session (localStorage key = `voted_${serverId}`)
- **If user is logged in:** Store vote linked to `user_id` in DB (prevents duplicate across devices)
- **Display:** Show upvote count + heart/thumbs-up button on each server card
- **Sorting:** Add "Sort by: Most Popular / Newest / Category" filter to library page

### 4.2 Technical Implementation

```
Supabase table: library_votes
  id          uuid
  server_id   text          ← matches the server slug (e.g. "github-mcp")
  user_id     uuid | null   ← null for anonymous votes
  browser_id  text          ← localStorage fingerprint for anon dedup
  created_at  timestamptz

API: POST /api/library/vote { server_id, browser_id }
     GET  /api/library/votes → { [server_id]: count }
```

### 4.3 Why This Matters

- Community signal shows which MCP servers are actually useful
- Generates organic engagement — developers share "I upvoted GitHub MCP, check it out"
- Data feeds future curation decisions: build more of what's popular
- Differentiates FloMCP library from a static list into a living community resource

---

## 5. Future Product Roadmap — MCP + Agent Vision

### 5.1 Near Term (3–6 months)

| Feature | Value | Notes |
|---------|-------|-------|
| MCP Assistant (audit + debug) | High — retention | Core expansion of current product |
| Python generation | High — new market | Data/ML engineers, huge untapped segment |
| OpenAPI auto-import | High — acquisition | "Connect your REST API in 5 min" is a killer demo |
| Team workspaces | High — revenue | Moves from $29 solo to $79 team |
| Pro early access form | Medium — signal | Build the waitlist now |
| Library upvotes | Low — engagement | Quick win, community building |

---

### 5.2 Medium Term (6–12 months) — Agent Infrastructure

**MCP Marketplace**  
- FloMCP becomes the place to discover, publish, and install MCP servers
- Developers publish their generated servers with one click
- Users browse by category, install to their Claude/Copilot config with one command
- Business model: featured listings, verified publisher badges

**MCP Composition Engine**  
- Most powerful future feature: combine multiple MCP servers into one
- "I want GitHub + Slack + Postgres in one server" → FloMCP merges them, handles conflicts, generates the combined server
- No-code MCP pipeline builder (like Zapier but for AI tool access)

**Hosted MCP Servers (Server-Side Transport)**  
- Instead of local stdio, FloMCP hosts the server on its infrastructure
- User gets a URL: `mcp.flomcp.com/servers/{user}/{server-id}`
- Works without Node.js/Python installed locally — pure cloud
- Authentication handled by FloMCP (OAuth, API key rotation, etc.)
- This is the **biggest monetisation opportunity** — charge per-execution or flat monthly

**MCP Analytics Dashboard**  
- For hosted servers: show which tools are called most, latency, error rate
- "Your Postgres MCP tool was called 1,247 times this week. Error rate: 0.3%."
- Developers pay for observability — it's the Datadog of MCP

---

### 5.3 Long Term (12–24 months) — Agent Platform Vision

**Agent Workflow Builder**  
- MCP servers are individual tools — agents chain them together
- FloMCP builds the workflow layer: "When GitHub issue is created → query Postgres for context → post summary to Slack"
- Visual drag-and-drop agent workflow builder powered by MCP servers as nodes

**MCP Security Certification**  
- FloMCP becomes the trusted authority for MCP server security
- "FloMCP Certified Secure" badge that developers put on their GitHub repos
- Enterprise companies pay for security audits of their internal MCP servers

**Auto-Generated MCP from Existing Code**  
- Scan a developer's existing codebase / API endpoints
- Auto-detect what would make useful MCP tools (functions that read/write data)
- Generate the MCP wrapper layer automatically
- This is like "auto-instrument your app for AI access"

---

## 6. Summary: What Makes FloMCP Worth Paying For

| Layer | Today | With Roadmap |
|-------|-------|-------------|
| **Generation** | TypeScript, single file, from description | + Python, multi-file, from OpenAPI/URL |
| **Security** | Score on every generation | + Auto-fix, audit existing servers, certification |
| **Lifecycle** | Download and done | + Upgrade, compose, debug, retry |
| **Collaboration** | Solo only | + Team workspaces, shared library, comments |
| **Infrastructure** | Local stdio only | + Hosted servers, analytics, execution |
| **Ecosystem** | Internal tool | + Marketplace, discovery, publishing |

The journey is: **Generator → Assistant → Platform → Marketplace**

Each stage compounds on the last. Start with the Generator (done). Build the Assistant next. That's the unlock for the $29 Pro plan.
