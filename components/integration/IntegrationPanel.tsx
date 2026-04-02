"use client";

/**
 * IntegrationPanel — B11 + B12
 *
 * Transport Method Selector + Connection Config JSON Output (Ready-to-Paste).
 *
 * Shows STDIO transport badge (always — that's what FloMCP generates) and
 * ready-to-paste config JSON for every major MCP-compatible AI coding tool:
 *   Claude Desktop · VS Code (GitHub Copilot) · Cursor · Windsurf · Cline
 *
 * Usage:
 *   <IntegrationPanel serverName={server.name} />
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  CheckCircle2,
  Terminal,
  MonitorPlay,
  MousePointerClick,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Client Definitions ───────────────────────────────────────────────────────

type ClientId = "claude" | "vscode" | "cursor" | "windsurf" | "cline";

interface ConfigPath {
  os: string;
  value: string;
}

interface ClientDef {
  id: ClientId;
  /** Tab label */
  label: string;
  /** Full display name */
  name: string;
  /** Coloured dot class for the tab indicator */
  colorClass: string;
  configPaths: ConfigPath[];
  getConfig: (slug: string) => object;
  getSseConfig: (slug: string) => object;
  restartNote: string;
  addViaUI?: string;
}

const CLIENTS: ClientDef[] = [
  {
    id: "claude",
    label: "Claude Desktop",
    name: "Claude Desktop",
    colorClass: "bg-orange-500",
    configPaths: [
      {
        os: "macOS",
        value: "~/Library/Application Support/Claude/claude_desktop_config.json",
      },
      {
        os: "Windows",
        value: "%APPDATA%\\Claude\\claude_desktop_config.json",
      },
    ],
    getConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          command: "npx",
          args: ["tsx", "src/index.ts"],
          cwd: `/absolute/path/to/${slug}`,
        },
      },
    }),
    getSseConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          url: "http://localhost:3001/sse",
        },
      },
    }),
    restartNote: "Fully quit and reopen Claude Desktop (menu bar → Quit, then reopen).",
  },
  {
    id: "vscode",
    label: "VS Code / Copilot",
    name: "VS Code (GitHub Copilot)",
    colorClass: "bg-blue-500",
    configPaths: [
      {
        os: "Workspace",
        value: ".vscode/mcp.json  (create in your project folder — server available in this project)",
      },
      {
        os: "Global macOS",
        value: "~/Library/Application Support/Code/User/settings.json",
      },
      {
        os: "Global Win",
        value: "%APPDATA%\\Code\\User\\settings.json",
      },
    ],
    getConfig: (slug) => ({
      servers: {
        [slug]: {
          type: "stdio",
          command: "npx",
          args: ["tsx", "src/index.ts"],
          cwd: `/absolute/path/to/${slug}`,
        },
      },
    }),
    getSseConfig: (slug) => ({
      servers: {
        [slug]: {
          type: "sse",
          url: "http://localhost:3001/sse",
        },
      },
    }),
    restartNote:
      'For .vscode/mcp.json: Ctrl+Shift+P → "MCP: List Servers" to confirm it loaded. For global settings.json: wrap the above in "mcp": { ... } and Reload Window.',
  },
  {
    id: "cursor",
    label: "Cursor",
    name: "Cursor",
    colorClass: "bg-violet-500",
    configPaths: [
      { os: "macOS / Linux", value: "~/.cursor/mcp.json" },
      { os: "Windows", value: "C:\\Users\\<username>\\.cursor\\mcp.json" },
    ],
    getConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          command: "npx",
          args: ["tsx", "src/index.ts"],
          cwd: `/absolute/path/to/${slug}`,
        },
      },
    }),
    getSseConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          url: "http://localhost:3001/sse",
        },
      },
    }),
    restartNote: "Restart Cursor (Cmd/Ctrl+Shift+P → Reload Window). Your tools appear in the Composer Agent panel.",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    name: "Windsurf",
    colorClass: "bg-cyan-500",
    configPaths: [
      { os: "macOS / Linux", value: "~/.codeium/windsurf/mcp_config.json" },
      {
        os: "Windows",
        value:
          "C:\\Users\\<username>\\.codeium\\windsurf\\mcp_config.json",
      },
    ],
    getConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          command: "npx",
          args: ["tsx", "src/index.ts"],
          cwd: `/absolute/path/to/${slug}`,
        },
      },
    }),
    getSseConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          url: "http://localhost:3001/sse",
        },
      },
    }),
    restartNote: "Restart Windsurf. Your MCP tools slot into the Cascade panel automatically.",
  },
  {
    id: "cline",
    label: "Cline",
    name: "Cline (VS Code Extension)",
    colorClass: "bg-green-500",
    configPaths: [
      {
        os: "Easiest",
        value: "Open Cline → MCP icon → Add Server → enter config below",
      },
      {
        os: "macOS",
        value:
          "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      },
      {
        os: "Windows",
        value:
          "%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json",
      },
    ],
    getConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          command: "npx",
          args: ["tsx", "src/index.ts"],
          cwd: `/absolute/path/to/${slug}`,
          disabled: false,
          autoApprove: [],
        },
      },
    }),
    getSseConfig: (slug) => ({
      mcpServers: {
        [slug]: {
          url: "http://localhost:3001/sse",
          disabled: false,
          autoApprove: [],
        },
      },
    }),
    restartNote: "Ctrl+Shift+P → Developer: Reload Window.",
    addViaUI:
      'In VS Code open the Cline extension, click the MCP server icon (top-right of the Cline panel), then "Add Server" and paste the JSON manually.',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface IntegrationPanelProps {
  serverName: string;
  /** When true the panel renders in a compact style (e.g. PostGenerationReview) */
  compact?: boolean;
}

export function IntegrationPanel({ serverName, compact = false }: IntegrationPanelProps) {
  const [activeId, setActiveId] = useState<ClientId>("claude");
  const [transportMode, setTransportMode] = useState<"stdio" | "sse">("stdio");
  const [copied, setCopied] = useState(false);

  const serverSlug = serverName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");

  const client = CLIENTS.find((c) => c.id === activeId)!;
  const configJson = transportMode === "sse"
    ? JSON.stringify(client.getSseConfig(serverSlug), null, 2)
    : JSON.stringify(client.getConfig(serverSlug), null, 2);

  async function handleCopy() {
    await navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Transport mode tabs */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border border-border/60 w-fit">
        <button
          onClick={() => { setTransportMode("stdio"); setCopied(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            transportMode === "stdio" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Terminal className="h-3.5 w-3.5" />
          STDIO Transport
        </button>
        <button
          onClick={() => { setTransportMode("sse"); setCopied(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            transportMode === "sse" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          SSE Transport
        </button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        {transportMode === "stdio"
          ? "Runs on your machine — no server, no port, no internet required. Works with every client below."
          : "HTTP-based transport — run the server locally then connect any client via URL. Ideal for testing."}
      </p>

      {/* SSE start instruction */}
      {transportMode === "sse" && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            Step 1 — start the SSE server
          </p>
          <code className="block text-xs font-mono bg-muted/60 rounded px-2 py-1.5">
            npm run start:http
          </code>
          <p className="text-xs text-muted-foreground">
            Starts an HTTP server on port 3001. Your MCP server is then reachable at{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">http://localhost:3001/sse</code>
          </p>
        </div>
      )}

      {/* Client selector tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CLIENTS.map((c) => (
          <button
            key={c.id}
            onClick={() => { setActiveId(c.id); setCopied(false); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
              activeId === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border/60 hover:bg-muted/50 hover:text-foreground hover:border-border"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.colorClass)} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Config block for the active client */}
      <div className="rounded-lg border border-border/70 overflow-hidden">
        {/* Header: client name + config file path(s) */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border/50 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", client.colorClass)} />
            <span className="text-sm font-semibold">{client.name}</span>
          </div>

          {/* Add via UI shortcut (Cline) */}
          {client.addViaUI && (
            <div className="flex items-start gap-2 rounded bg-blue-500/8 border border-blue-500/20 px-2.5 py-2 mt-1">
              <MousePointerClick className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{client.addViaUI}</p>
            </div>
          )}

          {/* Config file paths */}
          <div className="space-y-1 pt-0.5">
            {client.configPaths.map((p) => (
              <div key={p.os} className="flex items-start gap-2.5">
                <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide min-w-[60px] pt-px">
                  {p.os}
                </span>
                <code className="text-[11px] font-mono text-muted-foreground break-all">{p.value}</code>
              </div>
            ))}
          </div>
        </div>

        {/* JSON config + copy button */}
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 bg-background/80 hover:bg-background shadow-sm"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre
            className={cn(
              "text-xs font-mono bg-background overflow-auto leading-relaxed p-4 pt-3",
              compact ? "max-h-[180px]" : "max-h-[240px]"
            )}
          >
            <code>{configJson}</code>
          </pre>
        </div>

        {/* After-pasting instruction */}
        <div className="px-4 py-2.5 bg-muted/20 border-t border-border/40 flex items-start gap-2">
          <MonitorPlay className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">After pasting: </span>
            {client.restartNote}
          </p>
        </div>
      </div>

      {/* Path placeholder warning — STDIO only (SSE uses URL, no path needed) */}
      {transportMode === "stdio" && (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/8 border border-yellow-500/20">
        <span className="text-yellow-500 text-sm flex-shrink-0 mt-px">⚠</span>
        <p className="text-xs text-muted-foreground">
          Replace{" "}
          <code className="font-mono bg-muted/60 px-1 rounded text-foreground/80">
            /absolute/path/to/{serverSlug}
          </code>{" "}
          in the <strong>cwd</strong> field with the <strong>full folder path</strong> where you extracted the server.
          <span className="block mt-1 text-muted-foreground/70">
            Windows example:{" "}
            <code className="font-mono">C:/Users/YourName/Downloads/{serverSlug}</code>
            <br />
            macOS example:{" "}
            <code className="font-mono">/Users/YourName/Downloads/{serverSlug}</code>
            <br />
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              The cwd is critical — it tells the client where to find your .env file and node_modules.
            </span>
          </span>
        </p>
      </div>
      )}
    </div>
  );
}
