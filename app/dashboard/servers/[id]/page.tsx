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
  FlaskConical,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Wrench,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadMCPServerAsZip } from "@/lib/download-helper";
import { SecurityReport as SecurityReportComponent } from "@/components/security/SecurityReport";
import type { SecurityReport } from "@/lib/security/types";
import { IntegrationPanel } from "@/components/integration/IntegrationPanel";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  generation_input: {
    serverName: string;
    description: string;
    apiConfig: Record<string, unknown> | null;
    tools: Array<{
      name: string;
      description: string;
      annotation?: string;
      fields?: Array<{ name: string; type: string; required: boolean; description?: string }>;
    }>;
    resources: Array<{ name: string; description: string; mimeType: string; contentLength: number }>;
    prompts: Array<{ name: string; description: string; mimeType: string; contentLength: number }>;
  } | null;
  user_feedback: { rating: "up" | "down"; comment: string | null; submittedAt: string } | null;
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
  const [copiedGenInput, setCopiedGenInput] = useState(false);
  const [configJsonOpen, setConfigJsonOpen] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [fbRating, setFbRating] = useState<"up" | "down" | null>(null);
  const [fbComment, setFbComment] = useState("");
  const [fbSent, setFbSent] = useState(false);

  // B20 — env var setup modal
  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [envValues, setEnvValues] = useState<Record<string, string>>({});

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

  // Auto-prompt for feedback after 1 minute if not yet given
  useEffect(() => {
    if (!server || server.user_feedback || fbSent) return;
    const t = setTimeout(() => setFeedbackModalOpen(true), 30_000);
    return () => clearTimeout(t);
  }, [server, fbSent]);

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

  /** Parse env var key names from .env.example content (KEY=value lines only). */
  function parseEnvVarNames(example: string | null): string[] {
    if (!example) return [];
    return [...new Set(
      example.split("\n")
        .map((line) => line.split("=")[0].trim())
        .filter((k) => /^[A-Z_][A-Z0-9_]*$/.test(k))
    )];
  }

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
    const envVars = parseEnvVarNames(server.env_example);
    if (envVars.length > 0) {
      // Pre-populate keys with empty values so the form renders inputs
      setEnvValues(Object.fromEntries(envVars.map((k) => [k, ""])));
      setEnvModalOpen(true);
      return;
    }
    await doDownload(null);
  }

  /** Performs the actual ZIP download with optional pre-filled .env content. */
  async function doDownload(filledEnv: string | null) {
    if (!server) return;
    await downloadMCPServerAsZip({
      name: server.name,
      generated_code: server.generated_code,
      package_json: server.package_json,
      readme: server.readme,
      tsconfig: server.tsconfig,
      env_example: server.env_example,
      env_filled: filledEnv,
    });
    // Mark as downloaded via API
    await fetch(`/api/servers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloaded: true, downloaded_at: new Date().toISOString() }),
    });
    toast.success("Server downloaded successfully.");
  }

  /** Called when user submits the env var form. */
  async function handleEnvDownload(skip: boolean) {
    setEnvModalOpen(false);
    if (skip) {
      await doDownload(null);
      return;
    }
    const lines = Object.entries(envValues)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    await doDownload(lines);
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
        toast.success("Security analysis complete.");
      } else {
        toast.error("Security analysis failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsRevalidating(false);
    }
  }

  async function handleFeedbackSubmit() {
    if (!fbRating) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: id, rating: fbRating, comment: fbComment.trim() || null }),
    }).catch(() => {});
    setFbSent(true);
    setFeedbackModalOpen(false);
    setServer((prev) =>
      prev ? { ...prev, user_feedback: { rating: fbRating, comment: fbComment.trim() || null, submittedAt: new Date().toISOString() } } : prev
    );
    toast.success("Thanks for your feedback!");
  }

  const createdDate = new Date(server.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-0.5 flex-shrink-0" onClick={() => router.push("/dashboard/servers")}>
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

      {/* Feedback Modal (auto-opens after 1 minute) */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" />
              How was the generation?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Now that you&apos;ve seen your server code, let us know how the generation turned out.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFbRating("up")}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all",
                  fbRating === "up"
                    ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <ThumbsUp className="h-5 w-5" />
                Looks good!
              </button>
              <button
                type="button"
                onClick={() => setFbRating("down")}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all",
                  fbRating === "down"
                    ? "border-red-500 bg-red-500/10 text-red-500 dark:text-red-400"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <ThumbsDown className="h-5 w-5" />
                Needs work
              </button>
            </div>
            {fbRating && (
              <Textarea
                placeholder="Any specific comments? (optional)"
                value={fbComment}
                onChange={(e) => setFbComment(e.target.value)}
                rows={3}
                maxLength={500}
                className="text-sm resize-none"
              />
            )}
            <div className="flex gap-2 justify-center pt-1">
              <Button variant="ghost" size="sm" onClick={() => setFeedbackModalOpen(false)}>
                Skip
              </Button>
              <Button
                size="sm"
                disabled={!fbRating}
                onClick={handleFeedbackSubmit}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Server Capabilities */}
      {server.generation_input && (
        server.generation_input.tools.length > 0 ||
        server.generation_input.resources.length > 0 ||
        server.generation_input.prompts.length > 0
      ) && (
        <Card className="border border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Server Capabilities
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              What this MCP server exposes to Claude —{" "}
              {[
                server.generation_input.tools.length > 0 &&
                  `${server.generation_input.tools.length} tool${server.generation_input.tools.length !== 1 ? "s" : ""}`,
                server.generation_input.resources.length > 0 &&
                  `${server.generation_input.resources.length} resource${server.generation_input.resources.length !== 1 ? "s" : ""}`,
                server.generation_input.prompts.length > 0 &&
                  `${server.generation_input.prompts.length} prompt${server.generation_input.prompts.length !== 1 ? "s" : ""}`,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-6">

            {/* ── Tools ── */}
            {server.generation_input.tools.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tools</p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {server.generation_input.tools.length}
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {server.generation_input.tools.map((tool, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs font-mono font-semibold text-foreground break-all">
                          {tool.name}
                        </code>
                        {tool.fields && tool.fields.length > 0 && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {tool.fields.length} param{tool.fields.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                      {tool.fields && tool.fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {tool.fields.map((f, fi) => (
                            <span
                              key={fi}
                              className={cn(
                                "inline-flex items-center gap-0.5 text-[10px] rounded px-1.5 py-0.5 font-mono border",
                                f.required
                                  ? "bg-primary/10 border-primary/20 text-primary"
                                  : "bg-muted border-border/60 text-muted-foreground"
                              )}
                            >
                              {f.name}
                              <span className="opacity-60">:{f.type}</span>
                              {f.required && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Resources ── */}
            {server.generation_input.resources.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {server.generation_input.resources.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {server.generation_input.resources.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <code className="text-xs font-mono font-semibold text-foreground">{r.name}</code>
                        {r.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {r.mimeType || "text/plain"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Prompts ── */}
            {server.generation_input.prompts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompts</p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {server.generation_input.prompts.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {server.generation_input.prompts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <code className="text-xs font-mono font-semibold text-foreground">{p.name}</code>
                        {p.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {p.mimeType || "text/plain"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Connect section — IntegrationPanel (B11 + B12) */}
      <Card className="border border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Connect to Your AI Client
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            One-time setup. Pick your tool, paste the config, restart — your tools appear instantly.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Setup steps */}
          <div className="rounded-lg bg-muted/30 border border-border/50 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">First: install &amp; configure (one time)</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Download all files and extract them into a folder.</li>
              <li>
                Open a terminal <strong>in that folder</strong> and run{" "}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">npm install</code>
              </li>
              {server.env_example && (
                <li>
                  Copy{" "}
                  <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">.env.example</code>
                  {" to "}
                  <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">.env</code>
                  {" and fill in your API keys — the server won't work without this."}
                </li>
              )}
              <li>
                Test it:{" "}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">npx tsx src/index.ts</code>
                {" — should print: "}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">MCP server running on stdio</code>
              </li>
            </ol>
          </div>
          {/* Client config panel */}
          <IntegrationPanel serverName={server.name} />
        </CardContent>
      </Card>

      {/* Generation Input JSON — accordion for analysis */}
      <Card className="border border-border/70">
        <button
          onClick={() => setConfigJsonOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-muted/30 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" />
            Generation Input
            <span className="text-xs text-muted-foreground font-normal">(what was submitted — for verification &amp; analysis)</span>
          </div>
          {configJsonOpen
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {configJsonOpen && (
          <CardContent className="px-5 pb-5 pt-0 space-y-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground pt-3">
              The exact description, API configuration, tools, resources, and prompts that were submitted to generate this server.
            </p>
            {server.generation_input ? (
              <>
                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Description</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs font-mono whitespace-pre-wrap break-words">
                    {server.generation_input.description}
                  </div>
                </div>

                {/* API Config */}
                {server.generation_input.apiConfig?.enabled && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">API Configuration</p>
                    <pre className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs font-mono overflow-auto">
                      <code>{JSON.stringify(server.generation_input.apiConfig, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {/* Tools */}
                {server.generation_input.tools.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Tools ({server.generation_input.tools.length})</p>
                    <pre className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs font-mono overflow-auto">
                      <code>{JSON.stringify(server.generation_input.tools, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {/* Resources */}
                {server.generation_input.resources.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Resources ({server.generation_input.resources.length})</p>
                    <pre className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs font-mono overflow-auto">
                      <code>{JSON.stringify(server.generation_input.resources, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {/* Prompts */}
                {server.generation_input.prompts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Prompts ({server.generation_input.prompts.length})</p>
                    <pre className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs font-mono overflow-auto">
                      <code>{JSON.stringify(server.generation_input.prompts, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {/* Copy full input */}
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        JSON.stringify(server.generation_input, null, 2)
                      );
                      setCopiedGenInput(true);
                      setTimeout(() => setCopiedGenInput(false), 2000);
                    }}
                  >
                    {copiedGenInput
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                    {copiedGenInput ? "Copied!" : "Copy Full JSON"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">
                Generation input not available for servers created before this feature was added.
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Generation Feedback */}
      <Card className="border border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Generation Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {server.user_feedback || fbSent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full",
                (server.user_feedback?.rating ?? fbRating) === "up"
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              )}>
                {(server.user_feedback?.rating ?? fbRating) === "up"
                  ? <ThumbsUp className="h-5 w-5 text-green-500" />
                  : <ThumbsDown className="h-5 w-5 text-red-500" />}
              </div>
              <div>
                <p className="text-sm font-medium">Feedback submitted — thank you!</p>
                {(server.user_feedback?.comment || fbComment) && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    &ldquo;{server.user_feedback?.comment ?? fbComment}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How did this server generation perform? Your feedback helps us improve the AI output.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFbRating("up")}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-sm transition-all",
                    fbRating === "up"
                      ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  <ThumbsUp className="h-5 w-5" />
                  Looks good!
                </button>
                <button
                  type="button"
                  onClick={() => setFbRating("down")}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-sm transition-all",
                    fbRating === "down"
                      ? "border-red-500 bg-red-500/10 text-red-500 dark:text-red-400"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  <ThumbsDown className="h-5 w-5" />
                  Needs work
                </button>
              </div>
              {fbRating && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Specific comments? (optional) — e.g. tools were off, wrong API pattern…"
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="text-sm resize-none"
                  />
                  <div className="flex justify-center">
                    <Button size="sm" onClick={handleFeedbackSubmit}>
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* B20 — Env var setup modal */}
      <Dialog open={envModalOpen} onOpenChange={setEnvModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set up your environment variables</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your API keys and secrets. These values are written directly
              into a <code>.env</code> file inside your ZIP — they are{" "}
              <strong>never sent to FloMCP servers</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {Object.keys(envValues).map((key) => (
              <div key={key} className="space-y-1">
                <label htmlFor={`env-${key}`} className="text-xs font-mono text-foreground">
                  {key}
                </label>
                <Input
                  id={`env-${key}`}
                  type={key.toLowerCase().includes("secret") || key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("pass") ? "password" : "text"}
                  placeholder={`Enter ${key}`}
                  value={envValues[key]}
                  onChange={(e) =>
                    setEnvValues((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => handleEnvDownload(true)}
            >
              Skip — I&apos;ll fill it in later
            </Button>
            <Button size="sm" onClick={() => handleEnvDownload(false)}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download with .env
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
