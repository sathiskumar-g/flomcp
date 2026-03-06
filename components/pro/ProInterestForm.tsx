"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PRO_FEATURE_OPTIONS = [
  "Python support",
  "50 credits/month",
  "MCP security audit & auto-fix",
  "Team collaboration",
  "OpenAPI auto-import",
  "Custom templates",
];

interface ProInterestFormProps {
  /** Pre-fill the email field (e.g. from logged-in user session) */
  initialEmail?: string;
  /** Called after successful submission */
  onSuccess?: () => void;
}

export function ProInterestForm({ initialEmail = "", onSuccess }: ProInterestFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [useCase, setUseCase] = useState("");
  const [volume, setVolume] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleFeature = (f: string) =>
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side format check before hitting the API
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          interest: "pro_interest",
          description: useCase,
          urgency: volume,
          features,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
      toast.success("You're on the list! We'll email you when Pro launches.");
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <p className="font-semibold">You&apos;re on the list!</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you when Pro launches. Early access users get 30 days free.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="pro-email" className="text-sm font-medium">
          Your email
        </label>
        <input
          id="pro-email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Use case */}
      <div className="space-y-1.5">
        <label htmlFor="pro-usecase" className="text-sm font-medium">
          What kind of MCP servers are you building?
        </label>
        <input
          id="pro-usecase"
          type="text"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="e.g. REST API wrapper, database tools, internal tooling..."
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Volume */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">How many MCP servers per month?</label>
        <div className="flex gap-2 flex-wrap">
          {["1–3", "4–10", "10+", "Not sure"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVolume(v)}
              aria-pressed={volume === v}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                volume === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/60"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Feature wishlist */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">What would unlock Pro for you?</label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRO_FEATURE_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFeature(f)}
              aria-pressed={features.includes(f)}
              className={`px-3 py-1.5 rounded-md text-xs border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                features.includes(f)
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {features.includes(f) && <span className="mr-1" aria-hidden="true">✓</span>}
              {f}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {loading ? "Joining..." : "Join Early Access List →"}
      </button>
      {error && (
        <p className="text-sm text-[#ff4343] font-medium text-center">{error}</p>
      )}
    </form>
  );
}
