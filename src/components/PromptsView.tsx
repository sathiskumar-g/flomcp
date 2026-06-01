"use client";

import { useState, useMemo } from "react";
import {
  Terminal, Plus, Trash2, Edit3, Copy, Check, Search, Tag, X, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type PromptItem } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

const CATEGORIES = ["general", "writing", "coding", "planning", "analysis", "creative", "research"];
const CATEGORY_COLORS: Record<string, string> = {
  general:  "bg-white/10 text-white/60",
  writing:  "bg-blue-500/20 text-blue-300",
  coding:   "bg-green-500/20 text-green-300",
  planning: "bg-purple-500/20 text-purple-300",
  analysis: "bg-orange-500/20 text-orange-300",
  creative: "bg-pink-500/20 text-pink-300",
  research: "bg-cyan-500/20 text-cyan-300",
};

export default function PromptsView() {
  const { prompts, addPrompt, updatePrompt, deletePrompt } = useStore();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New prompt form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newFormat, setNewFormat] = useState<"md" | "txt">("md");
  const [newTag, setNewTag] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editTag, setEditTag] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return prompts
      .filter((p) => {
        if (filterCat !== "all" && p.category !== filterCat) return false;
        if (q && !p.title.toLowerCase().includes(q) && !p.content.toLowerCase().includes(q) && !p.tags.some((t) => t.includes(q))) return false;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [prompts, search, filterCat]);

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) { toast.error("Title and content required"); return; }
    addPrompt(newTitle, newContent, newTags, newCategory, newFormat);
    toast.success("Prompt saved");
    setShowNew(false);
    setNewTitle(""); setNewContent(""); setNewTags([]); setNewTag(""); setNewCategory("general"); setNewFormat("md");
  };

  const startEdit = (p: PromptItem) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditCategory(p.category);
    setEditTag("");
  };

  const saveEdit = (p: PromptItem) => {
    updatePrompt(p.id, { title: editTitle, content: editContent, category: editCategory });
    setEditingId(null);
    toast.success("Updated");
  };

  const handleCopy = (p: PromptItem) => {
    navigator.clipboard.writeText(p.content);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Copied to clipboard");
  };

  const addNewTag = () => {
    const t = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !newTags.includes(t)) setNewTags((prev) => [...prev, t]);
    setNewTag("");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[hsl(222_47%_5%)]">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-green-400" />
            <h2 className="text-base font-semibold text-white">Prompts</h2>
            <span className="text-xs text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full">{prompts.length}</span>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30 transition-all"
          >
            <Plus size={13} /> New Prompt
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-white/30 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-full"
            />
            {search && <button onClick={() => setSearch("")}><X size={12} className="text-white/30" /></button>}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {["all", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-all",
                  filterCat === cat
                    ? "bg-green-600/25 border-green-500/40 text-green-300"
                    : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                )}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New prompt form */}
      {showNew && (
        <div className="shrink-0 mx-5 mt-4 p-4 bg-[hsl(222_47%_7%)] border border-white/[0.09] rounded-xl">
          <h3 className="text-sm font-medium text-white mb-3">New Prompt</h3>
          <div className="flex flex-col gap-2.5">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Prompt title…"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 transition-colors"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Prompt content… (supports variables like {{topic}}, {{context}})"
              rows={5}
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 transition-colors resize-none font-mono leading-relaxed"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-white/[0.06] border border-white/10 text-white/70 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-green-500/50"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as "md" | "txt")}
                className="bg-white/[0.06] border border-white/10 text-white/70 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="md">.md</option>
                <option value="txt">.txt</option>
              </select>
              <div className="flex items-center gap-1 flex-1">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addNewTag(); } }}
                  placeholder="Add tag…"
                  className="bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none w-24"
                />
                {newTags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                    {t}
                    <button onClick={() => setNewTags((prev) => prev.filter((x) => x !== t))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <button onClick={() => setShowNew(false)} className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5">Cancel</button>
              <button onClick={handleCreate} className="text-xs font-medium bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg transition-colors">Save Prompt</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <Terminal size={36} className="mb-3" />
            <p className="text-sm">No prompts yet</p>
            <p className="text-xs mt-1">Click "New Prompt" to save your first one</p>
          </div>
        )}

        {filtered.map((p) => (
          <div key={p.id} className="bg-[hsl(222_47%_7%)] border border-white/[0.07] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
            {editingId === p.id ? (
              <div className="p-4 flex flex-col gap-2.5">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-green-500/50 resize-none"
                />
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="bg-white/[0.06] border border-white/10 text-white/70 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none w-fit"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5">Cancel</button>
                  <button onClick={() => saveEdit(p)} className="text-xs font-medium bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg">Save</button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-white truncate">{p.title}</span>
                      <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md font-medium", CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.general)}>{p.category}</span>
                      <span className="text-[11px] text-white/25 border border-white/10 px-1.5 py-0.5 rounded">.{p.format}</span>
                    </div>
                    {p.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        {p.tags.map((t) => (
                          <span key={t} className="flex items-center gap-0.5 text-[11px] text-white/40 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
                            <Tag size={9} /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleCopy(p)} className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors" title="Copy">
                      {copiedId === p.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors" title="Edit">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => { deletePrompt(p.id); toast("Deleted"); }} className="p-1.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-white/50 font-mono whitespace-pre-wrap leading-relaxed line-clamp-4 bg-white/[0.03] rounded-lg px-3 py-2">{p.content}</pre>
                <p className="text-[11px] text-white/25 mt-2">{formatDate(p.updatedAt)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
