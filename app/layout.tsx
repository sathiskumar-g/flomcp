import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://flomcp.com'),
  title: "FloMCP — MCP Server Generator | Build Production-Ready MCP Servers",
  description: "Build MCP servers from plain English — Zod schemas, error handling, 22 security checks. Works with Claude, GitHub Copilot, Cursor & Windsurf. Free to start.",
  keywords: [
    // Primary keywords
    "create mcp online", "build mcp online", "mcp helper", "mcp flow", "quick mcp",
    // Secondary keywords
    "mcp", "mcp server", "mcp generator", "mcp builder", "mcp creator", "mcp tool",
    "model context protocol", "mcp server generator", "mcp server builder", "mcp online",
    "build mcp", "create mcp", "mcp development", "mcp helper tool",
    // AI-related keywords
    "claude mcp", "copilot mcp", "ai mcp", "mcp for claude", "mcp for copilot",
    "anthropic mcp", "github copilot mcp", "ai assistant mcp", "llm mcp",
    // Developer keywords
    "mcp boilerplate", "mcp template", "mcp scaffold", "automated mcp",
    "developer productivity", "code generation", "api integration", "ai tools",
    // Long-tail keywords
    "how to create mcp server", "how to build mcp", "mcp server tutorial",
    "fastest way to build mcp", "mcp development tool", "mcp automation",
    // Security keywords
    "secure mcp", "mcp security", "safe mcp server", "owasp mcp", "mcp best practices",
    // Competitor keywords
    "mcp generator online", "instant mcp", "mcp maker", "mcp wizard"
  ],
  authors: [{ name: "FloMCP Team" }],
  creator: "FloMCP",
  publisher: "FloMCP",
  alternates: {
    canonical: "https://flomcp.com",
  },
  openGraph: {
    title: "FloMCP — MCP Server Generator",
    description: "Generate complete MCP servers from plain English. Zod schemas, error handling, security checks — download and run in minutes.",
    type: "website",
    url: "https://flomcp.com",
    siteName: "FloMCP",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FloMCP - Create MCP Servers Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FloMCP — MCP Server Generator",
    description: "Generate production-ready MCP servers from plain English. Works with Claude, Copilot, Cursor. 22 security checks on every server.",
    images: ["/og-image.png"],
    creator: "@flomcp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "Technology",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/FloMCP-Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "FloMCP",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Generate production-ready MCP servers from plain English. Zod schemas, error handling, and 22 security checks included. Works with Claude, GitHub Copilot, Cursor, and Windsurf.",
    "operatingSystem": "Web",
    "url": "https://flomcp.com",
    "author": {
      "@type": "Organization",
      "name": "FloMCP"
    }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FloMCP",
    "url": "https://flomcp.com",
    "logo": "https://flomcp.com/FloMCP-Logo.png",
    "description": "MCP server generator for developers. Generate production-ready Model Context Protocol servers with security checks built in.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "availableLanguage": "English"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I generate an MCP server with FloMCP?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sign up for a free account (no card required), describe your server in plain English across 5 short steps, and FloMCP generates complete TypeScript code — Zod schemas, handlers, error handling, and README included. Download and run immediately."
        }
      },
      {
        "@type": "Question",
        "name": "What is an MCP server and why do I need one?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An MCP server exposes your tools, APIs, and databases to AI assistants like Claude and GitHub Copilot. Without one, your AI only uses its training data. With one, it can query your database, call your APIs, and take real actions in real time. FloMCP generates the complete server code so you don't have to write the boilerplate yourself."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to build an MCP server with FloMCP?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "As little as 1 minute with FloMCP, compared to 10+ hours writing one manually. FloMCP handles schemas, error handling, security checks, and README generation automatically."
        }
      },
      {
        "@type": "Question",
        "name": "Are FloMCP servers secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. FloMCP generates secure, OWASP-compliant MCP servers with no SSRF vulnerabilities, proper input validation, zero hardcoded secrets, and bounded execution paths. All code follows MCP security best practices."
        }
      }
    ]
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Build an MCP Server with FloMCP",
    "description": "Step-by-step guide to generating a production-ready MCP server with FloMCP — from plain English description to working TypeScript code",
    "totalTime": "PT2M",
    "tool": [{
      "@type": "HowToTool",
      "name": "FloMCP - MCP Helper & Generator"
    }],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Sign up for FloMCP",
        "text": "Create your free FloMCP account — 5 credits included, no card required",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Describe your MCP requirements",
        "text": "Tell FloMCP what APIs or integrations you need in plain English",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Generate MCP server code",
        "text": "FloMCP instantly generates production-ready MCP server with schemas, validation, and error handling",
        "position": 3
      },
      {
        "@type": "HowToStep",
        "name": "Download and deploy",
        "text": "Download your secure MCP server code and deploy it with Claude, Copilot, or any AI assistant",
        "position": 4
      }
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        {/* Global toast notifications */}
        <Toaster
          position="top-center"
          theme="dark"
          richColors
          toastOptions={{ duration: 6000 }}
        />
      </body>
    </html>
  );
}
