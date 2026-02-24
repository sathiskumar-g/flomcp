"use client";

/**
 * Step 5 — Post-Generation Review
 *
 * Shows the generated MCP server tools. User can:
 *  - Accept & view their server (redirects to /dashboard/servers/:id)
 *  - Tweak tools (goes back to step 3 to adjust and regenerate)
 */

import { useRouter } from "next/navigation";
import { useGeneratorStore } from "@/lib/stores/generator-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Wrench,
  ArrowRight,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ─── Component ────────────────────────────────────────────────────────────────

export function PostGenerationReview() {
  const router = useRouter();
  const { generatedResult, setStep, reset } = useGeneratorStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!generatedResult) return null;

  const { id, tools } = generatedResult;

  function handleAccept() {
    reset();
    router.push(`/dashboard/servers/${id}`);
  }

  function handleTweak() {
    // Keep description + apiConfig, go back to step 3
    setStep(3);
  }

  const toggleExpand = (toolId: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(toolId) ? next.delete(toolId) : next.add(toolId);
      return next;
    });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold">Your MCP Server is Ready!</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
          Claude has generated your server. Review the tools below —
          accept them or go back to make adjustments.
        </p>
      </div>

      {/* Server ID chip */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5">
          <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">{id}</span>
        </div>
      </div>

      {/* Generated tools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">
            Generated Tools ({tools.length})
          </h3>
        </div>
        <div className="space-y-2">
          {tools.map((tool) => {
            const expanded = expandedIds.has(tool.id);
            return (
              <Card key={tool.id} className="border border-border/60 shadow-none">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-mono font-medium flex-1">{tool.name}</span>
                    <Badge variant="secondary" className="text-xs gap-1 h-5 px-1.5">
                      <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                      Generated
                    </Badge>
                    <button
                      onClick={() => toggleExpand(tool.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!expanded && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {tool.description}
                    </p>
                  )}
                </CardHeader>
                {expanded && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    {tool.fields.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Parameters
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {tool.fields.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1"
                            >
                              <span className="text-xs font-mono">{f.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {f.type}
                              </span>
                              {f.required && (
                                <span className="text-xs text-red-400">*</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-center text-muted-foreground">
        Not happy with these tools? Go back and adjust your tool definitions, then regenerate.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleTweak}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Tweak Tools &amp; Regenerate
        </Button>
        <Button
          className="flex-1 gap-2"
          size="lg"
          onClick={handleAccept}
        >
          Accept &amp; View Server
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
