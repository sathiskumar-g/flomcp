# FloMCP Pricing & Credits System — Master Implementation Plan
**Date:** March 1, 2026  
**Status:** Phases 1 & 2 complete — Phase 3 (LemonSqueezy payments) next  
**Purpose:** Single source of truth for pricing model, credit system, enterprise plan, and payment integration

---

## ✅ Implementation Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| UI — Credit logic engine | `lib/credits.ts` | ✅ Done |
| UI — Live complexity badge (Step 3) | `Step3ToolConfig.tsx` | ✅ Done |
| UI — Credit cost card (Step 5 Review) | `Step5Review.tsx` | ✅ Done |
| UI — Live balance + post-gen balance in Step 5 | `Step5Review.tsx` | ✅ Done |
| UI — Pre-flight balance check, disable Generate | `Step5Review.tsx` | ✅ Done |
| UI — Insufficient credits card + pricing CTA | `Step5Review.tsx` | ✅ Done |
| UI — CreditChip in UserMenu (top-right) | `components/auth/UserMenu.tsx` | ✅ Done |
| UI — CreditChip + display name in Sidebar | `components/dashboard/Sidebar.tsx` | ✅ Done |
| UI — Credits stat card in dashboard | `app/dashboard/page.tsx` | ✅ Done |
| UI — Settings subscription section | `app/dashboard/settings/page.tsx` | ✅ Done |
| UI — Pricing page (3-plan + packs + FAQ) | `app/pricing/page.tsx` | ✅ Done |
| UI — Landing page pricing section | `app/page.tsx` | ✅ Done |
| UI — Credit cost tags on pricing + landing | Pricing page + landing page | ✅ Done |
| UI — Docs getting-started references | `app/docs/getting-started/page.tsx` | ✅ Done |
| UI — Logo → landing page redirect | Sidebar + Pricing header | ✅ Done |
| UI — Free → Pro nudge (1 credit remaining) | Step 5 Review / dashboard | ❌ Not started |
| DB — `user_credits` table | Supabase migration | ✅ Migration 008 written |
| DB — `credit_transactions` table | Supabase migration | ✅ Migration 008 written |
| DB — `process_monthly_reset` SQL function | Supabase | ❌ Not started (Pro only — Phase 3) |
| API — `/api/credits/balance` | Next.js route | ✅ Done |
| API — `/api/credits/estimate` | Next.js route | ❌ Not needed — client uses `lib/credits.ts` directly |
| API — `/api/credits/transactions` | Next.js route | ❌ Not started |
| API — `/api/payments/checkout` | LemonSqueezy checkout | ❌ Not started |
| API — `/api/payments/webhook` | LemonSqueezy webhook handler | ❌ Not started |
| Generate route — credit check (402 on 0 balance) | `/api/generate` | ✅ Done |
| Generate route — credit deduction before stream | `/api/generate` | ✅ Done |
| Generate route — auto-refund on error | `/api/generate` | ✅ Done |
| LemonSqueezy — store + products setup | External | ❌ Not started |
| Credit pack purchase UI | Dashboard settings | ❌ Not started |
| Pro upgrade flow (checkout → confirmation) | End-to-end | ❌ Not started |

> **Note:** Migration `008_user_credits.sql` must be run in the Supabase SQL editor  
> before testing. It creates the tables, SQL functions, signup trigger, and backfills  
> existing users with 5 credits each.  
> The `CreditChip` now reads from `/api/credits/balance` (not `user_usage`).  
> The generate route deducts credits before streaming and refunds on failure.  
> Step 5 Review now fetches live balance on mount, disables the Generate button when  
> balance < cost (pre-flight check), and shows a dedicated "No Credits" card with  
> a link to `/pricing` when a 402 is returned — replacing the old generic red error text.

---

## ⏳ Pending Items — What's Left To Build

### Must-do before launch (free plan testing is unblocked, but these are needed for Pro)

| # | Item | Phase | File / Location |
|---|------|-------|-----------------|
| 1 | Run migration 008 in Supabase SQL editor | 1 | `supabase/migrations/008_user_credits.sql` |
| 2 | Free → Pro nudge when balance === 1 (last credit) | 2 | `Step5Review.tsx` |
| 3 | `/api/credits/transactions` GET route | 3 | `app/api/credits/transactions/route.ts` |
| 4 | Transaction history UI in dashboard settings | 3 | `app/dashboard/settings/page.tsx` |
| 5 | LemonSqueezy account setup (5 products, webhook URL) | 3 | External — app.lemonsqueezy.com |
| 6 | Install `@lemonsqueezy/lemonsqueezy-js` + add env vars | 3 | `package.json`, `.env.local` |
| 7 | `/api/payments/checkout` — create LS checkout session | 3 | `app/api/payments/checkout/route.ts` |
| 8 | `/api/payments/webhook` — handle all 6 LS events | 3 | `app/api/payments/webhook/route.ts` |
| 9 | Credit pack purchase UI (Pro subscribers only) | 3 | `app/dashboard/settings/page.tsx` |
| 10 | `process_monthly_reset` SQL function | 3 | Supabase migration or cron |
| 11 | Pro upgrade button → LS checkout flow | 4 | Settings + pricing CTA |
| 12 | Post-payment confirmation page + credits added | 4 | `app/payment/success/page.tsx` |
| 13 | Monthly reset via `subscription_renewed` webhook | 4 | `/api/payments/webhook` |
| 14 | Cancel flow UI + grace period handling | 4 | Settings + webhook |
| 15 | Upgrade confirmation email via Resend | 4 | Webhook handler |

### Not needed (resolved)
- `/api/credits/estimate` — removed; client uses `lib/credits.ts` directly (estimateCredits runs in-browser)

---

## 1. All Decisions — Final

| # | Question | Decision |
|---|----------|----------|
| 1 | Complexity tiers at launch? | 2 tiers only: 1 credit (default) or 2 credits (complex — see rule below) |
| 2 | Credit rollover? | Half of unused monthly credits roll over. Bonus/pack credits never expire. |
| 3 | Free tier credits? | 5 credits, one-time, never expire, never reset. No monthly top-up. |
| 4 | Credit packs who can buy? | Pro subscribers only. Free users must upgrade to buy packs. |
| 5 | Enterprise model? | Project-based — includes Pro plan features + custom MCP build with client team. |
| 6 | Payment provider? | LemonSqueezy — Stripe not viable for India. LS supports India natively. |

---

## 2. Why Credits Over Fixed Tiers

### The Problem With Fixed Tiers
- User needs 60 gens — forced to pay for 100 tier — feels penalised
- Two plans = two decisions = lower conversion
- Scaling cost invisible to user = surprise overages

### Why Credits Work for FloMCP
- Users think before generating — "do I really need this right now?"
- Prevents waste: free users burning all 5 credits on experiments
- Heavy users spend more naturally — revenue scales with usage
- One Pro plan to sell — simpler funnel
- Pack purchases = additional revenue on top of subscription
- Industry standard: Midjourney, Cursor, Vercel, Replicate, ElevenLabs all use credits

### The Psychological Shift
Fixed plan: "I have 50 gens, use them all, who cares."
Credits: "I have 50 credits — is this generation actually worth spending one right now?"

---

## 3. Final Pricing Structure

### Plan Overview

| Plan | Price | Credits | Rollover | Target User |
|------|-------|---------|----------|-------------|
| Free | $0 | 5 credits (one-time, never expire) | N/A | Try FloMCP |
| Pro | $29/mo | 50 credits/mo | Half unused rolls over | Solo devs, freelancers, small teams |
| Enterprise | Custom quote | Included in contract | N/A | Companies needing custom MCP builds |

### Free Tier Credit Rules
- User gets 5 credits once on signup — never expire, never reset
- Once exhausted, must upgrade to Pro — no top-up on Free plan
- Cannot purchase credit packs on Free plan

### Pro Tier Rollover Rule
- Rollover: floor(unused_monthly / 2) carries to next billing period
- Rollover cap: 75 total monthly credits max (prevents unlimited accumulation)
- Example: 20 unused — 10 roll over + 50 new = 60 available
- Example: 0 unused — 0 roll over + 50 new = 50 available
- Purchased pack credits are separate — never expire, not affected by rollover
- On cancellation: monthly credits stop; pack credits remain usable

### Credit Rollover Formula (Pro)
```
rolled      = floor(unused_monthly_credits / 2)
new_monthly = min(50 + rolled, 75)
total       = new_monthly + bonus_credits
```

---

## 4. Credit Packs (Pro Subscribers Only)

| Pack | Credits | Price | Cost/Credit | Best For |
|------|---------|-------|-------------|---------|
| Boost | +10 | $5 | $0.50 | Quick top-up |
| Standard | +25 | $11 | $0.44 | Regular extra work |
| Growth | +50 | $18 | $0.36 | Heavy month |
| Studio | +100 | $30 | $0.30 | Agency / team volume |

**Rules:**
- Pro subscribers only — not available on Free plan
- Purchased credits never expire
- Stack on top of monthly credits freely
- Monthly credits always consumed first, then bonus credits
- Unused pack credits survive plan cancellation

---

## 5. Credit Cost Per Generation — 2-Tier Rule

### Default: 1 Credit
All generations cost 1 credit unless ALL four complexity conditions are met.

### Complex: 2 Credits
Charged 2 credits only when ALL of the following are true simultaneously:
1. 5 or more tools defined in the wizard
2. 1 or more resources added
3. 1 or more prompts added
4. External API usage detected (REST call, external URL, authentication)

If ANY one of these is missing — 1 credit.

### Detection Logic (TypeScript)
```typescript
const API_KEYWORDS = ['fetch','http','https','api','endpoint','url','webhook',
                      'auth','token','oauth','rest','graphql','request','bearer'];

function detectApiUsage(tools: Tool[]): boolean {
  return tools.some(tool => {
    const text = (tool.name + ' ' + tool.description).toLowerCase();
    return API_KEYWORDS.some(kw => text.includes(kw));
  });
}

function estimateCredits(config: {
  tools: Tool[];
  resources: Resource[];
  prompts: Prompt[];
}): 1 | 2 {
  const isComplex =
    config.tools.length >= 5 &&
    config.resources.length >= 1 &&
    config.prompts.length >= 1 &&
    detectApiUsage(config.tools);
  return isComplex ? 2 : 1;
}
```

Runs live in Step 2 (badge updates as user adds tools) and confirmed in Step 4.

---

## 6. Credit Display — Review Page (Pre-Accept Flow)

This is the most important UX change. Deduction happens only after explicit user confirmation.

### Updated Generation Flow
```
Step 1: Name & Description
Step 2: Tool Definition          <- Live complexity badge shown here
Step 3: Resources & Prompts
Step 4: Review & Confirm         <- FINAL credit cost + balance confirmation
Step 5: Generating...
Step 6: Result & Download
```

### Step 2 — Live Complexity Badge
Updates in real-time as user adds tools/resources/prompts:

  Generation cost: 1 credit    (default)
  Generation cost: 2 credits   (when all 4 complex conditions met)
  Complex: 5+ tools, resources, prompts, and API detected

### Step 4 — Credit Confirmation Card (Standard — 1 credit)
```
+--------------------------------------------------+
|  Credit Summary                                  |
|                                                  |
|  Generation type:   Standard                     |
|  Credit cost:       1 credit                     |
|  Your balance:      18 credits                   |
|  After generation:  17 credits                   |
|                                                  |
|  [  Back  ]       [  Use 1 Credit & Generate  ]  |
+--------------------------------------------------+
```

### Step 4 — Credit Confirmation Card (Complex — 2 credits)
```
+--------------------------------------------------+
|  Credit Summary                                  |
|                                                  |
|  Generation type:   Complex (5+ tools, API...)   |
|  Credit cost:       2 credits                    |
|  Your balance:      18 credits                   |
|  After generation:  16 credits                   |
|                                                  |
|  [  Back  ]       [  Use 2 Credits & Generate ]  |
+--------------------------------------------------+
```

### Step 4 — Insufficient Credits
```
+--------------------------------------------------+
|  Not Enough Credits                              |
|                                                  |
|  This generation costs 2 credits.               |
|  Your balance: 1 credit                         |
|                                                  |
|  [ Buy +10 credits — $5 ]  [ Buy +25 — $11 ]    |
|                                                  |
|  Credits top up instantly after payment.        |
+--------------------------------------------------+
```

### Step 4 — Free Tier Warning
```
+--------------------------------------------------+
|  Free Plan                                       |
|                                                  |
|  Credit cost:   1 credit                        |
|  Balance:       2 of 5 lifetime credits left    |
|                                                  |
|  Tip: Pro gives 50 credits/mo + packs — $29/mo  |
|                                                  |
|  [  Back  ]            [  Use 1 Credit  ]        |
+--------------------------------------------------+
```

### Why This UX Is Critical
1. User explicitly consents before spending — zero disputes
2. Live indicator in Step 2 = no surprise at Step 4
3. Insufficient credits card = immediate in-context upsell
4. Transparent balance builds trust

---

## 7. Enterprise Plan

### What Enterprise Is
Enterprise is NOT a self-serve plan. It is a project engagement where the FloMCP team works with the client's team to design, build, integrate, and deliver custom MCP servers.

### What Enterprise Includes

| Feature | Pro | Enterprise |
|---------|-----|-----------|
| All Pro self-serve features | Yes | Yes (included) |
| Monthly credits (self-serve) | 50/mo | Included in contract |
| Credit packs | Available | Bundled |
| Team workspaces | 3 members | Custom (per contract) |
| Custom MCP server built by FloMCP | No | Yes |
| Collaborative build with client team | No | Yes |
| Full integration into client stack | No | Yes |
| Testing, QA, and validation | No | Yes |
| Complete codebase handoff + docs | No | Yes |
| Post-delivery support (30 days) | No | Yes |
| Dedicated Slack or Teams channel | No | Yes |
| SLA — 4h response time | No | Yes |
| NDA available on request | No | Yes |
| Private deployment advisory | No | Yes |

### Enterprise Engagement Model (Project-Based)

No public pricing. All quotes confirmed via direct communication.

| Engagement | Indicative Price | Scope |
|------------|-----------------|-------|
| Single custom MCP server | $500-$1,500 | 1 server, full delivery |
| Multi-server MCP infrastructure | $2,000-$5,000 | 3-5 servers, integrated |
| Full MCP platform build | Custom | Enterprise-wide, team onboarding |

**Pricing page Enterprise card:**
```
Enterprise / Custom Build
---------------------------------------------
Need a custom MCP server built and delivered 
by the FloMCP team?

We work with your team from design through 
integration and delivery.

Email: support@flomcp.com
Subject: Enterprise — [Company Name]

We reply within 24 hours.
```

---

## 8. Full Pricing Page Layout (After Implementation)

```
[ FREE ]            [ PRO — $29/mo ]        [ ENTERPRISE ]
5 credits           50 credits/mo           Custom quote
(one-time)          Half unused rolls over
-----------         ------------------      ---------------
Security score      Everything in Free      Everything in Pro
Download code       Priority queue          Custom MCP build
MCP Library         MCP Assistant           Team collaboration
Community           Credit top-up packs     Integration + delivery
support             Team (3 members)        SLA + support
                    Email support 48h       30-day post-delivery
                    Early access            Dedicated channel

[Start Free]        [Get Early Access]      [Contact Us]

--- Credit Top-Up Packs (Pro subscribers only) ----------
  +10 for $5  .  +25 for $11  .  +50 for $18  .  +100 for $30
  Purchased credits never expire. Monthly credits used first.
---------------------------------------------------------
```

---

## 9. Payment Provider — LemonSqueezy

### Why Not Stripe
- Requires US/UK/EU entity or Stripe Atlas ($500 setup fee)
- Indian founders face restricted payouts + heavy KYC
- Workarounds add complexity without solving the core problem

### Why LemonSqueezy
- Merchant of Record — LS handles all tax (VAT, GST, sales tax) globally
- India-native — full support for Indian founders receiving USD payouts
- No entity required — LS is the legal seller, FloMCP is the vendor
- Supports both subscriptions (Pro) and one-time payments (packs)
- Built-in hosted checkout — no custom payment UI needed
- Webhooks — same integration pattern as Stripe
- Pricing: 5% + $0.50 per transaction

### LemonSqueezy Product Setup

| Product | Type | Price | Internal ID |
|---------|------|-------|-------------|
| Pro Plan | Subscription | $29/mo | ls_pro_monthly |
| Boost Pack | One-time | $5 | ls_pack_boost |
| Standard Pack | One-time | $11 | ls_pack_standard |
| Growth Pack | One-time | $18 | ls_pack_growth |
| Studio Pack | One-time | $30 | ls_pack_studio |

### Payment Flow Architecture
```
User clicks "Buy" in FloMCP dashboard
    -> POST /api/payments/checkout
        -> Create LS checkout with: product_id, custom_data: {user_id, pack}
        -> Return checkout URL
    -> Redirect to LS hosted checkout page

User pays on LemonSqueezy
    -> LS sends webhook to /api/payments/webhook
        -> Verify LS webhook signature
        -> Handle event:
            order_created             -> add bonus credits
            subscription_created      -> plan = 'pro', add 50 monthly credits
            subscription_renewed      -> run rollover + add new monthly credits
            subscription_cancelled    -> mark cancelling, keep access until period end
            subscription_expired      -> downgrade to free, keep bonus credits
            subscription_payment_failed -> warning email, 3-day grace period
```

### LemonSqueezy Setup Checklist
- [ ] Create account at app.lemonsqueezy.com
- [ ] Set payout currency to USD, add GST/tax details
- [ ] Create 5 products with correct prices
- [ ] Enable webhooks pointing to https://flomcp.com/api/payments/webhook
- [ ] Add LEMONSQUEEZY_API_KEY + LEMONSQUEEZY_WEBHOOK_SECRET to Vercel env vars
- [ ] Install @lemonsqueezy/lemonsqueezy-js npm package

---

## 10. Database Schema

### New Tables

**user_credits**
```sql
CREATE TABLE user_credits (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan               text NOT NULL DEFAULT 'free',
  monthly_credits    int NOT NULL DEFAULT 5,
  bonus_credits      int NOT NULL DEFAULT 0,
  billing_day        int,                    -- day of month 1-28
  ls_customer_id     text,
  ls_subscription_id text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

**credit_transactions (audit log)**
```sql
CREATE TABLE credit_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id),
  amount         int NOT NULL,
  credit_type    text NOT NULL,   -- 'monthly' | 'bonus'
  reason         text NOT NULL,   -- 'generation' | 'pack_purchase' | 'monthly_reset' | 'rollover' | 'refund' | 'signup_bonus'
  generation_id  uuid,
  complexity     text,            -- '1' | '2'
  pack_name      text,
  ls_order_id    text,
  created_at     timestamptz DEFAULT now()
);
```

### Supabase Function — Monthly Rollover
```sql
CREATE OR REPLACE FUNCTION process_monthly_reset(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_unused     int;
  v_rollover   int;
  v_new_monthly int;
BEGIN
  SELECT monthly_credits INTO v_unused
    FROM user_credits WHERE user_id = p_user_id;

  v_rollover    := floor(v_unused::numeric / 2);
  v_new_monthly := LEAST(50 + v_rollover, 75);

  UPDATE user_credits
    SET monthly_credits = v_new_monthly, updated_at = now()
    WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, credit_type, reason)
    VALUES (p_user_id, v_new_monthly, 'monthly', 'monthly_reset');
END;
$$ LANGUAGE plpgsql;
```

---

## 11. API Routes Required

| Route | Method | Purpose |
|-------|--------|---------|
| /api/payments/checkout | POST | Create LS checkout session |
| /api/payments/webhook | POST | Handle all LS webhook events |
| /api/credits/balance | GET | Return current credit balance for header badge |
| /api/credits/estimate | POST | Return credit cost for current wizard config |
| /api/credits/transactions | GET | Transaction history for settings page |

### /api/credits/estimate Request/Response
```typescript
// Request body
{ tools: Tool[], resources: Resource[], prompts: Prompt[] }

// Response
{
  cost: 1 | 2,
  isComplex: boolean,
  reasons: string[],
  balance: number,
  balanceAfter: number,
  canAfford: boolean
}
```

---

## 12. Implementation Phases

### Phase 1 — Database + Credit Engine ✅ Done (run migration to activate)
- [x] Create `user_credits` table — `supabase/migrations/008_user_credits.sql`
- [x] Create `credit_transactions` audit table — same migration
- [x] `check_and_deduct_credits()` SQL function — atomic read-modify-write
- [x] `refund_credits()` SQL function — reverses deduction on error
- [x] Signup trigger — auto-creates row with 5 credits for every new user
- [x] Seed backfill — existing users get 5 credits on migration run
- [x] `lib/credits-service.ts` — `getBalance`, `deductCredits`, `refundCredits`, `ensureCreditRow`
- [x] `app/api/credits/balance/route.ts` — GET endpoint, used by CreditChip
- [x] `/api/generate` updated — credit check (402 on 0 balance), deduct before stream, refund on error
- [x] `CreditChip` updated — reads from `/api/credits/balance` instead of `user_usage`
- [x] `lib/constants/rate-limits.ts` — `perMonth: Infinity` (credits system enforces the cap now)
- [ ] **ACTION REQUIRED: Run `supabase/migrations/008_user_credits.sql` in Supabase SQL editor**

### Phase 2 — Generator Wizard UX ✅ Complete (1 minor item pending)
- [x] Add live complexity badge to Step 3 (tool definition step) — `Step3ToolConfig.tsx`
- [x] Add credit cost card to Step 5 (review page) — `Step5Review.tsx`
- [x] Add credit balance badge to dashboard header — `UserMenu.tsx` + `CreditChip.tsx`
- [x] Show live balance + post-generation balance in Step 5 — balance fetched from `/api/credits/balance` on mount
- [x] Block generation (disabled button) when balance < cost — pre-flight check before Generate
- [x] Dedicated "No Credits" card + pricing CTA when 402 returned from generate route
- [ ] Show "Free → Pro" nudge inline when balance === 1 (last credit warning)

### Phase 3 — LemonSqueezy Integration ❌ Not started
- [ ] Set up LS store + 5 products (Pro sub + 4 packs)
- [ ] Install `@lemonsqueezy/lemonsqueezy-js`
- [ ] Build `/api/payments/checkout` route
- [ ] Build `/api/payments/webhook` route with all 6 event handlers
- [ ] Add credit pack purchase UI to dashboard settings
- [ ] Add `/api/credits/transactions` history view in settings

### Phase 4 — Pro Subscription Flow ❌ Not started
- [ ] Pro upgrade button in settings → LS checkout
- [ ] Post-payment redirect with confirmation + credits added
- [ ] Monthly reset via LS `subscription_renewed` webhook
- [ ] Cancel flow UI + grace period handling
- [ ] Upgrade confirmation email

### Phase 5 — Pricing Page + Landing ✅ Done
- [x] Rebuilt `/pricing` page (3-column Free / Pro / Enterprise)
- [x] Credit pack section with generation cost tags
- [x] Landing page pricing section updated
- [x] Docs getting-started updated (signup step, FAQ, CTA footer)

---

## 13. Edge Cases & Rules

| Scenario | Behaviour |
|----------|-----------|
| Generation fails (API error / timeout) | Auto-refund full credit cost |
| User cancels on Step 4 | Zero credits deducted |
| Re-download existing server | 0 credits — always free |
| Free user tries to buy pack | Blocked: "Upgrade to Pro" prompt |
| Pro cancelled — bonus credits | Bonus credits stay, monthly credits stop |
| 1 credit balance, 2-credit generation | Blocked — top-up CTA shown |
| Monthly rollover | floor(unused/2) — capped at 75 monthly max |
| Monthly + bonus order of use | Monthly consumed first, then bonus |
| LS webhook duplicate event | Idempotency check on ls_order_id before adding credits |
| Payment fails | 3-day grace period, then downgrade, bonus credits kept |
| Enterprise user credit top-up | Manual admin action via Supabase dashboard |

---

## 14. Messaging & Copy

### Free Plan
"5 credits to get started — no card required. Each credit builds a production-ready MCP server."

### Free -> Pro nudge (1 credit remaining)
"You have 1 free credit left. Pro gives you 50 credits/month + packs for $29/mo."

### Pro Plan
"50 credits every month. Unused credits roll over. Need more? Top up in seconds."

### Credit pack CTA
"Running low? Top up instantly. Purchased credits never expire."

### 2-credit generation warning
"This is a complex server (5+ tools, resources, prompts, and an API). It costs 2 credits."

### Enterprise
"Need a custom MCP server built for your team? We handle design, development, integration, and delivery — you get the full source code and documentation."

---

## 15. Cost and Margin Model

| Scenario | Revenue | Claude Cost | LS Fee (5%+$0.50) | Net Margin |
|----------|---------|------------|-------------------|-----------|
| Pro user — 25 gens/mo | $29 | $3.25 | $1.95 | $23.80 (82%) |
| Pro user — 50 gens/mo | $29 | $6.50 | $1.95 | $20.55 (71%) |
| Pro + $18 Growth pack | $47 | $6.50 | $2.85 | $37.65 (80%) |
| Pro heavy — 75 gens/mo | $29 | $9.75 | $1.95 | $17.30 (60%) |
| Pro + 100 pack, 100 gens | $59 | $13.00 | $3.45 | $42.55 (72%) |

Key insight: With rollover cap at 75 monthly, worst-case Claude cost per Pro user is $9.75 — well within $29. Heavy users who need more buy packs, adding revenue at 72%+ margins.
