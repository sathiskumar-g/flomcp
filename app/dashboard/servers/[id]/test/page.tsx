"use client";

/**
 * Task 4.1.1 — Mock Test UI
 *
 * Lets users simulate tool invocations against their generated MCP server.
 * NEVER executes the generated code — everything is static mock analysis.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Play,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  FileCode2,
  FlaskConical,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTools, runMockTest } from "@/lib/test/mock-runner";
import type { ParsedTool, MockTestResult } from "@/lib/test/mock-runner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServerStub {
  id: string;
  name: string;
  generated_code: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultInput(tool: ParsedTool): string {
  const obj: Record<string, unknown> = {};
  for (const p of tool.parameters) {
    if (!p.required) continue;
    switch (p.zodType) {
      case "string":  obj[p.name] = p.enumValues ? p.enumValues[0] : "example"; break;
      case "number":  obj[p.name] = 1; break;
      case "boolean": obj[p.name] = true; break;
      case "array":   obj[p.name] = []; break;
      case "enum":    obj[p.name] = p.enumValues?.[0] ?? "value"; break;
      default:        obj[p.name] = null;
    }
  }
  return JSON.stringify(obj, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MockTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [server, setServer] = useState<ServerStub | null>(null);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ParsedTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<ParsedTool | null>(null);
  const [inputJson, setInputJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MockTestResult | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/servers/${id}`);
      if (res.status === 401) { router.push("/auth/signin"); return; }
      if (res.ok) {
        const json = await res.json();
        const s = json.server as ServerStub | null;
        if (s) {
          setServer(s);
          const parsed = parseTools(s.generated_code ?? "");
          setTools(parsed);
          if (parsed.length > 0) {
            setSelectedTool(parsed[0]);
            setInputJson(buildDefaultInput(parsed[0]));
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [id, router]);

  const handleSelectTool = useCallback((tool: ParsedTool) => {
    setSelectedTool(tool);
    setInputJson(buildDefaultInput(tool));
    setResult(null);
    setJsonError(null);
  }, []);

  function handleInputChange(val: string) {
    setInputJson(val);
    setJsonError(null);
    setResult(null);
  }

  function handleRun() {
    if (!selectedTool || !server) return;

    // Validate JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputJson || "{}") as Record<string, unknown>;
    } catch (e) {
      setJsonError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }

    setRunning(true);
    setResult(null);

    // Simulate a short "run" delay for UX (no real execution)
    setTimeout(() => {
      const r = runMockTest(server.generated_code, selectedTool.name, parsed);
      setResult(r);
      setRunning(false);
    }, 600);
  }

  // ── Loading / error states ──────────────────────────────────────────────────

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
        <FileCode2 className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Server not found</h2>
        <p className="text-muted-foreground">This server may have been deleted or you don&apos;t have access.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackBar name={server.name} id={id} router={router} />
        <div className="text-center py-20 space-y-4">
          <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h2 className="text-xl font-semibold">No tools detected</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            The tool parser could not find any <code className="font-mono text-xs px-1 py-0.5 bg-muted rounded">server.tool()</code> definitions in the generated code.
          </p>
          <Button variant="outline" onClick={() => router.push(`/dashboard/servers/${id}`)}>
            <FileCode2 className="mr-2 h-4 w-4" /> View Server Code
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackBar name={server.name} id={id} router={router} />

      {/* Mock only disclaimer */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Mock testing only — your server is never executed</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-6">
          <div className="flex items-start gap-1.5 text-xs text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Validates input types and required fields against the Zod schema
          </div>
          <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Does NOT execute any logic — no real computed answer
          </div>
          <div className="flex items-start gap-1.5 text-xs text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Shows the expected response shape the tool would return
          </div>
          <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Does NOT make any real network or API requests
          </div>
          <div className="flex items-start gap-1.5 text-xs text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Shows which API URL the tool would call with your input
          </div>
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            To run for real: download the zip and run locally with Node.js
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tool selector */}
        <div className="md:col-span-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            Tools ({tools.length})
          </p>
          {tools.map((tool) => {
            const active = selectedTool?.name === tool.name;
            return (
              <button
                key={tool.name}
                onClick={() => handleSelectTool(tool)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all",
                  active
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
                )}
              >
                <Wrench className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-mono font-medium truncate", active && "text-primary")}>
                    {tool.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {tool.description}
                  </p>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Test panel */}
        <div className="md:col-span-2 space-y-4">
          {selectedTool && (
            <>
              {/* Tool header */}
              <Card className="border border-border/70 shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span className="font-mono">{selectedTool.name}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{selectedTool.description}</p>
                </CardHeader>
                {selectedTool.parameters.length > 0 && (
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTool.parameters.map((p) => (
                        <div
                          key={p.name}
                          className="inline-flex items-center gap-1.5 border border-border/50 rounded-md bg-muted/20 px-2 py-1"
                        >
                          <span className="text-[10px] font-mono font-medium">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground">{p.zodType}</span>
                          {!p.required && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0">optional</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* JSON input */}
              <Card className="border border-border/70 shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Input JSON
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  <textarea
                    value={inputJson}
                    onChange={(e) => handleInputChange(e.target.value)}
                    rows={8}
                    spellCheck={false}
                    aria-label="Tool input JSON"
                    className={cn(
                      "w-full rounded-md border bg-background px-3 py-2.5 text-xs font-mono",
                      "resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      "placeholder:text-muted-foreground transition-colors",
                      jsonError ? "border-red-500/60 focus:ring-red-500/40" : "border-border/60"
                    )}
                    placeholder='{ "param": "value" }'
                  />
                  {jsonError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      {jsonError}
                    </p>
                  )}
                  <Button
                    className="w-full gap-2"
                    onClick={handleRun}
                    disabled={running || !!jsonError}
                    aria-label="Run mock test"
                  >
                    {running ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {running ? "Running mock test…" : "Run Mock Test"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              {result && (
                <Card className={cn(
                  "border shadow-none",
                  result.inputValid ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                )}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {result.inputValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {result.inputValid ? "Valid Input — Mock Response" : "Validation Failed"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    {/* Validation errors */}
                    {result.validationErrors.length > 0 && (
                      <div className="space-y-1">
                        {result.validationErrors.map((e, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-red-600">
                            <XCircle className="h-3 w-3 flex-shrink-0" />
                            {e}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mock response */}
                    {result.inputValid && result.mockResponse !== null && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Expected Response Shape
                        </p>
                        <pre className="rounded-md border border-border/50 bg-background px-3 py-2.5 text-xs font-mono overflow-auto max-h-52 text-foreground/90">
                          {JSON.stringify(result.mockResponse, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Would call */}
                    {result.wouldCall && (
                      <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            Would Call
                          </p>
                          <p className="text-xs font-mono break-all mt-0.5">{result.wouldCall}</p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <p className="text-[11px] text-muted-foreground">{result.notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function BackBar({
  name,
  id,
  router,
}: {
  name: string;
  id: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0"
        onClick={() => router.push(`/dashboard/servers/${id}`)}
        aria-label="Back to server"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate">{name}</h1>
          <Badge variant="secondary" className="text-xs gap-1 flex-shrink-0">
            <FlaskConical className="h-3 w-3" />
            Mock Test
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Test your tools with sample inputs — no code is executed</p>
      </div>
    </div>
  );
}
