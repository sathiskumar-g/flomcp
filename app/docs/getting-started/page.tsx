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

export const metadata = {
  title: "Getting Started — FloMCP Documentation",
  description:
    "Learn how to generate your first production-ready MCP server with FloMCP in under 5 minutes.",
};

export default function GettingStartedPage() {
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
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Start Free</Button>
            </Link>
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
              <li>
                <a href="#what-is-mcp" className="hover:text-foreground transition-colors">
                  What is MCP?
                </a>
              </li>
              <li>
                <a href="#create-account" className="hover:text-foreground transition-colors">
                  Create Your Account
                </a>
              </li>
              <li>
                <a href="#generate-server" className="hover:text-foreground transition-colors">
                  Generate Your First MCP Server
                </a>
              </li>
              <li>
                <a href="#download-setup" className="hover:text-foreground transition-colors">
                  Download &amp; Setup
                </a>
              </li>
              <li>
                <a href="#connect-claude" className="hover:text-foreground transition-colors">
                  Connect to Claude Desktop
                </a>
              </li>
              <li>
                <a href="#connect-copilot" className="hover:text-foreground transition-colors">
                  Connect to GitHub Copilot
                </a>
              </li>
              <li>
                <a href="#security-score" className="hover:text-foreground transition-colors">
                  Understanding Your Security Score
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
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
                <strong>5 credits on signup (one-time, never expire)</strong>.
              </span>
            </li>
          </ol>
        </section>

        {/* Generate Server */}
        <section id="generate-server" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Generate Your First MCP Server</h2>
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
                desc: 'Describe your integration in plain English. Example: "A GitHub MCP server that can list repositories, create issues, and read file contents."',
              },
              {
                step: "Step 2 — Tools",
                desc: 'Define the tools your server will expose. Each tool has a name, description, and input parameters. Example tool: "list_repos" with parameter "username: string".',
              },
              {
                step: "Step 3 — Authentication",
                desc: "Choose how your server authenticates with external services: API Key (env var), OAuth, or None. FloMCP generates the right auth scaffolding automatically.",
              },
              {
                step: "Step 4 — Review",
                desc: "Preview the generated server structure, tool list, and security configuration before generating.",
              },
              {
                step: "Step 5 — Generate",
                desc: "FloMCP calls Claude to generate your full MCP server. Watch it stream in real time. When done, download the ZIP and you're ready.",
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

        {/* Security Score */}
        <section id="security-score" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. Understanding Your Security Score</h2>
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
          <h2 className="text-2xl font-bold mb-6">8. FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "How many servers can I generate on the free plan?",
                a: "The free plan gives you 5 credits on signup \u2014 they never expire. Each server generation costs 1 credit (or 2 for complex servers with 5+ tools, API, resources, and prompts). Upgrade to Pro for 50 credits/month with rollover.",
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
                a: "Yes, your generated servers are saved in your dashboard under Servers. You can re-download, view the security score, and access setup instructions at any time.",
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
