"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, Zap, Shield, CheckCircle2, ArrowRight, Clock, Users, Database, FileCode, Sparkles, Target, X } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [interest, setInterest] = useState<"product" | "freelance" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Modal state for custom development
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [freelanceEmail, setFreelanceEmail] = useState("");
  const [freelanceDescription, setFreelanceDescription] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [error, setError] = useState("");

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
          <div className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FloMCP</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Build MCP servers in minutes
            </span>
            <Button variant="outline" size="sm" onClick={trackDemoInterest}>
              See Demo
            </Button>
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
            Build MCP Servers
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              in Minutes, Not Hours
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop wasting time on boilerplate. Generate production-ready Model Context Protocol servers with complete schemas, error handling, and documentation in minutes.
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
            <Button size="lg" className="text-lg px-8" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Early Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={trackDemoInterest}>
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Building MCP Servers is Painful
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Every MCP server requires the same repetitive work
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
            Everything You Need, Nothing You Don't
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Production-ready MCP servers in minutes, not hours
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-xl">5-Minute Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Describe your integration in plain English. Get complete, working code with schemas, handlers, and documentation generated instantly.
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
                <CardTitle className="text-xl">Copy-Paste Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No configuration required. Download your server, add your API keys, and start using it with Claude, Copilot, or any AI assistant.
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

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">FloMCP</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Build MCP servers in minutes, not hours. For developers who value their time.
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
