# FloMCP — Free Launch Readiness Report
**Date:** March 4, 2026
**Verdict: Almost ready — 5 hard blockers remain, all fixable in 1 day.**

---

## Overall Status

| Area | Status | Notes |
|------|--------|-------|
| Core generator (wizard → code → download) | ✅ Ready | Full 5-step wizard, SSE stream, ZIP download |
| Security scoring (22 checks) | ✅ Ready | Runs on every generation |
| Auth (signup / signin / reset) | ✅ Ready | Supabase Auth + email confirmation |
| Dashboard (servers, stats, settings) | ✅ Ready | All pages built |
| Credits system (free tier: 5 credits) | ✅ Code ready | DB migration 008 not yet run |
| Support tickets | ✅ Code ready | DB migration 006 not yet run |
| Notifications | ✅ Code ready | DB migration 007 not yet run |
| Landing page | ✅ Ready | SEO 82/100, can improve post-launch |
| Pricing page | ✅ Ready | Free + Pro + Enterprise layout |
| Email notifications | ✅ Ready | Sends from `no-reply@flomcp.com` via `NOREPLY_EMAIL` env var |
| Demo video | ❌ Missing | Video placeholder shows "coming soon" — damages trust |
| OG image | ❌ Missing | Social sharing has no preview image |
| LemonSqueezy payments | ❌ Not built | Not needed for free launch |
| Python generation | ❌ Not built | Not needed for free launch |
| MCP Assistant | ❌ Not built | Not needed for free launch |

---

## 🔴 Hard Blockers — Launch Cannot Happen Without These

### 1. Run 3 SQL Migrations in Supabase
**Time: 10 minutes**

Go to Supabase Dashboard → SQL Editor and run these 3 files in order:

```
supabase/migrations/006_support_tickets.sql   → enables Support page
supabase/migrations/007_notifications.sql     → enables notification bell
supabase/migrations/008_user_credits.sql      → enables credits system (free tier)
```

Without 006 and 007: Support and Notifications return 500 errors.
Without 008: Free users don't get their 5 credits on signup.

---

### 2. Set All Environment Variables in Vercel
**Time: 10 minutes**

Go to Vercel → Project → Settings → Environment Variables and confirm all of these are set:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NOREPLY_EMAIL=no-reply@flomcp.com
FOUNDER_EMAIL=founder@flomcp.com
SUPPORT_EMAIL=support@flomcp.com
NEXT_PUBLIC_APP_URL=https://flomcp.com
```

`FOUNDER_EMAIL` receives sales/business notifications. `SUPPORT_EMAIL` receives support, signups, churn, and feedback. `NOREPLY_EMAIL` is the from address on all outgoing emails.

---

### 3. Fix Email Sender Domain in Resend
**Time: 15 minutes**

**Current state:** `from: 'FloMCP <onboarding@resend.dev>'`
**Problem:** `@resend.dev` lands in spam. Looks unprofessional.

**Fix:**
1. Go to resend.com → Domains → Add Domain → add `flomcp.com`
2. Add the DNS records Resend provides
3. Wait for verification (~10 mins)
4. Update `lib/email.ts`: change `onboarding@resend.dev` → `noreply@flomcp.com`

---

### 4. End-to-End Test the Core Flow
**Time: 30 minutes**

Run this manually before launch:

| # | Step | Expected |
|---|------|----------|
| 1 | Sign up with new email | Confirmation email arrives |
| 2 | Click confirm link | Lands on dashboard (not 404) |
| 3 | Open Generator | 5-step wizard loads |
| 4 | Generate a simple server ("weather API MCP server") | SSE stream completes, security score appears |
| 5 | Download ZIP | Unzip → `npm install` → `npx tsx src/index.ts` runs without error |
| 6 | Submit a support ticket | Admin email arrives at `whytc4#@gmail.com` |
| 7 | Check notification bell | Badge shows, drawer opens |
| 8 | Check credits | Dashboard shows 5 credits on new free account |

---

### 5. Pro Interest Form — Add Admin Email Notification
**Time: 30 minutes (code change)**

Current state: `ProInterestForm.tsx` posts to `/api/submit` with `interest_type = 'pro_interest'` but `/api/submit` only sends email for `'product'` and `'freelance'` types. Pro interest signups are saved to DB silently — you never get notified.

**Fix in `app/api/submit/route.ts`:** add `pro_interest` and `enterprise` to the email branch in the route so admin gets notified for all 4 interest types.

---

## 🟡 Important — Fix Within First Week Post-Launch

### 6. Demo Video
The video section currently shows "coming soon" with a dashed border. First-time visitors see this and trust drops sharply — it signals the product is unfinished.

**Two options:**
- Option A: Record a 90-second Loom walkthrough (wizard → generate → download), embed it. Takes 30 mins.
- Option B: Replace the placeholder with a static screenshot of the generated output + security score. Better than "coming soon."

---

### 7. OG Image (Social Sharing)
No `/public/og-image.png` exists. Every link share (Twitter, LinkedIn, WhatsApp) shows a blank preview.

**Fix:** Create a 1200×630 PNG in Figma or Canva. Text: "FloMCP — Build MCP Servers in 5 minutes". Dark background, logo, one-liner. Takes 20 mins.

---

### 8. Add Social Proof Number
Landing page has zero social proof. One number changes this:

Add `{serverTotal} MCP servers generated` (already fetched from `/api/stats` in `page.tsx`) as a visible badge near the hero CTA. The state variable exists — it just isn't shown prominently enough.

---

## 🟢 Not Needed for Free Launch

These are real product improvements but are post-launch work:

| Item | Why it's post-launch |
|------|---------------------|
| LemonSqueezy payments (Pro billing) | Free tier needs no payments |
| Python MCP server generation | TypeScript covers the launch audience |
| MCP Assistant (audit/fix existing servers) | Sprint 2 — needs infrastructure |
| Multi-pass generation (v2 engine) | Current v1 quality is good enough to launch |
| Multi-file output (tools/ directory) | Single-file works for most servers |
| `"use client"` refactor on page.tsx | Low impact on launch; SEO score already 82/100 |
| Transaction history UI | Pro feature — no billing yet |

---

## Launch Day Sequence

```
Day before:
□ Run 3 SQL migrations in Supabase
□ Verify all env vars in Vercel (NOREPLY_EMAIL, FOUNDER_EMAIL, SUPPORT_EMAIL, RESEND_API_KEY)
□ Fix Resend email domain → noreply@flomcp.com
□ Fix Pro Interest email notification (30min code + deploy)
□ Full end-to-end test (sign up → generate → download)
□ Replace video placeholder with screenshot or real recording

Launch day:
□ ProductHunt post live at 12:01 AM PST
□ Reddit post in r/ClaudeAI ("I built FloMCP — generate MCP servers free")
□ Tweet with screen recording GIF
□ Monitor Vercel logs for 500 errors

First week:
□ Fix any bugs from support tickets
□ Create and upload OG image
□ Add server count social proof badge
□ Reply to every review/comment/DM
```

---

## Two Paths Forward

### Path A — Launch Now (recommended)
Fix the 5 hard blockers above (est. 1 day), then launch with the free plan.
Collect real user feedback. Use that to decide which post-launch improvement to build first.

**Advantage:** Real users > perfect product. The generation engine is already better than anything else available. Launch and learn.

### Path B — Improve Generation First
Spend 1–2 weeks implementing multi-pass generation (v2 engine from `AI-FIRST-CORE-ENGINE.md`).
This raises generated server quality from ~70% to ~92% first-try usable.

**Advantage:** Stronger first impression. Fewer support tickets about broken generated code.
**Disadvantage:** No user validation while you build. The current quality is sufficient for an MCP tool with a 22-check security score.

### Recommendation
**Path A.** Fix the 5 blockers, launch. The generation engine improvement is valuable but it's a post-launch Sprint 1 item. Real users will tell you if generation quality is the actual problem — it may not be.
