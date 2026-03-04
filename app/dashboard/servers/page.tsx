"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  ServerIcon,
  Clock,
  ArrowRight,
  Trash2,
  Shield,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  downloaded: boolean;
  security_score: number | null;
}

function getScoreBadgeClass(score: number | null): string {
  if (score == null) return "bg-muted/50 text-muted-foreground border-border/40";
  if (score >= 80) return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
  if (score >= 50) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
}

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MCPServer | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/servers");
      if (res.status === 401) { router.push("/auth/signin"); return; }
      if (res.ok) {
        const json = await res.json();
        setServers(json.servers ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      const res = await fetch(`/api/servers?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete server. Please try again.");
        setDeleting(null);
        return;
      }
      setServers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" has been deleted.`);
      setDeleteTarget(null);
      setDeleteInput("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My MCP Servers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your generated servers — view files, download, or delete
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/generate")}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate New
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : servers.length === 0 ? (
        <Card className="border border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
              <ServerIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No servers yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first MCP server to get started
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/generate")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My First Server
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => {
            const date = new Date(server.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <Card
                key={server.id}
                className="border border-border/70 hover:border-border hover:shadow-sm transition-all duration-150 cursor-pointer group"
                onClick={() => router.push(`/dashboard/servers/${server.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4 px-5">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ServerIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{server.name}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          server.status === "generated" && "bg-green-500/10 text-green-600 border-green-500/20",
                          server.status === "downloaded" && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        )}
                      >
                        {server.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("text-xs flex items-center gap-1", getScoreBadgeClass(server.security_score))}
                      >
                        <Shield className="h-3 w-3" />
                        {server.security_score != null ? `${server.security_score}/100` : "N/A"}
                      </Badge>
                    </div>
                    {server.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{server.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {date}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                      onClick={() => { setDeleteTarget(server); setDeleteInput(""); }}
                    >
                      {deleting === server.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Type-to-confirm delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteInput(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this server?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">&quot;{deleteTarget?.name}&quot;</span> and all its files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{deleteTarget?.name}</span> to confirm:
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={deleteTarget?.name ?? ""}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTarget(null); setDeleteInput(""); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={!!deleting || deleteInput.trim() !== deleteTarget?.name}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
