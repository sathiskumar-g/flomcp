"use client";

/**
 * Step 4 — Resources & Prompts
 *
 * Two tabs: Resources (docs/data/schemas) and Prompts (message templates).
 *
 * Each tab has:
 *   1. Drag & drop / Browse zone at top — files auto-populate content
 *   2. "Add Custom " button — opens a blank form
 *   3. Expandable cards — name, tool scope, description, MIME, content
 */

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  useGeneratorStore,
  type ResourceDefinition,
  type PromptDefinition,
  type ResourceMimeType,
  type PromptMimeType,
  type ToolDefinition,
} from "@/lib/stores/generator-store";
import { useSavedPrompts, PROMPT_FREE_LIMIT } from "@/lib/use-saved-prompts";
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
  BookOpen,
  ChevronDown,
  ChevronUp,
  Upload,
  MessageSquare,
  Wrench,
  BookMarked,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_TOTAL_CONTENT_CHARS } from "@/lib/credits";

// --- Constants ----------------------------------------------------------------

const RESOURCE_MIME_OPTIONS: { value: ResourceMimeType; label: string; hint: string }[] = [
  { value: "text/plain",       label: "Plain Text", hint: "Notes, data, general text" },
  { value: "text/markdown",    label: "Markdown",   hint: "Docs, README-style content" },
  { value: "application/json", label: "JSON",       hint: "Schemas, config, structured data" },
];

const PROMPT_MIME_OPTIONS: { value: PromptMimeType; label: string; hint: string }[] = [
  { value: "text/plain",    label: "Plain Text", hint: "General guidance" },
  { value: "text/markdown", label: "Markdown",   hint: "Structured prompt templates" },
];

const RESOURCE_ACCEPT = ".txt,.md,.mdx,.json";
const PROMPT_ACCEPT   = ".txt,.md,.mdx";
const MAX_CONTENT_LEN = 10_000;

type ActiveTab = "resources" | "prompts";

// --- Main component -----------------------------------------------------------

export function Step4Resources() {
  const {
    resources, addResource, updateResource, removeResource, addResourceFromFile,
    prompts,   addPrompt,  updatePrompt,  removePrompt,  addPromptFromFile,
    tools,
    nextStep, prevStep,
  } = useGeneratorStore();

  const [activeTab, setActiveTab]         = useState<ActiveTab>("resources");
  const [isDragging, setIsDragging]        = useState(false);
  const [expandedIds, setExpandedIds]      = useState<Set<string>>(new Set());
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const prevResLen    = useRef(resources.length);
  const prevProLen    = useRef(prompts.length);

  const { prompts: savedLibraryPrompts } = useSavedPrompts();

  const isResourcesTab = activeTab === "resources";
  const totalCount     = resources.length + prompts.length;

  const totalContentChars =
    resources.reduce((s, r) => s + r.content.length, 0) +
    prompts.reduce((s, p) => s + p.content.length, 0);

  // Auto-expand newly added items
  useEffect(() => {
    if (resources.length > prevResLen.current) {
      const last = resources[resources.length - 1];
      if (last) setExpandedIds(prev => new Set([...prev, last.id]));
    }
    prevResLen.current = resources.length;
  }, [resources]);

  useEffect(() => {
    if (prompts.length > prevProLen.current) {
      const last = prompts[prompts.length - 1];
      if (last) setExpandedIds(prev => new Set([...prev, last.id]));
    }
    prevProLen.current = prompts.length;
  }, [prompts]);

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAddCustom() {
    if (isResourcesTab) addResource(); else addPrompt();
  }

  function processFiles(files: FileList | File[]) {
    Array.from(files).forEach(file => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (isResourcesTab) {
        if (["txt", "md", "mdx", "json"].includes(ext)) addResourceFromFile(file);
      } else {
        if (["txt", "md", "mdx"].includes(ext)) addPromptFromFile(file);
      }
    });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) { processFiles(e.target.files); e.target.value = ""; }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Resources & Prompts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — attach content and prompt templates your MCP server can reference.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-lg p-1 gap-1">
        {(["resources", "prompts"] as ActiveTab[]).map(tab => {
          const count = tab === "resources" ? resources.length : prompts.length;
          const Icon  = tab === "resources" ? BookOpen : MessageSquare;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 text-sm rounded-md py-2 transition-all font-medium capitalize",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab}
              {count > 0 && (
                <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px] leading-none">
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Combined content pool meter */}
      {totalCount > 0 && (
        <div className={cn(
          "rounded-lg border px-3 py-2 flex items-center justify-between text-xs",
          totalContentChars > MAX_TOTAL_CONTENT_CHARS
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : totalContentChars > MAX_TOTAL_CONTENT_CHARS * 0.8
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
              : "bg-muted/40 border-border/50 text-muted-foreground"
        )}>
          <span>Combined content (resources + prompts)</span>
          <span className="font-mono font-medium tabular-nums">
            {totalContentChars.toLocaleString()} / {MAX_TOTAL_CONTENT_CHARS.toLocaleString()} chars
          </span>
        </div>
      )}

      {/* Info banner */}
      <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5 text-xs text-muted-foreground">
        {isResourcesTab ? (
          <>
            <strong className="text-foreground">Resources</strong> — static content embedded in your server and served via{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded">resource://server/name</code>.
            Accepts <strong>.txt  .md  .json</strong>.
          </>
        ) : (
          <>
            <strong className="text-foreground">Prompts</strong> — reusable message templates that guide the AI through workflows.
            Link to a specific tool or all tools. Accepts <strong>.txt  .md</strong>.
          </>
        )}
      </div>

      {/* DRAG & DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed transition-all p-6 flex flex-col items-center gap-3 text-center",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
          isDragging ? "bg-primary/15" : "bg-muted"
        )}>
          <Upload className={cn("h-5 w-5 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isDragging
              ? `Drop to add ${isResourcesTab ? "resource" : "prompt"}`
              : `Drop ${isResourcesTab ? "resource" : "prompt"} files here`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isResourcesTab ? ".txt  .md  .json" : ".txt  .md"} — content auto-fills
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept={isResourcesTab ? RESOURCE_ACCEPT : PROMPT_ACCEPT}
          onChange={handleFileChange}
        />
      </div>

      {/* ADD CUSTOM / FROM LIBRARY BUTTONS */}
      <div className="flex justify-center gap-2">
        {/* From Library dropdown — prompts tab only */}
        {!isResourcesTab && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLibraryDropdown(v => !v)}
              className="gap-1.5 border-dashed"
            >
              <BookMarked className="h-3.5 w-3.5" />
              From Library
              <ChevronDown className={cn("h-3 w-3 transition-transform", showLibraryDropdown && "rotate-180")} />
            </Button>
            {showLibraryDropdown && (
              <div className="absolute left-0 top-full mt-1 w-72 rounded-lg border border-border/70 bg-card shadow-md z-20">
                <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
                  <p className="text-xs font-medium">Saved Prompts ({savedLibraryPrompts.length}/{PROMPT_FREE_LIMIT})</p>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowLibraryDropdown(false)} aria-label="Close">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {savedLibraryPrompts.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-4 text-center">No saved prompts. Add them in the Library page.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto py-1">
                    {savedLibraryPrompts.map((sp) => (
                      <button
                        key={sp.id}
                        className="w-full px-3 py-2 hover:bg-muted/40 text-left"
                        onClick={() => {
                          addPrompt();
                          const last = useGeneratorStore.getState().prompts.slice(-1)[0];
                          if (last) {
                            updatePrompt(last.id, {
                              name: sp.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
                              content: sp.text,
                              mimeType: "text/plain",
                            });
                          }
                          setShowLibraryDropdown(false);
                        }}
                      >
                        <p className="text-xs font-medium truncate">{sp.name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{sp.text}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCustom}
          className="gap-1.5 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom {isResourcesTab ? "Resource" : "Prompt"}
        </Button>
      </div>

      {/* ITEMS LIST */}
      {isResourcesTab && resources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0.5">
            Resources ({resources.length})
          </p>
          {resources.map((r, idx) => (
            <ResourceCard
              key={r.id}
              resource={r}
              index={idx}
              expanded={expandedIds.has(r.id)}
              onToggle={() => toggleExpand(r.id)}
              onChange={patch => updateResource(r.id, patch)}
              onRemove={() => removeResource(r.id)}
              tools={tools}
            />
          ))}
        </div>
      )}

      {!isResourcesTab && prompts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0.5">
            Prompts ({prompts.length})
          </p>
          {prompts.map((p, idx) => (
            <PromptCard
              key={p.id}
              prompt={p}
              index={idx}
              expanded={expandedIds.has(p.id)}
              onToggle={() => toggleExpand(p.id)}
              onChange={patch => updatePrompt(p.id, patch)}
              onRemove={() => removePrompt(p.id)}
              tools={tools}
            />
          ))}
        </div>
      )}

      {((isResourcesTab && resources.length === 0) || (!isResourcesTab && prompts.length === 0)) && (
        <p className="text-center text-sm text-muted-foreground py-2">
          No {isResourcesTab ? "resources" : "prompts"} yet — drop files above or add a custom one.
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>
          <ChevronLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        {totalCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Auto-saved
          </span>
        )}
        <Button onClick={nextStep}>
          {totalCount === 0 ? "Skip" : "Continue"}
          <ChevronRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

// --- Resource card ------------------------------------------------------------

interface ResourceCardProps {
  resource: ResourceDefinition;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Omit<ResourceDefinition, "id">>) => void;
  onRemove: () => void;
  tools: ToolDefinition[];
}

function ResourceCard({ resource, index, expanded, onToggle, onChange, onRemove, tools }: ResourceCardProps) {
  const chars     = resource.content.length;
  const overLimit = chars > MAX_CONTENT_LEN;
  const isValid   = !!(resource.name.trim() && resource.content.trim());

  return (
    <ItemCard
      icon={<BookOpen className="h-3 w-3 text-primary" />}
      label={resource.name.trim() || `Resource ${index + 1}`}
      sublabel={resource.description}
      badge={RESOURCE_MIME_OPTIONS.find(m => m.value === resource.mimeType)?.label ?? "Text"}
      expanded={expanded}
      onToggle={onToggle}
      onRemove={onRemove}
      isValid={isValid}
    >
      <NameField
        value={resource.name}
        onChange={name => onChange({ name })}
        uriPrefix="resource://server/"
      />
      <DescriptionField value={resource.description} onChange={description => onChange({ description })} />
      <ToolScopeField value={resource.toolScope} onChange={toolScope => onChange({ toolScope })} tools={tools} />
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content type</label>
        <div className="flex gap-2">
          {RESOURCE_MIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ mimeType: opt.value })}
              className={cn(
                "flex-1 text-xs rounded-md border px-2 py-1.5 transition-all text-left",
                resource.mimeType === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5 hidden sm:block">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>
      <ContentField
        value={resource.content}
        onChange={content => onChange({ content })}
        mimeType={resource.mimeType}
        chars={chars}
        overLimit={overLimit}
      />
    </ItemCard>
  );
}

// --- Prompt card --------------------------------------------------------------

interface PromptCardProps {
  prompt: PromptDefinition;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Omit<PromptDefinition, "id">>) => void;
  onRemove: () => void;
  tools: ToolDefinition[];
}

function PromptCard({ prompt, index, expanded, onToggle, onChange, onRemove, tools }: PromptCardProps) {
  const chars     = prompt.content.length;
  const overLimit = chars > MAX_CONTENT_LEN;
  const { prompts: lib, savePrompt: saveToLib } = useSavedPrompts();
  const libraryFull = lib.length >= PROMPT_FREE_LIMIT;

  return (
    <ItemCard
      icon={<MessageSquare className="h-3 w-3 text-primary" />}
      label={prompt.name.trim() || `Prompt ${index + 1}`}
      sublabel={prompt.description}
      badge={PROMPT_MIME_OPTIONS.find(m => m.value === prompt.mimeType)?.label ?? "Text"}
      expanded={expanded}
      onToggle={onToggle}
      onRemove={onRemove}
      isValid={!!(prompt.name.trim() && prompt.content.trim())}
    >
      <NameField
        value={prompt.name}
        onChange={name => onChange({ name })}
        uriPrefix="prompt://"
        placeholder="e.g. sales-context, data-analysis-guide"
      />
      <DescriptionField value={prompt.description} onChange={description => onChange({ description })} />
      <ToolScopeField value={prompt.toolScope} onChange={toolScope => onChange({ toolScope })} tools={tools} />
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content type</label>
        <div className="flex gap-2">
          {PROMPT_MIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ mimeType: opt.value as PromptMimeType })}
              className={cn(
                "flex-1 text-xs rounded-md border px-2 py-1.5 transition-all text-left",
                prompt.mimeType === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5 hidden sm:block">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>
      <ContentField
        value={prompt.content}
        onChange={content => onChange({ content })}
        mimeType={prompt.mimeType}
        chars={chars}
        overLimit={overLimit}
        promptStyle
      />
      {/* Save to Prompt Library */}
      {prompt.content.trim() && (
        <div className="pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground -ml-1"
            disabled={libraryFull}
            onClick={() => {
              const result = saveToLib(
                prompt.name.trim() || `Prompt ${index + 1}`,
                prompt.content,
                prompt.mimeType as "text/plain" | "text/markdown"
              );
              if (result.ok) {
                toast.success("Prompt saved to library");
              } else {
                toast.error(result.reason ?? "Could not save");
              }
            }}
          >
            <BookMarked className="h-3.5 w-3.5" />
            {libraryFull ? `Library full (${PROMPT_FREE_LIMIT}/${PROMPT_FREE_LIMIT})` : "Save to Prompt Library"}
          </Button>
        </div>
      )}
    </ItemCard>
  );
}

// --- Shared item card shell ---------------------------------------------------

function ItemCard({
  icon, label, sublabel, badge, expanded, onToggle, onRemove, isValid, children,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge: string;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  isValid: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("transition-all", !isValid && label && "border-amber-300 dark:border-amber-700")}>
      <CardHeader className="p-3">
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <div className="flex-shrink-0 h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">{label}</span>
              {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
            </div>
            <Badge variant="outline" className="text-xs shrink-0">{badge}</Badge>
          </button>
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label={expanded ? "Collapse" : "Expand"}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-3 pb-3 space-y-3 border-t pt-3">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// --- Shared form fields -------------------------------------------------------

function NameField({
  value, onChange, uriPrefix,
  placeholder = "e.g. company-overview, api-schema",
}: {
  value: string;
  onChange: (v: string) => void;
  uriPrefix: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        Name <span className="text-destructive">*</span>
      </label>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(
          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
        )}
        className="font-mono text-sm h-8"
      />
      <p className="text-xs text-muted-foreground mt-1">
        URI: <code className="font-mono text-xs">{uriPrefix}{value || "name"}</code>
      </p>
    </div>
  );
}

function DescriptionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
      <Input
        placeholder="Brief description of what this contains"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm h-8"
      />
    </div>
  );
}

function ToolScopeField({
  value, onChange, tools,
}: {
  value: string;
  onChange: (v: string) => void;
  tools: ToolDefinition[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        <span className="flex items-center gap-1.5">
          <Wrench className="h-3 w-3" />
          Linked to tool
        </span>
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm rounded-md border border-input bg-background px-3 h-8 text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:[color-scheme:dark]"
      >
        <option value="all">All Tools</option>
        {tools.filter(t => t.name.trim()).map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-1">
        {value === "all"
          ? "Available to all tools"
          : `Linked to: ${tools.find(t => t.id === value)?.name ?? "selected tool"}`}
      </p>
    </div>
  );
}

function ContentField({
  value, onChange, mimeType, chars, overLimit, promptStyle = false,
}: {
  value: string;
  onChange: (v: string) => void;
  mimeType: string;
  chars: number;
  overLimit: boolean;
  promptStyle?: boolean;
}) {
  const placeholder =
    mimeType === "application/json"
      ? '{\n  "key": "value"\n}'
      : mimeType === "text/markdown"
      ? "# Title\n\nYour content here..."
      : promptStyle
      ? "You are a helpful assistant. When the user asks about...\n\nContext:\n{{resource_content}}"
      : "Paste your text content here...";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-muted-foreground">
          Content <span className="text-destructive">*</span>
        </label>
        <span className={cn("text-xs", overLimit ? "text-destructive" : "text-muted-foreground")}>
          {chars.toLocaleString()} / {MAX_CONTENT_LEN.toLocaleString()}
        </span>
      </div>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "font-mono text-xs min-h-[140px] resize-y",
          overLimit && "border-destructive focus-visible:ring-destructive"
        )}
      />
      {overLimit && (
        <p className="text-xs text-destructive mt-1">
          Content exceeds {MAX_CONTENT_LEN.toLocaleString()} characters. Please trim it.
        </p>
      )}
    </div>
  );
}
