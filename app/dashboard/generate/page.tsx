"use client";

/**
 * /dashboard/generate
 *
 * 4-step wizard: Describe → API Config → Tool Config → Review & Generate
 * State managed by Zustand (useGeneratorStore).
 */

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useGeneratorStore } from "@/lib/stores/generator-store";
import { Step1Description } from "@/components/generator/Step1Description";
import { Step2APIConfig } from "@/components/generator/Step2APIConfig";
import { Step3ToolConfig } from "@/components/generator/Step3ToolConfig";
import { Step4Resources } from "@/components/generator/Step4Resources";
import { Step4Review } from "@/components/generator/Step4Review";
import { PostGenerationReview } from "@/components/generator/PostGenerationReview";
import { cn } from "@/lib/utils";

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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-8 pb-16 px-4">
      <div className="w-full max-w-2xl space-y-8">
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
            const isActive = num === step;
            const isDone = num < step;

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
          {step === 5 && <Step4Review />}
          {step === 6 && <PostGenerationReview />}
        </div>

        {/* ── Fine print ── */}
        <p className="text-center text-xs text-muted-foreground">
          Your generated server is private until you choose to share it.
          Each generation uses one credit from your plan.
        </p>
      </div>
    </div>
  );
}
