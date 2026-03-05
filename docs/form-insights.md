# FloMCP — Form Insights
**Updated:** March 5, 2026
**Purpose:** Complete inventory of all forms — fields, DB writes, and live email routing.

---

## Email Infrastructure

- **From address (all outgoing):** `FloMCP <no-reply@flomcp.com>` — env var `NOREPLY_EMAIL`
- **Founder inbox:** `founder@flomcp.com` — env var `FOUNDER_EMAIL`
- **Support inbox:** `support@flomcp.com` — env var `SUPPORT_EMAIL`
- **Provider:** Resend (`RESEND_API_KEY`)
- **Supabase built-ins** (verification, password reset) send from Supabase's own domain — not affected

---

## Forms

---

### 1. Sign Up
- **Location:** `/auth` → `components/auth/SignUp.tsx`
- **Fields:** Email, Password, Display name, ToS checkbox, Responsibility checkbox
- **DB:** `auth.users` (Supabase Auth) + `user_credits` row via signup trigger
- **API route:** `POST /api/auth/signup`
- **Emails sent:**
  - Supabase → user: email verification link (Supabase built-in)
  - `[NEW USER] New signup: {email}` → `support@flomcp.com` ✅ labels `Flomcp Support/NEW USER`

---

### 2. Sign In
- **Location:** `/auth` → `components/auth/SignIn.tsx`
- **Fields:** Email, Password
- **DB:** Session only — no row written
- **API route:** `POST /api/auth/signin`
- **Emails sent:** None

---

### 3. Forgot Password
- **Location:** `/auth` → `SignIn.tsx` (inline toggle)
- **Fields:** Email
- **DB:** None
- **API route:** `POST /api/auth/reset-password`
- **Emails sent:** Supabase → user: password reset link (Supabase built-in)

---

### 5. Landing — Freelance / Custom Dev
- **Location:** `app/page.tsx` (dialog, visible to logged-out users)
- **Fields:** Email, project description, urgency
- **DB:** `submissions` table — `interest_type = 'freelance'`
- **API route:** `POST /api/submit`
- **Emails sent:**
  - `[ENTERPRISE INTEREST] Custom MCP Development Request` → `founder@flomcp.com` ✅ labels `Flomcp founder/ENTERPRISE INTEREST`

---

### 6. Pro Interest / Early Access
- **Location:** `components/pro/ProInterestForm.tsx`
- **Fields:** Email, use case, volume, feature checkboxes
- **DB:** `submissions` table — `interest_type = 'pro_interest'`
- **API route:** `POST /api/submit`
- **Emails sent:**
  - `[PRO INTEREST] Early Access Signup` → `founder@flomcp.com` ✅ labels `Flomcp founder/PRO INTEREST`

---

### 7. Enterprise Contact
- **Location:** `components/pro/EnterpriseContactForm.tsx`
- **Fields:** Email, project description, timeline
- **DB:** `submissions` table — `interest_type = 'enterprise'`
- **API route:** `POST /api/submit`
- **Emails sent:**
  - `[ENTERPRISE INTEREST] Enterprise Enquiry` → `founder@flomcp.com` ✅ labels `Flomcp founder/ENTERPRISE INTEREST`

---

### 8. Support Ticket
- **Location:** `app/dashboard/support/page.tsx`
- **Fields:** Subject, Category, Priority, Description, Attachments (up to 3 files)
- **DB:** `support_tickets` table + files → Supabase Storage bucket `support-attachments`
- **API route:** `POST /api/support`
- **Emails sent:**
  - When category = `bug` → `[BUG TICKET] {subject}` → `support@flomcp.com` ✅ labels `Flomcp Support/BUG`
  - All other categories → `[SUPPORT] {subject}` → `support@flomcp.com` ✅ labels `Flomcp Support/SUPPORT`
  - User confirmation → `Support Ticket Received — #{shortId}` → submitting user's email

---

### 9. Server Feedback
- **Location:** `app/dashboard/servers/[id]/page.tsx`
- **Fields:** Rating (👍 / 👎), Comment
- **DB:** `mcp_servers.user_feedback` JSON column (not a separate table)
- **API route:** `POST /api/feedback`
- **Emails sent:**
  - `[FEEDBACK] Server feedback: 👍/👎 — {serverId}` → `support@flomcp.com` ✅ labels `Flomcp Support/FEEDBACK`

---

### 10. Profile — Display Name
- **Location:** `app/dashboard/settings/page.tsx`
- **Fields:** Display name
- **DB:** `auth.users` via `POST /api/auth/update-profile`
- **Emails sent:** None

---

### 11. Profile — Change Password
- **Location:** `app/dashboard/settings/page.tsx`
- **Fields:** New password
- **DB:** Supabase Auth via `POST /api/auth/update-password`
- **Emails sent:** None

---

### 12. Profile — Role / Use Case
- **Location:** `app/dashboard/settings/page.tsx`
- **Fields:** Role selector
- **DB:** `profiles` table via `handleSaveRole`
- **Emails sent:** None

---

### 13. Delete Account
- **Location:** `app/dashboard/settings/page.tsx` (AlertDialog, type-to-confirm)
- **Fields:** Type email to confirm
- **DB:** Deletes `user_usage`, `mcp_servers`, then `auth.users` (hard delete)
- **API route:** `POST /api/auth/delete-account`
- **Emails sent:**
  - `[CHURN USER] Account deleted: {email}` → `support@flomcp.com` ✅ labels `Flomcp Support/CHURN USER`

---

## System-Triggered Email (not a form)

### Generation Error
- **Trigger:** Catch block in `POST /api/generate` when Claude generation fails
- **Emails sent:**
  - `[GEN ERROR] Generation failed: {serverName}` → `founder@flomcp.com`
  - Add Gmail filter `subject:(GEN ERROR)` to label this in your founder inbox

---

## Gmail Filters Required

- `from:(no-reply@flomcp.com) subject:(ENTERPRISE INTEREST)` → `Flomcp founder/ENTERPRISE INTEREST`
- `from:(no-reply@flomcp.com) subject:(PRO INTEREST)` → `Flomcp founder/PRO INTEREST`
- `from:(no-reply@flomcp.com) subject:(GEN ERROR)` → `Flomcp founder/GEN ERROR` ← add this
- `from:(no-reply@flomcp.com) subject:BUG` → `Flomcp Support/BUG`
- `from:(no-reply@flomcp.com) subject:SUPPORT` → `Flomcp Support/SUPPORT`
- `from:(no-reply@flomcp.com) subject:FEEDBACK` → `Flomcp Support/FEEDBACK`
- `from:(no-reply@flomcp.com) subject:(NEW USER)` → `Flomcp Support/NEW USER`
- `from:(no-reply@flomcp.com) subject:(CHURN USER)` → `Flomcp Support/CHURN USER`
