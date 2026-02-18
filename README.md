# FloCMP - MCP Server Generator

**Stop Writing Boilerplate MCP Servers**

Generate production-ready Model Context Protocol servers in 60 seconds.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm start
```

## 📦 Deploy to Vercel (2 minutes)

### Option 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (run from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? flomcp
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import from Git (or upload project folder)
4. Framework Preset: **Next.js** (auto-detected)
5. Root Directory: `./`
6. Click **Deploy**

### Configure Custom Domain

1. In Vercel Dashboard → Project Settings → Domains
2. Add your domain: `flomcp.com`
3. Follow DNS configuration instructions from your domain registrar

**DNS Records to add:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Wait 5-10 minutes for DNS propagation.

## 📊 Analytics

Vercel Analytics is pre-configured. View stats at:
- Vercel Dashboard → Your Project → Analytics

Tracks:
- Page views
- Unique visitors
- Form submissions (via console logs for now)

## 🗄️ Add Database (Later)

When ready to save form submissions:

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Create table:

```sql
CREATE TABLE validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  problem TEXT NOT NULL,
  interest TEXT NOT NULL, -- 'product' or 'freelance'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Add environment variables in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Analytics:** Vercel Analytics
- **Hosting:** Vercel
- **Font:** Inter (Google Fonts)
- **Icons:** Lucide React

## 📂 Project Structure

```
flomcp/
├── app/
│   ├── layout.tsx          # Root layout with SEO
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles + dark theme
├── components/
│   └── ui/                 # shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── lib/
│   └── utils.ts            # Utility functions
├── public/                 # Static files
└── README.md
```

## 🔧 Development

### Add New shadcn Component

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add dialog
```

### Environment Variables (Optional)

Create `.env.local`:

```env
# Analytics (auto-configured by Vercel)
# VERCEL_ANALYTICS_ID=auto

# Supabase (add later)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 🎯 Current Features

✅ Dark theme developer UI  
✅ SEO optimized  
✅ Mobile responsive  
✅ Form validation  
✅ Analytics tracking  
✅ Dual CTA (Product + Freelance)  

## 🚧 Coming Soon

- [ ] Supabase integration for form data
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] MCP generation tool
- [ ] Pre-built example servers

## 📝 Notes

- Form submissions currently log to browser console
- Add Supabase to persist data in production
- Domain configured: flomcp.com
- Analytics auto-enabled on Vercel

## 🤝 Support

For issues or questions, check:
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Vercel Documentation](https://vercel.com/docs)

---

**Built with ❤️ for developers who value their time**
