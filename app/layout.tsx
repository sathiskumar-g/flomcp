import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://flomcp.com'),
  title: "FloMCP - Build MCP Servers in Minutes, Not Hours | Model Context Protocol Generator",
  description: "Generate production-ready MCP servers in minutes. Complete boilerplate with error handling, schemas, and documentation. Works with Claude, Copilot, and all AI assistants. Save 2-3 hours per server.",
  keywords: ["MCP", "Model Context Protocol", "MCP server generator", "MCP server builder", "AI tools", "Claude MCP", "GitHub Copilot", "agentic AI", "LLM integration", "AI agent tools", "MCP boilerplate", "developer productivity", "code generation", "API integration", "tool calling", "MCP development", "Anthropic MCP", "AI workflow"],
  authors: [{ name: "FloMCP" }],
  openGraph: {
    title: "FloMCP - Generate MCP Servers Instantly",
    description: "Generate production-ready MCP servers in 60 seconds. Stop writing boilerplate.",
    type: "website",
    url: "https://flomcp.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "FloMCP - Generate MCP Servers Instantly",
    description: "Stop writing boilerplate MCP servers. Get production-ready code in 60 seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
