import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Zap, Shield, Users } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Pricing \u2014 FloMCP",
  description:
    "Credit-based pricing for MCP server generation. Start free with 5 credits \u2014 no card required. Upgrade to Pro for 50 credits/month.",
};

const FREE_CREDIT_FEATURES = [
  "5 credits \u2014 one-time, never expire",
  "Full TypeScript source code",
  "Security score on every server (22 checks)",
  "Download ZIP + auto-generated docs",
  "Works with Claude, Copilot & Cursor",
  "MCP Library access",
];

const PRO_CREDIT_FEATURES = [
  "50 credits / month",
  "Half unused credits roll over (max 75)",
  "Everything in Free",
  "Priority generation queue",
  "MCP Assistant \u2014 security audit",
  "Credit top-up packs available",
  "Team workspaces (up to 3 members)",
  "Email support \u2014 48h response",
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
  { name: "Boost",    credits: "+10",  price: "$5"  },
  { name: "Standard", credits: "+25",  price: "$11" },
  { name: "Growth",   credits: "+50",  price: "$18" },
  { name: "Studio",   credits: "+100", price: "$30" },
];

const FAQ = [
  {
    q: "What counts as a credit?",
    a: "Each completed MCP server generation consumes 1 credit, or 2 credits for complex servers (5+ tools, resources, prompts, and API integration all at once). Abandoned or errored generations do not consume credits.",
  },
  {
    q: "Can I re-download previously generated servers?",
    a: "Yes \u2014 your generated servers are saved permanently in your dashboard. Re-downloading never consumes credits.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan gives you 5 credits one-time, no card required. You can try every feature before deciding to upgrade to Pro at $29/mo.",
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
                5 credits to get started &mdash; they never expire.
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
                <Badge variant="outline">Early Access</Badge>
              </div>
              <div className="mt-2">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2 text-base">
                For developers who ship MCP servers regularly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/#pricing">
                <Button className="w-full mb-6" size="lg">
                  <Zap className="mr-2 h-4 w-4" />
                  Get Pro &mdash; $29/mo
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
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold">Credit Top-Up Packs</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">Pro subscribers only</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border">Coming soon</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-muted-foreground">Generation cost:</span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-medium">
              🪙 1 credit &mdash; Simple server
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
              🪙🪙 2 credits &mdash; Complex server
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.name} className="rounded-lg border border-border/60 bg-background px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{pack.name}</p>
                <p className="text-2xl font-bold">{pack.credits}</p>
                <p className="text-xs text-muted-foreground mt-0.5">credits</p>
                <p className="text-sm font-semibold text-primary mt-2">{pack.price}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Top-up credits never expire and stack on top of your monthly allowance.</p>
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
              5 free credits &middot; No credit card required &middot; Credits never expire
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