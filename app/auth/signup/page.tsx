/**
 * Sign Up Page
 * Public route for new users to create an account
 */

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignUp } from "@/components/auth/SignUp";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
          <Logo height={36} />
        </Link>
        <SignUp />
      </div>
    </div>
  );
}
