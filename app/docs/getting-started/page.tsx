import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Terminal,
  Download,
  Zap,
  Shield,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { createServerClient } from "@/lib/supabase-server";

export const metadata = {
  title: "Getting Started — FloMCP Documentation",
  description:
    "Learn how to generate your first production-ready MCP server with FloMCP in under 5 minutes.",
};

export default async function GettingStartedPage() {
  let isLoggedIn = false;
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // treat as logged-out if session unavailable
  }
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
              <Button variant="ghost" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Docs
              </Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Start Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Page title */}
        <div className="mb-12">
          <Badge className="mb-4">Documentation</Badge>
          <h1 className="text-4xl font-bold mb-4">Getting Started with FloMCP</h1>
          <p className="text-lg text-muted-foreground">
            Generate your first production-ready MCP server in under 5 minutes. No manual
            boilerplate, no configuration headaches.
          </p>
        </div>

        {/* Quick nav */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">On This Page</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
              <li><a href="#what-is-mcp" className="hover:text-foreground transition-colors">What is MCP?</a></li>
              <li><a href="#create-account" className="hover:text-foreground transition-colors">Create Your Account</a></li>
              <li><a href="#generate-server" className="hover:text-foreground transition-colors">The 5-Step Generator Wizard</a></li>
              <li><a href="#download-setup" className="hover:text-foreground transition-colors">Download &amp; Setup</a></li>
              <li><a href="#connect-claude" className="hover:text-foreground transition-colors">Connect to Claude Desktop</a></li>
              <li><a href="#connect-copilot" className="hover:text-foreground transition-colors">Connect to GitHub Copilot</a></li>
              <li><a href="#security-score" className="hover:text-foreground transition-colors">Understanding Your Security Score</a></li>
              <li><a href="#credits" className="hover:text-foreground transition-colors">Credits &amp; Pricing</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ol>
          </CardContent>
        </Card>

        {/* What is MCP */}
        <section id="what-is-mcp" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. What is MCP?</h2>
          <p className="text-muted-foreground mb-4">
            The{" "}
            <strong>Model Context Protocol (MCP)</strong> is an open standard created by Anthropic
            that allows AI assistants (Claude, GitHub Copilot, Cursor, etc.) to securely connect to
            external tools, data sources, and services.
          </p>
          <p className="text-muted-foreground mb-4">
            An MCP server exposes <strong>tools</strong> that the AI can call — for example, reading
            files, querying a database, calling an API, or running a search. Without MCP, every AI
            integration requires custom, often insecure glue code. With MCP, you write the server
            once and use it everywhere.
          </p>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm">
                <strong>FloMCP generates complete MCP servers for you</strong> — including tool
                schemas, error handling, input validation, and setup documentation — in under 5
                minutes via an AI-assisted 5-step wizard.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Create Account */}
        <section id="create-account" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Create Your Account</h2>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>
                Go to{" "}
                <Link href="/auth/signup" className="text-primary underline">
                  floMCP.com/auth/signup
                </Link>{" "}
                and enter your email address.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>
                Check your inbox for a confirmation email and click the link (check spam if you
                don&apos;t see it within 2 minutes).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>
                You&apos;re taken to your dashboard. The free plan includes{" "}
                <strong>3 credits on signup — they never expire</strong>.
              </span>
            </li>
          </ol>
        </section>

        {/* Generate Server */}
        <section id="generate-server" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. The 5-Step Generator Wizard</h2>
          <p className="text-muted-foreground mb-6">
            Navigate to{" "}
            <Link href="/dashboard/generate" className="text-primary underline">
              Dashboard → Generate
            </Link>{" "}
            and follow the 5-step wizard:
          </p>
          <div className="space-y-4">
            {[
              {
                step: "Step 1 — Describe",
                desc: 'Give your server a name and describe what it should do in plain English. Use the built-in example prompts (GitHub, Weather, Database, Slack…) or load a saved prompt. A clear, detailed description yields better tool suggestions and higher-quality generated code.',
              },
              {
                step: "Step 2 — API Setup (optional)",
                desc: 'Configure an external API your server will call: base URL, authentication type (None, API Key, Bearer Token, or OAuth 2.0), API documentation URL (FloMCP fetches and uses it as context), input schema fields, and config options. Skip this step if your server does not call an external API.',
              },
              {
                step: "Step 3 — Tools",
                desc: 'Define the tools your server exposes (up to 25). Three ways to add tools: (1) Generate Tools — Claude suggests 3 tools based on your description; (2) Import Schema — paste OpenAI function JSON, MCP inputSchema, or FloMCP native format; (3) Add Custom Tool — define name, description, parameters, and an optional example output. FloMCP shows a live credit cost estimate as you build.',
              },
              {
                step: "Step 4 — Resources & Prompts (optional)",
                desc: 'Attach static context (Resources) or reusable message templates (Prompts) to your server. Drag & drop .txt, .md, or .json files, or type content directly. Each resource/prompt can be scoped to all tools or a specific tool. This step is optional — skip it if your server needs no injected context.',
              },
              {
                step: "Step 5 — Review & Generate",
                desc: 'Full summary of your configuration with live credit cost. Click Generate — watch the 3-pass engine stream in real time: Pass 1 (schema contract) → Pass 2 (TypeScript implementation) → Pass 3 (quality checklist) → MCP protocol compliance checks → 22 OWASP security checks. When complete, download the ZIP and view your security score.',
              },
            ].map(({ step, desc }) => (
              <Card key={step} className="border-border/60">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">{step}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Download & Setup */}
        <section id="download-setup" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Download &amp; Setup</h2>
          <p className="text-muted-foreground mb-4">
            After generation, click <strong>Download ZIP</strong>. The archive includes:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground mb-6">
            {[
              "index.ts — Main MCP server entry point",
              "tools/ — Individual tool handler files",
              ".env.example — All required environment variables",
              "README.md — Auto-generated setup instructions specific to your server",
              "package.json — Dependencies with exact version pins",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold mb-3">Install Dependencies</h3>
          <Card className="bg-muted/50 border-border/60 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Terminal</span>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {`cd your-mcp-server
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run build`}
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Connect Claude */}
        <section id="connect-claude" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Connect to Claude Desktop</h2>
          <p className="text-muted-foreground mb-4">
            Claude Desktop uses a config file to register MCP servers. Open (or create) the file at:
          </p>
          <Card className="bg-muted/50 border-border/60 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Config path</span>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {`macOS:  ~/Library/Application Support/Claude/claude_desktop_config.json
Windows: %APPDATA%\\Claude\\claude_desktop_config.json`}
              </pre>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mb-4">
            Add your server to the <code>mcpServers</code> object:
          </p>
          <Card className="bg-muted/50 border-border/60 mb-4">
            <CardContent className="pt-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {`{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/your-server/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}`}
              </pre>
            </CardContent>
          </Card>
          <p className="text-muted-foreground">
            Restart Claude Desktop. Your MCP tools will appear in the tool selector (hammer icon) in
            any conversation.
          </p>
        </section>

        {/* Connect Copilot */}
        <section id="connect-copilot" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Connect to GitHub Copilot</h2>
          <p className="text-muted-foreground mb-4">
            GitHub Copilot (in VS Code) supports MCP servers via the{" "}
            <code>.vscode/mcp.json</code> workspace config:
          </p>
          <Card className="bg-muted/50 border-border/60 mb-4">
            <CardContent className="pt-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {`// .vscode/mcp.json
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["${"/absolute/path/to/your-server/dist/index.js"}"],
      "env": {
        "API_KEY": "\${input:apiKey}"
      }
    }
  }
}`}
              </pre>
            </CardContent>
          </Card>
          <p className="text-muted-foreground">
            VS Code will prompt for any <code>${"{input:varName}"}</code> values the first time you
            use the server. See the{" "}
            <a
              href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              VS Code MCP docs
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            for full details.
          </p>
        </section>

        {/* Credits */}
        <section id="credits" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">8. Credits &amp; Pricing</h2>
          <p className="text-muted-foreground mb-4">
            FloMCP uses a credit system. The cost of each generation depends on its complexity:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { tier: "Simple", cost: "1 credit", rule: "≤5 tools · content ≤2,000 chars", color: "border-primary/20 bg-primary/5" },
              { tier: "Complex", cost: "2 credits", rule: "6–15 tools · OR content 2,001–5,000 chars", color: "border-amber-500/20 bg-amber-500/5" },
              { tier: "Premium", cost: "3 credits", rule: "≥16 tools · OR content >5,000 chars", color: "border-orange-500/20 bg-orange-500/5" },
            ].map(({ tier, cost, rule, color }) => (
              <Card key={tier} className={`border ${color}`}>
                <CardContent className="pt-4 pb-4">
                  <p className="font-semibold text-sm">{tier} — {cost}</p>
                  <p className="text-xs text-muted-foreground mt-1">{rule}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-muted-foreground mb-4">
            The wizard shows your estimated credit cost in real time on Step 3 (Tools) and Step 5 (Review).
          </p>
          <Card className="border-border/60 mb-4">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-2">Plans</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Free:</strong> 3 credits on signup — never expire. No credit card required.</li>
                <li><strong className="text-foreground">Pro ($19/mo):</strong> 50 credits/month. Up to 25 unused credits roll over (max 75 total). Priority queue. Credit top-up packs available.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Security Score */}
        <section id="security-score" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. Understanding Your Security Score</h2>
          {/* anchor for credits section which comes after */}
          <p className="text-muted-foreground mb-4">
            Every FloMCP-generated server automatically receives a{" "}
            <strong>security score out of 100</strong>, calculated across 22 checks in 6 categories:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { label: "Input Validation", desc: "Schema strictness, type checking" },
              { label: "Authentication", desc: "Env var usage, no hardcoded secrets" },
              { label: "Error Handling", desc: "Graceful failures, no stack leaks" },
              { label: "Rate Limiting", desc: "Abuse prevention patterns" },
              { label: "SSRF Prevention", desc: "URL validation, metadata blocking" },
              { label: "Dependency Safety", desc: "No known vulnerable packages" },
            ].map(({ label, desc }) => (
              <Card key={label} className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Scores <strong className="text-green-600">80–100</strong> are production-ready.{" "}
            <strong className="text-yellow-600">60–79</strong> need review.{" "}
            <strong className="text-red-600">Below 60</strong> should not be deployed to production
            without addressing the flagged issues.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">9. FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "How many servers can I generate on the free plan?",
                a: "Free accounts start with 3 credits — they never expire. Simple servers (≤5 tools, content ≤2,000 chars) cost 1 credit. Complex (6–15 tools or content up to 5,000 chars) cost 2 credits. Premium (≥16 tools or content >5,000 chars) cost 3 credits. Upgrade to Pro for 50 credits/month with 25-credit rollover.",
              },
              {
                q: "What languages does FloMCP generate?",
                a: "FloMCP currently generates TypeScript MCP servers using the official @modelcontextprotocol/sdk. Python support is on the roadmap.",
              },
              {
                q: "Can I edit the generated code?",
                a: "Yes — the generated code is yours. It's plain TypeScript with no proprietary dependencies. Edit, extend, and deploy it anywhere.",
              },
              {
                q: "Does FloMCP store my generated servers?",
                a: "Yes. Generated servers are saved in your dashboard (Dashboard → Servers). You can re-download the ZIP, view the full source code, check the security score, and access integration instructions at any time.",
              },
              {
                q: "How do AI Tool Suggestions work?",
                a: "On Step 3 (Tools), click Generate Tools. FloMCP sends your description to Claude and receives 3 suggested tool definitions — names, descriptions, and parameter schemas — pre-filled and ready to edit. You can regenerate as many times as you like.",
              },
              {
                q: "Can I import an existing tool schema into the wizard?",
                a: "Yes. On Step 3, click Import Schema and paste JSON. FloMCP supports four formats: OpenAI function-calling format, MCP inputSchema, FloMCP native, and plain arrays. Duplicates are detected and skipped automatically so you never get two tools with the same name.",
              },
              {
                q: "What are Resources and Prompts?",
                a: "Resources are static context blocks (docs, schemas, data files) attached to your server so Claude can reference them during tool calls. Prompts are reusable message templates. Both are optional and can be scoped to all tools or a specific tool. Drag & drop .txt, .md, or .json files in Step 4.",
              },
              {
                q: "What if my API key is wrong in .env?",
                a: "The generated server validates required env vars at startup and throws a clear error message specifying which variable is missing or empty.",
              },
              {
                q: "Can I use FloMCP servers with Cursor or Windsurf?",
                a: "Yes. Any tool that supports the MCP stdio transport works. Check your tool's documentation for the config file location and format.",
              },
              {
                q: "How do I get support?",
                a: "Use the Support section in your dashboard (Dashboard → Support). We typically respond within 24 hours.",
              },
            ].map(({ q, a }) => (
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
        </section>

        {/* CTA */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg">Ready to build your first MCP server?</p>
                <p className="text-sm text-muted-foreground">
                  Free plan • No credit card required • 5 credits on signup
                </p>
              </div>
              <Link href="/auth/signup">
                <Button size="lg">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <p>© 2026 FloMCP</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/library" className="hover:text-foreground transition-colors">
              MCP Library
            </Link>
            <Link href="/legal/terms-of-service" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
