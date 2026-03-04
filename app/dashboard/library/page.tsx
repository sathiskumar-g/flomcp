"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code2, ArrowRight, ExternalLink, Github, Database, Globe,
  FileText, Terminal, MessageSquare, Search, Shield, Layers, Sparkles,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

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
    description: "Interact with GitHub repositories, issues, PRs, and code search directly from your AI assistant.",
    category: "Developer Tools", icon: Github,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    tags: ["repos", "issues", "PRs", "code search"], official: true,
  },
  {
    name: "Filesystem MCP",
    description: "Read, write, list, and search files on your local filesystem with configurable access controls.",
    category: "System", icon: FileText,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    tags: ["files", "local", "read/write"], official: true,
  },
  {
    name: "PostgreSQL MCP",
    description: "Query and inspect PostgreSQL databases. Supports SELECT queries with read-only safety mode.",
    category: "Databases", icon: Database,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    tags: ["postgres", "SQL", "database"], official: true,
  },
  {
    name: "SQLite MCP",
    description: "Full SQLite database interaction including CREATE, INSERT, SELECT, and UPDATE operations.",
    category: "Databases", icon: Database,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    tags: ["sqlite", "SQL", "local db"], official: true,
  },
  {
    name: "Brave Search MCP",
    description: "Web and local search using the Brave Search API. Returns structured results with snippets.",
    category: "Search", icon: Search,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
    tags: ["web search", "brave", "search"], official: true,
  },
  {
    name: "Fetch MCP",
    description: "Fetch web pages, convert HTML to Markdown, and extract content for AI consumption.",
    category: "Web", icon: Globe,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    tags: ["HTTP", "web scraping", "HTML to markdown"], official: true,
  },
  {
    name: "Puppeteer MCP",
    description: "Browser automation and web scraping using Puppeteer. Take screenshots, click elements, fill forms.",
    category: "Web", icon: Globe,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    tags: ["browser", "automation", "screenshots"], official: true,
  },
  {
    name: "Slack MCP",
    description: "Send messages, list channels, and read Slack workspace activity via the Slack API.",
    category: "Communication", icon: MessageSquare,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    tags: ["slack", "messaging", "workspace"], official: true,
  },
  {
    name: "Memory MCP",
    description: "Persistent key-value memory store for AI assistants. Create, update, and retrieve facts across sessions.",
    category: "AI Infrastructure", icon: Layers,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    tags: ["memory", "persistence", "KV store"], official: true,
  },
  {
    name: "Shell / Terminal MCP",
    description: "Execute shell commands in a sandboxed environment. Configurable allow-lists for command safety.",
    category: "System", icon: Terminal,
    githubUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
    tags: ["shell", "terminal", "commands"], official: true,
  },
];

const COMMUNITY_EXAMPLES = [
  { name: "REST API Wrapper", description: "A FloMCP-generated template for wrapping any REST API.", tags: ["REST", "API", "template"] },
  { name: "Database Query Server", description: "Read-only database query server with parameterized queries and schema introspection.", tags: ["database", "SQL", "read-only"] },
  { name: "Webhook Dispatcher", description: "Send webhooks with retry logic, payload signing, and delivery confirmation.", tags: ["webhooks", "HTTP", "events"] },
  { name: "File Processor", description: "Read, transform, and write files in JSON, CSV, YAML, XML with validation.", tags: ["files", "transform", "parsing"] },
  { name: "Email Sender", description: "Send transactional emails via Resend or SendGrid with template support.", tags: ["email", "Resend", "SendGrid"] },
  { name: "Calendar / Scheduling", description: "Create events and manage calendar entries via Google Calendar or CalDAV.", tags: ["calendar", "Google", "scheduling"] },
];

const CATEGORIES = ["All", "Developer Tools", "Databases", "Web", "Search", "Communication", "System", "AI Infrastructure"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardLibraryPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? OFFICIAL_SERVERS
    : OFFICIAL_SERVERS.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MCP Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse curated open-source MCP servers and FloMCP-generated examples.
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button size="sm" className="gap-2 flex-shrink-0">
            <Sparkles className="h-4 w-4" />
            Generate Custom Server
          </Button>
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Official servers grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Official MCP Servers</h2>
          <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((server) => {
            const Icon = server.icon;
            return (
              <Card key={server.name} className="border border-border/60 hover:border-border transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{server.name}</CardTitle>
                        <p className="text-[11px] text-muted-foreground">{server.category}</p>
                      </div>
                    </div>
                    {server.githubUrl && (
                      <a href={server.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                        aria-label={`${server.name} on GitHub`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{server.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {server.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FloMCP generated examples */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">FloMCP-Generated Examples</h2>
          <Badge variant="secondary" className="text-xs">Templates</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COMMUNITY_EXAMPLES.map((ex) => (
            <Card key={ex.name} className="border border-border/60 border-dashed hover:border-border transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm">{ex.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{ex.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {ex.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                  ))}
                </div>
                <Link href="/dashboard/generate">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-7">
                    <Sparkles className="h-3 w-3" />Generate Similar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="rounded-xl border border-border/60 bg-muted/20 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Can&apos;t find what you need?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Describe your integration and FloMCP will generate a production-ready MCP server in seconds.
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button className="gap-2 flex-shrink-0" size="sm">
            <Sparkles className="h-4 w-4" />Generate Custom Server
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
