"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
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
          {sent ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                We sent a password reset link to{" "}
                <span className="text-white/70 font-medium">{email}</span>. It may take a minute to arrive.
              </p>
              <p className="text-white/40 text-xs mt-3">
                Didn&apos;t get it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Reset your password</h1>
              <p className="text-white/50 text-sm mb-6">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2.5 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Email address</label>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-5">
          <Link href="/signin" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
