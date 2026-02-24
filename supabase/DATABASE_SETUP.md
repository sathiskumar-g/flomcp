# Database Setup Instructions
## Task 1.2: Database Schema with Cost Tracking

**Created:** February 23, 2026  
**Status:** Ready to deploy  
**Free Tier Limit:** 2 generations per month

---

## 🎯 What This Migration Creates

### 1. **mcp_servers** table (1.2.1)
Stores all generated MCP servers with:
- Complete code files (index.ts, package.json, README.md, etc.)
- Security validation scores
- **Cost tracking**: tokens used, USD cost, cache hits, generation time
- User feedback for quality improvement

### 2. **user_usage** table (1.2.2)
Tracks user generation limits with:
- Monthly limit: **2 generations for free tier**
- Hourly limit: 1 generation per hour
- Daily limit: 1 generation per day
- **1 hour cooldown** between generations
- ToS acceptance tracking

### 3. **suspicious_activity** table (1.2.3)
Logs potential abuse:
- Malware/hacking keywords detected
- Rate limit violations
- Disposable email usage
- Policy violations

### 4. **Row Level Security** (1.2.4)
Database-level security:
- Users can only see their own MCPs
- Users can only see their own usage data
- Admins can see everything for moderation
- Prevents data leaks at database level

---

## 🚀 How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor**
   - Visit: https://supabase.com/dashboard/project/uwmjditvovqtyrbtwixw/sql/new
   
2. **Copy the migration file**
   - Open: `supabase/migrations/001_initial_schema.sql`
   - Copy ALL the SQL code (Ctrl+A, Ctrl+C)

3. **Paste and run**
   - Paste into SQL Editor
   - Click **"Run"** button (bottom right)
   - Wait ~5-10 seconds for completion

4. **Verify success**
   - Check for green checkmark
   - You should see success messages in output
   - Go to **Table Editor** → You should see 3 new tables

5. **Test RLS policies**
   ```sql
   -- This should return empty (you're not logged in via dashboard)
   SELECT * FROM mcp_servers;
   
   -- This should work (admin query)
   SELECT COUNT(*) FROM mcp_servers;
   ```

### Option 2: Supabase CLI (Advanced)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref uwmjditvovqtyrbtwixw

# Run migration
supabase db push

# Verify
supabase db diff
```

---

## ✅ Verification Checklist

After running the migration, verify:

- [ ] **Tables exist**
  - Go to: Table Editor → See `mcp_servers`, `user_usage`, `suspicious_activity`

- [ ] **Indexes created**
  - Click on each table → See indexes listed

- [ ] **RLS enabled**
  - Click on table → "Authentication" section → See "Row Level Security: Enabled"

- [ ] **Triggers work**
  - Insert test record → Check `updated_at` auto-updates

- [ ] **Policies active**
  - Try to query as non-admin → Should be restricted

---

## 📊 Rate Limit Economics

### Free Tier (implemented in migration)

| Metric | Value | Cost Impact |
|--------|-------|-------------|
| Generations per month | **2** | $0.20/user/month |
| Cooldown between generations | **1 hour** | Prevents spam |
| Daily limit | **1** | Can't burn monthly limit in one day |
| Hourly limit | **1** | Prevents rapid abuse |

**With 100 free users:**
- Total cost: $20/month
- Manageable for bootstrapped startup ✅

**With 1000 free users:**
- Total cost: $200/month
- Still reasonable, can monetize with Pro tier ✅

### Pro Tier (for future)

| Metric | Value | Revenue |
|--------|-------|---------|
| Price | $29/month | Break-even at ~290 generations |
| Generations | Unlimited | Typical user: 50-100/month |
| Cooldown | 1 minute | Good UX, prevents abuse |

**Profit margin:**
- Average user: 75 generations/month = $7.50 cost
- Revenue: $29/month
- **Profit: $21.50/user** ✅

---

## 🔒 What Row Level Security Protects

### Without RLS (DANGEROUS):
```typescript
// ANY user could do this:
const allMCPs = await supabase
  .from('mcp_servers')
  .select('*');

// Result: See EVERYONE's generated code, API keys, secrets 😱
```

### With RLS (SECURE):
```typescript
// Same code, but RLS enforces user_id filter:
const allMCPs = await supabase
  .from('mcp_servers')
  .select('*');

// Result: Only see YOUR OWN MCPs ✅
// Supabase automatically adds: WHERE user_id = current_user_id
```

---

## 🎯 Next Steps After Migration

1. **Test auth flow**
   - Sign up → Verify email → Accept ToS
   - Check `user_usage` table has your record

2. **Create first MCP**
   - Generate MCP (will implement in Task 2.1)
   - Check `mcp_servers` table has record
   - Verify cost tracking fields populated

3. **Test rate limiting**
   - Generate first MCP → Success
   - Try to generate second immediately → **BLOCKED** (1 hour cooldown)
   - Wait 1 hour → Try again → Success
   - Try third MCP same day → **BLOCKED** (daily limit)

4. **Monitor costs**
   - Check `mcp_servers.cost_usd` column
   - Calculate daily/weekly totals
   - Verify cache hits reduce costs

---

## 💡 Pro Tips

### Cost Monitoring Query
```sql
-- Daily cost report
SELECT 
  DATE(created_at) as date,
  COUNT(*) as generations,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_gen,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN cached THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate
FROM mcp_servers
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### User Activity Report
```sql
-- See who's generating the most
SELECT 
  u.email,
  uu.tier,
  uu.generation_count_month,
  COUNT(m.id) as total_mcps,
  SUM(m.cost_usd) as total_cost
FROM user_usage uu
LEFT JOIN auth.users u ON u.id = uu.user_id
LEFT JOIN mcp_servers m ON m.user_id = uu.user_id
GROUP BY u.email, uu.tier, uu.generation_count_month
ORDER BY total_cost DESC
LIMIT 20;
```

### Suspicious Activity Report
```sql
-- Unreviewed suspicious activities
SELECT 
  u.email,
  sa.activity_type,
  sa.severity,
  sa.details,
  sa.created_at
FROM suspicious_activity sa
LEFT JOIN auth.users u ON u.id = sa.user_id
WHERE sa.reviewed = false
ORDER BY 
  CASE sa.severity 
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  sa.created_at DESC;
```

---

## 🐛 Troubleshooting

### Error: "permission denied for table mcp_servers"
**Solution:** RLS is working! You're trying to query without auth. Use service role key or query via authenticated user.

### Error: "relation 'mcp_servers' already exists"
**Solution:** Migration already ran. Check Table Editor to verify tables exist.

### Error: "function gen_random_uuid() does not exist"
**Solution:** Enable `uuid-ossp` extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tables created but no data showing
**Solution:** Normal! Tables are empty until:
1. User signs up → Creates `user_usage` record
2. User generates MCP → Creates `mcp_servers` record

---

## 📚 Related Files

- **Migration SQL:** `supabase/migrations/001_initial_schema.sql`
- **TypeScript constants:** `lib/constants/rate-limits.ts`
- **Next implementation:** Task 2.1 (Generator UI) will use these tables

---

## ✅ Task 1.2 Completion Checklist

- [x] 1.2.1: MCP servers table created with cost tracking
- [x] 1.2.2: User usage table created with rate limiting (2/month)
- [x] 1.2.3: Suspicious activity table created
- [x] 1.2.4: Row Level Security policies configured
- [ ] **Run migration in Supabase** (your action needed!)
- [ ] **Verify tables exist** (check Table Editor)
- [ ] **Test RLS policies** (try querying without auth)

**Once you run the migration, Task 1.2 is 100% complete! 🎉**
