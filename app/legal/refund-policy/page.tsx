import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Refund Policy — FloMCP",
  description: "FloMCP Refund Policy — eligibility, process, and timelines for subscription refunds.",
};

export default function RefundPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">

          <section>
            <p>
              We want you to be satisfied with FloMCP. This policy explains when refunds are
              available, how to request one, and what to expect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Free Tier</h2>
            <p>
              The free tier costs nothing. No refunds apply. You can use the free tier for as
              long as you like without any payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Pro Plan — 7-Day Money-Back Guarantee</h2>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                Payment Integration Coming Soon
              </p>
              <p className="text-sm">
                Pro plan billing is not yet live. This refund policy will take full effect once
                payments are enabled.
              </p>
            </div>
            <p>
              If you subscribe to the FloMCP Pro plan and are not satisfied, you may request a
              full refund within <strong>7 days of your initial purchase</strong>, subject to the
              usage limit below.
            </p>
            <p className="mt-3">Eligibility requirements:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Your refund request must be submitted within 7 calendar days of the original payment date.</li>
              <li>This applies to the <strong>first payment only</strong> on a new subscription — not to renewals.</li>
              <li>
                <strong>Usage limit:</strong> You must have used <strong>5 or fewer generation
                credits</strong> during the subscription period. If you have used more than 5
                credits, the service has been meaningfully consumed and a refund will not be issued.
              </li>
              <li>
                Your account must not have violated our{" "}
                <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>.
              </li>
            </ul>
            <div className="bg-muted/50 border border-border/60 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Why a usage limit?</strong> The Pro plan includes 50 credits per month.
                Consuming a significant portion of those credits and then requesting a refund is
                not in the spirit of a money-back guarantee. 5 credits gives you enough to
                evaluate the service without exhausting it.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Renewals</h2>
            <p>
              If you forget to cancel before a renewal date and are charged for the next billing
              period, you may request a refund for that renewal charge within{" "}
              <strong>48 hours</strong> of the charge, provided you have not used the service
              during that new period. Contact us at{" "}
              <a href="mailto:support@flomcp.com">support@flomcp.com</a> promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Non-Refundable Situations</h2>
            <p>Refunds will <strong>not</strong> be issued for:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Requests made after the 7-day window for initial purchases.</li>
              <li>Accounts where more than 5 generation credits have been used — the service has been meaningfully consumed.</li>
              <li>Renewal charges where the service has been used during the new billing period.</li>
              <li>Accounts terminated for violating our Terms of Service or Acceptable Use Policy.</li>
              <li>Partial months — we do not offer pro-rated refunds for unused time.</li>
              <li>
                Dissatisfaction with AI-generated output quality — as disclosed in our{" "}
                <Link href="/legal/terms-of-service">Terms of Service</Link>, all generated code
                is provided as-is and AI outputs are not guaranteed.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. How to Request a Refund</h2>
            <p>
              To request a refund, email us at{" "}
              <a href="mailto:support@flomcp.com">support@flomcp.com</a> with:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Subject line: <strong>Refund Request — [your email]</strong></li>
              <li>The email address on your FloMCP account.</li>
              <li>Your order or transaction number (found in your payment receipt email).</li>
              <li>The reason for your request (optional, but helps us improve).</li>
            </ul>
            <p className="mt-3">
              We will respond within <strong>2 business days</strong>. Once approved, your refund
              will be processed and typically appear on your statement within 5–10 business days
              depending on your bank.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Payment Processing</h2>
            <p>
              Payments for FloMCP Pro are processed by our payment provider{" "}
              <em>(payment integration coming soon)</em>. FloMCP does not store your card details.
              Refunds are issued back to the original payment method and typically appear on your
              statement within 5–10 business days depending on your bank.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Disputes &amp; Chargebacks</h2>
            <p>
              We strongly encourage you to contact us before initiating a chargeback with your
              bank. In most cases we can resolve issues quickly. Chargebacks that are filed
              without first contacting us may result in account suspension while the dispute is
              investigated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href="mailto:support@flomcp.com">support@flomcp.com</a>.
            </p>
          </section>

          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Also see our{" "}
              <Link href="/legal/terms-of-service">Terms of Service</Link>,{" "}
              <Link href="/legal/privacy-policy">Privacy Policy</Link>, and{" "}
              <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
