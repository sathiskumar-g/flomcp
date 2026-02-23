/**
 * Sign Up Page
 * Public route for new users to create an account
 */

import { SignUp } from "@/components/auth/SignUp";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <SignUp />
    </div>
  );
}
