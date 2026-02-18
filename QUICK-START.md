# ⚡ Quick Start - Do This NOW

## 🎯 Goal: Get flomcp.com live in 20 minutes!

---

## Step 1: Supabase (10 min)

### 1.1 Create Account
→ Go to: **https://supabase.com** → Sign up with GitHub

### 1.2 Create Project
- Name: `flomcp`
- Region: Closest to you
- Free tier ✅

### 1.3 Run SQL
1. Click **SQL Editor** (left sidebar)
2. Open: `supabase-schema.sql` (in your flomcp folder)
3. Copy all → Paste → **Run**

### 1.4 Get Keys
1. Click **Settings** → **API**
2. Copy:
   - Project URL
   - anon public key

### 1.5 Add to Project
1. Copy `.env.local.example` → `.env.local`
2. Paste your keys
3. Restart dev server: `npm run dev`

✅ **Test:** Submit form → Check Supabase Table Editor

---

## Step 2: Vercel (10 min)

### 2.1 Create Account
→ Go to: **https://vercel.com** → Sign up with GitHub

### 2.2 Push to GitHub (if needed)
```bash
cd s:\Engineering\2026\one\flomcp
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR-USERNAME/flomcp.git
git push -u origin main
```

### 2.3 Deploy
1. Vercel → **Add New** → **Project**
2. Import your `flomcp` repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**

### 2.4 Connect Domain
1. Vercel Settings → **Domains**
2. Add: `flomcp.com`
3. Add DNS records at your registrar:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

✅ **Done!** Wait 10 min for DNS → flomcp.com is live! 🎉

---

## 📁 Files Created

```
flomcp/
├── .env.local.example          ← Copy to .env.local
├── .env.local                  ← Add your Supabase keys HERE
├── supabase-schema.sql         ← Run in Supabase SQL Editor
├── lib/supabase.ts             ← Supabase client
├── app/api/submit/route.ts     ← API endpoint
├── components/ui/dialog.tsx    ← Modal component
└── app/page.tsx                ← Updated with modal & API
```

---

## 🆘 Quick Troubleshooting

**Form not working locally?**
→ Check `.env.local` exists and has correct keys

**Deployment failed?**
→ Check environment variables in Vercel

**Domain not working?**
→ Wait 10-30 min for DNS propagation

---

## 📖 Full Guide
See: `DEPLOYMENT-GUIDE.md` for detailed step-by-step instructions

---

**LET'S LAUNCH! 🚀**
