/**
 * Terms of Service Page
 * 
 * Legal protection and user agreement
 * Required for liability protection
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last Updated: March 6, 2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using FloMCP (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
            <p>
              FloMCP is a code generation tool that helps users create Model Context Protocol (MCP) servers.
              The Service uses AI (Anthropic&apos;s Claude) to generate code based on user inputs.
            </p>
          </section>

          {/* AI-Generated Content Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">3. AI-Generated Content Disclaimer</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-yellow-600 dark:text-yellow-500">
                IMPORTANT: AI Code Generation Notice
              </p>
              <p>
                FloMCP uses artificial intelligence to generate code. All output is AI-generated and must be
                treated as a starting point, not production-ready code.
              </p>
              <p>You acknowledge that:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>AI-generated code may contain errors, bugs, or security vulnerabilities</li>
                <li>Generated code may not be optimal, efficient, or best-practice compliant</li>
                <li>AI models can produce outputs that appear correct but are functionally incorrect</li>
                <li>You are solely responsible for reviewing, testing, and deploying any generated code</li>
              </ul>
            </div>
          </section>

          {/* No Warranty */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">4. No Warranty (AS-IS)</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-yellow-600 dark:text-yellow-500">
                IMPORTANT: Generated Code Disclaimer
              </p>
              <p>
                THE SERVICE AND ALL GENERATED CODE ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p>
                We make no guarantees that:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Generated code will be secure, error-free, or production-ready</li>
                <li>Generated code will meet your specific requirements</li>
                <li>Generated code will be free from vulnerabilities</li>
                <li>The Service will be available without interruption</li>
              </ul>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">5. User Responsibilities</h2>
            <p>You are solely responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Security Review:</strong> Reviewing all generated code for security vulnerabilities 
                before using it in any environment
              </li>
              <li>
                <strong>Testing:</strong> Thoroughly testing all generated code before deployment
              </li>
              <li>
                <strong>Compliance:</strong> Ensuring generated code complies with applicable laws and regulations
              </li>
              <li>
                <strong>Data Protection:</strong> Protecting any sensitive data used with generated code
              </li>
              <li>
                <strong>Dependencies:</strong> Keeping all dependencies in generated code up to date
              </li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-red-600 dark:text-red-500">
                CRITICAL: No Liability for Damages
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY DIRECT, 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your use or inability to use the Service</li>
                <li>Any errors, bugs, or vulnerabilities in generated code</li>
                <li>Data loss or security breaches resulting from generated code</li>
                <li>Any damages to your systems or third-party systems</li>
                <li>Any financial losses incurred from using generated code</li>
              </ul>
              <p className="mt-3">
                This limitation applies even if we have been advised of the possibility of such damages.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Acceptable Use</h2>
            <p>You agree NOT to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Generate malicious code, malware, viruses, or exploits</li>
              <li>Create tools for hacking, unauthorized access, or data theft</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Generate code that processes personal data without proper consent</li>
              <li>Abuse the Service through excessive API calls or automated scraping</li>
            </ul>
            <p className="mt-2 text-sm">
              See our <Link href="/legal/acceptable-use" className="text-primary hover:underline">
                Acceptable Use Policy
              </Link> for detailed guidelines.
            </p>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time if you violate 
              these Terms of Service or our Acceptable Use Policy.
            </p>
          </section>

          {/* Generated Code Ownership */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Intellectual Property</h2>
            <p>
              <strong>Generated Code:</strong> You own the code generated by the Service.
              You are free to use, modify, and distribute it as you see fit.
            </p>
            <p>
              <strong>The Service:</strong> FloMCP and its underlying technology remain our property.
              You may not copy, reverse engineer, or create derivative works of the Service itself.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Data Collection &amp; Privacy</h2>
            <p>
              We collect minimal data necessary to provide the Service:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Email address (for authentication)</li>
              <li>Usage statistics (generation count, timestamps)</li>
              <li>Generated code metadata (for rate limiting and abuse prevention)</li>
            </ul>
            <p className="mt-2">
              We do NOT store the actual code you generate. All generation happens in real-time, 
              and we only keep metadata for service operation.
            </p>
          </section>

          {/* Billing & Subscriptions */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Billing &amp; Subscriptions (Pro Plan)</h2>
            <p>
              FloMCP offers both a free tier and paid Pro subscription plan. By subscribing to a paid plan:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Billing:</strong> Subscriptions are billed monthly or annually via our payment
                provider <em>(payment integration coming soon)</em>.
                You authorise us to charge your payment method on a recurring basis.
              </li>
              <li>
                <strong>Cancellation:</strong> You may cancel at any time from your account settings.
                Cancellation takes effect at the end of the current billing period.
              </li>
              <li>
                <strong>Refunds:</strong> Please see our{" "}
                <a href="/legal/refund-policy" className="text-primary hover:underline">Refund Policy</a>{" "}
                for full details on eligibility and how to request a refund.
              </li>
              <li>
                <strong>Price Changes:</strong> We will provide at least 30 days notice before
                increasing subscription prices for existing subscribers.
              </li>
              <li>
                <strong>Credits:</strong> Unused generation credits do not roll over between billing periods
                unless stated otherwise.
              </li>
            </ul>
          </section>

          {/* Pricing & Free Tier */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Free Tier &amp; Pricing Changes</h2>
            <p>
              FloMCP currently offers a free tier with usage limits. We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Change pricing or introduce paid plans at any time</li>
              <li>Adjust free tier limits based on costs and usage patterns</li>
              <li>Require payment for continued access after free tier exhaustion</li>
            </ul>
            <p className="mt-2">
              We will provide notice before any significant pricing changes.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Changes to Terms</h2>
            <p>
              We may update these Terms of Service at any time. If we make material changes, 
              we will notify you via email or through the Service. Your continued use of the Service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India.
              Any disputes arising from these Terms or the use of the Service shall first be
              attempted to be resolved through good-faith negotiation. If unresolved within 30 days,
              disputes shall be subject to the exclusive jurisdiction of the courts of India.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@flomcp.com" className="text-primary hover:underline">
                legal@flomcp.com
              </a>
            </p>
          </section>

          {/* Acknowledgment */}
          <section className="bg-muted/50 border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-3">Acknowledgment</h2>
            <p className="text-sm">
              BY CLICKING "I AGREE" DURING SIGNUP, YOU ACKNOWLEDGE THAT YOU HAVE READ, 
              UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
