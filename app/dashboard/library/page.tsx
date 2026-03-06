"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSavedPrompts, PROMPT_FREE_LIMIT } from "@/lib/use-saved-prompts";
import { createClient } from "@/lib/supabase";
import type { SavedPrompt } from "@/lib/use-saved-prompts";
import { cn } from "@/lib/utils";
import {
  Code2, ArrowRight, ExternalLink, Github, Database, Globe,
  FileText, Terminal, MessageSquare, Search, Shield, Layers, Sparkles,
  BookMarked, Copy, Trash2, CheckCircle2, Clock, Plus, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

type McpServer = {
  name: string;
  description: string;
  category: string;
  icon: typeof Database;
  githubUrl?: string;
  tags: string[];
  official?: boolean;
};

const OFFICIAL_SERVERS: McpServer[] = [
  {
    name: "GitHub MCP",
    description: "Interact with GitHub repositories, issues, PRs, and code search directly from your AI assistant.",
    category: "Developer Tools", icon: Github,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    tags: ["repos", "issues", "PRs", "code search"], official: true,
  },
  {
    name: "Filesystem MCP",
    description: "Read, write, list, and search files on your local filesystem with configurable access controls.",
    category: "System", icon: FileText,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    tags: ["files", "local", "read/write"], official: true,
  },
  {
    name: "PostgreSQL MCP",
    description: "Query and inspect PostgreSQL databases. Supports SELECT queries with read-only safety mode.",
    category: "Databases", icon: Database,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    tags: ["postgres", "SQL", "database"], official: true,
  },
  {
    name: "SQLite MCP",
    description: "Full SQLite database interaction including CREATE, INSERT, SELECT, and UPDATE operations.",
    category: "Databases", icon: Database,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    tags: ["sqlite", "SQL", "local db"], official: true,
  },
  {
    name: "Brave Search MCP",
    description: "Web and local search using the Brave Search API. Returns structured results with snippets.",
    category: "Search", icon: Search,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
    tags: ["web search", "brave", "search"], official: true,
  },
  {
    name: "Fetch MCP",
    description: "Fetch web pages, convert HTML to Markdown, and extract content for AI consumption.",
    category: "Web", icon: Globe,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    tags: ["HTTP", "web scraping", "HTML to markdown"], official: true,
  },
  {
    name: "Puppeteer MCP",
    description: "Browser automation and web scraping using Puppeteer. Take screenshots, click elements, fill forms.",
    category: "Web", icon: Globe,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    tags: ["browser", "automation", "screenshots"], official: true,
  },
  {
    name: "Slack MCP",
    description: "Send messages, list channels, and read Slack workspace activity via the Slack API.",
    category: "Communication", icon: MessageSquare,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    tags: ["slack", "messaging", "workspace"], official: true,
  },
  {
    name: "Memory MCP",
    description: "Persistent key-value memory store for AI assistants. Create, update, and retrieve facts across sessions.",
    category: "AI Infrastructure", icon: Layers,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    tags: ["memory", "persistence", "KV store"], official: true,
  },
  {
    name: "Shell / Terminal MCP",
    description: "Execute shell commands in a sandboxed environment. Configurable allow-lists for command safety.",
    category: "System", icon: Terminal,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
    tags: ["shell", "terminal", "commands"], official: true,
  },
];

const COMMUNITY_EXAMPLES = [
  { name: "REST API Wrapper", description: "A FloMCP-generated template for wrapping any REST API.", tags: ["REST", "API", "template"] },
  { name: "Database Query Server", description: "Read-only database query server with parameterized queries and schema introspection.", tags: ["database", "SQL", "read-only"] },
  { name: "Webhook Dispatcher", description: "Send webhooks with retry logic, payload signing, and delivery confirmation.", tags: ["webhooks", "HTTP", "events"] },
  { name: "File Processor", description: "Read, transform, and write files in JSON, CSV, YAML, XML with validation.", tags: ["files", "transform", "parsing"] },
  { name: "Email Sender", description: "Send transactional emails via Resend or SendGrid with template support.", tags: ["email", "Resend", "SendGrid"] },
  { name: "Calendar / Scheduling", description: "Create events and manage calendar entries via Google Calendar or CalDAV.", tags: ["calendar", "Google", "scheduling"] },
];

const CATEGORIES = ["All", "Developer Tools", "Databases", "Web", "Search", "Communication", "System", "AI Infrastructure"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"mcp" | "prompts">("mcp");
  const [activeCategory, setActiveCategory] = useState("All");

  // Load userId so saved prompts are scoped to this account
  const [userId, setUserId] = useState("");
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? "");
    });
  }, []);

  const { prompts: savedPrompts, savePrompt, deletePrompt, updatePrompt } = useSavedPrompts(userId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddPromptForm, setShowAddPromptForm] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptMimeType, setNewPromptMimeType] = useState<"text/plain" | "text/markdown">("text/plain");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      if (prev.has(id)) return new Set<string>();
      return new Set<string>([id]);
    });
  }

  const filtered = activeCategory === "All"
    ? OFFICIAL_SERVERS
    : OFFICIAL_SERVERS.filter((s) => s.category === activeCategory);

  async function handleCopyPrompt(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse curated MCP servers or manage your saved prompt templates.
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button size="sm" className="gap-2 flex-shrink-0">
            <Sparkles className="h-4 w-4" />
            Generate Custom Server
          </Button>
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-border/60">
        <button
          onClick={() => setActiveTab("mcp")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "mcp"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="h-4 w-4" />
          MCP Library
        </button>
        <button
          onClick={() => setActiveTab("prompts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "prompts"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookMarked className="h-4 w-4" />
          Prompt Library
          {savedPrompts.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 tabular-nums">{savedPrompts.length}</Badge>
          )}
        </button>
      </div>

      {/* ── MCP Library tab ── */}
      {activeTab === "mcp" && (<>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Official servers grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Official MCP Servers</h2>
          <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((server) => {
            const Icon = server.icon;
            return (
              <Card key={server.name} className="border border-border/60 hover:border-border transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{server.name}</CardTitle>
                        <p className="text-[11px] text-muted-foreground">{server.category}</p>
                      </div>
                    </div>
                    {server.githubUrl && (
                      <a href={server.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                        aria-label={`${server.name} on GitHub`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{server.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {server.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FloMCP generated examples */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">FloMCP-Generated Examples</h2>
          <Badge variant="secondary" className="text-xs">Templates</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COMMUNITY_EXAMPLES.map((ex) => (
            <Card key={ex.name} className="border border-border/60 border-dashed hover:border-border transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm">{ex.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{ex.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {ex.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                  ))}
                </div>
                <Link href="/dashboard/generate">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-7">
                    <Sparkles className="h-3 w-3" />Generate Similar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="rounded-xl border border-border/60 bg-muted/20 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Can&apos;t find what you need?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Describe your integration and FloMCP will generate a production-ready MCP server in seconds.
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button className="gap-2 flex-shrink-0" size="sm">
            <Sparkles className="h-4 w-4" />Generate Custom Server
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      </>)} {/* end MCP Library tab */}

      {/* ── Prompt Library tab ── */}
      {activeTab === "prompts" && (
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Your saved prompt templates</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reuse prompts in <strong>Description</strong> (Step 1) and <strong>Prompts</strong> (Step 4) via the dropdown.
                Free plan: <span className="font-medium">{savedPrompts.length}/{PROMPT_FREE_LIMIT}</span> used.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 flex-shrink-0"
              disabled={savedPrompts.length >= PROMPT_FREE_LIMIT || showAddPromptForm}
              onClick={() => { setShowAddPromptForm(true); setNewPromptName(""); setNewPromptText(""); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Prompt
            </Button>
          </div>

          {/* Inline add form */}
          {showAddPromptForm && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-semibold">New prompt</p>
              <Input
                placeholder="Prompt name (e.g. GitHub Assistant)"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value.slice(0, 60))}
                className="text-sm h-8"
                autoFocus
              />
              {/* Content type selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content type</label>
                <div className="flex gap-2">
                  {(["text/plain", "text/markdown"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewPromptMimeType(type)}
                      className={`flex-1 text-xs rounded-md border px-2 py-1.5 transition-all text-left ${
                        newPromptMimeType === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      <div className="font-medium">{type === "text/plain" ? "Plain Text" : "Markdown"}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{type === "text/plain" ? "General guidance" : "Structured prompt templates"}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Content <span className="text-destructive">*</span></label>
                  <span className="text-xs text-muted-foreground">{newPromptText.length.toLocaleString()} chars</span>
                </div>
                <Textarea
                  placeholder={newPromptMimeType === "text/markdown"
                    ? "# Title\n\nYour prompt template here..."
                    : "You are a helpful assistant. When the user asks about...\n\nContext:\n{{context}}"}
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  rows={6}
                  className="font-mono text-xs resize-y"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setShowAddPromptForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  disabled={!newPromptName.trim() || !newPromptText.trim()}
                  onClick={() => {
                    const result = savePrompt(newPromptName.trim(), newPromptText.trim(), newPromptMimeType);
                    if (result.ok) {
                      toast.success("Prompt saved to library");
                      setShowAddPromptForm(false);
                      setNewPromptName(""); setNewPromptText(""); setNewPromptMimeType("text/plain");
                    } else {
                      toast.error(result.reason ?? "Could not save");
                    }
                  }}
                >
                  Save Prompt
                </Button>
              </div>
            </div>
          )}

          {savedPrompts.length === 0 && !showAddPromptForm ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <BookMarked className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">No saved prompts yet</p>
                <p className="text-xs text-muted-foreground max-w-sm text-center leading-relaxed">
                  Click <strong>Add Prompt</strong> above, or save from the generator:
                  <br />
                  <span className="text-foreground/70">· Step 1 (Description)</span> — write a description then click <strong>Save to Prompt Library</strong>
                  <br />
                  <span className="text-foreground/70">· Step 4 (Resources &amp; Prompts → Prompts tab)</span> — expand a prompt card and click <strong>Save to Prompt Library</strong>
                </p>
              </div>
            </div>
          ) : savedPrompts.length > 0 ? (
            <div className="space-y-2">
              {savedPrompts.map((prompt, idx) => (
                <PromptLibraryCard
                  key={prompt.id}
                  prompt={prompt}
                  index={idx}
                  expanded={expandedIds.has(prompt.id)}
                  onToggle={() => toggleExpand(prompt.id)}
                  onDelete={() => { deletePrompt(prompt.id); toast.success("Prompt deleted."); }}
                  onSave={(patch) => updatePrompt(prompt.id, patch)}
                  onCopy={() => handleCopyPrompt(prompt.id, prompt.text)}
                  copied={copiedId === prompt.id}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Prompt Library Card ──────────────────────────────────────────────────────


function PromptLibraryCard({
  prompt, index, expanded, onToggle, onDelete, onSave, onCopy, copied,
}: {
  prompt: SavedPrompt;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (patch: Partial<Pick<SavedPrompt, "name" | "text" | "mimeType">>) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const [editName, setEditName] = useState(prompt.name);
  const [editText, setEditText] = useState(prompt.text);
  const [editMimeType, setEditMimeType] = useState<"text/plain" | "text/markdown">(
    prompt.mimeType ?? "text/plain"
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local edit state if the saved prompt changes externally
  const [prevId, setPrevId] = useState(prompt.id);
  if (prompt.id !== prevId) {
    setEditName(prompt.name);
    setEditText(prompt.text);
    setEditMimeType(prompt.mimeType ?? "text/plain");
    setPrevId(prompt.id);
  }

  // When expanding, reset edits to current saved values
  const [wasExpanded, setWasExpanded] = useState(expanded);
  if (expanded && !wasExpanded) {
    setEditName(prompt.name);
    setEditText(prompt.text);
    setEditMimeType(prompt.mimeType ?? "text/plain");
    setWasExpanded(true);
  }
  if (!expanded && wasExpanded) setWasExpanded(false);

  const isDirty =
    editName !== prompt.name ||
    editText !== prompt.text ||
    editMimeType !== (prompt.mimeType ?? "text/plain");

  const mimeLabel = (prompt.mimeType ?? "text/plain") === "text/markdown" ? "Markdown" : "Plain Text";

  return (
    <div className={cn("rounded-xl border bg-card transition-all", !prompt.name.trim() && "border-amber-300 dark:border-amber-700")}>
      {/* Header */}
      <div className="p-3 flex items-center gap-2">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <div className="flex-shrink-0 h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">{prompt.name || `Prompt ${index + 1}`}</span>
            {!expanded && (
              <p className="text-xs text-muted-foreground truncate">{prompt.text}</p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{mimeLabel}</Badge>
        </button>
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          aria-label="Delete prompt"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Delete confirmation dialog */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                Delete Prompt
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">&ldquo;{prompt.name || `Prompt ${index + 1}`}&rdquo;</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t pt-3">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. GitHub Assistant"
              value={editName}
              onChange={(e) => setEditName(e.target.value.slice(0, 60))}
              className="text-sm h-8"
            />
          </div>

          {/* Content type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content type</label>
            <div className="flex gap-2">
              {([
                { value: "text/plain" as const, label: "Plain Text", hint: "General guidance" },
                { value: "text/markdown" as const, label: "Markdown", hint: "Structured prompt templates" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditMimeType(opt.value)}
                  className={cn(
                    "flex-1 text-xs rounded-md border px-2 py-1.5 transition-all text-left",
                    editMimeType === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                Content <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-muted-foreground">{editText.length.toLocaleString()} chars</span>
            </div>
            <Textarea
              placeholder={
                editMimeType === "text/markdown"
                  ? "# Title\n\nYour prompt template here..."
                  : "You are a helpful assistant. When the user asks about...\n\nContext:\n{{context}}"
              }
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="font-mono text-xs min-h-[120px] resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={onCopy}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              disabled={!isDirty || !editName.trim() || !editText.trim()}
              onClick={() => {
                onSave({ name: editName.trim(), text: editText, mimeType: editMimeType });
                toast.success("Prompt updated");
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
