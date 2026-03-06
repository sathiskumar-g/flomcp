import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — FloMCP",
  description: "FloMCP Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Who We Are</h2>
            <p>
              FloMCP (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the FloMCP.com
              website and MCP server generation service. This policy describes how we handle your
              personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. What We Collect</h2>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong>Account information:</strong> Email address and password (hashed) when
                you create an account.
              </li>
              <li>
                <strong>Usage data:</strong> MCP servers you generate, security scores, and
                dashboard activity.
              </li>
              <li>
                <strong>Support tickets:</strong> Messages you send to our support team.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, and request logs for
                security and abuse prevention.
              </li>
              <li>
                <strong>Analytics:</strong> Anonymised page view data via Vercel Analytics (no
                cookies, no cross-site tracking).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>To provide and improve the FloMCP service.</li>
              <li>To send transactional emails (account confirmation, support replies).</li>
              <li>To enforce our Terms of Service and prevent abuse.</li>
              <li>To analyse usage patterns in aggregate (never individually identifiable).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Storage &amp; Retention</h2>
            <p>
              Your data is stored in Supabase (PostgreSQL) hosted on AWS infrastructure in the US.
              We apply industry-standard encryption at rest and in transit (TLS 1.2+).
            </p>
            <p className="mt-3">
              We retain your account data for as long as your account is active. If you delete your
              account, we will delete your personal data within 30 days. Generation metadata used
              for rate limiting is purged after 90 days. Anonymised analytics data may be retained
              indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell your personal data. We share data with:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
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
                <strong>Payment processor</strong> — when you purchase a paid plan, billing data
                (name, email, payment method) is handled directly by our payment provider under
                their own privacy policy.{" "}
                <em>(Payment integration coming soon.)</em>
              </li>
              <li>
                <strong>Vercel</strong> — hosting and analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Your Rights (GDPR / CCPA)</h2>
            <p>
              If you are located in the European Economic Area (EEA), UK, or California, you have
              additional rights under GDPR and CCPA respectively.
            </p>
            <p className="mt-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Export your generated server data.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@flomcp.com">support@flomcp.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookies</h2>
            <p>
              We use a single session cookie for authentication (Supabase Auth). We do not use
              tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Children</h2>
            <p>
              FloMCP is not directed at children under 13. We do not knowingly collect data from
              children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy. Material changes will be communicated via email to
              registered users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
            <p>
              Questions? Email us at{" "}
              <a href="mailto:support@flomcp.com">support@flomcp.com</a>.
            </p>
          </section>

          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Also see our{" "}
              <Link href="/legal/terms-of-service">Terms of Service</Link>,{" "}
              <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>, and{" "}
              <Link href="/legal/refund-policy">Refund Policy</Link>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
