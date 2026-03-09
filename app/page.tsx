"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, Zap, Shield, CheckCircle2, ArrowRight, Clock, Users, Database, FileCode, Sparkles, Target, X, LogIn, Crown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/auth/UserMenu";
import type { User } from "@supabase/supabase-js";
import { ChevronDown } from "lucide-react";
import { CODE_FILES } from "@/lib/showcase-files";
import { ProInterestForm } from "@/components/pro/ProInterestForm";
import { EnterpriseContactForm } from "@/components/pro/EnterpriseContactForm";
import { toast } from "sonner";

const FAQ_ITEMS = [
  { q: "How do I generate an MCP server with FloMCP?", a: "Sign up for a free account, describe your server in plain English across 5 short steps, and FloMCP generates complete TypeScript code — schemas, handlers, error handling, and README included. No manual setup required." },
  { q: "What is an MCP server and why do I need one?", a: "An MCP server exposes your tools, APIs, and databases to AI assistants like Claude and GitHub Copilot. Without one, your AI can only use its training data. With one, it can query your database, call your APIs, and take real actions. FloMCP generates the server code so you don't have to write the boilerplate." },
  { q: "How long does it take to build MCP online?", a: "As little as 1 minute with FloMCP versus 10+ hours manually. FloMCP automates every step from schema creation to error handling." },
  { q: "Can I build MCP for Claude and Copilot?", a: "Yes — generated servers work with Claude Desktop, GitHub Copilot, Cursor, Windsurf, Cline, and any assistant supporting the MCP standard." },
  { q: "Are FloMCP servers secure?", a: "Yes. FloMCP generates OWASP-compliant code with input validation, zero hardcoded credentials, bounded execution, and protection against SSRF and injection attacks from day one." },
  { q: "Can I use FloMCP for complex API integrations?", a: "Absolutely. FloMCP handles REST APIs, GraphQL, databases, file systems, and webhooks — including authentication flows, rate limiting, and error recovery." },
  { q: "How does FloMCP compare to building MCP manually?", a: "Manual MCP development takes 10+ hours across boilerplate, schemas, error handling, testing, and documentation. FloMCP does it in under 2 minutes — with security checks built in." },
  { q: "What makes FloMCP different from just asking Claude or ChatGPT?", a: "FloMCP is purpose-built for MCP: the generated code follows the MCP specification exactly, includes Zod schemas, passes 22 security checks, and comes with a working README and claude_desktop_config.json — not a generic snippet that still needs hours of debugging." },
];

const FREE_CREDIT_FEATURES = [
  "3 credits on signup — never expire",
  "Full TypeScript source code",
  "3-pass quality engine + 22 security checks",
  "Download ZIP + auto-generated docs",
  "Works with Claude, Copilot & Cursor",
  "MCP Library access",
];

const PRO_CREDIT_FEATURES = [
  "50 credits / month",
  "Half unused credits roll over (max 75)",
  "Everything in Free",
  "Priority generation queue",
  "Higher rate limits — 50 generations/day",
  "MCP Assistant — security audit",
  "Credit top-up packs available",
  "Team workspaces (up to 5 members)",
  "Email support — 24h response",
  "Early access to new features",
];

const CREDIT_PACKS = [
  { name: "Boost",    credits: "+10",  price: "$5+",  priceNum: 5  },
  { name: "Standard", credits: "+30",  price: "$15+", priceNum: 15 },
  { name: "Growth",   credits: "+55",  price: "$25+", priceNum: 25 },
];

function ProInterestModal({ open, onClose, userEmail }: { open: boolean; onClose: () => void; userEmail?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
      onClick={onClose}
    >
      <div ref={containerRef} className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 id="pro-modal-title" className="text-xl font-bold">Get Early Access — $19/mo</h2>
            <p className="text-sm text-muted-foreground mt-1">Reserved for our first 50 founding members. Price locked at $19/mo forever.</p>
          </div>
          <button onClick={onClose} aria-label="Close early access form" className="text-muted-foreground hover:text-foreground transition-colors ml-4 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <ProInterestForm initialEmail={userEmail} onSuccess={onClose} />
      </div>
    </div>
  );
}

function CodeEditorShowcase() {
  const [activeFile, setActiveFile] = useState(0);
  const file = CODE_FILES[activeFile];

  async function handleDownload() {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folder = zip.folder("regex-lab")!;
    for (const f of CODE_FILES) {
      folder.file(f.name, f.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "regex-lab.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-[#0d1117] overflow-hidden shadow-2xl text-sm font-mono">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border/30 bg-[#161b22] overflow-x-auto" role="tablist" aria-label="Generated code files">
        <div className="flex items-center gap-1.5 px-4 shrink-0" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        {CODE_FILES.map((f, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeFile}
            aria-label={`View ${f.name}`}
            onClick={() => setActiveFile(i)}
            className={`px-4 py-2 text-xs whitespace-nowrap transition-colors border-r border-border/20 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary ${
              i === activeFile
                ? "bg-[#0d1117] text-white border-t-2 border-t-primary"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#0d1117]/60"
            }`}
          >
            {f.name.split("/").pop()}
          </button>
        ))}
        <div className="ml-auto px-3 py-1.5 shrink-0">
          <span className="text-xs text-gray-500 select-none">{file.name}</span>
        </div>
      </div>
      {/* Line numbers + code — single scroll container, no nested scrollbars */}
      <div
        className="flex overflow-auto max-h-[420px]"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4b5563 transparent",
        }}
      >
        <div className="select-none text-right pr-4 pl-4 py-4 text-gray-600 leading-6 text-xs bg-[#0d1117] border-r border-border/20 shrink-0">
          {file.content.split("\n").map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="py-4 px-4 text-gray-300 leading-6 text-xs flex-1 whitespace-pre min-w-0">
          <code>{file.content}</code>
        </pre>
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-primary/5 border-t border-border/20 text-[11px] text-gray-500">
        <span>Generated by FloMCP · Real code, ready to ship</span>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: "#0db4fa" }}
        >
          Download &amp; ship it
        </button>
      </div>
    </div>
  );
}

function EnterpriseModal({ open, onClose, userEmail }: { open: boolean; onClose: () => void; userEmail?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enterprise-modal-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="enterprise-modal-title" className="text-xl font-bold">Enterprise — Contact Us</h2>
            <p className="text-sm text-muted-foreground mt-1">Tell us what you need and we&apos;ll respond within 24 hours.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close enterprise enquiry form"
            className="text-muted-foreground hover:text-foreground transition-colors ml-4 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <EnterpriseContactForm initialEmail={userEmail} onSuccess={onClose} />
      </div>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
      {FAQ_ITEMS.map(({ q, a }, i) => (
        <div key={i}>
          <button
            id={`faq-btn-${i}`}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:bg-muted/40"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            aria-controls={`faq-panel-${i}`}
          >
            <span>{q}</span>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {open === i && (
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-btn-${i}`}
              className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed"
            >
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [heroCursor, setHeroCursor] = useState<{ x: number; y: number } | null>(null);

  // User state — start with checkingAuth=false so buttons show IMMEDIATELY.
  // Auth resolves in background; if user is logged in, button swaps to Dashboard.
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  // Stable string used in JSX to avoid TS narrowing issues with user?.email
  const loggedInEmail = user?.email ?? "";
  
  // Modal state for custom development
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [freelanceEmail, setFreelanceEmail] = useState("");
  const [freelanceDescription, setFreelanceDescription] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [error, setError] = useState("");

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkUser = async () => {
      try {
        // Race getSession() against a 3-second timeout.
        // If network is down, we just show "Sign In" — no freeze.
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        if (isMounted && result && 'data' in result) {
          const resolvedUser = result.data.session?.user ?? null;
          setUser(resolvedUser);
          if (resolvedUser?.email) setFreelanceEmail(resolvedUser.email);
        }
      } catch (error) {
        // Network error — silently ignore, show Sign In button
      }
    };

    checkUser();

    // No auth listener here to prevent AbortError with session locks
    // User state updates happen via page navigation/refresh after login/logout

    return () => {
      isMounted = false;
    };
  }, []);


  const handleFreelanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: freelanceEmail,
          problem: null,
          interest: 'freelance',
          urgency,
          description: freelanceDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
      toast.success("Request sent! We'll be in touch within 24 hours.");
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const trackDemoInterest = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_interest', {
        'page_location': window.location.href
      });
    }
    router.push('/auth/signup');
  };

  // Live server count for social proof
  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count != null) setServerTotal(d.count); })
      .catch(() => {});
  }, []);

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-background to-secondary/20"
      onMouseMove={(e) => setHeroCursor({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHeroCursor(null)}
    >
      {/* Full-page cursor brand-glow — fixed so it follows cursor across all sections */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: heroCursor ? 1 : 0,
          background: heroCursor
            ? `radial-gradient(420px circle at ${heroCursor.x}px ${heroCursor.y}px, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 50%, transparent 72%)`
            : "none",
        }}
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button type="button" onClick={() => router.push('/')} aria-label="FloMCP — go to home page" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <Logo height={42} />
          </button>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            {/* Always-visible nav links */}
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Jump to code showcase"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Demo
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Jump to pricing section"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Pricing
            </button>
            {/* Conditionally show UserMenu or Auth buttons */}
            {user ? (
              // User is logged in — show dashboard button + user menu
              <>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Go to Dashboard
                </Button>
                <UserMenu user={user} />
              </>
            ) : (
              // User is not logged in - show auth buttons
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/auth/signin')}
                  className="hidden sm:flex"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => router.push('/auth/signup')}
                  className="bg-primary hover:bg-primary/90"
                >
                  Start Free
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>From plain English to running MCP server — in under 5 minutes</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Build MCP Servers
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              That Actually Work
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe what you need in plain English. FloMCP runs a <span className="font-semibold text-foreground">3-pass generation engine</span> — schema contract, implementation, quality review — plus 22 security checks. Download-ready. No boilerplate.
          </p>

          {/* Time Savings Showcase + live server counter */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/60 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground line-through">10+ hours</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="font-semibold text-primary">1+ minutes</span>
              <span className="text-muted-foreground">with FloMCP</span>
            </div>
            {serverTotal !== null && serverTotal > 0 && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-green-500/30 text-sm"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" aria-hidden="true" />
                <span className="font-semibold">{serverTotal.toLocaleString()}</span>
                <span className="text-muted-foreground">MCP servers generated</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>3-pass generation + 22 security checks</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Works with Claude, Copilot &amp; Cursor</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Download and run — no config needed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8" 
              onClick={() => router.push('/auth/signup')}
            >
              Start Free — 5 Credits
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8" 
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Generated Code
            </Button>
          </div>
        </div>
      </section>

      {/* What is MCP — brief explainer for first-time visitors */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-8 py-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">What is MCP?</p>
            <p className="text-base md:text-lg leading-relaxed text-foreground">
              <strong>MCP (Model Context Protocol)</strong> is the open standard that lets AI assistants like Claude and GitHub Copilot call your tools, databases, and APIs in real time — instead of guessing from training data.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground mt-2">
              An <strong>MCP server</strong> is the code that exposes those capabilities. Building one from scratch means writing schemas, handlers, error handling, and config files — FloMCP generates all of it for you in under two minutes.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Why Building MCP Servers Manually Is So Painful
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Creating MCP servers manually takes 10+ hours - every single time
          </p>
          
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Boilerplate Setup</h3>
                      <p className="text-sm text-muted-foreground">50-100 lines of repetitive server initialization code</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Manual Schemas</h3>
                      <p className="text-sm text-muted-foreground">Writing JSON schemas by hand for every tool</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Error Handling</h3>
                      <p className="text-sm text-muted-foreground">Managing edge cases and validation manually</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Testing Complexity</h3>
                      <p className="text-sm text-muted-foreground">Restart AI assistants to test every change</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Documentation</h3>
                      <p className="text-sm text-muted-foreground">Writing setup instructions and usage guides</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Authentication</h3>
                      <p className="text-sm text-muted-foreground">OAuth, API keys, and security setup</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">10+ hrs</div>
                    <div className="text-xs text-muted-foreground mt-1">To write first server</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">3 hrs</div>
                    <div className="text-xs text-muted-foreground mt-1">Just to get schemas right</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">20+</div>
                    <div className="text-xs text-muted-foreground mt-1">Restarts to test changes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground mt-1">Clear docs on why tools don&apos;t appear</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What FloMCP Generates for You
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Every server includes the complete project structure — not just a snippet
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <Zap className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Working Server in Under a Minute</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Describe your integration in plain English. FloMCP generates a complete server with schemas, handlers, error responses, and a README — ready to download and run.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <Shield className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Battle-Tested Code</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Type-safe schemas, comprehensive error handling, input validation, and security best practices included by default.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <FileCode className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Download, Add Keys, Done</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No configuration required. Download your server, add your API keys to the env file, and start using it with Claude, Copilot, or any MCP-compatible AI assistant.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <Database className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Pre-Built Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Start with proven patterns for GitHub, databases, APIs, file systems, webhooks, and more. Customize as needed.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <Users className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Works Everywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Compatible with Claude Desktop, GitHub Copilot, Cursor, Windsurf, and any tool supporting the Model Context Protocol.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <Target className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Learn Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See how production MCP servers are structured. Learn patterns you can apply to your own tools and integrations.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 border-2 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 flex-wrap">
                  VS Code MCP Assistant
                  <span className="text-xs font-normal px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1" aria-label="Pro feature, coming soon"><Crown className="h-3 w-3" /> Pro</span>
                  <span className="text-xs font-normal px-2 py-1 rounded-full bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 border border-yellow-400/50">Coming Soon</span>
                </h3>
                <p className="text-muted-foreground mb-3">
                  Already generated your MCP server? The VS Code Assistant helps you maintain and improve it — fix broken connections, resolve configuration issues, apply security patches, and upgrade tools without starting from scratch.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Diagnose and fix MCP link &amp; connection errors in-editor</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Repair broken configuration — transport, auth, env variables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Security upgrade — patches flagged vulnerabilities automatically</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Update tools &amp; resources on existing servers without regenerating</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Video / Tutorial Slot — hidden, kept for future use */}
          {false && (
          <section className="mt-12" aria-label="Demo video">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">See FloMCP in Action</h3>
              <p className="text-sm text-muted-foreground">Watch how to generate a production-ready MCP server in under 5 minutes — from plain English to working TypeScript code.</p>
            </div>
            <button type="button" onClick={trackDemoInterest} aria-label="Watch FloMCP demo — sign up to get notified when the tutorial is live" className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-4 overflow-hidden group cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-primary ml-0.5" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Tutorial video coming soon</p>
                <p className="text-xs text-muted-foreground mt-1">Sign up to get notified when it&apos;s live</p>
              </div>
            </button>
          </section>
          )}

          {/* Generated Code Showcase — read-only output preview */}
          <div id="how-it-works" className="mt-10">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">This is What FloMCP Generates</h3>
              <p className="text-sm text-muted-foreground">
                A real MCP server — regex-lab — built with FloMCP.
                4 tools, ReDoS protection, 30 battle-tested patterns. Browse the code below.
              </p>
            </div>
            <CodeEditorShowcase />
          </div>
        </div>
      </section>

      {/* Security & Trust Section - Based on MCP Ecosystem Security Insights */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-secondary/10 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-sm mb-4">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">Security-First MCP Development</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Build Secure MCP Servers from Day One
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Recent analysis of 8,000+ MCP servers revealed widespread security vulnerabilities. FloMCP generates secure, production-ready code that follows industry best practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">No SSRF Vulnerabilities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  FloMCP automatically implements safe URL validation and request boundaries. No server-side request forgery risks - we validate all external calls and block metadata endpoints by default.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Input Validation & Bounded Execution</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every generated endpoint includes strict input validation with JSON schemas. All tool execution paths are bounded and sandboxed - no unsafe command injection or arbitrary code execution.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Zero Hardcoded Secrets</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Environment-based secret management is baked in. No API keys, tokens, or credentials ever appear in generated code. Runtime secret injection with proper scoping included automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">OWASP-Compliant Code</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generated servers follow OWASP Top 10 security standards and MCP-specific best practices. Trust boundary enforcement, dependency scanning, and secure defaults on every export.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="p-6 rounded-lg border-2 border-primary/20 bg-card">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Why MCP Security Matters</h3>
                <p className="text-sm text-muted-foreground">
                  MCP servers have privileged access to sensitive data, APIs, and local systems. A single vulnerability can expose credentials, leak metadata, or enable unauthorized actions. FloMCP eliminates these risks before they reach production.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => router.push('/auth/signup')}>
                  Build Secure MCP Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claude vs Copilot Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Works With Your Favorite AI Assistant
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            MCP is an open standard. Use FloMCP servers with any tool.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-orange-500" />
                  </div>
                  Claude (Anthropic)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Native MCP support in Claude Desktop</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Best for conversational AI workflows</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Great for research and analysis tasks</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-blue-500" />
                  </div>
                  GitHub Copilot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">MCP support via extensions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Perfect for in-editor coding workflow</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Great for code generation and refactoring</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-muted/50 border">
            <p className="text-sm text-center text-muted-foreground">
              <strong>The best tool?</strong> Use both. FloMCP servers work everywhere MCP is supported—Claude Desktop, Cursor, Windsurf, Cline, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Anti-Objection: Why Not Just Prompt an AI? */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Common question
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              &ldquo;Why not just prompt an AI to write the MCP server?&rdquo;
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Great question. You can — and you&apos;ll spend the next 4 hours debugging why the tools don&apos;t appear.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* General AI column */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center text-base">✦</div>
                <span className="font-semibold text-base">Any general-purpose AI</span>
              </div>
              <ul className="space-y-3">
                {[
                  ["Doesn't know the MCP spec deeply", "Generic TypeScript that looks right but breaks at runtime"],
                  ["No Zod schemas", "Input validation missing — your server crashes on bad data"],
                  ["No security checks", "Hardcoded credentials, SSRF vulnerabilities, injection risks"],
                  ["No README or config file", "You still have to write the claude_desktop_config.json yourself"],
                  ["Trial and error debugging", "\"Why isn't my tool showing up?\" — 2 hours of restarts"],
                ].map(([title, detail]) => (
                  <li key={title} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-red-500 flex-shrink-0 text-lg leading-none">✗</span>
                    <span className="text-sm">
                      <span className="font-medium text-foreground">{title}</span>
                      <span className="block text-muted-foreground text-xs mt-0.5">{detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FloMCP column */}
            <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-base">FloMCP</span>
              </div>
              <ul className="space-y-3">
                {[
                  ["MCP-spec compliant output", "Built exactly to the Model Context Protocol — tools appear first try"],
                  ["Full Zod validation on every input", "Type-safe, runtime-safe, no crashes from malformed requests"],
                  ["3-pass quality verification + 22 security checks", "Schema contract → implementation → quality checklist → OWASP security checks"],
                  ["Complete project — not just a snippet", "README, .env.example, claude_desktop_config.json included"],
                  ["Download and run in under 2 min", "No debugging. No restarts. Open the zip and go."],
                ].map(([title, detail]) => (
                  <li key={title} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <span className="font-medium text-foreground">{title}</span>
                      <span className="block text-muted-foreground text-xs mt-0.5">{detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom callout */}
          <div className="rounded-xl border border-border/60 bg-muted/30 px-6 py-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="text-3xl flex-shrink-0">💡</div>
            <div>
              <p className="font-semibold text-sm">Think of it this way</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                General-purpose AI is a brilliant engineer. FloMCP is the MCP specialist on the team.
                You wouldn&apos;t ask a generalist to write your security audit — same logic applies here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {user ? (
            <Card className="border-2 border-primary/30 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl">What would you like to build?</CardTitle>
                <CardDescription className="text-base">
                  Generate a server yourself or let us build it for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  size="lg"
                  className="w-full h-12 text-base"
                  onClick={() => router.push('/dashboard/generate')}
                >
                  Create MCP Server
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={() => setEnterpriseOpen(true)}
                >
                  I Need Custom MCP Development
                  <Users className="ml-2 h-5 w-5" />
                </Button>

                <div className="flex gap-4 justify-center text-xs text-muted-foreground pt-1">
                  <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
                  <a href="/dashboard/servers" className="hover:text-foreground transition-colors">My Servers</a>
                  <a href="/dashboard/settings" className="hover:text-foreground transition-colors">Settings</a>
                </div>
              </CardContent>
            </Card>
          ) : !submitted ? (
            <Card className="border-2 border-primary/30 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl">Start Building Today</CardTitle>
                <CardDescription className="text-base">
                  Generate your first production-ready MCP server in under a minute — free.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-base"
                    onClick={() => router.push('/auth/signin')}
                  >
                    Sign In
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or get in touch</span>
                  </div>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      I Need Custom MCP Development
                      <Users className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Custom MCP Development</DialogTitle>
                      <DialogDescription>
                        Tell us about your project and we'll get back to you within 24 hours.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFreelanceSubmit} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label htmlFor="freelance-email" className="text-sm font-medium">
                          Email Address *
                        </label>
                        <Input
                          id="freelance-email"
                          type="email"
                          placeholder="your@email.com"
                          value={freelanceEmail}
                          onChange={(e) => setFreelanceEmail(e.target.value)}
                          required
                          disabled={loading || (!!loggedInEmail && freelanceEmail === loggedInEmail)}
                          className={loggedInEmail && freelanceEmail === loggedInEmail ? "bg-muted/40 text-muted-foreground cursor-not-allowed" : ""}
                        />
                        {loggedInEmail && freelanceEmail === loggedInEmail && (
                          <p className="text-[11px] text-muted-foreground">Using your logged-in email.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                          Project Description *
                        </label>
                        <Textarea
                          id="description"
                          placeholder="Describe your MCP project needs, integrations required, timeline, etc."
                          value={freelanceDescription}
                          onChange={(e) => setFreelanceDescription(e.target.value)}
                          required
                          disabled={loading}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="urgency" className="text-sm font-medium">
                          Urgency
                        </label>
                        <select
                          id="urgency"
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value)}
                          disabled={loading}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="low">Low - Planning phase</option>
                          <option value="medium">Medium - Next few weeks</option>
                          <option value="high">High - ASAP</option>
                          <option value="urgent">Urgent - Need this week</option>
                        </select>
                      </div>

                      {error && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-500">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Submitting..." : "Submit Request"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Free plan • 3 credits on signup (first 50 get 5 ★) • No credit card required.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle2 className="h-20 w-20 mx-auto text-green-500" />
                <h3 className="text-2xl md:text-3xl font-bold">Request received!</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  We'll reach out within 24 hours to discuss your custom MCP server needs.
                </p>
                <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => router.push('/auth/signup')}>
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                  >
                    Submit Another Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* MCP Library Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs mb-6">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>Free MCP Library</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore the MCP Library</h2>
          <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
            Browse 10+ curated open-source MCP servers and FloMCP-generated examples — ready to deploy or use as a starting point.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {["GitHub MCP", "PostgreSQL MCP", "Filesystem MCP", "Brave Search", "Slack MCP", "Puppeteer MCP"].map((name) => (
              <span key={name} className="px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-sm text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
          <Button size="lg" variant="outline" className="gap-2" onClick={() => router.push(user ? '/dashboard/library' : '/library')}>
            Browse Free MCP Library
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Credit-Based Pricing</h2>
            <p className="text-muted-foreground text-lg">Pay for generations, not subscriptions you won&apos;t use.</p>
          </div>

          {/* Founding Member Banner */}
          <div
            className="mb-8 w-fit mx-auto"
            style={{ padding: "1px", borderRadius: "0.75rem", background: "linear-gradient(135deg, #a06af0 0%, #783ae6 100%)" }}
          >
            <div className="rounded-[11px] bg-background px-5 py-4 flex items-start gap-3">
              <div
                className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(120,58,230,0.12) 100%)", border: "1px solid rgba(120,58,230,0.25)" }}
              >
                <Zap className="h-4 w-4" style={{ color: "#783ae6" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    Founding member pricing &mdash; $19/mo, locked forever.
                  </span>
                  <span className="relative inline-flex items-center">
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(120,58,230,0.3)" }} />
                    <span className="relative text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: "#783ae6" }}>
                      49 spots left
                    </span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Regular price $29/mo after April 29. First 50 members only.
                </p>
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="text-3xl font-bold mt-2">$0</div>
                <CardDescription>
                  <span className="font-semibold text-foreground">5 credits</span>
                  <span className="line-through text-muted-foreground/50 ml-2 text-sm">3 credits</span>
                  <span className="ml-1"> to get started — no card required</span>
                  <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium align-middle">
                    First 50 members ★
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {FREE_CREDIT_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />{f}
                  </div>
                ))}
                <Button className="w-full mt-4" variant="outline" onClick={() => router.push('/auth/signup')}>
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-2 border-primary/40 bg-primary/5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Most Popular</span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">Pro</CardTitle>
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.6)" }}
                  ><Crown className="h-3 w-3" />Founding Member</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="text-3xl font-bold">$19<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                  <div className="text-base text-muted-foreground line-through">$29</div>
                </div>
                <CardDescription>For developers who ship regularly &mdash; price locked forever for first 50 members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PRO_CREDIT_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />{f}
                  </div>
                ))}
                <Button className="w-full mt-4 gap-2" onClick={() => setProModalOpen(true)}>
                  <Crown className="h-4 w-4" />
                  Get Early Access — $19/mo
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold mt-2">Custom</div>
                <CardDescription>Bespoke MCP servers built to spec</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Everything in Pro:</p>
                {[
                  "Custom server built to your exact spec",
                  "Private codebase delivery",
                  "Security review + full documentation",
                  "Ongoing maintenance option",
                  "Dedicated support channel",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />{f}
                  </div>
                ))}
                <Button className="w-full mt-4" variant="outline" onClick={() => setEnterpriseOpen(true)}>
                  Get in Touch
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Credit top-up packs */}
          <div className="mt-12">
            <div className="flex flex-col items-center gap-2 mb-4 text-center">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Credit Top-Up Packs</h3>
                <span className="text-sm px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium inline-flex items-center gap-1"><Crown className="h-3.5 w-3.5" /> Pro</span>
              </div>
              <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-muted border border-border/60 text-muted-foreground">
                <Zap className="h-3.5 w-3.5" /><span className="font-medium">1 credit</span> Simple
                <span className="opacity-40">·</span>
                <Zap className="h-3.5 w-3.5" /><span className="font-medium">2 credits</span> Complex
                <span className="opacity-40">·</span>
                <Zap className="h-3.5 w-3.5" /><span className="font-medium">3 credits</span> Premium
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
              {CREDIT_PACKS.map((pack) => (
                <div key={pack.name} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-4 text-center">
                  <p className="text-center text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">{pack.name}</p>
                  <p className="text-center text-3xl font-bold">{pack.credits}</p>
                  <p className="text-center text-sm text-muted-foreground mt-0.5">credits</p>
                  <p className="text-center text-lg font-semibold text-primary mt-2">{pack.price}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Credit used based on the number of tools, resources, and prompts in your server.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 bg-secondary/20 rounded-2xl">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-foreground/70 mb-12 text-lg">
            Everything you need to know about creating MCP online
          </p>

          <FaqAccordion />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Logo height={38} />
              </div>
              <p className="text-sm text-muted-foreground mb-3 pl-3">
                FloMCP generates production-ready MCP servers from plain English. Works with Claude, GitHub Copilot, Cursor, and Windsurf.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/library" className="hover:text-foreground transition-colors">MCP Library</a></li>
                <li><a href="/docs/getting-started" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="/auth/signup" className="hover:text-foreground transition-colors">Start Free</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/contact" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li>
                  <a href="mailto:support@flomcp.com" className="hover:text-foreground transition-colors">
                    support@flomcp.com
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/legal/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/legal/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="/legal/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use Policy</a></li>
                <li><a href="/legal/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© 2026 FloMCP. Built for developers who ship fast.</p>
            <p>Need help? <a href="mailto:support@flomcp.com" className="text-primary hover:underline font-medium">support@flomcp.com</a></p>
          </div>
        </div>
      </footer>

      {/* Pro Interest Modal */}
      <ProInterestModal open={proModalOpen} onClose={() => setProModalOpen(false)} userEmail={loggedInEmail} />
      <EnterpriseModal open={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} userEmail={loggedInEmail} />
    </main>
  );
}
