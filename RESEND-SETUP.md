# 📧 Resend Email Setup - 5 Minutes

## ✅ What This Does:
Get instant email notifications when someone:
- Signs up for product launch 🎉
- Requests custom MCP development 🚨

---

## 🚀 Step-by-Step Setup

### Step 1: Create Resend Account (2 min)

1. Go to: **https://resend.com**
2. Click **"Start Building"** or **"Sign Up"**
3. Sign up with GitHub (easiest)
4. ✅ **Free tier: 3,000 emails/month, 100/day**

### Step 2: Get API Key (1 min)

1. After signing up, you'll land on the dashboard
2. Click **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Name it: `flomcp-notifications`
5. Click **"Add"**
6. **Copy the API key** (starts with `re_...`)
7. ⚠️ **Save it now! You won't see it again!**

### Step 3: Add to Your Project (1 min)

1. Open: `s:\Engineering\2026\one\flomcp\.env.local`
2. Replace these lines:

```env
RESEND_API_KEY=re_YourActualKeyHere
NOTIFICATION_EMAIL=your@email.com
```

**Replace with:**
- `RESEND_API_KEY`: The key you just copied (starts with `re_`)
- `NOTIFICATION_EMAIL`: **YOUR email address** (where you want notifications)

Example:
```env
RESEND_API_KEY=re_123abc456def789ghi
NOTIFICATION_EMAIL=yourname@gmail.com
```

### Step 4: Restart Dev Server (30 sec)

Stop the server (Ctrl+C) and restart:
```bash
npm run dev
```

### Step 5: Test It! (1 min)

1. Go to: http://localhost:3001
2. Fill out the form
3. Click submit
4. ✅ **Check your email inbox!**

You should receive a beautiful HTML email with:
- The submission details
- Urgency level (for freelance requests)
- Timestamp
- Link to Supabase dashboard

---

## 📧 Email Templates

### Product Interest Email:
- Subject: "🎉 New FloCMP Product Interest"
- Shows: Email, problem description, timestamp
- Green success badge

### Custom Development Email:
- Subject: "🚨 Custom MCP Development Request [URGENCY]"
- Shows: Email, project description, urgency level
- Color-coded urgency badges
- Action reminder based on urgency

---

## 🎯 Verification Checklist

- [ ] Created Resend account
- [ ] Got API key (starts with `re_`)
- [ ] Added API key to `.env.local`
- [ ] Added your email to `NOTIFICATION_EMAIL`
- [ ] Restarted dev server
- [ ] Tested form submission
- [ ] Received email notification ✅

---

## 🆘 Troubleshooting

**Not receiving emails?**

1. **Check spam folder** (sometimes first email goes there)
2. **Verify API key** is correct in `.env.local`
3. **Check email address** has no typos in `NOTIFICATION_EMAIL`
4. **Look at terminal logs** for any email errors
5. **Check Resend dashboard** → "Logs" to see if email was sent

**Error: "Invalid API key"**
→ Make sure you copied the full key (starts with `re_`)

**Emails going to spam?**
→ Mark as "Not Spam" - future emails will go to inbox

---

## 🚀 Production Deployment

When you deploy to Vercel:

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add both:
   - `RESEND_API_KEY`: Your Resend API key
   - `NOTIFICATION_EMAIL`: Your email address
3. Redeploy

**Note:** In production, you can:
- Use your custom domain for sending emails (requires DNS setup)
- Currently uses: `onboarding@resend.dev` (free tier default)
- Upgrade to use: `noreply@flomcp.com` (paid plan, $20/mo)

---

## 💰 Pricing

**Free Tier (Perfect for MVP):**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ All features included
- ⚠️ Sends from `onboarding@resend.dev`

**Pro Plan ($20/month):**
- 50,000 emails/month
- Custom domain sending
- Priority support

**For now:** Free tier is perfect! ✅

---

## 📧 What Your Email Address Is For

Your email (`NOTIFICATION_EMAIL`) receives:
- All form submissions instantly
- Product interest notifications
- Custom development requests with urgency levels

**Privacy:** Your email is only stored in `.env.local` and Vercel (not in database or client-side)

---

**Done!** You'll now get instant email notifications! 📬
