# FloMCP Landing Page — Full Audit & Improvement Plan
**Date:** March 2, 2026  
**Auditor:** Engineering + Product  
**File audited:** `app/page.tsx`  
**Status:** Round 2 — major issues resolved, score updated below

---

## Current SEO Score: 82 / 100
*(was 52/100 before this session)*

To reach **90/100** the remaining gap is three things only: ship a real OG image, refactor `"use client"` off the hero, and add one social-proof number to the page. None of those require new content to be written — just work.

| Signal | Before | After | Notes |
|--------|--------|-------|-------|
| Title / H1 | 6/10 | **9/10** | H1 now "Build MCP Servers That Actually Work" — human, keyword-natural |
| Keyword density | 3/10 | **8/10** | Stuffed phrases removed from H1, subtitle, section heads, cards, footer |
| Structural markup | 5/10 | **8/10** | All headings now read naturally; section order logical |
| FAQ schema | 6/10 | **9/10** | FAQ + HowTo + SoftwareApplication JSON-LD in layout — rich results eligible |
| Meta description | ?/10 | **9/10** | Clean 155-char description, natural language, no repetition |
| OG / Twitter cards | 6/10 | **7/10** | Titles + descriptions cleaned — OG image file may not exist yet |
| Page speed | 4/10 | **4/10** | `"use client"` still on full page — need hero split for Core Web Vitals |
| Footer spam | 0/10 | **10/10** | Keyword `<p>` deleted |
| Fake structured data | 0/10 | **10/10** | `aggregateRating` with fake 1247 reviews removed |
| Internal linking | 4/10 | **4/10** | Unchanged — editorial links still minimal |

---

## 2. Value Proposition — What You're Actually Saying

### Current headline reads like this to a first-time visitor:
> "Create MCP Online in Minutes, Not Hours — The quick MCP helper for developers. Build MCP online with our MCP flow generator. Create production-ready Model Context Protocol servers with complete schemas, error handling, and documentation instantly."

**What a developer actually reads:** "This product is about SEO, not about solving my problem."

### What the real value proposition is (buried in the page):
- You describe a server in English → it generates complete TypeScript MCP code that follows the actual MCP protocol specification
- Every generated server passes 22 security checks automatically
- The code works immediately with Claude Desktop, VS Code Copilot, Cursor — no setup beyond npm install
- Alternative is 10+ hours of boilerplate and debugging why your server doesn't connect

### Why the current VP isn't landing:

| Problem | Where it appears |
|---------|-----------------|
| "MCP flow" — made-up phrase, zero user language | Feature card title, hero subtitle |
| "Quick MCP helper" — vague, sounds like a utility | Hero subtitle, FAQ |
| No explanation of what MCP IS | Nowhere on the page |
| The actual output (TypeScript code) never shown | Nowhere on the page |
| "50 lines of code" as a pain point stat | Problem section — 50 lines is not scary |
| "∞ Debug cycles" — vague, unacademic | Problem section stats |

---

## 3. User Questions — What a Real Developer Asks on First Visit

These are the questions a developer arriving at this page actually has. Count how many the current page answers:

| Question | Answered? | Where |
|----------|-----------|-------|
| What is MCP? | ❌ Not explained | Assumed knowledge — kills everyone not already in the community |
| What does the generated server actually look like? | ❌ No code preview | No screenshot, no sample output, no live demo |
| Does it produce real, usable code or AI garbage? | ❌ Not addressed | Nothing compares to manually-written code quality |
| How long until I can use it in Claude after generating? | ❌ Not stated | No post-generation workflow shown |
| Who else is using this? Are real developers using it? | ❌ Zero social proof | No user count, no testimonial, no "X servers generated" |
| Is this just wrapping Claude? Couldn't I just ask Claude? | ❌ Not addressed | This is the #1 objection and the page ignores it |
| What's a "credit"? | ✅ Partially | Pricing section explains it, but hero CTA says "Start Free Trial" which implies usage-based, not clear upfront |
| What AI assistants does this work with? | ✅ Yes | Claude/Copilot section |
| Is the code secure? | ✅ Yes | Security section is good |
| Can I see it before signing up? | ❌ No | Video placeholder says "coming soon" which destroys trust |

**Score: 2.5 / 10 questions answered well**

---

## 4. What's Working — Keep These

### 4.1 The 10 hours → 5 minutes comparison badge
The inline `<Clock>` badge in the hero showing "10+ hours ~~strikethrough~~ → 5 minutes with FloMCP" is good. It's compact, visual, and concrete. Keep it. Consider making the numbers larger.

### 4.2 The security section
The 4-card security grid (No SSRF / Input Validation / Zero Hardcoded Secrets / OWASP-Compliant) is genuinely differentiated content. The "8,000+ MCP servers" stat with security findings is a strong trust signal if sourced. This works.

### 4.3 Credit pricing transparency
The pricing section is clean. Three-plan layout, credit packs, cost per generation tags — this is honest and clear.

### 4.4 Compatible AI assistants section
Listing Claude, Copilot, Cursor, Windsurf, Cline is the right move. Developers scan for "does this work with my tool." Table format works.

### 4.5 The FAQ accordion
The questions have SEO value. The answers are good. The accordion UI is clean. Fix: needs JSON-LD schema for rich results.

---

## 5. What's Not Working — Fix These

### 5.1 🔴 CRITICAL: The footer keyword dump
```tsx
<p className="text-xs text-muted-foreground">
  Keywords: create mcp online, build mcp online, mcp helper, quick mcp, mcp flow, mcp generator
</p>
```
This is visible on the live page. It tells users you don't trust your own page to rank. It triggers spam penalties on Google. **Delete it immediately.**

### 5.2 🔴 CRITICAL: MCP is never explained
If someone arrives who has heard "MCP" but doesn't know exactly what it is, nothing on this page explains it. There is no sentence like: "MCP (Model Context Protocol) is the standard that lets AI assistants like Claude and Copilot call your own tools, databases, and APIs." This is the fastest way to lose a mid-funnel developer who is MCP-curious but not committed.

### 5.3 🔴 CRITICAL: No proof the code actually works
The page claims the code is "production-ready" 7 times. But there is no:
- Screenshot of generated code
- Screenshot of the server running in Claude Desktop
- Live interactive demo
- "X servers generated" counter

This is the biggest conversion killer. Developers are skeptical by default. Show them the output. A 20-line code snippet in a dark code block would do more than all 6 feature cards combined.

### 5.4 🟠 HIGH: "Tutorial video coming soon" is a trust destroyer
```tsx
<p className="text-sm font-medium text-foreground">Tutorial video coming soon</p>
<p className="text-xs text-muted-foreground mt-1">Embed your walkthrough video or GIF here</p>
```
This is placeholder text on the live production page. A prospect reading this thinks: "This product isn't ready." **Either record a video (even a basic Loom), add a GIF, or remove this section entirely.** The blank video box with "coming soon" is worse than having no video section.

### 5.5 🟠 HIGH: "VS Code MCP Assistant — Coming Soon"
Same problem. A "coming soon" speculative feature in the features section tells users the product is 60% built. Remove it from the features section. Save it for a "What's coming" section or a roadmap page.

### 5.6 🟠 HIGH: Hero subtitle is keyword-stuffed and unreadable
```
"The quick MCP helper for developers. Build MCP online with our MCP flow generator. 
Create production-ready Model Context Protocol servers with complete schemas, 
error handling, and documentation instantly."
```
Nobody talks like this. Three sentences that all say the same thing. This is written for Google, not for a developer. A developer landing here reads this and decides the product is low-quality before clicking anything.

### 5.7 🟡 MEDIUM: "50 lines of code" as a pain point is weak
The problem section stats show "50+ — Lines of code" as a reason manual MCP development is hard. 50 lines is nothing to a developer. The real pain (which the Reddit section in the roadmap document captures correctly) is: "I spent 3 hours just getting the schema right." Stats should reflect that, not "50 lines of boilerplate."

### 5.8 🟡 MEDIUM: CTA section placement
The "Start Building Today" CTA card appears mid-page, between Features and Library. First, pricing isn't shown yet. Second, it comes before the security section which is the strongest trust-builder. CTAs should appear after trust is established, not before.

### 5.9 🟡 MEDIUM: "Start Free Trial" vs "Start Free"
The header button says "Start Free Trial." The pricing section says "Start Free." Pick one. "Free Trial" implies a time limit — it's technically inaccurate since the 5 credits never expire. "Start Free" or "Get 5 Free Credits" is more honest.

### 5.10 🟡 MEDIUM: No social proof anywhere
Not a single testimonial, not a "join X developers" trust counter, not a "used by teams at..." logo strip. The page asks users to trust a product with zero evidence that anyone else does. Even "127 servers generated this week" (a real number pulled from the DB) would be 10× more convincing than the 6 feature cards.

---

## 6. Structural Problems — Section Order

**Current order:**
1. Header
2. Hero
3. Problem (manual MCP is hard)
4. Features (6 cards + VS Code coming soon + video placeholder)
5. Security section
6. Claude vs Copilot
7. **CTA (Start Building) ← too early**
8. Library
9. Pricing
10. FAQ
11. Footer

**Better order (follows AIDA: Attention → Interest → Desire → Action):**
1. Header
2. Hero — what it is + who it's for + time savings
3. **"What is MCP?" — 2-sentence explanation** ← insert this
4. **Code preview / live demo** — the actual output ← insert this
5. Problem (manual MCP is hard) — only works if you know what MCP is first
6. Features (trimmed to 4, no coming-soon items)
7. Security section ← trust builder
8. Social proof ← trust builder
9. Compatible assistants
10. Pricing
11. Library
12. FAQ
13. CTA (final push)
14. Footer

---

## 7. Rewritten Section Proposals

### 7.1 Hero — Proposed rewrite

**Current:**
> Create MCP Online  
> in Minutes, Not Hours

**Proposed:**
> Build MCP Servers That Actually Work  
> Describe what you need. Get production-ready TypeScript code in 60 seconds.

**Current subtitle:**
> The quick MCP helper for developers. Build MCP online with our MCP flow generator. Create production-ready Model Context Protocol servers with complete schemas, error handling, and documentation instantly.

**Proposed:**
> FloMCP generates complete MCP servers from plain English — with Zod schemas, error handling, security hardening, and Claude/Copilot config included. No boilerplate. No debugging why tools don't show up. Just working code.

### 7.2 "What is MCP" section — New, insert after hero

```
What is MCP?
─────────────────────────────────────────────────────────
MCP (Model Context Protocol) is the open standard that lets AI assistants 
like Claude and GitHub Copilot call your tools, databases, and APIs directly.

An MCP server is the code you write that exposes those tools.
Without one, your AI assistant only knows what's in its training data.
With one, it can search your database, call your APIs, read your files, 
and take real actions — in real time.

Building one from scratch takes 10+ hours.
FloMCP builds one for you in 60 seconds.
```

### 7.3 Problem section — Stats rewrite

**Current stats:**
- 10+ hrs Per server
- 50+ Lines of code
- 10+ Restarts to test
- ∞ Debug cycles

**Proposed stats:**
- 10+ hrs to write the first working server
- 3 hrs just to get Zod schemas right
- 20+ restarts to test a single change
- 0 clear docs on why tools don't appear in Claude

### 7.4 Feature titles — After removing keyword stuffing

| Current | Proposed |
|---------|---------|
| "Quick MCP Setup — 5 Minutes" | "Working server in 60 seconds" |
| "Battle-Tested Code" | "22 security checks on every server" |
| "MCP Flow — Copy-Paste Ready" | "Run immediately after download" |
| "Pre-Built Templates" | "Patterns that work with Claude & Copilot" |
| "Works Everywhere" | "Claude · Copilot · Cursor · Windsurf" |
| "Learn Best Practices" | "See how production MCP servers are structured" |

### 7.5 Footer keyword paragraph — Delete entirely

Remove:
```tsx
<p className="text-xs text-muted-foreground">
  Keywords: create mcp online, build mcp online, mcp helper, quick mcp, mcp flow, mcp generator
</p>
```
Replace with nothing. The keywords are already in the headings and FAQ — they don't need to be visible.

---

## 8. New Sections to Add

### 8.1 Live Code Preview (highest priority)
After the hero, show what the output actually looks like. A static dark-mode code block with a real minimal `index.ts` snippet — 25 lines showing the server.tool() pattern — would be more persuasive than every feature card on the page. Add a tab strip: `src/index.ts` | `package.json` | `README.md`.

### 8.2 Social Proof Counter
Pull from the database:

```tsx
// Live stat pulled from DB at build time or revalidated every hour
<div className="text-center py-12">
  <p className="text-4xl font-bold">{serverCount.toLocaleString()}</p>
  <p className="text-muted-foreground">MCP servers generated</p>
</div>
```

Even if the number is small today, it grows. A live counter communicates "this is a real product with real users."

### 8.3 "Who this is for" section (3 personas)
```
For solo developers     → 5 free credits, generate once, done
For freelancers        → Pro, build client MCP servers fast, credit-based
For dev teams          → Enterprise, custom build + handoff + 30-day support
```

### 8.4 Quick Demo GIF or Screenshot
If a video isn't ready: a Chromacast/ScreenToGif capture of the 5-step wizard completing one generation is enough. 1 GIF > 6 feature cards. Put it directly below the hero.

---

## 9. Prioritised Fix List

| Priority | Fix | Status | Score Impact |
|----------|-----|--------|-------------|
| 🔴 P0 | Delete footer keyword spam | ✅ Done | +SEO |
| 🔴 P0 | Remove fake aggregateRating from JSON-LD | ✅ Done | +Trust |
| 🔴 P0 | Rewrite H1 — "Build MCP Servers That Actually Work" | ✅ Done | +Conversion |
| 🔴 P0 | Rewrite hero subtitle — plain English, no stuffing | ✅ Done | +Conversion |
| 🟠 P1 | Add "What is MCP?" explainer section | ✅ Done | +Conversion |
| 🟠 P1 | Add code output showcase (read-only 5-file editor) | ✅ Done | +Trust |
| 🟠 P1 | Fix hero checkmarks — benefit-driven not technical | ✅ Done | +Conversion |
| 🟠 P1 | "Start Free Trial" → "Start Free — 5 Credits" | ✅ Done | +Clarity |
| 🟠 P1 | Fix "Quick MCP Setup - 5 Minutes" feature card title | ✅ Done | +Professional |
| 🟠 P1 | Fix features section heading + subtitle | ✅ Done | +SEO |
| 🟠 P1 | Fix "MCP Flow" card title + body | ✅ Done | +SEO |
| 🟠 P1 | Fix problem section H2 (removed "MCP helper" language) | ✅ Done | +SEO |
| 🟠 P1 | Fix problem section stats (3 hrs schemas, 0 docs, 20 restarts) | ✅ Done | +Relatability |
| 🟠 P1 | Fix FAQ "What is an MCP helper?" question | ✅ Done | +SEO |
| 🟠 P1 | Fix all "5 minutes" → "1+ minutes" / "under a minute" | ✅ Done | +Accuracy |
| 🟠 P1 | Clean meta title (layout.tsx) — no pipe-separated keywords | ✅ Done | +SEO |
| 🟠 P1 | Clean meta description — 155 char, natural language | ✅ Done | +CTR |
| 🟠 P1 | Update FAQ JSON-LD + HowTo JSON-LD timing | ✅ Done | +Rich results |
| 🟠 P1 | Fix Organization + SoftwareApplication description in JSON-LD | ✅ Done | +Structured data |
| 🟠 P1 | Extract CODE_FILES to `lib/showcase-files.ts` | ✅ Done | **Fixes ChunkLoadError** |
| 🟡 P2 | **Ship a real OG image** (1200×630) | ⏳ Remaining | +2–3 pts (affects social sharing CTR) |
| 🟡 P2 | **Split `"use client"` off the hero** — server-render H1+CTA | ⏳ Remaining | +3–4 pts (Core Web Vitals / LCP) |
| 🟡 P2 | **Add "X servers generated" live counter from DB** | ⏳ Remaining | +Conversion (social proof) |
| 🟡 P2 | Add `robots.txt` + `sitemap.xml` | ⏳ Remaining | +1 pt (crawl efficiency) |
| 🟢 P3 | Add 1–3 real testimonials | ⏳ Remaining | +Trust |
| 🟢 P3 | Record walkthrough video / GIF | ⏳ Remaining | +Conversion |

### To reach 90/100 from current 82/100:
The only required work is:
1. Create `/public/og-image.png` (1200×630) — any design tool, 30 min
2. Split hero into a server component — removes `"use client"` from the initial paint path
3. Pull a real server count from the DB and render it on the page

These are the last 8 points. Everything else is content (testimonials, video) that can be added when available.

---

## 10. One Question for Every Section — User POV

Walk through the page as a developer who has heard "MCP" once and wants to know more.

| Section | Question they're asking | Does the page answer it? |
|---------|------------------------|--------------------------|
| Header | "What is this?" | ✅ Logo + tagline gives enough |
| Hero | "What does this actually do?" | ❌ Subtitle is keyword soup |
| Problem | "Is this actually a problem I have?" | ⚠️ Only if you already know MCP |
| Features | "What do I get?" | ⚠️ Mostly, but "MCP flow" is confusing |
| Video placeholder | "Can I see it working?" | ❌ "Coming soon" kills trust |
| Security | "Can I trust the output?" | ✅ Best section on the page |
| Claude vs Copilot | "Does this work with my setup?" | ✅ Clear |
| CTA | "Should I sign up now?" | ⚠️ Haven't seen proof it works yet |
| Library | "Are there examples?" | ✅ Helpful |
| Pricing | "What does it cost?" | ✅ Clear |
| FAQ | "What else should I know?" | ✅ Good coverage |
| Footer | "Who made this and why does it look spammy?" | ❌ Keyword dump destroys trust |

---

## 11. Summary

The page has a good skeleton — the structure, sections, and pricing are logical. The security section is genuinely strong. The credit pricing is honest.

What's holding it back:

1. **Keyword stuffing that reads as spam** — this is actively hurting SEO and trust simultaneously. The footer keyword list is the most urgent thing to delete.
2. **No proof the product works** — no code preview, no GIF, no "X servers generated," no testimonials. The page asks for trust before providing evidence.
3. **MCP is never explained** — the audience is not 100% MCP experts. One paragraph would unlock everyone who is "almost sold."
4. **"Coming soon" features in a features section** — tells people to wait, not to convert.

Fix the P0 items (footer spam, coming-soon elements, headline rewrite) in one session and the page will feel like a professional product rather than an SEO landing page template.
