"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery link arrives with the session token in the URL hash.
  // The supabase client auto-detects it (detectSessionInUrl) and fires a
  // PASSWORD_RECOVERY event; we wait for a valid session before allowing reset.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/app"), 1500);
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
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} className="text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Password updated</h2>
              <p className="text-white/50 text-sm">Redirecting you to the app…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Set a new password</h1>
              <p className="text-white/50 text-sm mb-6">Choose a new password for your account.</p>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2.5 mb-4">
                  {error}
                </div>
              )}

              {!ready && !error && (
                <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
                  <Loader2 size={14} className="animate-spin" />
                  Verifying reset link…
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      disabled={!ready}
                      autoComplete="new-password"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors disabled:opacity-50"
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
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Confirm password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    disabled={!ready}
                    autoComplete="new-password"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !ready}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors mt-1"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-white/40 mt-5">
          <Link href="/signin" className="text-blue-400 hover:text-blue-300 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
