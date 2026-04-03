"use client";

/**
 * Step 1 — MCP Description
 *
 * User describes what their MCP server should do.
 * Includes example prompts, character counter, and helpful hints.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGeneratorStore } from "@/lib/stores/generator-store";
import { useSavedPrompts, PROMPT_FREE_LIMIT } from "@/lib/use-saved-prompts";
import { validateGeneratorStep1 } from "@/lib/validate-input";
import { ChevronRight, ChevronDown, AlertCircle, BookMarked, Save, X, Zap, Crown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip common markdown syntax so dropdown previews show plain readable text */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/>\s*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*+]\s+/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

// ─── Example prompts ──────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  {
    label: "GitHub",
    text: "Create an MCP server that lets Claude search GitHub repositories, read file contents, create issues, and comment on pull requests. Use the GitHub REST API with personal access token auth.",
  },
  {
    label: "Weather",
    text: "Build an MCP server that provides current weather, 7-day forecast, and weather alerts for any city. Use OpenWeatherMap API with API key authentication.",
  },
  {
    label: "Database",
    text: "Create an MCP server that allows Claude to query a PostgreSQL database with read-only access, list tables, describe schemas, and run SELECT queries with parameterized inputs.",
  },
  {
    label: "File System",
    text: "Build an MCP server to read, write, and list files in a specified directory. Include path validation, size limits, and support for text and JSON files only.",
  },
  {
    label: "Slack",
    text: "Create an MCP server for Slack that can send messages to channels, list recent messages, create posts, and search message history. OAuth 2.0 authentication.",
  },
  {
    label: "Custom API",
    text: "Build an MCP server that wraps a REST API. It should authenticate using an API key in the header, handle JSON requests and responses, and retry failed requests.",
  },
];

const MAX_CHARS = 2000;
const MIN_CHARS = 50;

// ─── Component ────────────────────────────────────────────────────────────────

export function Step1Description() {
  const { serverName, setServerName, description, setDescription, nextStep } = useGeneratorStore();
  const [userId, setUserId] = useState("");
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? "");
    });
  }, []);
  const { prompts: savedPrompts, savePrompt, deletePrompt } = useSavedPrompts(userId);
  const router = useRouter();

  const [touched, setTouched] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const noCredits = credits !== null && credits <= 0;

  useEffect(() => {
    fetch("/api/credits/balance", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCredits(d.total ?? 0); })
      .catch(() => {});
  }, []);
  // Prompt library UI state
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [promptSaveName, setPromptSaveName] = useState("");

  const charCount = description.length;
  const isNameValid = serverName.trim().length >= 3;
  const isDescValid = charCount >= MIN_CHARS;
  // Basic length gates + credits gate (for live UI feedback)
  const isValid = isNameValid && isDescValid && !noCredits;
  const showNameError = touched && !isNameValid;
  const showDescError = touched && !isDescValid;

  const charColor =
    charCount > MAX_CHARS
      ? "text-red-500"
      : charCount >= MIN_CHARS
      ? "text-green-500"
      : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Create your MCP server</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Give it a name, then describe what it should do in detail.
        </p>
      </div>

      {/* Credits gate banner */}
      {noCredits && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <Crown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">You&apos;ve used all your credits</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade to generate more MCP servers and unlock higher limits.</p>
          </div>
          <Button
            size="sm"
            className="shrink-0 h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => router.push("/pricing")}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            Upgrade
          </Button>
        </div>
      )}



      {/* Server name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Server name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g. GitHub Assistant, Weather Tools, Slack Bot"
          value={serverName}
          onChange={(e) =>
            setServerName(
              e.target.value
                .replace(/[^a-zA-Z0-9 _-]/g, "")
                .slice(0, 60)
            )
          }
          onBlur={() => setTouched(true)}
          className={cn(
            "text-sm",
            showNameError && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {showNameError ? (
          <span className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
            Minimum 3 characters
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Short, descriptive name for your server (letters, numbers, spaces)
          </span>
        )}
      </div>

      {/* Description textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </label>
          {/* Load from Prompt Library */}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground"
              onClick={() => { setShowLoadPrompt((v) => !v); setShowSavePrompt(false); }}
            >
              <BookMarked className="h-3.5 w-3.5" />
              Library
              <ChevronDown className={cn("h-3 w-3 transition-transform", showLoadPrompt && "rotate-180")} />
            </Button>
            {showLoadPrompt && (
              <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-border/70 bg-card shadow-md z-20">
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-medium">Plain Text Prompts</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Only plain text prompts work in Description</p>
                </div>
                {savedPrompts.filter(p => !p.mimeType || p.mimeType === "text/plain").length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-3">No plain text prompts saved yet. Save one from here or the Prompt Library.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto py-1">
                    {savedPrompts.filter(p => !p.mimeType || p.mimeType === "text/plain").map((p) => (
                      <div key={p.id} className="flex items-start gap-2 px-3 py-2 hover:bg-muted/40 group">
                        <button
                          className="flex-1 text-left min-w-0"
                          onClick={() => {
                            setDescription(p.text.slice(0, MAX_CHARS));
                            setTouched(true);
                            setShowLoadPrompt(false);
                          }}
                        >
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{stripMarkdown(p.text)}</p>
                        </button>
                        <button
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                          onClick={() => deletePrompt(p.id)}
                          aria-label="Delete saved prompt"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Textarea
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setDescription(e.target.value);
            }
          }}
          onBlur={() => setTouched(true)}
          placeholder="E.g. Create an MCP server that lets Claude access GitHub repositories — search code, read files, create issues, and leave comments on pull requests. Use the GitHub REST API with personal access token authentication."
          rows={7}
          className={cn(
            "resize-none text-sm leading-relaxed",
            showDescError && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        <div className="flex items-center justify-between">
          {showDescError ? (
            <span className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              At least {MIN_CHARS} characters required to get quality output
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Be specific — mention API names, auth methods, and tool behaviours
            </span>
          )}
          <span className={`text-xs tabular-nums ${charColor}`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
        {/* Save to Prompt Library */}
        {charCount >= MIN_CHARS && (
          <div>
            {!showSavePrompt ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-muted-foreground -ml-1"
                onClick={() => { setShowSavePrompt(true); setShowLoadPrompt(false); setPromptSaveName(serverName || ""); }}
                disabled={savedPrompts.length >= PROMPT_FREE_LIMIT}
              >
                <Save className="h-3.5 w-3.5" />
                {savedPrompts.length >= PROMPT_FREE_LIMIT ? `Library full (${PROMPT_FREE_LIMIT}/${PROMPT_FREE_LIMIT})` : "Save to Prompt Library"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  placeholder="Prompt name (e.g. GitHub Assistant)"
                  value={promptSaveName}
                  onChange={(e) => setPromptSaveName(e.target.value.slice(0, 60))}
                  className="h-7 text-xs flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSavePrompt(false);
                    if (e.key === "Enter") {
                      const result = savePrompt(promptSaveName || serverName || "Untitled", description);
                      if (result.ok) {
                        toast.success("Prompt saved to library");
                      } else {
                        toast.error(result.reason ?? "Could not save");
                      }
                      setShowSavePrompt(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    const result = savePrompt(promptSaveName || serverName || "Untitled", description);
                    if (result.ok) {
                      toast.success("Prompt saved to library");
                    } else {
                      toast.error(result.reason ?? "Could not save");
                    }
                    setShowSavePrompt(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowSavePrompt(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Example prompts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span>Quick-start examples — click to use</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <Badge
              key={ex.label}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs py-1.5 px-3"
              onClick={() => {
                setDescription(ex.text);
                setTouched(true);
              }}
            >
              {ex.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hints */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-medium text-foreground">Tips for great results:</p>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Name the specific API(s) you want to integrate (GitHub, Stripe, OpenAI…)</li>
          <li>Mention the authentication method (API key, OAuth, Bearer token)</li>
          <li>List the tools/actions Claude should be able to perform</li>
          <li>Describe error handling expectations (retries, timeouts, fallbacks)</li>
          <li>Specify any rate limits or constraints the server should respect</li>
        </ul>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (noCredits) {
              router.push("/pricing");
              return;
            }
            setTouched(true);
            if (!isValid) return;

            // Deep quality check — catches gibberish/random keysmash
            const check = validateGeneratorStep1(serverName, description);
            if (!check.valid) {
              toast.warning("Please improve your input", {
                description: check.reason,
                duration: 8000,
              });
              return;
            }

            nextStep();
          }}
          disabled={!isValid && !noCredits}
          className={cn(
            "min-w-[160px]",
            noCredits && "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          {noCredits ? (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Continue
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
