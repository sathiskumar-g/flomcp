"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, Zap, Shield, CheckCircle2, ArrowRight, Clock, Users, Database, FileCode, Sparkles, Target, X, LogIn } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [interest, setInterest] = useState<"product" | "freelance" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
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
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkUser();

    // No auth listener here to prevent AbortError with session locks
    // User state updates happen via page navigation/refresh after login/logout

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, type: "product" | "freelance") => {
    e.preventDefault();
    setLoading(true);
    setInterest(type);
    setError("");

    // Track button click for validation
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        'button_type': type,
        'page_location': window.location.href
      });
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          problem,
          interest: type,
          urgency: null,
          description: null,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setInterest('freelance');
      setSubmitted(true);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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
    console.log('Demo button clicked', { timestamp: new Date() });
    alert('Demo coming soon! We\'re working hard to show you how FloMCP generates production-ready MCP servers.');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <Code2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FloMCP</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Show demo button for everyone */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={trackDemoInterest}
            >
              See Demo
            </Button>
            
            {/* Conditionally show UserMenu or Auth buttons */}
            {checkingAuth ? (
              // Show nothing while checking auth
              <div className="h-9 w-32" />
            ) : user ? (
              // User is logged in - show user menu
              <UserMenu user={user} />
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
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Join 1,000+ developers building with MCP</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Create MCP Online
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              in Minutes, Not Hours
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The quick MCP helper for developers. Build MCP online with our MCP flow generator. Create production-ready Model Context Protocol servers with complete schemas, error handling, and documentation instantly.
          </p>

          {/* Time Savings Showcase */}
          <div className="inline-flex flex-col gap-2 p-6 rounded-lg bg-card border-2 border-primary/20">
            <div className="flex items-center gap-3 justify-center text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>Without FloMCP: <span className="line-through">10+ hours</span></span>
            </div>
            <div className="text-3xl font-bold text-primary">5 minutes</div>
            <div className="text-sm text-muted-foreground">with FloMCP</div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Type-safe schemas included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Error handling built-in</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Ready for production</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8" 
              onClick={() => router.push('/auth/signup')}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8" 
              onClick={trackDemoInterest}
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Why Use an MCP Helper to Build MCP Online?
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
                    <div className="text-xs text-muted-foreground mt-1">Per server</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">50+</div>
                    <div className="text-xs text-muted-foreground mt-1">Lines of code</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">10+</div>
                    <div className="text-xs text-muted-foreground mt-1">Restarts to test</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">∞</div>
                    <div className="text-xs text-muted-foreground mt-1">Debug cycles</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Quick MCP Creation - Everything You Need
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Create MCP servers online with FloMCP MCP helper - production-ready in minutes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">Quick MCP Setup - 5 Minutes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build MCP online fast. Describe your integration in plain English. Get complete, working MCP server code with schemas, handlers, and documentation generated instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
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

            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
              <CardHeader>
                <FileCode className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">MCP Flow - Copy-Paste Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Seamless MCP flow from creation to deployment. No configuration required. Download your MCP server, add your API keys, and start using it with Claude, Copilot, or any AI assistant.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
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

            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
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

            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
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
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  VS Code MCP Assistant (Coming Soon)
                  <span className="text-xs font-normal px-2 py-1 rounded-full bg-primary/20 text-primary">New</span>
                </h3>
                <p className="text-muted-foreground mb-3">
                  Build MCP servers directly in VS Code with our intelligent assistant. Get real-time suggestions, auto-complete schemas, and instant testing—all without leaving your editor.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Work entirely within VS Code—no context switching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Intelligent code completion for MCP schemas and handlers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Test your MCP servers instantly without restarts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Generate best-practice code with built-in templates</span>
                  </li>
                </ul>
              </div>
            </div>
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
                <Button variant="outline" size="sm" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}>
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

      {/* Validation Form Section */}
      <section id="waitlist" className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {!submitted ? (
            <Card className="border-2 border-primary/30 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl">Get Early Access</CardTitle>
                <CardDescription className="text-base">
                  Join 1,000+ developers building with MCP. Be first to know when we launch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => handleSubmit(e, "product")} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="problem" className="text-sm font-medium">
                      What challenges have you faced building MCP servers? *
                    </label>
                    <Textarea
                      id="problem"
                      placeholder="E.g., 'Too much boilerplate', 'Hard to test changes', 'No good examples', 'Authentication is complex'..."
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      required
                      disabled={loading}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your feedback helps us build exactly what developers need
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading && interest === "product" ? "Submitting..." : "Get Notified When We Launch"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
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
                              disabled={loading}
                            />
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
                  </div>

                  {error && !isModalOpen && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-500">{error}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    No spam, ever. Unsubscribe with one click. We'll email you when we launch.
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle2 className="h-20 w-20 mx-auto text-green-500" />
                <h3 className="text-2xl md:text-3xl font-bold">You're on the list!</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  {interest === "product" 
                    ? "We'll notify you as soon as we launch. Your feedback will help us build the perfect tool for MCP development."
                    : "We'll reach out within 24 hours to discuss your custom MCP server needs and how we can help."}
                </p>
                <div className="pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                      setProblem("");
                      setInterest(null);
                    }}
                  >
                    Submit Another Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 bg-secondary/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Everything you need to know about creating MCP online
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How do I create MCP online?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  FloMCP lets you create MCP servers online in just minutes. Simply describe your requirements in plain English, and FloMCP generates production-ready Model Context Protocol server code with schemas, error handling, and documentation. No manual setup or configuration required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What is an MCP helper?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  An MCP helper is a tool that simplifies the process of building Model Context Protocol servers. FloMCP is a quick MCP helper that automates the entire creation process - from boilerplate code to schemas to testing. It saves you 10+ hours per project by generating everything you need automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How long does it take to build MCP online?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  With FloMCP, you can build MCP servers online in just 5 minutes. Manual MCP development typically takes 10+ hours including setup, schema creation, error handling implementation, and testing. FloMCP automates all of this for instant results.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What is MCP flow and why does it matter?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  MCP flow refers to the streamlined workflow from idea to deployment. FloMCP provides a seamless MCP flow: describe your needs → generate code → download → deploy. Our quick MCP approach eliminates friction at every step, letting you focus on building features instead of wrestling with configuration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I build MCP for Claude and Copilot?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! FloMCP generates MCP servers that work with Claude Desktop, GitHub Copilot, and any AI assistant supporting the Model Context Protocol standard. Create MCP online once and use it everywhere - with Claude, Copilot, Cursor, Windsurf, Cline, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Is there a quick MCP tutorial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  FloMCP itself is the quickest MCP tutorial you'll find. Instead of spending hours reading documentation, you get hands-on, production-ready code instantly. Study the generated code to learn MCP best practices, schema structures, and error handling patterns - all by example.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Are FloMCP servers secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes. Recent analysis found that 8,000+ MCP servers contain security vulnerabilities like SSRF, command injection, and hardcoded secrets. FloMCP generates secure, OWASP-compliant code with proper input validation, zero hardcoded credentials, bounded execution, and protection against common MCP vulnerabilities from day one.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What is MCP flow in FloMCP?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  MCP flow in FloMCP refers to our seamless workflow: describe your integration needs → FloMCP generates complete MCP server code → download → deploy. The entire MCP flow takes just 5 minutes from idea to working integration, with no manual configuration or boilerplate coding required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How does FloMCP compare to building MCP manually?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manual MCP development takes 10+ hours: writing boilerplate (1-2 hrs), creating JSON schemas (2-3 hrs), implementing error handling (2 hrs), testing with AI restarts (3+ hrs), and documentation (1-2 hrs). FloMCP automates all of this in 5 minutes - that's 120x faster with better code quality and security.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I use FloMCP for complex API integrations?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. FloMCP excels at complex integrations. Build MCP servers for REST APIs, GraphQL, databases, file systems, webhooks, and more. The MCP helper automatically generates authentication flows, rate limiting, error recovery, and schema validation - everything production systems need.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What makes FloMCP the best quick MCP tool?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  FloMCP is purpose-built for speed and quality. Unlike generic code generators, we focus exclusively on secure MCP development with AI-specific optimizations. You get type-safe schemas, comprehensive error handling, built-in validation, zero security vulnerabilities, and production-ready code - not just basic templates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">FloMCP</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Create MCP online in minutes. Quick MCP helper for developers building Model Context Protocol servers.
              </p>
              <p className="text-xs text-muted-foreground">
                Keywords: create mcp online, build mcp online, mcp helper, quick mcp, mcp flow, mcp generator
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#waitlist" className="hover:text-foreground transition-colors">Get Early Access</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">MCP Specification</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Examples</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
              
              <h4 className="font-semibold mb-3 text-sm mt-6">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a 
                    href="/legal/terms-of-service" 
                    className="hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/legal/terms-of-service');
                    }}
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a 
                    href="/legal/acceptable-use" 
                    className="hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/legal/acceptable-use');
                    }}
                  >
                    Acceptable Use Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2026 FloMCP. Built for developers who ship fast.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
