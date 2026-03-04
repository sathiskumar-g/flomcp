# FloMCP — Master Launch Checklist & Roadmap

> **Target:** 100 users within 30 days of launch  
> **Status:** ~85% launch-ready as of this document

---

## 🔴 MUST DO BEFORE LAUNCH (P0 — Blockers)

### 1. Run Missing SQL Migrations in Supabase Dashboard

These files exist in the repo but must be executed in Supabase SQL Editor:

```bash
supabase/migrations/006_support_tickets.sql   # Support system
supabase/migrations/007_notifications.sql     # Notification system
```

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Open each file and paste the contents
3. Run each script
4. Verify no errors in the output

> ⚠️ Without these migrations, the Support and Notifications features will return 500 errors.

---

### 2. Configure Environment Variables in Production

Verify all env vars are set in Vercel (or your host):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
ADMIN_EMAIL=your@email.com
NEXT_PUBLIC_APP_URL=https://flomcp.com
```

**Check:** Visit `/api/health` (if exists) or monitor deploy logs for missing env var errors.

---

### 3. Fix Email Sender Domain (Resend)

**Current state:** `from: 'FloMCP <onboarding@resend.dev>'` in `lib/email.ts`  
**Problem:** `@resend.dev` sender domain causes emails to land in spam and damages professional credibility.

**Fix:**
1. Go to [resend.com](https://resend.com) → Domains → Add Domain
2. Add `flomcp.com` (or your domain)
3. Add the DNS records Resend provides (MX + DKIM + SPF)
4. Wait for verification (usually <10 mins)
5. Update `lib/email.ts`:
   ```ts
   from: 'FloMCP <noreply@flomcp.com>'
   ```

---

### 4. Verify Auth Flow End-to-End

| Step | Test |
|------|------|
| Sign Up | New email → confirm email → redirected to dashboard |
| Sign In | Existing credentials → dashboard |
| Sign Out | Clear session, redirect to `/` |
| Password Reset | Email received, can set new password |
| Auth Guard | Visiting `/dashboard/*` without session → redirect to `/auth/signin` |

---

## 🟡 SHOULD DO BEFORE LAUNCH (P1 — Important)

### 5. Test Generation Flow

Full happy path:
1. Navigate to Dashboard → Generate
2. Complete 5-step wizard with a simple description (e.g., "A weather API MCP server")
3. Watch SSE stream complete successfully
4. Security score appears (should be 70–100 for standard output)
5. Download ZIP
6. Unzip → `npm install` → `npm run build` → no errors

**Known edge cases to test:**
- Very long description (>500 chars) — should not crash
- Empty tool list — should show validation error
- Claude API timeout — should show user-friendly error, not crash

---

### 6. Test Support System

1. Open Dashboard → Support
2. Submit a ticket → check admin receives email at `ADMIN_EMAIL`
3. Check ticket appears in the support list
4. Click ticket → detail dialog opens

---

### 7. Test Notification System

1. Trigger an action that creates a notification (e.g., generate a server)
2. Bell icon in sidebar shows unread badge
3. Click bell → notification drawer opens from right
4. Mark as read → badge disappears
5. Test on mobile viewport (min-width: 400px drawer)

---

### 8. Security Score Spot Check

Generate a basic MCP server and verify:
- Score is between 60–100
- Individual checks are shown in the report
- Score appears on the dashboard stat card

---

## 🟢 NICE TO HAVE (P2 — Post-Launch)

### 9. ProductHunt Launch Assets

**Title:** FloMCP — Generate production-ready MCP servers in 5 minutes

**Tagline:** The fastest way to build secure Model Context Protocol servers

**Description (300 chars):**
> FloMCP generates complete TypeScript MCP servers in 5 minutes — with type-safe schemas, error handling, input validation, and a 22-check security score. Works with Claude Desktop, GitHub Copilot, Cursor, and any MCP-compatible tool. Free to start.

**Tags:** Developer Tools, AI, Open Source, Productivity, Claude

**Checklist:**
- [ ] Screenshots: generator wizard (step 2-3), security score, dashboard server list
- [ ] GIF: 30-second screen recording of generation flow
- [ ] A first comment ready (founder story, why you built it)
- [ ] Schedule for Tuesday/Wednesday 12:01 AM PST (historically best days)
- [ ] Line up 10–15 upvotes from network before 9 AM launch day

---

### 10. Reddit Launch Posts

**Best subreddits:**
- r/MachineLearning (show HN crosspost style — technical depth)
- r/ClaudeAI (MCP is deeply relevant)
- r/GithubCopilot (Copilot MCP angle)
- r/webdev (developer tool angle)
- r/sideprojects (founder story)

**Post title options:**
- "I built a tool that generates production-ready MCP servers in 5 minutes — free"
- "After spending 10+ hours building MCP servers manually, I automated it — FloMCP"
- "Show HN: FloMCP — AI-powered MCP server generator with security scoring"

**Post must-haves:**
- Demo GIF embedded in post
- Mention it's free
- Address "why not just use Claude directly" — FloMCP adds security analysis, structure, and download
- Reply to every comment in first 2 hours

---

### 11. Hacker News (Show HN)

**Title:** `Show HN: FloMCP – Generate MCP servers with security scoring (free)`

**Required:** Working demo, no paywall on first use, respond to all comments promptly.

---

## 🏗️ TECHNICAL ROADMAP

### Phase 7 — Generation Engine Improvements

| Feature | Effort | Impact |
|--------|--------|--------|
| Multi-file generation (tools/ directory per spec) | Medium | High |
| Python MCP server generation | High | High |
| Custom prompt templates stored per user | Low | Medium |
| Streaming generation progress bar | Low | Medium |
| Retry / regenerate failed generations | Low | High |
| Export to GitHub Gist | Low | Medium |
| Share server publicly via /server/[id] | Medium | High |

**Python generation:**  
Add a `language` option to the generator (Step 1 or Step 4). Maintain separate Claude system prompts for TypeScript vs Python. Python uses `fastmcp` or `mcp` PyPI package.

---

### Phase 8 — Library & Discovery

| Feature | Effort | Impact |
|--------|--------|--------|
| /library with filterable categories | Done ✅ | High |
| User-submitted MCP servers | Medium | High |
| GitHub import (fork existing MCP, rescan security) | High | Medium |
| MCP server rating / upvotes | Medium | Medium |

---

### Phase 9 — Team & Pro Features

| Feature | Effort | Impact |
|--------|--------|--------|
| Pro plan billing via Stripe | Medium | High |
| Team workspaces (shared servers) | High | High |
| Custom org security policies | High | Medium |
| API access (programmatic generation) | Medium | Medium |

---

## 🔐 MCP OFFICIAL LISTING & CERTIFICATION

### How to Get Listed on the Official MCP Ecosystem

**1. MCP Server Registry (Highest value)**

Submit a PR to: `github.com/modelcontextprotocol/servers`

This is Anthropic's official server list. Getting FloMCP added here means massive organic discovery.

**Requirements:**
- Server must follow MCP specification (tool schemas, proper JSON-RPC)
- Must have a public GitHub repo
- Must include a `README.md` with setup instructions
- Recommended: passing security checks

**How to PR:**
```bash
git clone https://github.com/modelcontextprotocol/servers
# Add entry in README.md under appropriate category
# Add your server directory under src/ (if contributing directly)
# Or just add to the README community servers list
```

---

**2. modelcontextprotocol.io — Official Site Listing**

Website: [modelcontextprotocol.io](https://modelcontextprotocol.io)  
Maintained by Anthropic.

To be listed: Submit a PR to the site's GitHub repo or contact Anthropic via the MCP Discord.

---

**3. Anthropic Partner Program**

URL: [anthropic.com/partners](https://anthropic.com/partners)

Apply as a build partner. Benefits: co-marketing opportunities, early API access, and official partner badge.

**Criteria:**
- Working product using Claude API
- User base or demonstrated traction
- Security-compliant implementation

---

**4. Claude.ai Integrations**

When Claude.ai launches its integrations marketplace (expected 2025-2026), FloMCP-generated servers should be submittable directly.

Watch: [claude.ai](https://claude.ai) → Integrations for announcements.

---

**5. MCP Community Resources**

| Resource | URL |
|----------|-----|
| Official Discord | discord.gg/anthropic |
| MCP Spec GitHub | github.com/modelcontextprotocol/modelcontextprotocol |
| MCP Servers List | github.com/modelcontextprotocol/servers |
| MCP Docs | modelcontextprotocol.io/docs |

---

## 📊 100-USER ACQUISITION STRATEGY

### Week 1 (Launch)
- ProductHunt launch day
- Reddit posts (r/ClaudeAI, r/sideprojects, r/webdev)
- Personal network DMs — ask for honest feedback
- Post on X/Twitter with demo GIF

### Week 2
- HN Show HN post
- Write a blog post: "Why 8,000+ MCP servers have security vulnerabilities" (SEO + Reddit content)
- Reach out to 10 MCP developers directly on GitHub (people who've built MCP servers)

### Week 3–4
- YouTube demo video (3–5 mins: problem → FloMCP solution → result)
- Answer MCP-related questions on Reddit with helpful responses (light promotion)
- Check analytics: which pages convert best → double down

### Conversion Goal
| Metric | Target |
|--------|--------|
| Landing page visitors | 500 |
| Signups | 100 (20% conversion) |
| Activated users (≥1 generation) | 50 |
| Pro waitlist signups | 20 |

---

## ✅ LAUNCH DAY CHECKLIST

```
Pre-launch (day before):
[ ] SQL migrations run in prod Supabase
[ ] All env vars verified in Vercel
[ ] Email domain verified in Resend
[ ] End-to-end test: sign up → generate → download → security score
[ ] Support system tested (ticket + admin email)
[ ] ProductHunt assets ready (screenshots, GIF, description)

Launch day morning:
[ ] ProductHunt post live at 12:01 AM PST
[ ] Reddit r/ClaudeAI post live
[ ] Tweet with demo GIF
[ ] Monitor error logs (Vercel → Logs)

Launch day afternoon:
[ ] Respond to ALL ProductHunt comments
[ ] Respond to ALL Reddit comments
[ ] Post in relevant Discord servers (MCP, Claude, Copilot)

Post-launch (day 2–7):
[ ] Write follow-up post with metrics ("Day 1: X signups, here's what worked")
[ ] Fix any bugs reported in support tickets
[ ] Email collected users with "Your feedback shaped this feature" message
```

---

## 🔍 KNOWN GAPS (Future Work)

| Gap | Notes |
|-----|-------|
| OpenGraph / meta images | Add og:image to all public pages for better social sharing |
| Server `[id]` detail page | `/dashboard/servers/[id]/page.tsx` exists — verify completeness |
| Email confirmation UX | Verify redirect after email click lands on dashboard, not 404 |
| Rate limit UI feedback | Show user when they hit generation rate limit (currently just 429) |
| Mobile responsive audit | Test all dashboard pages on 375px viewport |
| Stripe webhook | Needed before Pro billing goes live |
| `002`–`005` migrations | Exist in Supabase but not in repo — add them for runnable local dev |

---

*Last updated: January 2026 — generated as part of FloMCP launch preparation*
