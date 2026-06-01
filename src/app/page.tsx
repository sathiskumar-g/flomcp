"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Zap, Shield, BookOpen, Network, ArrowRight, User } from "lucide-react";
import { ProInterestModal } from "@/components/ProInterestModal";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const [proOpen, setProOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/app");
    } else {
      router.push("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222_47%_4%)] text-white flex flex-col">
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[hsl(222_47%_5%)] sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <Brain size={18} className="text-blue-400" />
          <span>flomcpmemory</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 hover:border-blue-400/50 transition-all"
          >
            <Zap size={12} />
            Pro Interest
          </button>

          {!loading && (
            user ? (
              /* ── Signed-in user pill ── */
              <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-white" />
                </div>
                <span className="text-xs text-white/70 max-w-[140px] truncate">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors ml-1 border-l border-white/10 pl-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/signin" className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                Sign In
              </Link>
            )
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Local-first knowledge &amp; memory base
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl leading-tight">
          Capture, connect and{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            grow your knowledge.
          </span>
        </h1>
        <p className="text-white/60 text-lg max-w-xl mb-10 leading-relaxed">
          Your personal knowledge base and planning hub — notes, highlights, reminders, ideas and progress boards. Everything lives on your machine, organized and always accessible.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-7 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-blue-600/25"
          >
            {user ? "Open App" : "Get Started — free"}
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => setProOpen(true)}
            className="flex items-center gap-2 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Zap size={15} />
            I&apos;m interested in Pro
          </button>
        </div>

        {/* ── Feature cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
          {[
            {
              icon: <Brain size={18} className="text-blue-400" />,
              title: "Knowledge Base",
              desc: "Write and link markdown documents, capture highlights, tag ideas — build a living second brain on your disk.",
            },
            {
              icon: <Network size={18} className="text-purple-400" />,
              title: "Planning Hub",
              desc: "Kanban progress board, reminders with due dates, a queue list and sticky notes to keep projects moving.",
            },
            {
              icon: <Shield size={18} className="text-green-400" />,
              title: "Private by Default",
              desc: "No cloud upload. Everything syncs to a folder you choose. Sign up to unlock cross-device sync (coming soon).",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-colors">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm text-white mb-1.5">{f.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-5 text-center text-xs text-white/30">
        flomcpmemory — local-first knowledge &amp; memory base
      </footer>

      {proOpen && <ProInterestModal onClose={() => setProOpen(false)} />}
    </div>
  );
}


