/**
 * Verify Email Page
 * 
 * Shown to users who haven't verified their email yet
 * Provides instructions and resend link option
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleResendEmail = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Get current user from local session (no network call)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        setError("Please sign in first.");
        router.push('/auth/signin');
        return;
      }

      // Resend verification email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (resendError) throw resendError;

      setMessage("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || "Failed to resend email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            Please verify your email address to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm">
              We've sent a verification link to your email address.
            </p>
            <p className="text-sm">
              Click the link in the email to verify your account and gain access to FlowMCP.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Didn't receive the email?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          {message && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#ff4343]/10 border border-[#ff4343]/20 text-[#ff4343] rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push('/auth/signin')}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
