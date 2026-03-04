"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Shield,
  ChevronDown,
  ChevronUp,
  MonitorPlay,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadMCPServerAsZip } from "@/lib/download-helper";
import { SecurityReport as SecurityReportComponent } from "@/components/security/SecurityReport";
import type { SecurityReport } from "@/lib/security/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  status: string;
  security_score: number | null;
  generated_code: string;
  package_json: string;
  readme: string;
  tsconfig: string | null;
  env_example: string | null;
  api_config: Record<string, unknown> | null;
  created_at: string;
  downloaded: boolean;
  security_report: SecurityReport | null;
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

  const [server, setServer] = useState<MCPServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FileTab["key"]>("generated_code");
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedVscode, setCopiedVscode] = useState(false);
  const [vscodeOpen, setVscodeOpen] = useState(false);
  const [claudeOpen, setClaudeOpen] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/servers/${id}`);
      if (res.status === 401) { router.push("/auth/signin"); setLoading(false); return; }
      if (res.ok) {
        const json = await res.json();
        setServer(json.server ?? null);
      }
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

  // Download all files as a ZIP archive
  async function handleDownloadAll() {
    if (!server) return;
    await downloadMCPServerAsZip({
      name: server.name,
      generated_code: server.generated_code,
      package_json: server.package_json,
      readme: server.readme,
      tsconfig: server.tsconfig,
      env_example: server.env_example,
    });
    // Mark as downloaded via API
    await fetch(`/api/servers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloaded: true, downloaded_at: new Date().toISOString() }),
    });
  }

  // Re-run security validation via /api/validate
  async function handleRevalidate() {
    if (!server || isRevalidating) return;
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: id }),
      });
      if (res.ok) {
        const json = await res.json();
        setServer((prev) =>
          prev
            ? { ...prev, security_score: json.report.score, security_report: json.report }
            : prev
        );
        // Auto-open modal once analysis is done
        setSecurityModalOpen(true);
      }
    } finally {
      setIsRevalidating(false);
    }
  }

  // Config JSON generators
  const serverSlug = server.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [serverSlug]: {
          command: "npx",
          args: ["tsx", `C:/Users/YourName/Downloads/${serverSlug}/src/index.ts`],
        },
      },
    },
    null,
    2
  );
  const vscodeConfig = JSON.stringify(
    {
      "github.copilot.chat.mcp.servers": {
        [serverSlug]: {
          command: "npx",
          args: ["tsx", `C:/Users/YourName/Downloads/${serverSlug}/src/index.ts`],
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
  async function handleCopyVscode() {
    await navigator.clipboard.writeText(vscodeConfig);
    setCopiedVscode(true);
    setTimeout(() => setCopiedVscode(false), 2000);
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
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-xs text-muted-foreground">Generated {createdDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {server.security_score != null ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSecurityModalOpen(true)}
              className={cn(
                "flex-shrink-0 gap-1.5 text-xs",
                server.security_score >= 85 && "border-green-500/40 text-green-700 hover:bg-green-500/10 dark:text-green-400",
                server.security_score >= 70 && server.security_score < 85 && "border-blue-500/40 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400",
                server.security_score >= 55 && server.security_score < 70 && "border-yellow-500/40 text-yellow-700 hover:bg-yellow-500/10 dark:text-yellow-400",
                server.security_score < 55 && "border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-400",
              )}
              aria-label="View security report"
            >
              <Shield className="h-3.5 w-3.5" />
              {server.security_score}/100 · View Report
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRevalidate}
              disabled={isRevalidating}
              className="flex-shrink-0 gap-1.5 text-xs"
              aria-label="Run security analysis"
            >
              {isRevalidating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Shield className="h-3.5 w-3.5" />}
              {isRevalidating ? "Analysing…" : "Security Analysis"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/servers/${id}/test`)}
            className="flex-shrink-0 gap-1.5 text-xs border-blue-500/40 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400"
            aria-label="Open mock test page"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Test Tools
          </Button>
          <Button size="sm" onClick={handleDownloadAll} className="flex-shrink-0 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Download All Files
          </Button>
        </div>
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

      {/* Security Report Modal */}
      <Dialog open={securityModalOpen} onOpenChange={setSecurityModalOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Security Report
              {server.security_score != null && (
                <span className={cn(
                  "ml-1 text-sm font-semibold",
                  server.security_score >= 85 && "text-green-600",
                  server.security_score >= 70 && server.security_score < 85 && "text-blue-600",
                  server.security_score >= 55 && server.security_score < 70 && "text-yellow-600",
                  server.security_score < 55 && "text-red-600",
                )}>
                  — {server.security_score}/100
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {server.security_report ? (
              <SecurityReportComponent
                report={server.security_report}
                onRevalidate={handleRevalidate}
                isRevalidating={isRevalidating}
                showRecommendations
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 border border-border">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No security report yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    This server was generated before security scanning. Run an analysis to see all 22 checks.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleRevalidate}
                  disabled={isRevalidating}
                  className="gap-2"
                >
                  {isRevalidating
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Shield className="h-4 w-4" />}
                  {isRevalidating ? "Running analysis…" : "Run Security Analysis"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect section */}
      <Card className="border border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Connect to your AI client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Shared setup steps */}
          <div className="rounded-lg bg-muted/30 border border-border/50 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Setup (one time)</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Download all files and extract them into a folder</li>
              <li>
                Open a terminal in that folder and run{" "}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">npm install</code>
              </li>
              <li>
                Test it works:{" "}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">npx tsx src/index.ts</code>
                {" — should print: MCP server running on stdio"}
              </li>
            </ol>
          </div>

          {/* VS Code / GitHub Copilot */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <button
              onClick={() => setVscodeOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 text-blue-500" />
                VS Code (GitHub Copilot)
              </div>
              {vscodeOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {vscodeOpen && (
              <div className="px-4 pb-4 space-y-2.5 border-t border-border/40">
                <p className="text-xs text-muted-foreground pt-3">
                  Create or edit{" "}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded">.vscode/settings.json</code>{" "}
                  in your project folder (not the server folder):
                </p>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/50">
                    <span className="text-xs font-mono text-muted-foreground">.vscode/settings.json</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={handleCopyVscode}>
                      {copiedVscode ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copiedVscode ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <pre className="p-3 text-xs font-mono bg-background overflow-auto">
                    <code>{vscodeConfig}</code>
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  Replace the path with your actual folder path. Then press{" "}
                  <strong>Ctrl+Shift+P → Developer: Reload Window</strong>. A 🔌 icon will appear in Copilot Chat.
                </p>
              </div>
            )}
          </div>

          {/* Claude Desktop */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <button
              onClick={() => setClaudeOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                Claude Desktop
              </div>
              {claudeOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {claudeOpen && (
              <div className="px-4 pb-4 space-y-2.5 border-t border-border/40">
                <div className="text-xs text-muted-foreground pt-3 space-y-0.5">
                  <p>Edit <code className="font-mono bg-muted px-1 py-0.5 rounded">claude_desktop_config.json</code>:</p>
                  <p>Windows: <code className="font-mono bg-muted px-1 py-0.5 rounded">%APPDATA%\Claude\claude_desktop_config.json</code></p>
                  <p>macOS: <code className="font-mono bg-muted px-1 py-0.5 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code></p>
                </div>
                <div className="rounded-lg border border-border/50 overflow-hidden">
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
                <p className="text-xs text-muted-foreground">
                  Replace the path with your actual folder path, then <strong>restart Claude Desktop</strong> — your tools will appear.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
