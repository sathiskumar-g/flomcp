/**
 * Sign In Page
 * Public route for existing users to log in
 */

import { SignIn } from "@/components/auth/SignIn";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <SignIn />
    </div>
  );
}
