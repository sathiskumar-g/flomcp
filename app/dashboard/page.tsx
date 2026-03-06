"use client";

/**
 * Dashboard Home Page - Task 1.3.3
 *
 * Welcome message, usage stats, quick generate CTA, recent MCP servers
 * Protected by ProtectedRoute
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserMenu } from "@/components/auth/UserMenu";
import { MCPServersList } from "@/components/dashboard/MCPServersList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Shield, Clock, Zap, ArrowRight, TrendingUp, Server, BarChart2, Crown } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface UsageStats {
  generation_count_month: number;
  tier: string;
  last_generation_at: string | null;
  last_generation_cooldown_until: string | null;
}

const FREE_TIER_LIMIT = 5;

function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [serverCount, setServerCount] = useState<number | null>(null);
  const [avgSecurityScore, setAvgSecurityScore] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<{ total: number; plan: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // getSession() reads from local cookies — instant, no network call
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const [usageResult, serversJson, creditsResult] = await Promise.all([
            supabase
              .from("user_usage")
              .select("generation_count_month, tier, last_generation_at, last_generation_cooldown_until")
              .eq("user_id", currentUser.id)
              .maybeSingle(),
            // Use /api/servers (admin client) so RLS never blocks dashboard stats
            fetch("/api/servers", { cache: "no-store" })
              .then(r => r.ok ? r.json() : { servers: [] })
              .catch(() => ({ servers: [] })),
            fetch("/api/credits/balance", { cache: "no-store" })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
          ]);
          setUsage(usageResult.data);
          if (creditsResult) setCreditBalance({ total: creditsResult.total ?? 0, plan: creditsResult.plan ?? "free" });
          const servers: { security_score: number | null }[] = serversJson.servers ?? [];
          setServerCount(servers.length);
          // BUG-005: filter nulls before averaging to avoid NaN
          const validScores = servers.filter((s) => s.security_score != null);
          if (validScores.length > 0) {
            const avg = Math.round(
              validScores.reduce((sum, s) => sum + s.security_score!, 0) / validScores.length
            );
            setAvgSecurityScore(avg);
          } else {
            setAvgSecurityScore(null);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    loadData();

    // Subscribe so display name updates live when settings page saves a new name
    // (Settings calls refreshSession() which fires this listener with updated metadata)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // BUG-006: prefer full_name from Google OAuth user_metadata over email prefix
  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Developer";
  const generationsUsed = usage?.generation_count_month ?? 0;
  const generationsRemaining = Math.max(0, FREE_TIER_LIMIT - generationsUsed);
  const isInCooldown = usage?.last_generation_cooldown_until
    ? new Date(usage.last_generation_cooldown_until) > new Date()
    : false;

  const getCooldownText = () => {
    if (!usage?.last_generation_cooldown_until) return null;
    const cooldownUntil = new Date(usage.last_generation_cooldown_until);
    if (cooldownUntil <= new Date()) return null;
    const msRemaining = cooldownUntil.getTime() - Date.now();
    const totalMinutes = Math.ceil(msRemaining / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const usagePercentage = Math.min(100, (generationsUsed / FREE_TIER_LIMIT) * 100);
  const usageBarColor =
    usagePercentage >= 100 ? "bg-red-500" : usagePercentage >= 50 ? "bg-yellow-500" : "bg-green-500";

  const tierLimit = creditBalance?.plan === "pro" ? 50 : FREE_TIER_LIMIT;
  const creditsRemaining = creditBalance !== null ? creditBalance.total : generationsRemaining;
  const creditUsagePercentage = Math.min(100, ((tierLimit - creditsRemaining) / tierLimit) * 100);
  const creditBarColor =
    creditUsagePercentage >= 100 ? "bg-red-500" : creditUsagePercentage >= 50 ? "bg-yellow-500" : "bg-green-500";

  const canGenerate = creditsRemaining > 0 && !isInCooldown;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and manage your MCP servers
          </p>
        </div>
        <div className="hidden md:block">
          {user && <UserMenu user={user} />}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <span className="text-base">🪙</span>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {creditsRemaining}
                  <span className="text-muted-foreground text-lg font-normal">
                    /{tierLimit}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${creditBarColor}`}
                    style={{ width: `${creditUsagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {creditsRemaining === 0
                    ? "All credits used"
                    : `${creditsRemaining} credit${creditsRemaining !== 1 ? "s" : ""} remaining`}
                </p>
                <button
                  onClick={() => router.push("/dashboard/settings#subscription")}
                  className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                >
                  <Crown className="h-3 w-3" />
                  Add Credits
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold capitalize">
                  {usage?.tier ?? "Free"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {usage?.tier === "pro" ? "50 credits/month" : "5 credits (one-time)"}
                </p>
                {(!usage?.tier || usage.tier === "free") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => router.push("/dashboard/settings#subscription")}
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Next generation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Next Generation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isInCooldown ? getCooldownText() : "Ready"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isInCooldown
                    ? "Cooldown active"
                    : generationsRemaining > 0
                    ? "You can generate now"
                    : "Limit reached"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              22 security checks enabled
            </p>
          </CardContent>
        </Card>

        {/* Total Servers Created */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Servers Created</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{serverCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {serverCount === 1 ? "MCP server generated" : "MCP servers generated"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Average Security Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg Security Score</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : avgSecurityScore === null ? (
              <>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">No servers yet</p>
              </>
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    avgSecurityScore >= 80
                      ? "text-green-500"
                      : avgSecurityScore >= 50
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {avgSecurityScore}
                  <span className="text-muted-foreground text-lg font-normal">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all your servers</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Generate CTA */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Generate a new MCP Server</h3>
              <p className="text-sm text-muted-foreground">
                Describe your tool and get production-ready TypeScript code in seconds
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => router.push("/dashboard/generate")}
            disabled={!canGenerate}
            className="flex-shrink-0 bg-primary hover:bg-primary/90"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {generationsRemaining === 0
              ? "No Credits Left"
              : isInCooldown
              ? `Wait ${getCooldownText()}`
              : "Start Generating"}
            {canGenerate && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>

      {/* Recent MCP Servers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">My MCP Servers</h2>
            <p className="text-sm text-muted-foreground">
              Your generated servers — download, view, or manage
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/servers")}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {user && <MCPServersList userId={user.id} limit={3} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
