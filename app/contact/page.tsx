"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; summary?: string; description?: string }>({});

  const validate = () => {
    const errs: { email?: string; summary?: string; description?: string } = {};
    const emailTrimmed = email.trim();
    const summaryTrimmed = summary.trim();
    const descTrimmed = description.trim();

    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!summaryTrimmed || summaryTrimmed.length < 3) {
      errs.summary = "Query summary must be at least 3 characters.";
    }
    if (!descTrimmed || descTrimmed.length < 10) {
      errs.description = "Description must be at least 10 characters.";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, summary, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/">
            <Logo height={34} />
          </a>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Contact Us</h1>
          <p className="text-muted-foreground text-base">
            Have a question, feedback, or need help? Fill out the form and we&apos;ll get back to you within 24 hours.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>Or email us directly at{" "}
              <a href="mailto:support@flomcp.com" className="text-primary font-medium hover:underline">
                support@flomcp.com
              </a>
            </span>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-16 space-y-4">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Message received!</h2>
            <p className="text-muted-foreground">
              Thanks for reaching out. We&apos;ll reply to <strong>{email}</strong> within 24 hours.
            </p>
            <a
              href="/"
              className="inline-block mt-4 text-sm text-primary font-medium hover:underline"
            >
              Back to home
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="text-sm font-medium">
                Your email <span className="text-destructive">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="you@example.com"
                disabled={loading}
                className={`w-full px-3 py-2.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 ${errors.email ? "border-destructive" : "border-input"}`}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label htmlFor="contact-summary" className="text-sm font-medium">
                Query summary <span className="text-destructive">*</span>
              </label>
              <input
                id="contact-summary"
                type="text"
                required
                value={summary}
                onChange={(e) => { setSummary(e.target.value); setErrors((p) => ({ ...p, summary: undefined })); }}
                placeholder="e.g. Billing question, feature request, account issue…"
                disabled={loading}
                className={`w-full px-3 py-2.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 ${errors.summary ? "border-destructive" : "border-input"}`}
              />
              {errors.summary && <p className="text-xs text-destructive mt-1">{errors.summary}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="contact-description" className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="contact-description"
                required
                rows={5}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
                placeholder="Tell us more about your question or issue…"
                disabled={loading}
                className={`w-full px-3 py-2.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none disabled:opacity-60 ${errors.description ? "border-destructive" : "border-input"}`}
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <p>© 2026 FloMCP · <a href="mailto:support@flomcp.com" className="hover:text-foreground transition-colors">support@flomcp.com</a></p>
      </footer>
    </div>
  );
}
