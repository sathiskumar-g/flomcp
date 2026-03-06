/**
 * Auth Error Page
 * 
 * Displays authentication errors in a user-friendly way
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Support both ?message= (legacy) and ?error= (from callback/confirm routes)
  const errorCode = searchParams.get('error');
  const rawMessage = searchParams.get('message');

  const ERROR_MESSAGES: Record<string, string> = {
    auth_exchange_failed: 'Authentication failed. The link may have expired — please request a new one.',
    missing_token:        'Verification link is incomplete. Please use the full link from your email or request a new one.',
    verification_failed:  'Email verification failed. The link may have expired — please request a new one.',
  };

  const message = rawMessage ||
    (errorCode ? (ERROR_MESSAGES[errorCode] ?? null) : null) ||
    'An authentication error occurred';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-[#ff4343]" />
          </div>
          <CardTitle className="text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
