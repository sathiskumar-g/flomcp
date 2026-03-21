import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Zap, Shield, Users, Crown } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Pricing \u2014 FloMCP",
  description:
    "Credit-based pricing for MCP server generation. Start free with 3 credits — no card required. First 50 signups get 5 credits. Upgrade to Pro for 50 credits/month.",
};

const FREE_CREDIT_FEATURES = [
  "3 credits on signup — never expire",
  "Early birds (first 50 signups) get 5 credits",
  "Full TypeScript source code",
  "3-pass quality engine + 22 security checks + 10 protocol compliance checks",
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
  "Personal API key — programmatic access",
  "Credit top-up packs available",
  "Team workspaces (up to 5 members)",
  "Email support — 24h response",
  "Early access to new features",
];

const ENTERPRISE_FEATURES = [
  "Custom MCP server built to your exact spec",
  "Private codebase delivery",
  "Security review + full documentation",
  "Ongoing maintenance option",
  "Dedicated support channel",
];

const CREDIT_PACKS = [
  { name: "Boost",    credits: "+10",  price: "$5+"  },
  { name: "Standard", credits: "+30",  price: "$15+" },
  { name: "Growth",   credits: "+55",  price: "$25+" },
];

const FAQ = [
  {
    q: "What counts as a credit?",
    a: "Tier is based only on tool count and content size. Simple (1 credit): ≤5 tools and content ≤2,000 chars. Complex (2 credits): 6–15 tools or content up to 5,000 chars. Premium (3 credits): 16–25 tools or content up to 10,000 chars. Description length and API use are always free and never affect the tier.",
  },
  {
    q: "How many credits do I get on signup?",
    a: "3 credits on signup — they never expire. The first 50 people to sign up get 5 credits as an early-adopter bonus.",
  },
  {
    q: "Can I re-download previously generated servers?",
    a: "Yes \u2014 your generated servers are saved permanently in your dashboard. Re-downloading never consumes credits.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan gives you 3 credits on signup (5 for the first 50 users), no card required. You can try every feature before deciding to upgrade to Pro at $19/mo.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We'll accept all major credit cards. Pro billing and credit top-ups are coming soon \u2014 join the free plan now and upgrade when it launches.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your account settings. You keep access and your credits until the end of your billing period.",
  },
  {
    q: "Do unused credits carry over?",
    a: "On the Pro plan, half of your unused monthly credits roll over to the next month, up to a maximum of 75 banked credits. Top-up pack credits never expire.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={32} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/docs/getting-started">
              <Button variant="ghost" size="sm">Docs</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="mb-4">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Credit-based pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pay for generations, not subscriptions you won&apos;t use. Start free &mdash; no card required.
          </p>
        </div>

        {/* C11 — Founding Member Banner */}
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
                  Founding member pricing - $19/mo, locked forever.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Free */}
          <Card className="border-2 border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Free</CardTitle>
                <Badge variant="outline">No card needed</Badge>
              </div>
              <div className="mt-2">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <CardDescription className="mt-2 text-base">
                <span className="line-through text-muted-foreground/60">3 credits</span>{" "}
                <span className="font-semibold text-foreground">5 credits</span> for the first 50 signups — they never expire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup">
                <Button className="w-full mb-6" variant="outline" size="lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                {FREE_CREDIT_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-2 border-primary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              MOST POPULAR
            </div>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <Badge className="gap-1 font-semibold" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", borderColor: "rgba(34,197,94,0.6)" }}>
                  <Crown className="h-3 w-3" />Founding Member
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
                <span className="text-sm text-muted-foreground line-through">$29</span>
              </div>
              <CardDescription className="mt-2 text-base">
                For developers who ship MCP servers regularly. Price locked forever for first 50 members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup">
                <Button className="w-full mb-6" size="lg">
                  <Zap className="mr-2 h-4 w-4" />
                  Get Early Access — $19/mo
                </Button>
              </Link>
              <div className="space-y-2">
                {PRO_CREDIT_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="border-2 border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <Badge variant="outline">Custom</Badge>
              </div>
              <div className="mt-2">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <CardDescription className="mt-2 text-base">
                A bespoke MCP server built to your exact spec.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:support@flomcp.com?subject=Enterprise%20MCP%20enquiry">
                <Button className="w-full mb-6" size="lg" variant="outline">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <div className="space-y-2">
                {ENTERPRISE_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit top-up packs */}
        <div className="mb-16 rounded-xl border border-border/60 bg-muted/20 p-6">
          <div className="flex flex-col items-center gap-2 mb-5 text-center">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Credit Top-Up Packs</h2>
              <span className="text-base px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium inline-flex items-center gap-1"><Crown className="h-3.5 w-3.5" /> Pro</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-base px-3 py-1 rounded-full bg-background border border-border/60 text-muted-foreground">
              🪙 1 credit simple &nbsp;·&nbsp; 🪙🪙 2 credits complex &nbsp;·&nbsp; 🪙🪙🪙 3 credits premium
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 max-w-xl mx-auto">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.name} className="rounded-lg border border-border/60 bg-background px-4 py-5 text-center">
                <p className="text-center text-base text-muted-foreground font-medium uppercase tracking-wide mb-1">{pack.name}</p>
                <p className="text-center text-3xl font-bold">{pack.credits}</p>
                <p className="text-center text-base text-muted-foreground mt-0.5">credits</p>
                <p className="text-center text-lg font-semibold text-primary mt-2">{pack.price}</p>
              </div>
            ))}
          </div>
          {/* Tier reference */}
          <div className="mt-4 rounded-lg border border-border/60 overflow-hidden max-w-xl mx-auto">
            <div className="px-4 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credit cost per generation</div>
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-3 px-4 py-2 text-sm">
                <span className="font-medium text-primary">▸ Simple — 1 credit</span>
                <span className="text-muted-foreground col-span-2">≤5 tools · content ≤2,000 chars</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2 text-sm">
                <span className="font-medium text-amber-500">▸ Complex — 2 credits</span>
                <span className="text-muted-foreground col-span-2">6–15 tools · or content up to 5,000 chars</span>
              </div>
              <div className="grid grid-cols-3 px-4 py-2 text-sm">
                <span className="font-medium text-orange-500">▸ Premium — 3 credits</span>
                <span className="text-muted-foreground col-span-2">16–25 tools · or content up to 10,000 chars</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why upgrade */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why developers upgrade to Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <Zap className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-2">50 Credits Every Month</h3>
                <p className="text-sm text-muted-foreground">
                  Ship MCP integrations as fast as you think of them. Unused credits roll over &mdash; you never lose what you paid for.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-2">Security Audit on Every Server</h3>
                <p className="text-sm text-muted-foreground">
                  Get a detailed security report with specific remediation guidance for every flagged check across 22 security rules.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-2">Priority Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get answers within 48 hours. Our team helps with setup, debugging, and deployment questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {FAQ.map(({ q, a }) => (
              <Card key={q} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="border-2 border-primary/20 bg-primary/5 text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-2">Start building MCP servers today</h2>
            <p className="text-muted-foreground mb-6">
              3 free credits · First 50 get 5 · No credit card required · Credits never expire
            </p>
            <Link href="/auth/signup">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="border-t border-border/40 mt-8">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <p>&copy; 2026 FloMCP</p>
          <div className="flex gap-4">
            <Link href="/docs/getting-started" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/library" className="hover:text-foreground transition-colors">MCP Library</Link>
            <Link href="/legal/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}