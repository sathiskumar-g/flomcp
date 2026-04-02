import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Acceptable Use Policy — FloMCP",
  description: "FloMCP Acceptable Use Policy — what is and is not permitted when using the service.",
};

export default function AcceptableUsePolicyPage() {
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
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold">Acceptable Use Policy</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Last Updated: April 2, 2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">Purpose</h2>
            <p>
              This Acceptable Use Policy defines prohibited uses of FloMCP. Violations may result
              in immediate account suspension or termination without refund.
            </p>
          </section>

          {/* Prohibited Uses - Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Prohibited Security Activities</h2>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-red-600 dark:text-red-500">
                STRICTLY PROHIBITED:
              </p>
              <p>You may NOT use FloMCP to generate:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Malware:</strong> Viruses, trojans, ransomware, spyware, keyloggers, 
                  or any malicious software
                </li>
                <li>
                  <strong>Hacking Tools:</strong> Port scanners, password crackers, exploit frameworks, 
                  or tools designed to bypass security measures
                </li>
                <li>
                  <strong>Data Stealers:</strong> Tools to scrape, harvest, or exfiltrate data 
                  without authorization
                </li>
                <li>
                  <strong>Botnet Components:</strong> Command-and-control servers, DDoS tools, 
                  or automated attack scripts
                </li>
                <li>
                  <strong>Exploits:</strong> Zero-day exploits, vulnerability scanners for offensive 
                  purposes, or tools designed to compromise systems
                </li>
              </ul>
            </div>
          </section>

          {/* Prohibited Uses - Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Privacy Violations</h2>
            <p>You may NOT use FloMCP to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Generate tools that collect personal data without proper consent and legal basis
              </li>
              <li>
                Create surveillance software or stalking tools
              </li>
              <li>
                Build tools that violate GDPR, CCPA, or other privacy regulations
              </li>
              <li>
                Generate code that processes sensitive personal information (health, financial, 
                biometric) without proper safeguards
              </li>
            </ul>
          </section>

          {/* Prohibited Uses - Legal */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Illegal Activities</h2>
            <p>You may NOT use FloMCP to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights (copyright, trademarks, patents)</li>
              <li>Create tools for fraud, scams, or deception</li>
              <li>Generate code that aids in money laundering or illegal transactions</li>
              <li>Build tools for harassment, doxxing, or cyberbullying</li>
            </ul>
          </section>

          {/* Prohibited Uses - Service Abuse */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Service Abuse</h2>
            <p>You may NOT:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Automated Abuse:</strong> Use bots, scripts, or automation to 
                excessively generate code beyond normal human usage
              </li>
              <li>
                <strong>Account Sharing:</strong> Share your account credentials or 
                create multiple accounts to bypass rate limits
              </li>
              <li>
                <strong>Reverse Engineering:</strong> Attempt to reverse engineer, decompile, 
                or extract our AI models or prompts
              </li>
              <li>
                <strong>Reselling:</strong> Resell or redistribute the Service without authorization
              </li>
              <li>
                <strong>System Attacks:</strong> Attempt to disrupt, damage, or gain unauthorized 
                access to our systems
              </li>
            </ul>
          </section>

          {/* Acceptable Uses */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Acceptable Uses (Examples)</h2>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-green-600 dark:text-green-500">
                ENCOURAGED USES:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Development Tools:</strong> Internal tools for your team or projects
                </li>
                <li>
                  <strong>API Integrations:</strong> Connecting legitimate APIs to AI assistants
                </li>
                <li>
                  <strong>Data Processing:</strong> Tools to process your own data or data 
                  you have permission to use
                </li>
                <li>
                  <strong>Automation:</strong> Legitimate workflow automation for productivity
                </li>
                <li>
                  <strong>Educational Projects:</strong> Learning MCP and AI tool development
                </li>
                <li>
                  <strong>Security Research:</strong> Defensive security tools for protecting 
                  your own systems (not offensive tools)
                </li>
              </ul>
            </div>
          </section>

          {/* Content Filtering */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Content Filtering</h2>
            <p>
              We implement automated content filtering to detect and block prohibited uses. 
              Our system checks for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Keywords associated with malicious activities</li>
              <li>Patterns indicative of exploit development</li>
              <li>Requests that violate our policies</li>
            </ul>
            <p className="mt-3">
              <strong>Note:</strong> Our filtering may occasionally flag legitimate use cases. 
              If you believe your request was incorrectly blocked, contact support with details.
            </p>
          </section>

          {/* Enforcement */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Enforcement</h2>
            <p>Violations of this policy may result in:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                <strong>First Violation:</strong> Warning and temporary account suspension
              </li>
              <li>
                <strong>Second Violation:</strong> Extended suspension (7-30 days)
              </li>
              <li>
                <strong>Third Violation or Severe Violation:</strong> Permanent account 
                termination and potential legal action
              </li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">
              Severe violations (malware, hacking tools, illegal activities) may result in 
              immediate permanent termination without warning.
            </p>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Reporting Violations</h2>
            <p>
              If you become aware of violations of this policy, please report them to:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:abuse@flomcp.com" className="text-primary hover:underline">
                abuse@flomcp.com
              </a>
            </p>
            <p className="mt-2">
              Include as much detail as possible:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Account username or email (if known)</li>
              <li>Description of the violation</li>
              <li>Evidence (screenshots, generated code, etc.)</li>
              <li>Date and time of the violation</li>
            </ul>
          </section>

          {/* Legal Cooperation */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Legal Cooperation</h2>
            <p>
              We cooperate with law enforcement and regulatory authorities. We will:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Report suspected criminal activity to appropriate authorities</li>
              <li>Comply with valid legal requests for user information</li>
              <li>Preserve evidence of violations as required by law</li>
            </ul>
          </section>

          {/* Updates to Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Policy Updates</h2>
            <p>
              We may update this Acceptable Use Policy to address new threats or compliance 
              requirements. Continued use of the Service after updates constitutes acceptance 
              of the revised policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Questions</h2>
            <p>
              If you have questions about what is or isn't allowed, contact us before proceeding:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:support@flomcp.com" className="text-primary hover:underline">
                support@flomcp.com
              </a>
            </p>
          </section>

          {/* Acknowledgment */}
          <section className="bg-muted/50 border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-3">Acknowledgment</h2>
            <p className="text-sm">
              BY USING FLOMCP, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS
              ACCEPTABLE USE POLICY AND AGREE TO COMPLY WITH ALL PROVISIONS.
            </p>
            <p className="text-sm mt-2 text-muted-foreground">
              Violation of this policy may result in account termination, legal action, 
              and cooperation with law enforcement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
