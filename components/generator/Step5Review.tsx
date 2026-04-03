"use client";

/**
 * Step 4 — Review & Generate
 *
 * Read-only summary of all previous steps.
 * Fires POST /api/generate to trigger Claude code generation.
 */

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useGeneratorStore, type ToolDefinition, type PromptDefinition } from "@/lib/stores/generator-store";
import { estimateCredits, validateInputLimits, MAX_TOOLS, MAX_DESCRIPTION_CHARS, MAX_SINGLE_RESOURCE_CHARS, MAX_SINGLE_PROMPT_CHARS, MAX_TOTAL_CONTENT_CHARS } from "@/lib/credits";
import { useDrafts, DRAFT_FREE_LIMIT } from "@/lib/use-drafts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Zap,
  FileText,
  Globe,
  Wrench,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Key,
  MessageSquare,
  Server,
  ArrowRight,
  Coins,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Auth label map ───────────────────────────────────────────────────────────

const AUTH_LABELS: Record<string, string> = {
  none: "No Auth",
  api_key: "API Key",
  bearer: "Bearer Token",
  oauth: "OAuth 2.0",
};

// ─── Progress steps shown during streaming ─────────────────────────────────────

const PROGRESS_STEPS = [
  { key: "pass1",    label: "Pass 1 — Designing tool schema contract" },
  { key: "pass2",    label: "Pass 2 — Writing TypeScript implementation" },
  { key: "pass3",    label: "Pass 3 — Running quality checklist" },
  { key: "protocol", label: "Checking MCP protocol compliance" },
  { key: "security", label: "Running 22 security checks" },
  { key: "saving",   label: "Saving your server" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Step5Review({ onSaveDraft, userId = "" }: { onSaveDraft?: () => void; userId?: string }) {
  const { description, serverName, apiConfig, apiDocContext, tools, resources, prompts, prevStep, nextStep, setGeneratedResult } = useGeneratorStore();

  const { saveDraft } = useDrafts(userId);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draftError, setDraftError] = useState<string | null>(null);

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [noCredits, setNoCredits]           = useState(false);
  const [balance, setBalance]               = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [activeStep, setActiveStep]         = useState<string | null>(null);

  // Fetch live credit balance on mount so we can show it in the cost card
  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits/balance")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled && data) setBalance(data.total as number); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function handleSaveAsDraft() {
    setDraftStatus("saving");
    setDraftError(null);
    const result = saveDraft({ serverName, description, apiConfig, tools, resources, prompts });
    if (result.ok) {
      setDraftStatus("saved");
      setTimeout(() => setDraftStatus("idle"), 3000);
      onSaveDraft?.();
    } else {
      setDraftStatus("error");
      setDraftError(result.reason ?? "Could not save draft.");
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setNoCredits(false);
    setCompletedSteps(new Set());
    setActiveStep(null);

    // Accumulate security data from the `type:"security"` SSE event
    let securityScore: number | undefined;
    let securityGrade: string | undefined;
    let blockDownload: boolean | undefined;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, serverName, apiConfig, tools, resources, prompts, apiDocContext }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setNoCredits(true);
          setBalance(body?.balance ?? 0);
          setLoading(false);
          return;
        }
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Local tracker for the current step — avoids stale closure from `activeStep` state
      // (on retry, `activeStep` in the closure still holds the previous run's last step)
      let currentStep: string | null = null;
      // Flag so we can break out of the outer while loop from the inner event loop
      let generationDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done || generationDone) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines — process each event sequentially with yield points
        // so React commits each step's state change as a separate render frame.
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "progress") {
            // flushSync forces React to render each step's state immediately,
            // even when multiple progress events arrive in the same SSE chunk.
            const prevStep = currentStep;
            currentStep = event.step;
            flushSync(() => {
              if (prevStep) setCompletedSteps((prev) => new Set([...prev, prevStep]));
              setActiveStep(event.step);
            });
          } else if (event.type === "security") {
            // Store security result — will be attached to generatedResult below
            securityScore = event.score as number;
            securityGrade = event.grade as string;
            blockDownload = event.blockDownload as boolean;
          } else if (event.type === "complete") {
            // Tick the last active step, pause briefly so user sees it, then mark all done
            const lastStep = currentStep;
            flushSync(() => {
              if (lastStep) setCompletedSteps((prev) => new Set([...prev, lastStep]));
            });
            await new Promise<void>((r) => setTimeout(r, 300));
            flushSync(() => {
              setCompletedSteps(new Set(PROGRESS_STEPS.map((s) => s.key)));
              setActiveStep(null);
            });
            setGeneratedResult({
              id: event.id,
              tools: (event.tools ?? tools) as ToolDefinition[],
              securityScore,
              securityGrade,
              blockDownload,
            });
            // Brief pause so user sees all 6 steps ticked before navigating
            setTimeout(() => nextStep(), 700);
            generationDone = true;
            break;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setActiveStep(null);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Review & Generate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Everything looks good? Hit generate and Claude will build your MCP server in seconds.
        </p>
      </div>
      {/* Credit cost card */}
      {(() => {
        const estimate = estimateCredits({ tools, resources, prompts, apiConfig, description });
        const canAfford = balance === null || balance >= estimate.cost;
        // Per-tier colour tokens
        const tierColor = !canAfford
          ? { border: "border-red-500/30 bg-red-500/5", icon: "text-red-500", badge: "bg-red-500/10 text-red-600 border-red-500/30" }
          : estimate.tier === 3
          ? { border: "border-orange-500/30 bg-orange-500/5", icon: "text-orange-500", badge: "bg-orange-500/10 text-orange-600 border-orange-500/30" }
          : estimate.tier === 2
          ? { border: "border-amber-500/30 bg-amber-500/5", icon: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 border-amber-500/30" }
          : { border: "border-primary/20 bg-primary/5", icon: "text-primary", badge: "bg-primary/10 text-primary border-primary/20" };
        return (
          <div className={cn("rounded-lg border px-4 py-3 flex items-center justify-between gap-3", tierColor.border)}>
            <div className="flex items-center gap-3">
              <Zap className={cn("h-5 w-5 flex-shrink-0", tierColor.icon)} />
              <div>
                <p className="text-sm font-medium">
                  Generation cost
                  <span className={cn("ml-2 text-xs font-normal px-1.5 py-0.5 rounded border", tierColor.badge)}>
                    {estimate.tierLabel}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {estimate.tier === 3
                    ? `Premium — ${estimate.reasons.join(", ")} · ≥11 tools or content >4,000 chars`
                    : estimate.tier === 2
                    ? `Complex — ${estimate.reasons.join(", ")} · 4–10 tools or content 2,001–4,000 chars`
                    : "Simple — ≤3 tools and content ≤2,000 chars"}
                  {balance !== null && (
                    <span className={cn("ml-2", !canAfford ? "text-red-500" : "")}>
                      &middot; Balance: {balance} credit{balance !== 1 ? "s" : ""}
                      {canAfford && ` \u2192 ${balance - estimate.cost} after`}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full border flex-shrink-0",
              tierColor.badge
            )}>
              <Coins className="h-3.5 w-3.5" />
              {estimate.cost} credit{estimate.cost > 1 ? "s" : ""}
            </span>
          </div>
        );
      })()}

      {/* Input limit violations — blocks generation */}
      {(() => {
        const limitErrors = validateInputLimits({ tools, resources, prompts, description });
        if (limitErrors.length === 0) return null;
        return (
          <div className="space-y-2">
            {limitErrors.map((err) => (
              <div key={err.code} className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-600">
                    {err.code === "TOOLS_LIMIT_EXCEEDED"             && `Tool limit — max ${MAX_TOOLS} tools`}
                    {err.code === "DESCRIPTION_LIMIT_EXCEEDED"       && `Description too long — max ${MAX_DESCRIPTION_CHARS.toLocaleString()} chars`}
                    {err.code === "RESOURCE_CONTENT_LIMIT_EXCEEDED"  && `Resource too large — max ${MAX_SINGLE_RESOURCE_CHARS.toLocaleString()} chars`}
                    {err.code === "PROMPT_CONTENT_LIMIT_EXCEEDED"    && `Prompt too large — max ${MAX_SINGLE_PROMPT_CHARS.toLocaleString()} chars`}
                    {err.code === "TOTAL_CONTENT_LIMIT_EXCEEDED"     && `Total content too large — max ${MAX_TOTAL_CONTENT_CHARS.toLocaleString()} chars`}
                  </p>
                  <p className="text-xs text-red-500/80 mt-0.5">{err.message}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Summary cards */}
      <div className="space-y-4">
        {/* 0 — Server Name (if set) */}
        {serverName && (
          <SummaryCard
            icon={<Server className="h-4 w-4" />}
            title="Server Name"
            badge="Step 1"
          >
            <p className="text-sm font-mono font-medium">{serverName}</p>
          </SummaryCard>
        )}

        {/* 1 — Description */}
        <SummaryCard
          icon={<FileText className="h-4 w-4" />}
          title="Description"
          badge="Step 1"
        >
          <p className="text-sm leading-relaxed text-foreground/80 line-clamp-5">
            {description}
          </p>
        </SummaryCard>

        {/* 2 — API Config */}
        <SummaryCard
          icon={<Globe className="h-4 w-4" />}
          title="API Configuration"
          badge="Step 2"
        >
          {!apiConfig.enabled ? (
            <p className="text-sm text-muted-foreground">
              No external API — local tools only
            </p>
          ) : (
            <dl className="space-y-1.5">
              <Row label="Base URL" value={apiConfig.baseUrl || "—"} mono />
              <Row label="Auth" value={AUTH_LABELS[apiConfig.authType]} />
              {apiConfig.apiDocUrl && <Row label="Docs" value={apiConfig.apiDocUrl} mono />}
              <Row
                label="Schema fields"
                value={String(apiConfig.inputSchema.length)}
              />
              <Row
                label="Env vars"
                value={String(apiConfig.configOptions.length)}
              />
            </dl>
          )}
        </SummaryCard>

        {/* 3 — Tools */}
        <SummaryCard
          icon={<Wrench className="h-4 w-4" />}
          title={`Tools (${tools.length})`}
          badge="Step 3"
        >
          <div className="space-y-2">
            {tools.map((tool, idx) => (
              <div
                key={tool.id}
                className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground w-5 flex-shrink-0 pt-0.5">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium text-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {tool.description}
                  </p>
                  {tool.fields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tool.fields.map((f) => (
                        <Badge
                          key={f.id}
                          variant="outline"
                          className="text-xs font-mono px-1.5 py-0"
                        >
                          {f.name}
                          <span className="ml-1 text-muted-foreground text-[10px]">
                            {f.type}
                          </span>
                          {f.required && (
                            <span className="ml-1 text-red-400 text-[10px]">*</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>

        {/* 4 — Resources & Prompts */}
        <SummaryCard
          icon={<BookOpen className="h-4 w-4" />}
          title={resources.length > 0 ? `Resources (${resources.length})` : "Resources"}
          badge="Step 4"
        >
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources added</p>
          ) : (
            <div className="space-y-1.5">
              {resources.map((r) => (
                <div key={r.id} className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium">{r.name || "(unnamed)"}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{r.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.mimeType} · {r.content.length.toLocaleString()} chars
                      {r.toolScope !== "all" && <span className="ml-1 text-primary">· scoped</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>

        {/* 5 — Prompts */}
        <SummaryCard
          icon={<MessageSquare className="h-4 w-4" />}
          title={prompts.length > 0 ? `Prompts (${prompts.length})` : "Prompts"}
          badge="Step 4"
        >
          {prompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prompts added</p>
          ) : (
            <div className="space-y-1.5">
              {prompts.map((p: PromptDefinition) => (
                <div key={p.id} className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium">{p.name || "(unnamed)"}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.mimeType} · {p.content.length.toLocaleString()} chars
                      {p.toolScope !== "all" && <span className="ml-1 text-primary">· scoped</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Estimated generation time:</span>
          <span className="font-medium">~30–45 seconds</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground">
            AI-generated code should be reviewed before production use. Always audit
            authentication handling and input validation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Secrets are never stored — only your config metadata</span>
        </div>
      </div>

      {/* No credits card */}
      {noCredits && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600">No credits remaining</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your balance is 0. Upgrade to Pro for 50 credits/month, or top up with a credit pack.
              </p>
            </div>
          </div>
          <a href="/pricing" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="w-full border-red-500/30 text-red-600 hover:bg-red-500/10">
              View plans &amp; pricing
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      )}

      {/* Generic error message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Loading state — live streaming progress */}
      {loading && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">3-pass generation in progress…</span>
          </div>
          <div className="space-y-2">
            {PROGRESS_STEPS.map(({ key, label }) => {
              const done = completedSteps.has(key);
              const active = activeStep === key;
              return (
                <div key={key} className="flex items-center gap-2.5">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border/50 flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      done ? "text-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground/50"
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Draft hint */}
      <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 flex items-start gap-2.5">
        <Save className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            Not ready to generate?{" "}
            <span className="font-medium text-foreground">Save as Draft</span> — stores your entire
            wizard configuration locally. Free plan: up to{" "}
            <span className="font-medium">{DRAFT_FREE_LIMIT}</span> drafts.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Draft name:{" "}
            <span className="font-medium text-foreground">
              {serverName.trim() || <span className="italic text-muted-foreground">same as server name</span>}
            </span>
          </p>
          {draftError && (
            <p className="text-xs text-red-500 mt-1">{draftError}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5 flex-shrink-0"
          onClick={handleSaveAsDraft}
          disabled={draftStatus === "saving"}
        >
          {draftStatus === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : draftStatus === "saved" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {draftStatus === "saved" ? "Saved!" : "Save as Draft"}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prevStep} disabled={loading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={
            loading ||
            (balance !== null && balance < estimateCredits({ tools, resources, prompts, apiConfig, description }).cost) ||
            validateInputLimits({ tools, resources, prompts, description }).length > 0
          }
          className="min-w-[200px] gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Generate MCP Server
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {title}
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            {badge}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-xs text-muted-foreground w-24 flex-shrink-0 pt-0.5">{label}</dt>
      <dd className={cn("text-xs flex-1 break-all", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
