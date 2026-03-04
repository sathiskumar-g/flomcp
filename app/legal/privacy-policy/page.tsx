import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Privacy Policy — FloMCP",
  description: "FloMCP Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={32} />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>
          <em>Last updated: January 2026</em>
        </p>

        <h2>1. Who We Are</h2>
        <p>
          FloMCP (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the floMCP.com website
          and MCP server generation service. This policy describes how we handle your personal
          information.
        </p>

        <h2>2. What We Collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> Email address and password (hashed) when you
            create an account.
          </li>
          <li>
            <strong>Usage data:</strong> MCP servers you generate, security scores, and dashboard
            activity.
          </li>
          <li>
            <strong>Support tickets:</strong> Messages you send to our support team.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser type, and request logs for security
            and abuse prevention.
          </li>
          <li>
            <strong>Analytics:</strong> Anonymised page view data via Vercel Analytics (no cookies,
            no cross-site tracking).
          </li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>To provide and improve the FloMCP service.</li>
          <li>To send transactional emails (account confirmation, support replies).</li>
          <li>To enforce our Terms of Service and prevent abuse.</li>
          <li>To analyse usage patterns in aggregate (never individually identifiable).</li>
        </ul>

        <h2>4. Data Storage</h2>
        <p>
          Your data is stored in Supabase (PostgreSQL) hosted on AWS infrastructure in the US. We
          apply industry-standard encryption at rest and in transit (TLS 1.2+).
        </p>

        <h2>5. Data Sharing</h2>
        <p>
          We do <strong>not</strong> sell your personal data. We share data with:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database and auth provider.
          </li>
          <li>
            <strong>Resend</strong> — transactional email delivery.
          </li>
          <li>
            <strong>Anthropic (Claude API)</strong> — to generate your MCP server code. Your
            generation prompts are processed by Claude but not stored by FloMCP beyond your
            dashboard.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and analytics.
          </li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Export your generated server data.</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:support@flomcp.com">support@flomcp.com</a>.
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use a single session cookie for authentication (Supabase Auth). We do not use tracking
          cookies or third-party advertising cookies.
        </p>

        <h2>8. Children</h2>
        <p>
          FloMCP is not directed at children under 13. We do not knowingly collect data from
          children.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy. Material changes will be communicated via email to registered
          users.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions? Email us at{" "}
          <a href="mailto:support@flomcp.com">support@flomcp.com</a>.
        </p>

        <hr />
        <p className="text-sm text-muted-foreground">
          Also see our{" "}
          <Link href="/legal/terms-of-service">Terms of Service</Link> and{" "}
          <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>.
        </p>
      </div>
    </main>
  );
}
