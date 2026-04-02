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
        <p className="text-muted-foreground mb-8">Last updated: April 2, 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Who We Are</h2>
            <p>
              FloMCP (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the FloMCP.com
              website and MCP server generation service. We are the data controller responsible
              for the personal data you provide to us.
            </p>
            <p className="mt-3">
              Contact: <a href="mailto:privacy@flomcp.com">privacy@flomcp.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. What We Collect</h2>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong>Account information:</strong> Email address and password (hashed and salted
                by Supabase Auth — we never see your plaintext password).
              </li>
              <li>
                <strong>Usage data:</strong> MCP servers you generate, security scores, credit
                balance, generation timestamps, and dashboard activity.
              </li>
              <li>
                <strong>Generated server content:</strong> The source code and tool definitions of
                servers you generate, stored so you can access them from your dashboard.
              </li>
              <li>
                <strong>Support communications:</strong> Messages you send via our support system.
              </li>
              <li>
                <strong>Technical / security data:</strong> IP address, browser type, and request
                logs retained for security monitoring and abuse prevention.
              </li>
              <li>
                <strong>Analytics:</strong> Anonymised page-view data via Vercel Analytics (no
                cookies, no cross-site tracking, no personal identifiers).
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> collect payment card details directly. If and when
              paid plans are processed by a payment provider, that provider handles all card data
              under their own PCI-DSS compliant environment and privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Legal Basis for Processing (GDPR)</h2>
            <p>
              If you are located in the EEA, UK, or another jurisdiction with similar data
              protection laws, we process your personal data on the following legal bases:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong>Contract (Art. 6(1)(b) GDPR):</strong> Processing your email, usage data,
                and generated content is necessary to provide the Service you signed up for.
              </li>
              <li>
                <strong>Legal obligation (Art. 6(1)(c) GDPR):</strong> We may process data to
                comply with applicable laws (e.g. record-keeping, responding to lawful requests).
              </li>
              <li>
                <strong>Legitimate interests (Art. 6(1)(f) GDPR):</strong> Processing IP addresses
                and logs for security monitoring, fraud prevention, and abuse detection — balanced
                against your interests and rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>To provide, operate, and improve the FloMCP service.</li>
              <li>To send transactional emails (account confirmation, support replies, billing notifications).</li>
              <li>To enforce our Terms of Service and Acceptable Use Policy.</li>
              <li>To analyse usage patterns in aggregate (never individually identifiable).</li>
              <li>To investigate abuse, fraud, or illegal activity.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> use your data for advertising, sell it to third parties,
              or use it for any purpose unrelated to providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Storage &amp; Retention</h2>
            <p>
              Your data is stored in Supabase (PostgreSQL) hosted on AWS infrastructure. We apply
              industry-standard encryption at rest and in transit (TLS 1.2+).
            </p>
            <table className="w-full text-sm mt-3 border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-semibold">Data type</th>
                  <th className="py-2 font-semibold">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr><td className="py-2 pr-4">Account data</td><td className="py-2">Until account deletion + 30 days</td></tr>
                <tr><td className="py-2 pr-4">Generated servers</td><td className="py-2">Until you delete them or your account</td></tr>
                <tr><td className="py-2 pr-4">Security / request logs</td><td className="py-2">90 days, then purged</td></tr>
                <tr><td className="py-2 pr-4">Support messages</td><td className="py-2">3 years from last interaction</td></tr>
                <tr><td className="py-2 pr-4">Anonymised analytics</td><td className="py-2">Indefinitely (no personal data)</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Sharing &amp; Processors</h2>
            <p>
              We do <strong>not</strong> sell your personal data. We share the minimum necessary
              data with the following processors, each bound by data processing agreements:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong>Supabase</strong> — database and authentication provider (AWS us-east-1).
              </li>
              <li>
                <strong>Anthropic (Claude API)</strong> — your generation prompts are sent to
                Claude to produce MCP server code. Anthropic processes this data under their
                API terms and privacy policy. Prompts are not retained by FloMCP beyond the
                generated output.
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery.
              </li>
              <li>
                <strong>Vercel</strong> — hosting and privacy-friendly analytics.
              </li>
              <li>
                <strong>Payment processor</strong> — billing data is handled directly by our
                payment provider under their own privacy policy. FloMCP does not receive or
                store card details.
              </li>
            </ul>
            <p className="mt-3">
              We may disclose personal data if required by law, court order, or to protect the
              rights and safety of FloMCP, our users, or the public.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. International Data Transfers</h2>
            <p>
              FloMCP is operated from India and uses infrastructure based in the United States
              (Supabase on AWS). If you are located in the EEA or UK, your personal data is
              transferred to countries that may not have equivalent data protection laws.
            </p>
            <p className="mt-3">
              We rely on the European Commission&apos;s Standard Contractual Clauses (SCCs) and
              the UK International Data Transfer Addendum as the appropriate safeguard for these
              transfers where applicable. You may request a copy of the relevant safeguards by
              contacting us at <a href="mailto:privacy@flomcp.com">privacy@flomcp.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Your Rights</h2>
            <p>
              Depending on your location, you may have the following rights regarding your
              personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your account and personal data.</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Restriction:</strong> Ask us to restrict processing of your data in certain circumstances.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li>
                <strong>Complaint:</strong> If you are in the EEA or UK, you have the right to
                lodge a complaint with your local data protection authority (e.g. the ICO in the
                UK, or your national DPA in the EU).
              </li>
              <li>
                <strong>CCPA (California residents):</strong> You have the right to know what
                personal data we collect, to delete it, and to opt out of its sale. We do not
                sell personal data.
              </li>
              <li>
                <strong>India DPDP Act 2023:</strong> Indian residents have rights to access,
                correction, erasure, and grievance redressal under the Digital Personal Data
                Protection Act 2023.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@flomcp.com">privacy@flomcp.com</a>. We will respond within
              30 days (or as required by applicable law). We may ask you to verify your identity
              before processing your request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Cookies</h2>
            <p>
              We use a single session cookie for authentication (set by Supabase Auth). This
              cookie is strictly necessary for the Service to function and cannot be opted out of
              while using your account.
            </p>
            <p className="mt-3">
              We do <strong>not</strong> use tracking cookies, advertising cookies, or third-party
              cookies. Vercel Analytics uses no cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Children</h2>
            <p>
              FloMCP is not directed at children. You must be at least 16 years old (or the
              applicable age of digital consent in your country) to create an account. We do not
              knowingly collect personal data from anyone under 16. If you believe we have
              inadvertently collected data from a child, please contact us immediately at{" "}
              <a href="mailto:privacy@flomcp.com">privacy@flomcp.com</a> and we will delete it
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Security</h2>
            <p>
              We implement industry-standard technical and organisational measures to protect your
              personal data, including TLS encryption in transit, encryption at rest, access
              controls, and regular security reviews. However, no internet transmission is
              completely secure and we cannot guarantee absolute security.
            </p>
            <p className="mt-3">
              If you discover a security vulnerability, please disclose it responsibly to{" "}
              <a href="mailto:security@flomcp.com">security@flomcp.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. When we make material changes, we will
              update the &quot;Last updated&quot; date at the top and notify registered users by
              email at least 14 days before changes take effect. Your continued use of the Service
              after the effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact &amp; Complaints</h2>
            <p>
              For any privacy questions, data subject requests, or complaints:
            </p>
            <ul className="list-none mt-2 space-y-1 text-sm">
              <li><strong>Email:</strong> <a href="mailto:privacy@flomcp.com">privacy@flomcp.com</a></li>
              <li><strong>General support:</strong> <a href="mailto:support@flomcp.com">support@flomcp.com</a></li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              If you are dissatisfied with our response, you may escalate to your national data
              protection authority.
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
