"use client";

/**
 * Step 3 — Tool Configuration
 *
 * On mount: calls /api/suggest-tools to get 2 AI-suggested tools pre-selected.
 * Users can remove suggestions they don't want, edit them, or add custom ones.
 */

import { useState } from "react";
import {
  useGeneratorStore,
  type ToolDefinition,
  type SchemaField,
} from "@/lib/stores/generator-store";
import { estimateCredits } from "@/lib/credits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Wrench,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  FileJson,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_TYPES: SchemaField["type"][] = ["string", "number", "boolean", "object", "array"];

// ─── Component ────────────────────────────────────────────────────────────────

export function Step3ToolConfig() {
  const {
    description,
    tools,
    resources,
    prompts,
    apiConfig,
    suggestionsLoading,
    suggestedIds: suggestedIdsArr,
    setTools,
    setSuggestionsLoading,
    setSuggestedIds,
    addTool,
    updateTool,
    removeTool,
    addToolField,
    updateToolField,
    removeToolField,
    nextStep,
    prevStep,
  } = useGeneratorStore();

  const suggestedIds = new Set(suggestedIdsArr);
  // First tool starts expanded so users see it immediately
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(tools.length > 0 ? [tools[0].id] : [])
  );
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  // Track the most-recently manually added tool ID so we can auto-focus its name input
  const [newToolId, setNewToolId] = useState<string | null>(null);

  // Schema import modal state
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [schemaInput, setSchemaInput] = useState("");
  const [schemaParseError, setSchemaParseError] = useState<string | null>(null);
  const [schemaPreview, setSchemaPreview] = useState<ToolDefinition | null>(null);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [schemaParsedCount, setSchemaParsedCount] = useState(0);
  const [schemaSkippedCount, setSchemaSkippedCount] = useState(0);
  const [skippedNotice, setSkippedNotice] = useState<string | null>(null);

  function openSchemaModal() {
    setSchemaInput("");
    setSchemaParseError(null);
    setSchemaPreview(null);
    setSchemaParsedCount(0);
    setSchemaSkippedCount(0);
    setSampleOpen(false);
    setSchemaModalOpen(true);
  }

  const isBlankTool = (t: ToolDefinition) => t.name.trim() === "" && t.description.trim() === "";

  function runAISuggest() {
    if (suggestionsLoading) return;
    setSuggestionsLoading(true);
    setSuggestionError(null);
    setSkippedNotice(null);

    // Send existing non-blank tool names so Claude avoids suggesting duplicates
    const existingToolNames = tools.filter((t) => t.name.trim()).map((t) => t.name);

    fetch("/api/suggest-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, existingToolNames }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.tools && Array.isArray(data.tools)) {
          const existingNames = new Set(tools.map((t) => t.name));
          const toAdd = (data.tools as ToolDefinition[]).filter((t) => !existingNames.has(t.name));
          const skipped = data.tools.length - toAdd.length;
          // Drop blank placeholder tools before merging — keep only tools the user has filled in
          const filledTools = tools.filter((t) => !isBlankTool(t));
          setTools([...filledTools, ...toAdd]);
          setSuggestedIds(toAdd.map((t: ToolDefinition) => t.id));
          setExpandedIds(new Set(toAdd.map((t: ToolDefinition) => t.id)));
          if (skipped > 0) setSkippedNotice(`${skipped} suggested tool${skipped !== 1 ? "s" : ""} skipped — name already exists.`);
        } else {
          setSuggestionError("Could not load suggestions — add your tools manually.");
        }
      })
      .catch(() => setSuggestionError("Could not load suggestions — add your tools manually."))
      .finally(() => setSuggestionsLoading(false));
  }

  // ─── Schema Parser ────────────────────────────────────────────────────────
  const uid = () => Math.random().toString(36).slice(2, 9);

  function mapFieldType(raw: unknown): SchemaField["type"] {
    const t = String(raw ?? "string").toLowerCase();
    if (t === "integer") return "number";
    if (["string", "number", "boolean", "object", "array"].includes(t)) return t as SchemaField["type"];
    return "string";
  }

  function parseSingleTool(obj: Record<string, unknown>): ToolDefinition | null {
    const name = String(obj.name ?? obj.tool_name ?? obj.function_name ?? "").replace(/\s+/g, "_");
    if (!name) return null;
    const description = String(obj.description ?? obj.summary ?? "");
    const fields: SchemaField[] = [];
    const nativeFields = obj.fields as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(nativeFields)) {
      nativeFields.forEach((f) => {
        fields.push({ id: uid(), name: String(f.name ?? ""), type: mapFieldType(f.type), required: Boolean(f.required ?? true), description: String(f.description ?? "") });
      });
    } else {
      const schema = (obj.parameters ?? obj.inputSchema ?? obj.input_schema ?? obj.schema) as Record<string, unknown> | undefined;
      if (schema && typeof schema === "object") {
        const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
        const required = schema.required as string[] | undefined;
        if (props) {
          Object.entries(props).forEach(([pName, def]) => {
            fields.push({ id: uid(), name: pName, type: mapFieldType(def.type), required: Array.isArray(required) ? required.includes(pName) : true, description: String(def.description ?? "") });
          });
        }
      }
    }
    return { id: uid(), name, description, fields, exampleOutput: "" };
  }

  function parseSchemaJson(raw: string): ToolDefinition[] | string {
    try {
      const parsed = JSON.parse(raw.trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const result: ToolDefinition[] = [];
      const seenNames = new Set<string>();
      for (const item of items) {
        if (typeof item !== "object" || !item) continue;
        const tool = parseSingleTool(item as Record<string, unknown>);
        if (!tool) continue;
        // Deduplicate within the imported JSON itself — keep first occurrence
        if (seenNames.has(tool.name)) continue;
        seenNames.add(tool.name);
        result.push(tool);
      }
      if (result.length === 0) return "No recognisable tool structure found. Expected { name, description, parameters } or { name, description, fields }.";
      return result;
    } catch {
      return "Invalid JSON — please check your input.";
    }
  }

  function handleSchemaApply() {
    const result = parseSchemaJson(schemaInput);
    if (typeof result === "string") { setSchemaParseError(result); return; }
    // Drop blank placeholder tools before merging — keep only tools the user has filled in
    const filledTools = tools.filter((t) => !isBlankTool(t));
    const existingNames = new Set(filledTools.map((t) => t.name));
    const toAdd = result.filter((t) => !existingNames.has(t.name));
    const skipped = result.length - toAdd.length;
    setTools([...filledTools, ...toAdd]);
    setExpandedIds(new Set(toAdd.map((t) => t.id)));
    setSchemaModalOpen(false);
    setSchemaInput("");
    setSchemaParseError(null);
    setSchemaPreview(null);
    setSchemaParsedCount(0);
    setSchemaSkippedCount(0);
    if (skipped > 0) setSkippedNotice(`${skipped} tool${skipped !== 1 ? "s" : ""} skipped — name already exists.`);
  }

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allValid = tools.every(
    (t) => t.name.trim().length > 0 && t.description.trim().length > 0
  );
  const canContinue = tools.length > 0 && allValid;

  return (
    <div className="space-y-6">
      {/* Header + top action buttons */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Define Your Tools</h2>
          <p className="text-sm text-muted-foreground mt-1">
            At least one tool is required to continue.{" "}
            <span className="text-foreground/70">Use <strong>Generate Tools</strong> to get 2 AI-suggested tools instantly, or import an existing JSON schema.</span>
          </p>
        </div>
        {/* Always-visible action buttons */}
        <div className="flex gap-2">
          <Button onClick={runAISuggest} disabled={suggestionsLoading} className="gap-2">
            {suggestionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {suggestionsLoading ? "Generating…" : "Generate Tools"}
          </Button>
          <Button variant="outline" onClick={openSchemaModal} disabled={suggestionsLoading} className="gap-2">
            <FileJson className="h-4 w-4" />
            Import Schema
          </Button>
        </div>
      </div>

      {/* Suggestion error */}
      {suggestionError && !suggestionsLoading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {suggestionError}
        </div>
      )}

      {/* Skipped notice — shown when duplicate tool names were skipped */}
      {skippedNotice && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-2 text-sm text-amber-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {skippedNotice}
          </div>
          <button onClick={() => setSkippedNotice(null)} className="text-amber-500 hover:text-amber-700 text-xs underline shrink-0">Dismiss</button>
        </div>
      )}

      {/* Empty state — shown when no tools, not loading */}
      {!suggestionsLoading && tools.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 border border-border mx-auto mb-3">
            <Wrench className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No tools yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click <strong>Generate Tools</strong> above to get 2 AI-suggested tools, or import a schema.</p>
        </div>
      )}

      {/* Tool cards — always visible so existing tools stay put during generate */}
      {tools.length > 0 && (
        <div className="space-y-3">
          {tools.map((tool, idx) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={idx}
              isSuggested={suggestedIds.has(tool.id)}
              isExpanded={expandedIds.has(tool.id)}
              autoFocusName={newToolId === tool.id}
              canRemove={tools.length > 1}
              onToggleExpand={() => toggleExpand(tool.id)}
              onUpdate={(patch) => updateTool(tool.id, patch)}
              onRemove={() => removeTool(tool.id)}
              onAddField={() => addToolField(tool.id)}
              onUpdateField={(fid, patch) => updateToolField(tool.id, fid, patch)}
              onRemoveField={(fid) => removeToolField(tool.id, fid)}
            />
          ))}
        </div>
      )}

      {/* Inline loading skeleton — appended below existing tools while generating */}
      {suggestionsLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{tools.length > 0 ? "Adding AI-suggested tools…" : "Asking Claude to suggest tools for your server…"}</span>
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg border border-border/50 bg-muted/20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Add custom tool (only shown when tools exist) */}
      {tools.length > 0 && (
        <>
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => {
              const newId = Math.random().toString(36).slice(2, 9);
              addTool(newId);
              setExpandedIds((prev) => new Set([...prev, newId]));
              setNewToolId(newId);
            }}
            disabled={tools.length >= 25 || suggestionsLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Tool
            {tools.length >= 25
              ? <Badge variant="destructive" className="ml-2 text-xs">Max 25 reached</Badge>
              : tools.length >= 20
              ? <Badge variant="secondary" className="ml-2 text-xs">{tools.length}/25</Badge>
              : null
            }
          </Button>
          {tools.length >= 20 && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Maximum 20 tools per server. Remove a tool to add another.
            </p>
          )}
        </>
      )}

      {/* Credit complexity badge + tier reference table */}
      {tools.length > 0 && (() => {
        const estimate = estimateCredits({ tools, resources, prompts, apiConfig, description });
        const tierColor =
          estimate.tier === 3 ? "text-orange-500" :
          estimate.tier === 2 ? "text-amber-500" : "text-primary";
        const badgeClass =
          estimate.tier === 3 ? "border-orange-500/30 bg-orange-500/10 text-orange-600" :
          estimate.tier === 2 ? "border-amber-500/30 bg-amber-500/10 text-amber-600" :
          "border-primary/20 bg-primary/10 text-primary";
        const TIERS = [
          { tier: 1 as const, label: "Simple",  cost: "1 credit",  rule: "≤3 tools · content ≤2,000 chars",             dotColor: "text-primary" },
          { tier: 2 as const, label: "Complex", cost: "2 credits", rule: "4–10 tools · OR content 2,001–5,000 chars",  dotColor: "text-amber-500" },
          { tier: 3 as const, label: "Premium", cost: "3 credits", rule: "11–20 tools · OR content >5,000 chars",          dotColor: "text-orange-500" },
        ] as const;
        return (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            {/* Cost header row */}
            <div className="flex items-center gap-2 bg-muted/20 px-4 py-2.5 text-sm">
              <Zap className={cn("h-4 w-4 flex-shrink-0", tierColor)} />
              <span className="text-muted-foreground">Generation cost:</span>
              <span className={cn("font-semibold", tierColor)}>
                {estimate.cost} credit{estimate.cost > 1 ? "s" : ""}
              </span>
              <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded border", badgeClass)}>
                {estimate.tierLabel}
              </span>
              {estimate.reasons.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1 hidden sm:inline truncate">
                  — {estimate.reasons.join(", ")}
                </span>
              )}
            </div>
            {/* Tier reference rows */}
            <div className="divide-y divide-border/40 border-t border-border/60">
              {TIERS.map(row => {
                const active = estimate.tier === row.tier;
                return (
                  <div
                    key={row.tier}
                    className={cn(
                      "grid items-center gap-x-3 px-4 py-1.5 text-xs",
                      "grid-cols-[70px_80px_1fr]",
                      active ? "bg-muted/50" : ""
                    )}
                  >
                    <span className={cn("font-medium flex items-center gap-1", active ? row.dotColor : "text-muted-foreground")}>
                      {active ? "▸" : "○"} {row.label}
                    </span>
                    <span className={cn("tabular-nums", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {row.cost}
                    </span>
                    <span className={active ? "text-foreground" : "text-muted-foreground"}>
                      {row.rule}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Validation hint */}
      {!suggestionsLoading && !allValid && tools.length > 0 && (
        <p className="text-xs text-amber-500 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          Every tool needs a name and description before continuing
        </p>
      )}

      {/* Schema Import Modal */}
      <Dialog open={schemaModalOpen} onOpenChange={setSchemaModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileJson className="h-4 w-4 text-primary" />
              Import Tool Schema
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paste an array of tool objects — supports OpenAI function format, MCP inputSchema, or FloMCP native.
              {tools.length > 0 && (
                <span className="text-primary font-medium"> Imported tools will be added to your {tools.length} existing tool{tools.length !== 1 ? "s" : ""}.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">

            {/* Sample schema accordion */}
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setSampleOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-xs"
              >
                <span className="flex items-center gap-2 font-medium">
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground", sampleOpen && "rotate-180")} />
                  See example schema (array of 2 tools)
                </span>
                <span className="text-muted-foreground">expand to see format</span>
              </button>
              {sampleOpen && (
                <div className="border-t border-border/50 bg-muted/10">
                  <pre className="text-[11px] font-mono p-3 overflow-x-auto leading-relaxed text-foreground/80">{`[
  {
    "name": "get_weather",
    "description": "Get current weather for a city",
    "parameters": {
      "properties": {
        "city":  { "type": "string",  "description": "City name" },
        "units": { "type": "string",  "description": "celsius or fahrenheit" }
      },
      "required": ["city"]
    }
  },
  {
    "name": "search_web",
    "description": "Search the web and return results",
    "parameters": {
      "properties": {
        "query": { "type": "string", "description": "Search query" },
        "limit": { "type": "number", "description": "Max results (default 5)" }
      },
      "required": ["query"]
    }
  }
]`}</pre>
                  <div className="px-3 pb-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                    <span className="flex items-center gap-1"><code className="bg-muted px-1 rounded">name</code> → tool function name</span>
                    <span className="flex items-center gap-1"><code className="bg-muted px-1 rounded">description</code> → what the tool does</span>
                    <span className="flex items-center gap-1"><code className="bg-muted px-1 rounded">parameters.properties</code> → input fields</span>
                    <span className="flex items-center gap-1"><code className="bg-muted px-1 rounded">required</code> → required field names</span>
                  </div>
                </div>
              )}
            </div>

            <Textarea
              value={schemaInput}
              onChange={(e) => {
                setSchemaInput(e.target.value);
                setSchemaParseError(null);
                if (e.target.value.trim()) {
                  const r = parseSchemaJson(e.target.value);
                  if (typeof r !== "string") {
                    const existingNames = new Set(tools.map((t) => t.name));
                    const newOnes = r.filter((t) => !existingNames.has(t.name));
                    setSchemaPreview(newOnes[0] ?? r[0]);
                    setSchemaParsedCount(newOnes.length);
                    setSchemaSkippedCount(r.length - newOnes.length);
                  } else {
                    setSchemaPreview(null);
                    setSchemaParsedCount(0);
                    setSchemaSkippedCount(0);
                  }
                } else {
                  setSchemaPreview(null);
                  setSchemaParsedCount(0);
                  setSchemaSkippedCount(0);
                }
              }}
              placeholder={`Paste an array of tool objects here.\n\n[\n  {\n    "name": "tool_name",\n    "description": "What this tool does",\n    "parameters": {\n      "properties": {\n        "param": { "type": "string" }\n      },\n      "required": ["param"]\n    }\n  },\n  {\n    "name": "another_tool",\n    ...\n  }\n]`}
              rows={11}
              className="text-xs font-mono resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {schemaParseError && (
              <div className="flex items-start gap-2 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {schemaParseError}
              </div>
            )}
            {schemaPreview && !schemaParseError && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 overflow-hidden">
                <div className="px-3 py-2 border-b border-green-500/20 flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      {schemaParsedCount} tool{schemaParsedCount !== 1 ? "s" : ""} will be added
                      {schemaSkippedCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 ml-1">
                          · {schemaSkippedCount} duplicate name{schemaSkippedCount !== 1 ? "s" : ""} skipped
                        </span>
                      )}
                    </span>
                  </div>
                  {tools.length > 0 && schemaParsedCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">{tools.length} existing + {schemaParsedCount} new = {tools.length + schemaParsedCount} total</span>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <code className="text-xs font-mono font-semibold text-foreground">{schemaPreview.name}</code>
                  {schemaPreview.description && (
                    <p className="text-xs text-muted-foreground">{schemaPreview.description}</p>
                  )}
                  {schemaPreview.fields.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {schemaPreview.fields.map((f, fi) => (
                        <span
                          key={fi}
                          className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] rounded px-1.5 py-0.5 font-mono border",
                            f.required ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border/60 text-muted-foreground"
                          )}
                        >
                          {f.name}<span className="opacity-60">:{f.type}</span>
                          {f.required && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2 border-t border-border/40">
            <Button variant="ghost" onClick={() => setSchemaModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSchemaApply} disabled={!schemaInput.trim() || schemaParsedCount === 0}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {schemaParsedCount > 0
                ? `Add ${schemaParsedCount} Tool${schemaParsedCount !== 1 ? "s" : ""}`
                : "Add Tools"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canContinue || suggestionsLoading} className="min-w-[160px]">
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

type ToolCardProps = {
  tool: ToolDefinition;
  index: number;
  isSuggested: boolean;
  isExpanded: boolean;
  autoFocusName?: boolean;
  canRemove: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<Pick<ToolDefinition, "name" | "description" | "exampleOutput">>) => void;
  onRemove: () => void;
  onAddField: () => void;
  onUpdateField: (fieldId: string, patch: Partial<Omit<SchemaField, "id">>) => void;
  onRemoveField: (fieldId: string) => void;
};

function ToolCard({
  tool,
  index,
  isSuggested,
  isExpanded,
  autoFocusName,
  canRemove,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAddField,
  onUpdateField,
  onRemoveField,
}: ToolCardProps) {
  return (
    <Card className="border border-border/70 shadow-none">
      {/* Always-visible header */}
      <CardHeader className={cn("pt-3 px-4", isExpanded ? "pb-0" : "pb-3")}>
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary flex-shrink-0" />
          <span
            className={cn(
              "text-sm font-mono font-medium flex-1 truncate",
              !tool.name && "text-muted-foreground italic"
            )}
          >
            {tool.name || `tool_${index + 1}`}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            {isSuggested && (
              <Badge variant="secondary" className="text-xs gap-1 h-5 px-1.5">
                <Sparkles className="h-2.5 w-2.5" />
                AI Suggested
              </Badge>
            )}
            {canRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-500"
                onClick={onRemove}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {!isExpanded && tool.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {tool.description}
          </p>
        )}
      </CardHeader>

      {/* Expanded editor */}
      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tool Name
            </label>
            <Input
              value={tool.name}
              onChange={(e) =>
                onUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })
              }
              placeholder="e.g. get_weather"
              className="font-mono text-sm"
              autoFocus={autoFocusName}
            />
            <p className="text-xs text-muted-foreground">
              Snake_case — this is what Claude calls when using your tool
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={tool.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="What does this tool do?"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Input Parameters
              </label>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={onAddField}>
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {tool.fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">No parameters — runs with no inputs</p>
            ) : (
              <div className="space-y-1.5">
                {tool.fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    onChange={(patch) => onUpdateField(field.id, patch)}
                    onRemove={() => onRemoveField(field.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expected Output / Sample Response{" "}
              <span className="normal-case text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <Textarea
              value={tool.exampleOutput ?? ""}
              onChange={(e) => onUpdate({ exampleOutput: e.target.value })}
              placeholder={`e.g. { "id": 123, "status": "active", "name": "Acme Corp" }\n\nor describe it: "Returns a list of customer objects with id, name, email and plan."`}
              rows={3}
              className="text-xs font-mono resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <p className="text-xs text-muted-foreground">
              Paste a real API response or describe the return shape — Claude will generate more accurate parsing logic.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: SchemaField;
  onChange: (patch: Partial<Omit<SchemaField, "id">>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2">
      <Input
        value={field.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="param_name"
        className="text-xs font-mono h-7 flex-1 min-w-0"
      />

      <select
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value as SchemaField["type"] })}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground flex-shrink-0 dark:[color-scheme:dark]"
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <Input
        value={field.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Description"
        className="text-xs h-7 flex-[2] min-w-0"
      />

      <button
        onClick={() => onChange({ required: !field.required })}
        className={cn(
          "text-xs px-2 py-1 rounded-md border transition-colors flex-shrink-0 h-7",
          field.required
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:bg-muted"
        )}
      >
        {field.required ? "Req" : "Opt"}
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-red-500 flex-shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
