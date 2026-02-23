"use client";

/**
 * SignUp Component
 * 
 * Features:
 * - Email/password registration
 * - Disposable email detection (blocks temporary email services)
 * - Terms of Service acceptance (required)
 * - Security disclaimer checkboxes
 * - Email verification requirement
 * - Google OAuth option
 * 
 * Cost-conscious: Uses Supabase free tier for auth (no additional cost)
 */

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

// List of disposable/temporary email domains to block
// This prevents abuse from users creating fake accounts
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'mailinator.com', 'throwaway.email', 'maildrop.cc',
  'temp-mail.org', 'getnada.com', 'trashmail.com',
  'yopmail.com', 'fakeinbox.com', 'mintemail.com',
  'mohmal.com', 'emailondeck.com', 'throwawaymail.com',
  'tempail.com', 'discard.email', 'guerrillamailblock.com',
];

/**
 * Check if email domain is from a disposable email service
 * Helps prevent spam and fake account creation (cost protection)
 */
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

export function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Terms of Service acceptance states
  const [tosAccepted, setTosAccepted] = useState(false);
  const [securityAcknowledged, setSecurityAcknowledged] = useState(false);
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);

  const supabase = createClient();

  /**
   * Handle email/password signup
   * - Validates email (no disposable domains)
   * - Requires all ToS checkboxes
   * - Sends verification email (Supabase handles this automatically)
   */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation: Check disposable email
    if (isDisposableEmail(email)) {
      setError("Disposable email addresses are not allowed. Please use a permanent email.");
      setLoading(false);
      return;
    }

    // Validation: Check all required checkboxes
    if (!tosAccepted || !securityAcknowledged || !responsibilityAccepted) {
      setError("Please accept all required terms to continue.");
      setLoading(false);
      return;
    }

    // Validation: Password strength (minimum 8 characters)
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      // Create user with email verification required
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            tos_accepted: true,
            security_acknowledged: true,
            responsibility_accepted: true,
          }
        }
      });

      if (signUpError) throw signUpError;

      // Success! User must verify email before accessing the platform
      setSuccess(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth signup
   * - Same ToS requirements
   * - Redirect to Google for authentication
   * - No email verification needed (Google already verified)
   */
  const handleGoogleSignUp = async () => {
    setError("");

    // Validation: Check all required checkboxes
    if (!tosAccepted || !securityAcknowledged || !responsibilityAccepted) {
      setError("Please accept all required terms to continue.");
      return;
    }

    setLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(err.message || "Failed to sign up with Google. Please try again.");
      setLoading(false);
    }
  };

  // Show success message after signup
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center">Check Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in the email to verify your account and start generating MCP servers.
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary hover:underline"
            >
              try again
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up to start generating secure MCP servers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Terms of Service Checkboxes - REQUIRED FOR LEGAL PROTECTION */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Required Agreements:</p>
            
            {/* ToS Agreement */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="tos"
                checked={tosAccepted}
                onCheckedChange={(checked) => setTosAccepted(checked as boolean)}
                disabled={loading}
              />
              <label htmlFor="tos" className="text-sm leading-tight cursor-pointer">
                I agree to the{" "}
                <Link href="/legal/terms-of-service" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/acceptable-use" target="_blank" className="text-primary hover:underline">
                  Acceptable Use Policy
                </Link>
              </label>
            </div>

            {/* Security Disclaimer */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="security"
                checked={securityAcknowledged}
                onCheckedChange={(checked) => setSecurityAcknowledged(checked as boolean)}
                disabled={loading}
              />
              <label htmlFor="security" className="text-sm leading-tight cursor-pointer">
                I understand that generated code requires security review before production use
              </label>
            </div>

            {/* Responsibility Disclaimer */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="responsibility"
                checked={responsibilityAccepted}
                onCheckedChange={(checked) => setResponsibilityAccepted(checked as boolean)}
                disabled={loading}
              />
              <label htmlFor="responsibility" className="text-sm leading-tight cursor-pointer">
                I am responsible for testing and validating all generated code before deployment
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Sign Up Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
