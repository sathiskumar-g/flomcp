# FloMCP — Form Insights
**Date:** March 4, 2026
**Purpose:** Complete inventory of all forms in the app — what each collects, where it saves, and what emails it triggers.

---

## All Forms

| # | Form | Location | Fields | Saves to DB | Sends Email |
|---|------|----------|--------|-------------|-------------|
| 1 | **Sign Up** | `/auth` → `components/auth/SignUp.tsx` | Email, Password, Display name, ToS checkbox, Responsibility checkbox | ✅ `auth.users` (Supabase Auth) + `user_credits` row via signup trigger | ✅ Supabase sends confirmation email to user |
| 2 | **Sign In** | `/auth` → `components/auth/SignIn.tsx` | Email, Password | ❌ Session only | ❌ |
| 3 | **Forgot Password** | `/auth` → `SignIn.tsx` (inline toggle) | Email only | ❌ | ✅ Supabase sends password reset link to user |
| 4 | ~~**Landing — Product Interest**~~ | `app/page.tsx` | ~~Email, what to build~~ | ~~`submissions` table~~ | ~~Admin notif~~ | **REMOVED** — hero CTA now routes directly to `/auth/signup`. `handleSubmit` and related state (`email`, `problem`, `interest`) deleted. |
| 5 | **Landing — Freelance / Custom Dev** | `app/page.tsx` (dialog — visible to logged-out users) | Email, project description, urgency | ✅ `submissions` table — `interest_type = 'freelance'` | ✅ Admin notification → `NOTIFICATION_EMAIL` |
| 6 | **Pro Interest / Early Access** | `components/pro/ProInterestForm.tsx` | Email, use case, volume, feature checkboxes | ✅ `submissions` table — `interest_type = 'pro_interest'` | ❌ No email sent (silent — needs fix) |
| 7 | **Enterprise Contact** | `components/pro/EnterpriseContactForm.tsx` | Email, project description, timeline | ✅ `submissions` table — `interest_type = 'enterprise'` | ✅ Admin notification → `NOTIFICATION_EMAIL` |
| 8 | **Support Ticket** | `app/dashboard/support/page.tsx` | Subject, Category, Priority, Description, Attachments (up to 3 files) | ✅ `support_tickets` table + files → Supabase Storage bucket `support-attachments` | ✅ **Two emails**: admin notification + user confirmation (both via Resend) |
| 9 | **Server Feedback** | `app/dashboard/servers/[id]/page.tsx` | Rating (👍 / 👎), Comment | ✅ Written to `mcp_servers.user_feedback` (JSON column, not a separate table) | ❌ Intentional — fire-and-forget |
| 10 | **Profile — Display Name** | `app/dashboard/settings/page.tsx` | Display name | ✅ `auth.users` via `POST /api/auth/update-profile` | ❌ |
| 11 | **Profile — Change Password** | `app/dashboard/settings/page.tsx` | New password | ✅ Supabase Auth via `POST /api/auth/update-password` | ❌ |
| 12 | **Profile — Role / Use Case** | `app/dashboard/settings/page.tsx` | Role selector | ✅ `profiles` table via `handleSaveRole` | ❌ |
| 13 | **Delete Account** | `app/dashboard/settings/page.tsx` (confirm dialog) | Type-to-confirm text | ✅ Deletes `auth.users` row + cascade via `POST /api/auth/delete-account` | ❌ |

---

## Email Recipients

| Email Trigger | Who Receives It | Sent Via |
|---------------|-----------------|----------|
| Product interest submitted | `NOTIFICATION_EMAIL` env var | Resend |
| Freelance request submitted | `NOTIFICATION_EMAIL` env var | Resend |
| Enterprise contact submitted | `NOTIFICATION_EMAIL` env var | Resend |
| Support ticket created — admin copy | `NOTIFICATION_EMAIL` env var | Resend |
| Support ticket created — user confirmation | Submitting user's own email | Resend |
| Forgot password | User's email | Supabase (built-in) |
| Sign up email confirmation | User's email | Supabase (built-in) |

> **Current `NOTIFICATION_EMAIL`:** `whytc4#@gmail.com`
> Set this in `.env.local` (local dev) and Vercel → Settings → Environment Variables (production).

```env
NOTIFICATION_EMAIL=whytc4#@gmail.com
```

---

## API Routes Backing the Forms

| Route | Method | Used By |
|-------|--------|---------|
| `POST /api/submit` | POST | Forms 5, 6, 7 (freelance, pro interest, enterprise) — **Form 4 (product) removed** |
| `POST /api/support` | POST | Form 8 (support ticket) |
| `GET  /api/support` | GET | Support page — ticket history list |
| `POST /api/feedback` | POST | Form 9 (server feedback) |
| `POST /api/auth/signup` | POST | Form 1 |
| `POST /api/auth/signin` | POST | Form 2 |
| `POST /api/auth/reset-password` | POST | Form 3 (forgot password) |
| `POST /api/auth/update-profile` | POST | Form 10 |
| `POST /api/auth/update-password` | POST | Form 11 |
| `POST /api/auth/delete-account` | POST | Form 13 |

---

## Gaps to Fix

| # | Gap | Priority |
|---|-----|----------|
| 1 | **Pro Interest (Form 6)** sends no email — admin never notified of early access signups | High |
| 2 | **Server Feedback (Form 9)** saved to JSON column on server row — no dedicated table, no easy aggregate queries | Medium |
| 3 | **Support attachments** uploaded to public Supabase storage — no expiry or access control | Medium |
| 4 | **`NOTIFICATION_EMAIL` not set** blocks all admin notifications in production | High — action required |
