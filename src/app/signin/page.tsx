"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const needsVerify = searchParams.get("verify") === "1";
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      router.push("/app");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222_47%_4%)] text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 text-white/70 hover:text-white transition-colors">
          <FileText size={18} className="text-blue-400" />
          <span className="font-semibold">MDVault</span>
        </Link>

        <div className="bg-[hsl(222_47%_7%)] border border-white/[0.08] rounded-2xl p-7 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-white/50 text-sm mb-6">Sign in to your flomcpmemory account</p>

          {needsVerify && !error && (
            <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm rounded-lg px-3 py-2.5 mb-4">
              Please confirm your email first. Check your inbox for the verification link, then sign in.
            </div>
          )}

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
                autoFocus
                autoComplete="email"
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-white/50 font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
