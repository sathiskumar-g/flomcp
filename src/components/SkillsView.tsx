"use client";

import { useState, useMemo } from "react";
import {
  BrainCircuit, Plus, Trash2, Edit3, Copy, Check, Search, Tag, X, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type SkillFile } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

const TOPICS = ["general", "TypeScript", "JavaScript", "React", "Next.js", "Python", "Node.js", "SQL", "CSS", "Git", "AI/ML", "System Design", "DevOps", "Testing"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

const LEVEL_COLORS: Record<string, string> = {
  beginner:     "bg-green-500/20 text-green-300 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  advanced:     "bg-red-500/20 text-red-300 border-red-500/30",
};

const TOPIC_COLORS: Record<string, string> = {
  general:        "text-white/50",
  TypeScript:     "text-blue-400",
  JavaScript:     "text-yellow-400",
  React:          "text-cyan-400",
  "Next.js":      "text-white/70",
  Python:         "text-green-400",
  "Node.js":      "text-emerald-400",
  SQL:            "text-orange-400",
  CSS:            "text-pink-400",
  Git:            "text-orange-300",
  "AI/ML":        "text-purple-400",
  "System Design":"text-indigo-400",
  DevOps:         "text-teal-400",
  Testing:        "text-lime-400",
};

export default function SkillsView() {
  const { skills, addSkill, updateSkill, deleteSkill } = useStore();

  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // New skill state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTopic, setNewTopic] = useState("general");
  const [newLevel, setNewLevel] = useState<SkillFile["level"]>("intermediate");
  const [newTag, setNewTag] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTopic, setEditTopic] = useState("general");
  const [editLevel, setEditLevel] = useState<SkillFile["level"]>("intermediate");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return skills
      .filter((s) => {
        if (filterTopic !== "all" && s.topic !== filterTopic) return false;
        if (filterLevel !== "all" && s.level !== filterLevel) return false;
        if (q && !s.title.toLowerCase().includes(q) && !s.content.toLowerCase().includes(q) && !s.tags.some((t) => t.includes(q))) return false;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [skills, search, filterTopic, filterLevel]);

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) { toast.error("Title and content required"); return; }
    addSkill(newTitle, newContent, newTags, newTopic, newLevel);
    toast.success("Skill saved");
    setShowNew(false);
    setNewTitle(""); setNewContent(""); setNewTags([]); setNewTag(""); setNewTopic("general"); setNewLevel("intermediate");
  };

  const startEdit = (s: SkillFile) => {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditContent(s.content);
    setEditTopic(s.topic);
    setEditLevel(s.level);
  };

  const saveEdit = (s: SkillFile) => {
    updateSkill(s.id, { title: editTitle, content: editContent, topic: editTopic, level: editLevel });
    setEditingId(null);
    toast.success("Updated");
  };

  const handleCopy = (s: SkillFile) => {
    navigator.clipboard.writeText(s.content);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Copied to clipboard");
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
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
            <BrainCircuit size={18} className="text-purple-400" />
            <h2 className="text-base font-semibold text-white">Skills</h2>
            <span className="text-xs text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full">{skills.length}</span>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-all"
          >
            <Plus size={13} /> New Skill
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 max-w-xs">
            <Search size={13} className="text-white/30 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills…"
              className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-full"
            />
            {search && <button onClick={() => setSearch("")}><X size={12} className="text-white/30" /></button>}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1">
              {["all", ...LEVELS].map((l) => (
                <button
                  key={l}
                  onClick={() => setFilterLevel(l)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-all",
                    filterLevel === l
                      ? "bg-purple-600/25 border-purple-500/40 text-purple-300"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  )}
                >
                  {l === "all" ? "All Levels" : l}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10 shrink-0" />
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="bg-white/[0.06] border border-white/10 text-white/60 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Topics</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* New skill form */}
      {showNew && (
        <div className="shrink-0 mx-5 mt-4 p-4 bg-[hsl(222_47%_7%)] border border-white/[0.09] rounded-xl">
          <h3 className="text-sm font-medium text-white mb-3">New Skill File</h3>
          <div className="flex flex-col gap-2.5">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Skill title… e.g. React useCallback patterns"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Skill content… (write in Markdown)"
              rows={7}
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors resize-none font-mono leading-relaxed"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="bg-white/[0.06] border border-white/10 text-white/70 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500/50"
              >
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex items-center gap-1">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setNewLevel(l)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all",
                      newLevel === l ? LEVEL_COLORS[l] : "border-white/10 text-white/40 hover:border-white/25"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
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
              <button onClick={handleCreate} className="text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg transition-colors">Save Skill</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <BrainCircuit size={36} className="mb-3" />
            <p className="text-sm">No skills yet</p>
            <p className="text-xs mt-1">Click "New Skill" to document your first skill</p>
          </div>
        )}

        {filtered.map((s) => {
          const isExpanded = expanded.has(s.id);
          return (
            <div key={s.id} className="bg-[hsl(222_47%_7%)] border border-white/[0.07] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
              {editingId === s.id ? (
                <div className="p-4 flex flex-col gap-2.5">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      className="bg-white/[0.06] border border-white/10 text-white/70 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none w-fit"
                    >
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      {LEVELS.map((l) => (
                        <button
                          key={l}
                          onClick={() => setEditLevel(l)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full border transition-all",
                            editLevel === l ? LEVEL_COLORS[l] : "border-white/10 text-white/40"
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5">Cancel</button>
                    <button onClick={() => saveEdit(s)} className="text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg">Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn("text-xs font-medium", TOPIC_COLORS[s.topic] ?? "text-white/50")}>
                            <BookOpen size={11} className="inline mr-1 mb-0.5" />{s.topic}
                          </span>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", LEVEL_COLORS[s.level])}>{s.level}</span>
                        </div>
                        <h3 className="font-medium text-sm text-white">{s.title}</h3>
                        {s.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {s.tags.map((t) => (
                              <span key={t} className="flex items-center gap-0.5 text-[11px] text-white/40 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
                                <Tag size={9} /> {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleCopy(s)} className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors" title="Copy">
                          {copiedId === s.id ? <Check size={13} className="text-purple-400" /> : <Copy size={13} />}
                        </button>
                        <button onClick={() => startEdit(s)} className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors" title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => { deleteSkill(s.id); toast("Deleted"); }} className="p-1.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(s.id)}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 mt-2 transition-colors"
                    >
                      {isExpanded ? <><X size={11} /> Collapse</> : <><BookOpen size={11} /> Show content</>}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                      <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed bg-white/[0.03] rounded-lg px-3 py-2.5 overflow-x-auto">{s.content}</pre>
                    </div>
                  )}
                  <div className="px-4 pb-3">
                    <p className="text-[11px] text-white/20">{formatDate(s.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
