"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

interface ProInterestModalProps {
  onClose: () => void;
}

export function ProInterestModal({ onClose }: ProInterestModalProps) {
  const [form, setForm] = useState({ name: "", email: "", feedback: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      toast.error("Supabase is not configured yet. Add credentials to .env.local");
      return;
    }
    const { error } = await supabase.from("pro_interests").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      feedback: form.feedback.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to submit. Please try again.");
    } else {
      setDone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-[hsl(222_47%_8%)] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={18} />
        </button>

        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-white mb-2">Thanks for your interest!</h2>
            <p className="text-white/60 text-sm">
              We&apos;ll reach out when Pro features are ready.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✨</span>
                <h2 className="text-lg font-semibold text-white">Interested in Pro?</h2>
              </div>
              <p className="text-white/50 text-sm">
                Cloud sync, team vaults, and more — coming soon. Let us know you&apos;re interested.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">
                  What would you use Pro for? <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  value={form.feedback}
                  onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                  placeholder="Tell us what you&apos;d love to see..."
                  rows={3}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Sending..." : "Submit Interest"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
