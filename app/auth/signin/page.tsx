/**
 * Sign In Page
 * Public route for existing users to log in
 */

import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { SignIn } from "@/components/auth/SignIn";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
          <Logo height={36} />
        </Link>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
          <SignIn />
        </Suspense>
      </div>
    </div>
  );
}
