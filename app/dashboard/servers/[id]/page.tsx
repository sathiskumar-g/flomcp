"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Copy,
  Download,
  CheckCircle2,
  Loader2,
  FileCode2,
  FileText,
  Package,
  Settings,
  Terminal,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  status: string;
  generated_code: string;
  package_json: string;
  readme: string;
  tsconfig: string | null;
  env_example: string | null;
  api_config: Record<string, unknown> | null;
  created_at: string;
  downloaded: boolean;
}

// ─── File tabs ────────────────────────────────────────────────────────────────

type FileTab = {
  key: keyof Pick<MCPServer, "generated_code" | "package_json" | "tsconfig" | "env_example" | "readme">;
  label: string;
  filename: string;
  icon: React.ComponentType<{ className?: string }>;
  language: string;
};

const FILE_TABS: FileTab[] = [
  { key: "generated_code", label: "src/index.ts",   filename: "src/index.ts",   icon: FileCode2, language: "typescript" },
  { key: "package_json",   label: "package.json",   filename: "package.json",   icon: Package,   language: "json" },
  { key: "tsconfig",       label: "tsconfig.json",  filename: "tsconfig.json",  icon: Settings,  language: "json" },
  { key: "env_example",    label: ".env.example",   filename: ".env.example",   icon: Terminal,  language: "dotenv" },
  { key: "readme",         label: "README.md",      filename: "README.md",      icon: BookOpen,  language: "markdown" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [server, setServer] = useState<MCPServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FileTab["key"]>("generated_code");
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    async function load() {
      // Verify the user session first
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("mcp_servers")
        .select("id, name, description, status, generated_code, package_json, readme, tsconfig, env_example, api_config, created_at, downloaded")
        .eq("id", id)
        .single();

      if (!error && data) setServer(data as MCPServer);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Server not found</h2>
        <p className="text-muted-foreground">This server may have been deleted or you don&apos;t have access.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const activeFileTab = FILE_TABS.find((t) => t.key === activeTab)!;
  const activeContent = server[activeTab] ?? "";

  // Copy file content
  async function handleCopy() {
    await navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Download current file
  function handleDownload() {
    const blob = new Blob([activeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFileTab.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Download all files as separate downloads
  async function handleDownloadAll() {
    if (!server) return;
    const filesToDownload = FILE_TABS.filter((t) => server[t.key]);
    for (const tab of filesToDownload) {
      const content = server[tab.key] ?? "";
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tab.filename;
      a.click();
      URL.revokeObjectURL(url);
      await new Promise((r) => setTimeout(r, 200));
    }
    // Mark as downloaded
    await supabase
      .from("mcp_servers")
      .update({ downloaded: true, downloaded_at: new Date().toISOString() })
      .eq("id", id);
  }

  // Claude Desktop config JSON
  const serverName = server.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [serverName]: {
          command: "node",
          args: [`/path/to/${serverName}/dist/index.js`],
        },
      },
    },
    null,
    2
  );

  async function handleCopyConfig() {
    await navigator.clipboard.writeText(claudeConfig);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  }

  const createdDate = new Date(server.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-0.5 flex-shrink-0" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{server.name}</h1>
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
          </div>
          {server.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{server.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Generated {createdDate}</p>
        </div>
        <Button onClick={handleDownloadAll} className="flex-shrink-0">
          <Download className="mr-2 h-4 w-4" />
          Download All Files
        </Button>
      </div>

      {/* File viewer */}
      <Card className="border border-border/70 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-border/70 bg-muted/30 overflow-x-auto">
          {FILE_TABS.filter((t) => server[t.key]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-foreground bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-1 px-2 flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>

        {/* Code content */}
        <CardContent className="p-0">
          <pre className="overflow-auto text-xs leading-relaxed p-4 max-h-[520px] bg-background font-mono text-foreground/90 whitespace-pre">
            <code>{activeContent || "(empty)"}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Claude Desktop setup */}
      <Card className="border border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Connect to Claude Desktop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            After installing and building your server, add it to your{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">claude_desktop_config.json</code>:
          </p>
          <div className="relative rounded-lg border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/50">
              <span className="text-xs font-mono text-muted-foreground">claude_desktop_config.json</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={handleCopyConfig}>
                {copiedConfig ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copiedConfig ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="p-3 text-xs font-mono bg-background overflow-auto">
              <code>{claudeConfig}</code>
            </pre>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Download all files and put them in a folder</li>
            <li>Run <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">npm install</code> in that folder</li>
            <li>Run <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">npm run build</code> to compile TypeScript</li>
            <li>Add the config above to your Claude Desktop settings</li>
            <li>Restart Claude Desktop — your tools will appear</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
