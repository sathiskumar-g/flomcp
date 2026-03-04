"use client";

/**
 * Support Page (Phase 6.2)
 *
 * Lets authenticated users submit support tickets and view their ticket history.
 *
 * Features:
 * - 6.2.2  Issue form: Subject, Category, Description, Priority
 * - 6.2.3  Emails via Resend (admin notification + user confirmation)
 * - 6.2.4  Persists to support_tickets table
 * - 6.2.5  Ticket list cards below the form
 * - 6.2.6  Click a card → Dialog with full ticket details
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  HelpCircle,
  Send,
  Loader2,
  Ticket,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge className="bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/20">Open</Badge>;
    case "in-review":
      return <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20">In Review</Badge>;
    case "resolved":
      return <Badge className="bg-green-500/15 text-green-600 border border-green-500/30 hover:bg-green-500/20">Resolved</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return <Badge className="bg-red-500/15 text-red-500 border border-red-500/30">Urgent</Badge>;
    case "high":
      return <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/30">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-500/15 text-yellow-600 border border-yellow-500/30">Medium</Badge>;
    case "low":
      return <Badge variant="secondary">Low</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ subject: false, category: false, description: false, priority: false });

  // Derived validation
  const errors = {
    subject: !subject.trim() ? "Subject is required." : "",
    category: !category ? "Please select a category." : "",
    description: !description.trim()
      ? "Description is required."
      : description.trim().length < 10
      ? "Description must be at least 10 characters."
      : "",
  };
  const isFormValid = !errors.subject && !errors.category && !errors.description;

  // Ticket list state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Dialog state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // ─── Fetch tickets on mount ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("/api/support");
        if (!res.ok) throw new Error("Failed to load tickets");
        const data = await res.json();
        setTickets(data.tickets ?? []);
      } catch {
        toast.error("Could not load your tickets.");
      } finally {
        setLoadingTickets(false);
      }
    }
    fetchTickets();
  }, []);

  // ─── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ subject: true, category: true, description: true, priority: true });
    if (!isFormValid) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, description, priority }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit ticket.");
        return;
      }

      toast.success("Ticket submitted! Check your email for confirmation.");
      setTickets((prev) => [data.ticket, ...prev]);
      setSubject("");
      setCategory("");
      setDescription("");
      setPriority("medium");
      setTouched({ subject: false, category: false, description: false, priority: false });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Support
        </h1>
        <p className="text-muted-foreground mt-1">
          Submit a ticket and we&apos;ll get back to you within 24-48 hours.
        </p>
      </div>

      {/* ── Submission Form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Support Ticket</CardTitle>
          <CardDescription>
            Describe your issue and we&apos;ll respond as quickly as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-sm font-medium leading-none">Subject</label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, subject: true }))}
                maxLength={200}
                disabled={submitting}
                className={touched.subject && errors.subject ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.subject && errors.subject && (
                <p className="text-xs text-destructive">{errors.subject}</p>
              )}
            </div>

            {/* Category + Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium leading-none">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, category: true }))}
                  disabled={submitting}
                  className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark] bg-background ${
                    touched.category && errors.category ? "border-destructive" : "border-input"
                  }`}
                >
                  <option value="" disabled>Select category</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical Issue</option>
                  <option value="account">Account</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
                {touched.category && errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="priority" className="text-sm font-medium leading-none">Priority</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, priority: true }))}
                  disabled={submitting}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium leading-none">Description</label>
              <Textarea
                id="description"
                placeholder="Describe your issue in detail — include steps to reproduce if it's a bug."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, description: true }))}
                rows={5}
                maxLength={5000}
                disabled={submitting}
                className={`resize-none ${
                  touched.description && errors.description ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              <div className="flex items-center justify-between">
                {touched.description && errors.description
                  ? <p className="text-xs text-destructive">{errors.description}</p>
                  : <span />}
                <p className="text-xs text-muted-foreground">{description.length}/5000</p>
              </div>
            </div>

            <Button type="submit" disabled={submitting || !isFormValid} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Ticket History ── */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-muted-foreground" />
          Your Tickets
        </h2>

        {loadingTickets ? (
          /* Loading skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* Empty state */
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                No tickets yet. Submit one above if you need help.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Ticket cards */
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full text-left group"
              >
                <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{ticket.id.slice(0, 8).toUpperCase()}
                          </span>
                          {statusBadge(ticket.status)}
                          {priorityBadge(ticket.priority)}
                          <span className="text-xs text-muted-foreground capitalize">
                            {ticket.category.replace("-", " ")}
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.created_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 group-hover:text-foreground transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Ticket Detail Dialog ── */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  Ticket #{selectedTicket.id.slice(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  Submitted {formatDate(selectedTicket.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Status + Priority */}
                <div className="flex items-center gap-2 flex-wrap">
                  {statusBadge(selectedTicket.status)}
                  {priorityBadge(selectedTicket.priority)}
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedTicket.category.replace("-", " ")}
                  </span>
                </div>

                {/* Subject */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                    Subject
                  </p>
                  <p className="text-sm font-medium">{selectedTicket.subject}</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                    Description
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Full ID */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                    Ticket ID
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{selectedTicket.id}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
