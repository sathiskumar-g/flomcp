/**
 * Sign Up Page
 * Public route for new users to create an account
 */

import Link from "next/link";
import { Code2 } from "lucide-react";
import { SignUp } from "@/components/auth/SignUp";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <Code2 className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">FloMCP</span>
        </Link>
        <SignUp />
      </div>
    </div>
  );
}
