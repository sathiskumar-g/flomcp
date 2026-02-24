"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  ServerIcon,
  Clock,
  ArrowRight,
  Trash2,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  downloaded: boolean;
}

export default function ServersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push("/auth/signin"); return; }
      setUser(u);

      const { data } = await supabase
        .from("mcp_servers")
        .select("id, name, description, status, created_at, downloaded")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });

      setServers((data as MCPServer[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("mcp_servers").delete().eq("id", id);
    setServers((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
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
                className="border border-border/70 hover:border-border transition-colors cursor-pointer group"
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
                      {server.downloaded && (
                        <Badge variant="outline" className="text-xs">Downloaded</Badge>
                      )}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {deleting === server.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this server?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{server.name}&quot; will be permanently deleted. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDelete(server.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
