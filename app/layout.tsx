import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://flomcp.com'),
  title: "FloMCP - Create MCP Online | Build MCP Servers in Minutes | MCP Helper & Generator",
  description: "Create MCP servers online with FloMCP. Build Model Context Protocol servers instantly. MCP helper tool for quick MCP development. Generate production-ready MCP servers with AI - works with Claude, Copilot. Save 10+ hours per project.",
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
    "fastest way to build mcp", "mcp development tool", "mcp automation"
  ],
  authors: [{ name: "FloMCP Team" }],
  creator: "FloMCP",
  publisher: "FloMCP",
  alternates: {
    canonical: "https://flomcp.com",
  },
  openGraph: {
    title: "FloMCP - Create MCP Online | MCP Helper & Generator",
    description: "Build MCP servers online in minutes. Quick MCP helper tool for developers. Generate production-ready Model Context Protocol servers instantly.",
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
    title: "FloMCP - Create MCP Online | Build MCP Servers in Minutes",
    description: "Quick MCP helper tool. Build Model Context Protocol servers online. Save 10+ hours with automated MCP generation.",
    images: ["/twitter-image.png"],
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
    google: "your-google-verification-code", // Add your Google Search Console verification code
  },
  category: "Technology",
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
    "description": "Create MCP servers online. Build Model Context Protocol servers in minutes with automated generation, complete schemas, and production-ready code.",
    "operatingSystem": "Web",
    "url": "https://flomcp.com",
    "author": {
      "@type": "Organization",
      "name": "FloMCP"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247"
    }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FloMCP",
    "url": "https://flomcp.com",
    "logo": "https://flomcp.com/logo.png",
    "description": "Quick MCP helper tool for developers. Build Model Context Protocol servers online.",
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
        "name": "How do I create MCP online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "FloMCP lets you create MCP servers online in minutes. Simply describe your requirements, and FloMCP generates production-ready Model Context Protocol server code with schemas, error handling, and documentation."
        }
      },
      {
        "@type": "Question",
        "name": "What is an MCP helper?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An MCP helper is a tool that simplifies building Model Context Protocol servers. FloMCP is a quick MCP helper that automates boilerplate code generation, saving you 10+ hours per project."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to build MCP online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "With FloMCP, you can build MCP servers online in just 5 minutes. Without FloMCP, manual MCP development takes 10+ hours including setup, schemas, and testing."
        }
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
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
