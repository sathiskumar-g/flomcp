/**
 * Reset Password Page
 *
 * User lands here after clicking the password reset link in their email.
 * Flow:
 *  1. Supabase email link → /auth/callback?next=/auth/reset-password
 *  2. Callback exchanges the code and sets a recovery session cookie
 *  3. User lands here with an active (recovery) session
 *  4. They set a new password → POST /api/auth/update-password
 *  5. On success → redirect to sign in
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null); // null = checking

  // Verify we have a valid recovery session before showing the form.
  // The session was set by /auth/callback when it exchanged the reset code.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to update password. Please try again.");
        return;
      }

      setSuccess(true);
      // Sign out so they log in fresh with the new password
      await fetch("/api/auth/signout", { method: "POST" });
      setTimeout(() => router.push("/auth/signin"), 3000);
    } catch {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading session check ──
  if (sessionReady === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── No session — link expired or already used ──
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
            <Logo height={36} />
          </Link>
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-14 w-14 text-[#ff4343]" />
              </div>
              <CardTitle className="text-center">Link Expired</CardTitle>
              <CardDescription className="text-center">
                This password reset link has expired or has already been used.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push("/auth/signin")}>
                Back to Sign In
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Need a new link? Click <strong>Forgot password?</strong> on the sign-in page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
            <Logo height={36} />
          </Link>
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
              </div>
              <CardTitle className="text-center">Password Updated</CardTitle>
              <CardDescription className="text-center">
                Your password has been changed successfully. Redirecting you to sign in…
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/auth/signin")}>
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Password form ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
          <Logo height={36} />
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
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
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#ff4343]/10 border border-[#ff4343]/20 text-[#ff4343] rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
