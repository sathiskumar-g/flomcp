# 🚀 FloMCP Deployment Guide - Step by Step

## ✅ What We Just Built
- ✅ Supabase database integration
- ✅ Form submission API (`/api/submit`)  
- ✅ Custom development modal with urgency levels
- ✅ Error handling and validation
- ✅ Ready for deployment!

---

## 📋 Phase 1: Supabase Setup (10 minutes)

### Step 1: Create Supabase Account
1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub (fastest) or email
4. ✅ **Free tier - no credit card needed!**

### Step 2: Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Organization:** Create new (your name)
   - **Project name:** `flomcp` (or anything you like)
   - **Database Password:** Generate strong password (SAVE THIS!)
   - **Region:** Choose closest to you (e.g., `us-east-1`)
   - **Pricing Plan:** FREE (selected by default)
3. Click **"Create new project"**
4. ⏱️ Wait 2-3 minutes while it sets up

### Step 3: Create Database Table
1. In your Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open file: `s:\Engineering\2026\one\flomcp\supabase-schema.sql`
4. Copy ALL the SQL code from that file
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ You should see: **"Success. No rows returned"**

### Step 4: Get API Keys
1. Click **"Settings"** (gear icon, bottom left)
2. Click **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL** (like: `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJh...`)
4. **Keep this page open!** You'll need these in Step 5

### Step 5: Add Keys to Your Project
1. Open file: `s:\Engineering\2026\one\flomcp\.env.local.example`
2. Copy that file and rename it to: `.env.local` (remove `.example`)
3. Edit `.env.local` and replace:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...your-long-key-here
   ```
4. **Save the file!**

### Step 6: Test Locally
1. Stop the dev server (Ctrl+C in terminal)
2. Restart: `npm run dev`
3. Open: http://localhost:3000
4. Fill out the form and submit
5. Go to Supabase Dashboard → **Table Editor** → **submissions**
6. ✅ **You should see your submission!**

---

## 📋 Phase 2: Vercel Deployment (10 minutes)

### Step 1: Create Vercel Account
1. Go to: **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (easiest)
4. Authorize Vercel to access your GitHub
5. ✅ **Free tier - no credit card needed!**

### Step 2: Push to GitHub (If not already)
1. Create a new GitHub repo: **https://github.com/new**
   - Name: `flomcp`
   - Private or Public (your choice)
   - Don't initialize (you already have code)
2. In your terminal:
   ```bash
   cd s:\Engineering\2026\one\flomcp
   git init
   git add .
   git commit -m "Initial commit - FloMCP MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/flomcp.git
   git push -u origin main
   ```

### Step 3: Import Project to Vercel
1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your `flomcp` repository
3. Click **"Import"**
4. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)

### Step 4: Add Environment Variables
1. Before clicking "Deploy", scroll down to **"Environment Variables"**
2. Add TWO variables:
   
   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project.supabase.co` (from Supabase)
   
   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJh...your-long-key` (from Supabase)

3. Click **"Deploy"**
4. ⏱️ Wait 2-3 minutes for build

### Step 5: Test Deployment
1. Once deployed, click **"Visit"**
2. Test the form submission
3. Check Supabase dashboard - should see new submission!
4. ✅ **Your site is live!**

---

## 📋 Phase 3: Custom Domain (5 minutes)

### Step 1: Add Domain to Vercel
1. In Vercel project dashboard, click **"Settings"** tab
2. Click **"Domains"** in left sidebar
3. Enter your domain: `flomcp.com`
4. Click **"Add"**

### Step 2: Configure DNS
Vercel will show you DNS records to add. Go to your domain registrar (where you bought flomcp.com):

**Add these DNS records:**

**For using apex domain (flomcp.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`
- TTL: `Auto` or `3600`

**For www subdomain (www.flomcp.com):**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: `Auto` or `3600`

### Step 3: Wait for SSL
1. DNS propagation takes 5-60 minutes (usually ~10 min)
2. Vercel automatically provisions SSL certificate (Let's Encrypt)
3. Once ready, you'll see ✅ next to domain
4. ✅ **Your site is live at flomcp.com with SSL!**

---

## 🎯 Success Checklist

After completing all steps, you should have:

### Local Development
- ✅ `.env.local` file with Supabase keys
- ✅ Dev server running at localhost:3000
- ✅ Form submissions saving to Supabase
- ✅ Modal working for custom development requests

### Production
- ✅ Site deployed on Vercel
- ✅ Accessible at `your-project.vercel.app`
- ✅ Custom domain `flomcp.com` connected
- ✅ SSL certificate active (HTTPS)
- ✅ Form submissions working in production
- ✅ Data persisting in Supabase

### Supabase Dashboard
- ✅ Can view submissions at: `Supabase → Table Editor → submissions`
- ✅ See all form data: email, problem, interest, urgency, etc.
- ✅ Export to CSV anytime

---

## 📊 How to View Submissions

### Option 1: Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard
2. Select your `flomcp` project
3. Click **"Table Editor"** (left sidebar)
4. Click **"submissions"** table
5. See all submissions in a spreadsheet view!

### Option 2: SQL Queries
Click **"SQL Editor"** and run:
```sql
-- View all submissions
SELECT * FROM submissions ORDER BY created_at DESC;

-- View only product interest
SELECT * FROM submissions WHERE interest_type = 'product';

-- View urgency breakdown
SELECT urgency, COUNT(*) as count 
FROM submissions 
WHERE interest_type = 'freelance'
GROUP BY urgency;

-- Export as CSV
SELECT * FROM submissions;  -- Then click "Download as CSV"
```

---

## 🔧 Troubleshooting

### Issue: Form not submitting locally
**Solution:**
- Check `.env.local` exists (not `.env.local.example`)
- Restart dev server after adding env variables
- Check browser console for errors

### Issue: "Failed to save submission"
**Solution:**
- Check Supabase keys are correct
- Verify SQL schema was run successfully
- Check Supabase project is not paused (free tier pauses after 7 days inactivity)

### Issue: Domain not working
**Solution:**
- Wait 10-30 minutes for DNS propagation
- Check DNS records are correct: `nslookup flomcp.com`
- Make sure domain isn't parked or has other DNS records conflicting

### Issue: SSL certificate not provisioning
**Solution:**
- Wait up to 24 hours (usually completes in minutes)
- Ensure DNS is fully propagated
- Remove and re-add domain in Vercel if stuck

---

## 🎉 You're Done!

Your FloMCP MVP is now:
- ✅ Live at **flomcp.com**
- ✅ Secure with SSL (HTTPS)
- ✅ Collecting submissions in database
- ✅ Professional and production-ready!

---

## 🚀 Next Steps (Optional)

1. **Add Email Notifications** (Week 2)
   - Sign up for Resend (free)
   - Get emailed when someone submits
   - Guide: `resend-setup.md` (coming soon)

2. **Build Admin Dashboard** (Week 3)
   - View submissions in custom UI
   - Export CSV with filters
   - Analytics and charts

3. **Share on Social Media**
   - Post on Reddit: r/ClaudeAI, r/programming
   - Share on Twitter/X with #MCP
   - Get early adopters!

---

## 📞 Need Help?

If you get stuck:
1. Check the error messages in browser console
2. Check Vercel deployment logs
3. Check Supabase logs (Logs → API)
4. Review this guide step by step

---

**Good luck with your launch! 🚀**
