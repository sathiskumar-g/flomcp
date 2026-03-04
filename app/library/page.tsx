import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase-server";
import { Logo } from "@/components/Logo";
import {
  Code2,
  ArrowRight,
  ExternalLink,
  Github,
  Database,
  Globe,
  FileText,
  Terminal,
  MessageSquare,
  Search,
  Shield,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "MCP Library — FloMCP",
  description:
    "Curated collection of open-source MCP servers and FloMCP-generated examples. Find the right MCP integration for your project.",
};

type McpServer = {
  name: string;
  description: string;
  category: string;
  icon: typeof Database;
  githubUrl?: string;
  tags: string[];
  official?: boolean;
};

const OFFICIAL_SERVERS: McpServer[] = [
  {
    name: "GitHub MCP",
    description:
      "Interact with GitHub repositories, issues, PRs, and code search directly from your AI assistant.",
    category: "Developer Tools",
    icon: Github,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    tags: ["repos", "issues", "PRs", "code search"],
    official: true,
  },
  {
    name: "Filesystem MCP",
    description:
      "Read, write, list, and search files on your local filesystem with configurable access controls.",
    category: "System",
    icon: FileText,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    tags: ["files", "local", "read/write"],
    official: true,
  },
  {
    name: "PostgreSQL MCP",
    description:
      "Query and inspect PostgreSQL databases. Supports SELECT queries with read-only safety mode.",
    category: "Databases",
    icon: Database,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    tags: ["postgres", "SQL", "database"],
    official: true,
  },
  {
    name: "SQLite MCP",
    description:
      "Full SQLite database interaction including CREATE, INSERT, SELECT, and UPDATE operations.",
    category: "Databases",
    icon: Database,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    tags: ["sqlite", "SQL", "local db"],
    official: true,
  },
  {
    name: "Brave Search MCP",
    description:
      "Web and local search using the Brave Search API. Returns structured results with snippets.",
    category: "Search",
    icon: Search,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
    tags: ["web search", "brave", "search"],
    official: true,
  },
  {
    name: "Fetch MCP",
    description:
      "Fetch web pages, convert HTML to Markdown, and extract content for AI consumption.",
    category: "Web",
    icon: Globe,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    tags: ["HTTP", "web scraping", "HTML to markdown"],
    official: true,
  },
  {
    name: "Puppeteer MCP",
    description:
      "Browser automation and web scraping using Puppeteer. Take screenshots, click elements, fill forms.",
    category: "Web",
    icon: Globe,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    tags: ["browser", "automation", "screenshots"],
    official: true,
  },
  {
    name: "Slack MCP",
    description:
      "Send messages, list channels, and read Slack workspace activity via the Slack API.",
    category: "Communication",
    icon: MessageSquare,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    tags: ["slack", "messaging", "workspace"],
    official: true,
  },
  {
    name: "Memory MCP",
    description:
      "Persistent key-value memory store for AI assistants. Create, update, and retrieve facts across sessions.",
    category: "AI Infrastructure",
    icon: Layers,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    tags: ["memory", "persistence", "KV store"],
    official: true,
  },
  {
    name: "Shell / Terminal MCP",
    description:
      "Execute shell commands in a sandboxed environment. Configurable allow-lists for command safety.",
    category: "System",
    icon: Terminal,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
    tags: ["shell", "terminal", "commands"],
    official: true,
  },
];

const COMMUNITY_EXAMPLES = [
  {
    name: "REST API Wrapper",
    description:
      "A FloMCP-generated template for wrapping any REST API as an MCP server. Includes auth, pagination, and error handling.",
    tags: ["REST", "API", "template"],
    useFloMCP: true,
  },
  {
    name: "Database Query Server",
    description:
      "Read-only database query MCP server with parameterized queries, connection pooling, and schema introspection.",
    tags: ["database", "SQL", "read-only"],
    useFloMCP: true,
  },
  {
    name: "Webhook Dispatcher",
    description:
      "Send webhooks to external services with retry logic, payload signing, and delivery confirmation.",
    tags: ["webhooks", "HTTP", "events"],
    useFloMCP: true,
  },
  {
    name: "File Processor",
    description:
      "Read, transform, and write files in various formats (JSON, CSV, YAML, XML) with validation.",
    tags: ["files", "transform", "parsing"],
    useFloMCP: true,
  },
  {
    name: "Email Sender",
    description:
      "Send transactional emails via Resend or SendGrid. Includes template support and delivery tracking.",
    tags: ["email", "Resend", "SendGrid"],
    useFloMCP: true,
  },
  {
    name: "Calendar / Scheduling",
    description:
      "Create events, check availability, and manage calendar entries via Google Calendar or CalDAV.",
    tags: ["calendar", "Google", "scheduling"],
    useFloMCP: true,
  },
];

const CATEGORIES = [
  "All",
  "Developer Tools",
  "Databases",
  "Web",
  "Search",
  "Communication",
  "System",
  "AI Infrastructure",
];

const iconMap: Record<string, typeof Database> = {
  "Developer Tools": Github,
  Databases: Database,
  Web: Globe,
  Search: Search,
  Communication: MessageSquare,
  System: Terminal,
  "AI Infrastructure": Layers,
};

export default async function LibraryPage() {
  // Check auth server-side so the header and CTAs adapt to login state
  let isLoggedIn = false;
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // if cookies/session unavailable just treat as logged-out
  }

  const authHref = isLoggedIn ? "/dashboard" : "/auth/signup";
  const generateHref = isLoggedIn ? "/dashboard/generate" : "/auth/signup";
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
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Start Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4">MCP Library</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Open-Source MCP Servers</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A curated collection of production-ready MCP servers — official Anthropic servers,
            community contributions, and FloMCP-generated templates. All free, all open-source.
          </p>
        </div>

        {/* Banner */}
        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <div>
                <p className="font-bold mb-1">Need a custom MCP server?</p>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t see what you need? Generate a custom MCP server in 5 minutes with
                  FloMCP — free, no code required.
                </p>
              </div>
              <Link href={generateHref} className="flex-shrink-0">
                <Button>
                  Generate Free Server
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Official Servers */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">Official MCP Servers</h2>
            <Badge variant="outline" className="border-green-500/40 text-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Anthropic Official
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            Maintained by Anthropic and the MCP core team. Available at{" "}
            <a
              href="https://github.com/modelcontextprotocol/servers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              github.com/modelcontextprotocol/servers
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_SERVERS.map((server) => {
              const Icon = server.icon;
              return (
                <Card
                  key={server.name}
                  className="border-border/60 hover:border-primary/30 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base">{server.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {server.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">{server.description}</CardDescription>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {server.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {server.githubUrl && (
                      <a
                        href={server.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Github className="h-3 w-3" />
                        View on GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FloMCP Templates */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">FloMCP Templates</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Code2 className="h-3 w-3 mr-1" />
              Generate Free
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            Common MCP patterns you can generate instantly with FloMCP. Click &quot;Generate&quot; to
            create a customized version for your use case.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMMUNITY_EXAMPLES.map((server) => (
              <Card
                key={server.name}
                className="border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{server.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-3">{server.description}</CardDescription>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {server.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link href={generateHref}>
                    <Button size="sm" variant="outline" className="w-full">
                      <Code2 className="mr-2 h-3 w-3" />
                      Generate This Template
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Install Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">How to Use Any MCP Server</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mb-3">
                  1
                </div>
                <h3 className="font-semibold mb-2">Clone or Download</h3>
                <p className="text-sm text-muted-foreground">
                  Clone the GitHub repo or download the FloMCP ZIP. Run{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">npm install</code> and
                  copy <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.example</code>{" "}
                  to <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code>.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mb-3">
                  2
                </div>
                <h3 className="font-semibold mb-2">Add to Config</h3>
                <p className="text-sm text-muted-foreground">
                  Register the server in your AI tool&apos;s config file. See the{" "}
                  <Link
                    href="/docs/getting-started"
                    className="text-primary underline"
                  >
                    getting started guide
                  </Link>{" "}
                  for Claude Desktop and Copilot setup.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mb-3">
                  3
                </div>
                <h3 className="font-semibold mb-2">Use It</h3>
                <p className="text-sm text-muted-foreground">
                  Restart your AI assistant. The MCP tools are available immediately. Ask your AI to
                  use them naturally — it knows what they do from the schema.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <Card className="border-2 border-primary/20 bg-primary/5 text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-2">Build a custom MCP server</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Describe your integration in plain English. FloMCP generates the complete TypeScript
              server with security analysis — free.
            </p>
            <Link href={generateHref}>
              <Button size="lg">
                {isLoggedIn ? "Go to Generator" : "Start Generating Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="border-t border-border/40 mt-8">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <p>© 2026 FloMCP</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs/getting-started" className="hover:text-foreground transition-colors">
              Docs
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
