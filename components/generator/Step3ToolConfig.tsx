"use client";

/**
 * Step 3 — Tool Configuration
 *
 * On mount: calls /api/suggest-tools to get 3 AI-suggested tools pre-selected.
 * Users can remove suggestions they don't want, edit them, or add custom ones.
 */

import { useEffect, useRef, useState } from "react";
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
    setTools,
    setSuggestionsLoading,
    addTool,
    updateTool,
    removeTool,
    addToolField,
    updateToolField,
    removeToolField,
    nextStep,
    prevStep,
  } = useGeneratorStore();

  const [suggestedIds, setSuggestedIds] = useState<Set<string>>(new Set());
  // First tool starts expanded so users see it immediately
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(tools.length > 0 ? [tools[0].id] : [])
  );
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  // Track the most-recently manually added tool ID so we can auto-focus its name input
  const [newToolId, setNewToolId] = useState<string | null>(null);
  const fetched = useRef(false);

  // Fetch 3 AI suggestions on first mount if tools are still blank
  useEffect(() => {
    if (fetched.current) return;
    const allBlank = tools.every((t) => t.name === "");
    if (!allBlank) return;
    fetched.current = true;
    setSuggestionsLoading(true);
    setSuggestionError(null);

    fetch("/api/suggest-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.tools && Array.isArray(data.tools)) {
          setTools(data.tools);
          setSuggestedIds(new Set(data.tools.map((t: ToolDefinition) => t.id)));
          setExpandedIds(new Set(data.tools.map((t: ToolDefinition) => t.id)));
        } else {
          setSuggestionError("Could not load suggestions — add your tools manually.");
        }
      })
      .catch(() => setSuggestionError("Could not load suggestions — add your tools manually."))
      .finally(() => setSuggestionsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Define Your Tools</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We've suggested 3 tools based on your description. Remove any you don't need,
          edit them, or add custom ones.
        </p>
      </div>

      {/* Loading skeleton */}
      {suggestionsLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Asking Claude to suggest the best tools for your server…</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg border border-border/50 bg-muted/20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Suggestion error */}
      {suggestionError && !suggestionsLoading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {suggestionError}
        </div>
      )}

      {/* Tool cards */}
      {!suggestionsLoading && (
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

      {/* Add custom tool */}
      {!suggestionsLoading && (
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
            disabled={tools.length >= 25}
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
          {tools.length >= 25 && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Maximum 25 tools per server. Remove a tool to add another.
            </p>
          )}
        </>
      )}

      {/* Credit complexity badge + tier reference table */}
      {!suggestionsLoading && tools.length > 0 && (() => {
        const estimate = estimateCredits({ tools, resources, prompts, apiConfig, description });
        const tierColor =
          estimate.tier === 3 ? "text-orange-500" :
          estimate.tier === 2 ? "text-amber-500" : "text-primary";
        const badgeClass =
          estimate.tier === 3 ? "border-orange-500/30 bg-orange-500/10 text-orange-600" :
          estimate.tier === 2 ? "border-amber-500/30 bg-amber-500/10 text-amber-600" :
          "border-primary/20 bg-primary/10 text-primary";
        const TIERS = [
          { tier: 1 as const, label: "Simple",  cost: "1 credit",  rule: "≤5 tools · content ≤2,000 chars",             dotColor: "text-primary" },
          { tier: 2 as const, label: "Complex", cost: "2 credits", rule: "6–15 tools · OR content 2,001–5,000 chars",  dotColor: "text-amber-500" },
          { tier: 3 as const, label: "Premium", cost: "3 credits", rule: "≥16 tools · OR content >5,000 chars",          dotColor: "text-orange-500" },
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
              className="text-xs font-mono resize-none"
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
