"use client";

/**
 * /dashboard/generate
 *
 * Two-panel layout: left sidebar (New | Drafts) + right wizard content.
 * State managed by Zustand (useGeneratorStore).
 */

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useGeneratorStore } from "@/lib/stores/generator-store";
import { useDrafts, type SavedDraft } from "@/lib/use-drafts";
import { createClient } from "@/lib/supabase";
import { Step1Description } from "@/components/generator/Step1Description";
import { Step2APIConfig } from "@/components/generator/Step2APIConfig";
import { Step3ToolConfig } from "@/components/generator/Step3ToolConfig";
import { Step4Resources } from "@/components/generator/Step4Resources";
import { Step5Review } from "@/components/generator/Step5Review";
import { PostGenerationReview } from "@/components/generator/PostGenerationReview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Plus, FileText, Trash2, FolderOpen, Clock, Loader2 } from "lucide-react";

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Describe" },
  { label: "API Setup" },
  { label: "Tools" },
  { label: "Resources" },
  { label: "Review" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  return (
    <ProtectedRoute>
      <GenerateWizard />
    </ProtectedRoute>
  );
}

function GenerateWizard() {
  const step = useGeneratorStore((s) => s.step);
  const loadDraft = useGeneratorStore((s) => s.loadDraft);
  const reset = useGeneratorStore((s) => s.reset);
  const navigatingToServer = useGeneratorStore((s) => s.navigatingToServer);
  // BUG-011: clamp so step indicator never renders out-of-bounds circles
  const clampedStep = Math.min(step, 5);

  // Reset store when this page unmounts (after navigation away) so step 1
  // never flashes while the overlay is still visible on the old page.
  useEffect(() => () => { reset(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load userId so drafts are scoped to this account
  const [userId, setUserId] = useState("");
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? "");
    });
  }, []);

  const { drafts, deleteDraft } = useDrafts(userId);
  const [mode, setMode] = useState<"new" | "drafts">("new");

  function handleLoadDraft(draft: SavedDraft) {
    loadDraft({
      serverName: draft.serverName,
      description: draft.description,
      apiConfig: draft.apiConfig,
      tools: draft.tools,
      resources: draft.resources,
      prompts: draft.prompts,
    });
    setMode("new");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Full-screen overlay while navigating to server page — lives here so
          it persists even when step changes back to 1 during navigate */}
      {navigatingToServer && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/90 backdrop-blur-sm">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold">Loading your server…</p>
            <p className="text-sm text-muted-foreground">Taking you to the code.</p>
          </div>
        </div>
      )}
      <div className="flex gap-0 flex-1 min-h-0">

        {/* ── Left Sidebar ── */}
        <aside className="w-44 shrink-0 border-r border-border/40 pr-4 mr-6 hidden sm:flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Generate
          </p>
          <button
            onClick={() => setMode("new")}
            className={cn(
              "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              mode === "new"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            New
          </button>
          <button
            onClick={() => setMode("drafts")}
            className={cn(
              "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              mode === "drafts"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            Drafts
            {drafts.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto text-[10px] h-4 min-w-[16px] px-1 tabular-nums"
              >
                {drafts.length}
              </Badge>
            )}
          </button>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 pb-8 space-y-8">

          {mode === "new" ? (
            <>
              {/* ── Heading ── */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Generate MCP Server</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Answer a few questions and Claude will write a production-ready MCP server for you.
                </p>
              </div>

              {/* ── Step indicator (hidden on step 6 — done state) ── */}
              {step < 6 && (
                <div className="relative flex items-center">
                  {/* connector line */}
                  <div
                    className="absolute left-0 right-0 top-4 h-px bg-border"
                    aria-hidden="true"
                  />
                  {STEPS.map((s, idx) => {
                    const num = idx + 1;
                    const isActive = num === clampedStep;
                    const isDone = num < clampedStep;
                    return (
                      <div
                        key={s.label}
                        className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
                      >
                        {/* Circle */}
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all",
                            isDone
                              ? "border-primary bg-primary text-primary-foreground"
                              : isActive
                                ? "border-primary bg-background text-primary ring-4 ring-primary/10"
                                : "border-border bg-background text-muted-foreground"
                          )}
                        >
                          {isDone ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            num
                          )}
                        </div>
                        {/* Label */}
                        <span
                          className={cn(
                            "text-xs",
                            isActive ? "text-foreground font-medium" : "text-muted-foreground"
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )} {/* end step < 6 */}

              {/* ── Active step content ── */}
              <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                {step === 1 && <Step1Description />}
                {step === 2 && <Step2APIConfig />}
                {step === 3 && <Step3ToolConfig />}
                {step === 4 && <Step4Resources />}
                {step === 5 && <Step5Review onSaveDraft={() => setMode("drafts")} />}
                {step === 6 && <PostGenerationReview />}
              </div>

              {/* ── Fine print ── */}
              <p className="text-center text-xs text-muted-foreground">
                Your generated server is private until you choose to share it.
                Each generation uses a credit from your plan.
              </p>
            </>
          ) : (
            /* ── Drafts view ── */
            <DraftsList
              drafts={drafts}
              onLoad={handleLoadDraft}
              onDelete={deleteDraft}
              onNew={() => setMode("new")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drafts List ─────────────────────────────────────────────────────────────

function DraftsList({
  drafts,
  onLoad,
  onDelete,
  onNew,
}: {
  drafts: SavedDraft[];
  onLoad: (d: SavedDraft) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Drafts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drafts save your wizard configuration before generating. Free plan: up to 5 drafts.
          </p>
        </div>
        <Button size="sm" className="gap-2 flex-shrink-0" onClick={onNew}>
          <Plus className="h-4 w-4" />
          New Server
        </Button>
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">No drafts saved yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              In the Review step, click &ldquo;Save as Draft&rdquo; to bookmark your wizard
              configuration without generating.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={onNew}>
            <Plus className="h-4 w-4" />
            Start New Server
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  onLoad,
  onDelete,
}: {
  draft: SavedDraft;
  onLoad: (d: SavedDraft) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const draftName = draft.serverName || "Untitled Draft";

  const savedDate = new Date(draft.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function openDelete() {
    setDeleteInput("");
    setDeleteOpen(true);
  }

  function closeDelete() {
    setDeleteOpen(false);
    setDeleteInput("");
  }

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate">{draftName}</p>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">Draft</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {draft.description || "(No description)"}
            </p>
            <div className="flex items-center gap-3 pt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {savedDate}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {draft.tools.length} tool{draft.tools.length !== 1 ? "s" : ""}
              </span>
              {draft.apiConfig.enabled && (
                <span className="text-[11px] text-muted-foreground">· API configured</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => onLoad(draft)}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Load
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
              onClick={openDelete}
              aria-label="Delete draft"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { if (!open) closeDelete(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">&quot;{draftName}&quot;</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Type{" "}
              <span className="font-mono font-medium text-foreground">{draftName}</span>{" "}
              to confirm:
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={draftName}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteInput.trim() !== draftName}
              onClick={(e) => { e.preventDefault(); onDelete(draft.id); closeDelete(); }}
            >
              Delete Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
