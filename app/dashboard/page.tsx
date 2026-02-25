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
import { Sparkles, Shield, Clock, Zap, ArrowRight, TrendingUp } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface UsageStats {
  generation_count_month: number;
  tier: string;
  last_generation_at: string | null;
  last_generation_cooldown_until: string | null;
}

const FREE_TIER_LIMIT = 2;

function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // getSession() reads from local cookies — instant, no network call
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data } = await supabase
            .from("user_usage")
            .select("generation_count_month, tier, last_generation_at, last_generation_cooldown_until")
            .eq("user_id", currentUser.id)
            .single();
          setUsage(data);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    loadData();
  }, []);

  const displayName = user?.email?.split("@")[0] || "Developer";
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

  const canGenerate = generationsRemaining > 0 && !isInCooldown;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Generations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Generations</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {generationsUsed}
                  <span className="text-muted-foreground text-lg font-normal">
                    /{FREE_TIER_LIMIT}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usageBarColor}`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {generationsRemaining === 0
                    ? "Monthly limit reached"
                    : `${generationsRemaining} remaining this month`}
                </p>
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
                  {usage?.tier === "pro" ? "Unlimited generations" : "2 generations / month"}
                </p>
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
              ? "Limit Reached"
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
