"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface EnterpriseContactFormProps {
  /** Pre-fill email (e.g. from logged-in user) */
  initialEmail?: string;
  /** Called after successful submission */
  onSuccess?: () => void;
}

export function EnterpriseContactForm({ initialEmail = "", onSuccess }: EnterpriseContactFormProps) {
  const [entEmail, setEntEmail] = useState(initialEmail);
  const [entDesc, setEntDesc] = useState("");
  const [entTimeline, setEntTimeline] = useState("weeks");
  const [entSubmitted, setEntSubmitted] = useState(false);
  const [entLoading, setEntLoading] = useState(false);
  const [entError, setEntError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntError("");

    // Client-side format check before hitting the API
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(entEmail.trim())) {
      setEntError("Please enter a valid email address.");
      return;
    }

    setEntLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: entEmail,
          problem: entDesc,
          interest: "enterprise",
          urgency: entTimeline,
          description: entDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setEntSubmitted(true);
      toast.success("Request received! We'll reach out within 24 hours.");
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setEntError(msg);
      toast.error(msg);
    } finally {
      setEntLoading(false);
    }
  };

  if (entSubmitted) {
    return (
      <div className="py-6 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
        <p className="font-semibold text-lg">Request received!</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ll reach out to <strong>{entEmail}</strong> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Work Email */}
      <div className="space-y-1">
        <label htmlFor="ent-email" className="text-sm font-medium">
          Work Email <span className="text-destructive">*</span>
        </label>
        <input
          id="ent-email"
          type="email"
          required
          autoFocus
          placeholder="you@company.com"
          value={entEmail}
          onChange={(e) => setEntEmail(e.target.value)}
          disabled={entLoading}
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="ent-desc" className="text-sm font-medium">
          Describe your MCP server needs <span className="text-destructive">*</span>
        </label>
        <textarea
          id="ent-desc"
          required
          rows={4}
          placeholder="What integrations, APIs, or workflows do you need covered? Any security or compliance requirements?"
          value={entDesc}
          onChange={(e) => setEntDesc(e.target.value)}
          disabled={entLoading}
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <label htmlFor="ent-timeline" className="text-sm font-medium">
          Timeline
        </label>
        <select
          id="ent-timeline"
          value={entTimeline}
          onChange={(e) => setEntTimeline(e.target.value)}
          disabled={entLoading}
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 dark:[color-scheme:dark]"
        >
          <option value="asap">ASAP — need this week</option>
          <option value="weeks">A few weeks</option>
          <option value="month">Within a month</option>
          <option value="planning">Still planning</option>
        </select>
      </div>

      {entError && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {entError}
        </p>
      )}

      <button
        type="submit"
        disabled={entLoading}
        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {entLoading ? "Sending…" : "Send Enquiry"}
        {!entLoading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
