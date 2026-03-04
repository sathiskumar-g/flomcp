"use client";

/**
 * MCPServersList Component
 *
 * Task 1.3.4: Display user's generated MCP servers with security badges
 * and download / delete actions.
 *
 * Props:
 *  - userId: string   — used to scope the Supabase query
 *  - limit?: number   — cap results (used on dashboard home page preview)
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  Trash2,
  Shield,
  Clock,
  Loader2,
  ServerIcon,
  Sparkles,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  status: "generated" | "downloaded" | "archived" | "failed";
  security_score: number | null | undefined;
  tokens_used: number | null | undefined;
  cost_usd: number | null | undefined;
  downloaded: boolean;
  created_at: string;
}

interface MCPServersListProps {
  userId: string;
  /** If set, only the N most-recent servers are shown */
  limit?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns Tailwind color classes for a numeric security score.
 * green ≥ 80 | yellow ≥ 50 | red < 50 | gray for null
 */
function getSecurityScoreStyle(score: number | null | undefined): {
  badge: string;
  label: string;
} {
  if (score == null) return { badge: "bg-muted text-muted-foreground", label: "N/A" };
  if (score >= 80) return { badge: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30", label: `${score}/100` };
  if (score >= 50) return { badge: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30", label: `${score}/100` };
  return { badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", label: `${score}/100` };
}

function getStatusStyle(status: MCPServer["status"]): string {
  switch (status) {
    case "generated":  return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "downloaded": return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
    case "archived":   return "bg-muted text-muted-foreground";
    case "failed":     return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MCPServersList({ userId, limit }: MCPServersListProps) {
  const router = useRouter();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers${limit ? `?limit=${limit}` : ""}`);
      if (!res.ok) throw new Error("Failed to load servers");
      const json = await res.json();
      const data: MCPServer[] = json.servers ?? [];
      setServers(limit ? data.slice(0, limit) : data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load servers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleDelete = async (serverId: string) => {
    setDeletingId(serverId);
    try {
      const res = await fetch(`/api/servers?id=${serverId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setServers((prev) => prev.filter((s) => s.id !== serverId));
    } catch (err: unknown) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your MCP servers…</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center py-10 gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchServers}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ──
  if (servers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-muted">
            <ServerIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No MCP servers yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate your first server and it will appear here
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Each generated server includes TypeScript, package.json, README & .env</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Server list ──
  return (
    <div className="space-y-3">
      {servers.map((server) => {
        const securityStyle = getSecurityScoreStyle(server.security_score ?? 100);
        const statusStyle = getStatusStyle(server.status);
        const isDeleting = deletingId === server.id;

        return (
          <Card
            key={server.id}
            className="transition-all duration-150 hover:translate-x-1 hover:shadow-md hover:border-border/80 cursor-pointer"
            onClick={() => router.push(`/dashboard/servers/${server.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{server.name}</CardTitle>
                  {server.description && (
                    <CardDescription className="mt-0.5 line-clamp-2">
                      {server.description}
                    </CardDescription>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Status */}
                  <Badge variant="outline" className={`capitalize text-xs ${statusStyle}`}>
                    {server.status}
                  </Badge>

                  {/* Security score */}
                  <Badge variant="outline" className={`text-xs flex items-center gap-1 ${securityStyle.badge}`}>
                    <Shield className="h-3 w-3" />
                    {securityStyle.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(server.created_at)}
                  </span>
                  {server.tokens_used != null && (
                    <span>{server.tokens_used.toLocaleString()} tokens</span>
                  )}
                  {server.cost_usd != null && (
                    <span>${server.cost_usd.toFixed(4)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* View server detail */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/servers/${server.id}`); }}
                  >
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                    View
                  </Button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                        onClick={(e) => e.stopPropagation()}
                        className="border-red-500/60 text-red-600 hover:bg-red-500/10 hover:border-red-500 dark:text-red-400"
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete MCP Server?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{server.name}</strong>.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(server.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
