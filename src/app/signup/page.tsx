"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222_47%_4%)] text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 text-white/70 hover:text-white transition-colors">
          <FileText size={18} className="text-blue-400" />
          <span className="font-semibold">flomcpmemory</span>
        </Link>

        <div className="bg-[hsl(222_47%_7%)] border border-white/[0.08] rounded-2xl p-7 shadow-2xl">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-white/50 text-sm mb-6">
                We sent a confirmation link to <span className="text-white/70">{email}</span>. Click it to activate your account, then sign in.
              </p>
              <Link href="/signin" className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Create account</h1>
              <p className="text-white/50 text-sm mb-6">Join flomcpmemory — free forever, local-first</p>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2.5 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    autoComplete="new-password"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors mt-1"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-white/40 mt-5">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
