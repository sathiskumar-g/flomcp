"use client";

/**
 * Step 4 — Review & Generate
 *
 * Read-only summary of all previous steps.
 * Fires POST /api/generate to trigger Claude code generation.
 */

import { useState } from "react";
import { useGeneratorStore, type ToolDefinition } from "@/lib/stores/generator-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Zap,
  FileText,
  Globe,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Key,
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
  { key: "analyzing", label: "Analyzing your requirements" },
  { key: "schema",    label: "Designing tool schemas" },
  { key: "coding",   label: "Writing TypeScript code" },
  { key: "security", label: "Adding security best practices" },
  { key: "saving",   label: "Saving your server" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Step4Review() {
  const { description, apiConfig, tools, prevStep, nextStep, setGeneratedResult } = useGeneratorStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [activeStep, setActiveStep] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCompletedSteps(new Set());
    setActiveStep(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, apiConfig, tools }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "progress") {
            // Mark previous active as complete
            if (activeStep) {
              setCompletedSteps((prev) => new Set([...prev, activeStep]));
            }
            setActiveStep(event.step);
          } else if (event.type === "complete") {
            // Mark all steps done
            setCompletedSteps(new Set(PROGRESS_STEPS.map((s) => s.key)));
            setActiveStep(null);
            setGeneratedResult({
              id: event.id,
              tools: (event.tools ?? tools) as ToolDefinition[],
            });
            nextStep(); // → Step 5: PostGenerationReview
            return;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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

      {/* Summary cards */}
      <div className="space-y-4">
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
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Estimated generation time:</span>
          <span className="font-medium">~20–30 seconds</span>
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

      {/* Error message */}
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
            <span className="text-sm font-medium">Claude is building your MCP server…</span>
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

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prevStep} disabled={loading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={loading}
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
