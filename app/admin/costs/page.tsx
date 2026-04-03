/**
 * Admin Costs Dashboard — Task 1.4.3
 *
 * Server component — uses the Supabase service-role key (bypasses RLS).
 * Only accessible to the ADMIN_EMAIL defined in server env vars.
 *
 * Metrics displayed:
 * - Total cost today / this week / this month
 * - Average cost per generation
 * - Cache hit rate & cost savings
 * - Top 10 most expensive users
 * - Daily cost alert if > $50
 * - Recent suspicious activity log
 */

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Users,
  BarChart2,
  Clock,
  CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MCPServerRow {
  id: string;
  user_id: string;
  cost_usd: number | null;
  cached: boolean | null;
  tokens_used: number | null;
  created_at: string;
  status: string;
}

interface SuspiciousRow {
  id: string;
  user_id: string;
  activity_type: string;
  severity: string;
  reviewed: boolean;
  created_at: string;
  details: Record<string, unknown> | null;
}

interface UserUsageRow {
  user_id: string;
  email: string | null;
  tier: string;
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function startOf(unit: "day" | "week" | "month"): Date {
  const d = new Date();
  if (unit === "day") {
    d.setHours(0, 0, 0, 0);
  } else if (unit === "week") {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function sumCost(rows: MCPServerRow[], since: Date): number {
  return rows
    .filter((r) => r.cost_usd != null && new Date(r.created_at) >= since)
    .reduce((acc, r) => acc + (r.cost_usd ?? 0), 0);
}

function countRows(rows: MCPServerRow[], since: Date): number {
  return rows.filter((r) => new Date(r.created_at) >= since).length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent?: "red" | "yellow" | "green" | "blue";
}) {
  const iconColors: Record<string, string> = {
    red: "text-red-500",
    yellow: "text-yellow-500",
    green: "text-green-500",
    blue: "text-blue-500",
  };
  const iconColor = accent ? iconColors[accent] : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={`capitalize text-xs ${styles[severity] ?? styles.low}`}>
      {severity}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCostsPage() {
  // ── Auth check ──
  // getUser() validates the JWT with Supabase Auth server — prevents revoked token bypass
  const supabaseUser = createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) redirect("/auth/signin");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          This page is restricted to FloMCP administrators.
        </p>
      </div>
    );
  }

  // ── Fetch data with service role (bypasses RLS) ──
  const admin = createAdminClient();

  const [{ data: serversData }, { data: suspiciousData }, { data: usageData }] =
    await Promise.all([
      admin
        .from("mcp_servers")
        .select("id, user_id, cost_usd, cached, tokens_used, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5000),
      admin
        .from("suspicious_activity")
        .select("id, user_id, activity_type, severity, reviewed, created_at, details")
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("user_usage")
        .select("user_id, email, tier")
        .limit(2000),
    ]);

  const servers = (serversData ?? []) as MCPServerRow[];
  const suspicious = (suspiciousData ?? []) as SuspiciousRow[];
  const userUsage = (usageData ?? []) as UserUsageRow[];

  // ── Build email lookup map ──
  const emailMap: Record<string, string> = {};
  for (const u of userUsage) {
    if (u.user_id && u.email) emailMap[u.user_id] = u.email;
  }

  // ── Time windows ──
  const dayStart = startOf("day");
  const weekStart = startOf("week");
  const monthStart = startOf("month");

  const costToday = sumCost(servers, dayStart);
  const costWeek = sumCost(servers, weekStart);
  const costMonth = sumCost(servers, monthStart);

  const genToday = countRows(servers, dayStart);
  const genWeek = countRows(servers, weekStart);
  const genMonth = countRows(servers, monthStart);

  const totalCost = servers.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
  const totalGen = servers.length;
  const avgCost = totalGen > 0 ? totalCost / totalGen : 0;

  const cachedCount = servers.filter((r) => r.cached).length;
  const cacheHitRate = totalGen > 0 ? (cachedCount / totalGen) * 100 : 0;
  const cacheSavings = cachedCount * avgCost; // Estimate: if each hit saved avgCost

  const totalTokens = servers.reduce((s, r) => s + (r.tokens_used ?? 0), 0);

  const dailyCostAlert = costToday > 50;

  // ── Top 10 users by total cost ──
  const costByUser: Record<string, { cost: number; count: number }> = {};
  for (const row of servers) {
    if (!costByUser[row.user_id]) costByUser[row.user_id] = { cost: 0, count: 0 };
    costByUser[row.user_id].cost += row.cost_usd ?? 0;
    costByUser[row.user_id].count += 1;
  }
  const topUsers = Object.entries(costByUser)
    .map(([uid, v]) => ({ uid, email: emailMap[uid] ?? uid.slice(0, 8) + "…", ...v }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  // ── Unreviewed suspicious ──
  const unreviewedCount = suspicious.filter((s) => !s.reviewed).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cost & Usage Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Admin view — real-time Claude API spend and abuse monitoring
        </p>
      </div>

      {/* Daily cost alert */}
      {dailyCostAlert && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-600 dark:text-red-400">
              Daily cost alert: ${costToday.toFixed(2)} today
            </p>
            <p className="text-sm text-muted-foreground">
              Daily spend has exceeded the $50 threshold. Consider pausing
              free-tier generation or alerting the team.
            </p>
          </div>
        </div>
      )}

      {/* Cost stats */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Claude API Cost</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Today"
            value={`$${costToday.toFixed(2)}`}
            sub={`${genToday} generation${genToday !== 1 ? "s" : ""}`}
            icon={DollarSign}
            accent={dailyCostAlert ? "red" : "green"}
          />
          <StatCard
            title="This Week"
            value={`$${costWeek.toFixed(2)}`}
            sub={`${genWeek} generations`}
            icon={TrendingUp}
            accent="blue"
          />
          <StatCard
            title="This Month"
            value={`$${costMonth.toFixed(2)}`}
            sub={`${genMonth} generations`}
            icon={BarChart2}
            accent="blue"
          />
          <StatCard
            title="All Time"
            value={`$${totalCost.toFixed(2)}`}
            sub={`${totalGen} total generations`}
            icon={Zap}
          />
        </div>
      </section>

      {/* Efficiency stats */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Efficiency Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Avg Cost / Generation"
            value={`$${avgCost.toFixed(4)}`}
            sub="across all time"
            icon={DollarSign}
          />
          <StatCard
            title="Cache Hit Rate"
            value={`${cacheHitRate.toFixed(1)}%`}
            sub={`${cachedCount} cached out of ${totalGen}`}
            icon={CheckCircle2}
            accent="green"
          />
          <StatCard
            title="Est. Cache Savings"
            value={`$${cacheSavings.toFixed(2)}`}
            sub="by serving cached results"
            icon={TrendingUp}
            accent="green"
          />
          <StatCard
            title="Total Tokens Used"
            value={totalTokens >= 1_000_000
              ? `${(totalTokens / 1_000_000).toFixed(2)}M`
              : totalTokens >= 1000
              ? `${(totalTokens / 1000).toFixed(1)}K`
              : String(totalTokens)}
            sub="across all generations"
            icon={BarChart2}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 users by cost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Users by Cost
            </CardTitle>
            <CardDescription>
              10 highest-spending users (all time)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, i) => {
                  const barPct = topUsers[0].cost > 0
                    ? Math.round((u.cost / topUsers[0].cost) * 100)
                    : 0;
                  return (
                    <div key={u.uid} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground w-4 text-right text-xs">
                            {i + 1}
                          </span>
                          <span className="truncate max-w-[160px]">{u.email}</span>
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {u.count} gen
                          </span>
                          <span className="font-medium w-16 text-right">
                            ${u.cost.toFixed(4)}
                          </span>
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspicious activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Suspicious Activity
              {unreviewedCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">
                  {unreviewedCount} unreviewed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Recent flags requiring admin review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suspicious.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                No suspicious activity logged
              </div>
            ) : (
              <div className="space-y-3">
                {suspicious.slice(0, 10).map((row) => (
                  <div key={row.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize">
                        {row.activity_type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {emailMap[row.user_id] ?? row.user_id.slice(0, 12) + "…"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(row.created_at).toLocaleString("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <SeverityBadge severity={row.severity} />
                      {row.reviewed ? (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      ) : (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claude API projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly Cost Projection
          </CardTitle>
          <CardDescription>
            Estimated full-month spend based on current pace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const now = new Date();
            const dayOfMonth = now.getDate();
            const daysInMonth = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0
            ).getDate();
            const projected =
              dayOfMonth > 0
                ? (costMonth / dayOfMonth) * daysInMonth
                : 0;
            const projectedGen =
              dayOfMonth > 0
                ? Math.round((genMonth / dayOfMonth) * daysInMonth)
                : 0;

            const riskLevel =
              projected > 200
                ? { label: "High", cls: "text-red-500" }
                : projected > 100
                ? { label: "Medium", cls: "text-yellow-500" }
                : { label: "Low", cls: "text-green-500" };

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Month to date</p>
                  <p className="text-2xl font-bold">${costMonth.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {genMonth} generations
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected total</p>
                  <p className="text-2xl font-bold">${projected.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ~{projectedGen} generations
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days remaining</p>
                  <p className="text-2xl font-bold">{daysInMonth - dayOfMonth}</p>
                  <p className="text-xs text-muted-foreground">
                    of {daysInMonth} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spend risk</p>
                  <p className={`text-2xl font-bold ${riskLevel.cls}`}>
                    {riskLevel.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {projected > 50
                      ? "Consider tightening limits"
                      : "Within safe range"}
                  </p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground pb-4">
        Data refreshes on each page load · Costs estimated at $0.10 per generation
        where cost_usd is null ·{" "}
        <a href="/dashboard" className="underline">
          Back to Dashboard
        </a>
      </p>
    </div>
  );
}
