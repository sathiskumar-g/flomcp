"use client";

import { useState, useRef, useEffect } from "react";
import { Highlighter, Trash2, FileText, Edit2, X, Check, Clipboard } from "lucide-react";
import { toast } from "sonner";
import { useStore, type HighlightColor } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";

const COLOR_MAP: Record<HighlightColor, { bg: string; border: string; text: string; dot: string }> = {
  yellow: { bg: "bg-yellow-400/10", border: "border-yellow-400/20", text: "text-yellow-200", dot: "bg-yellow-400" },
  blue:   { bg: "bg-blue-400/10",   border: "border-blue-400/20",   text: "text-blue-200",   dot: "bg-blue-400" },
  green:  { bg: "bg-green-400/10",  border: "border-green-400/20",  text: "text-green-200",  dot: "bg-green-400" },
  pink:   { bg: "bg-pink-400/10",   border: "border-pink-400/20",   text: "text-pink-200",   dot: "bg-pink-400" },
};

const COLORS: HighlightColor[] = ["yellow", "blue", "green", "pink"];

export function HighlightsPanel() {
  const { highlights, deleteHighlight, updateHighlightNote, setActiveFile, setAppView, files } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [filterColor, setFilterColor] = useState<HighlightColor | "all">("all");
  const [filterFileId, setFilterFileId] = useState<string | "all">("all");

  const filtered = highlights
    .filter((h) => filterColor === "all" || h.color === filterColor)
    .filter((h) => filterFileId === "all" || h.fileId === filterFileId)
    .sort((a, b) => b.createdAt - a.createdAt);

  // Unique files that have highlights
  const highlightedFiles = Array.from(new Map(highlights.map((h) => [h.fileId, h.fileName])).entries());

  const startEdit = (id: string, note: string) => {
    setEditingId(id);
    setEditNote(note);
  };

  const commitEdit = () => {
    if (editingId) updateHighlightNote(editingId, editNote);
    setEditingId(null);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
  };

  const openFile = (fileId: string) => {
    setActiveFile(fileId);
    setAppView("editor");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Highlighter size={20} className="text-yellow-400" />
          Highlights
        </h1>
        <p className="text-sm text-white/40 mt-0.5">{highlights.length} saved highlight{highlights.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Color filter */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
            <button
              onClick={() => setFilterColor("all")}
              className={cn("px-2 py-1 rounded text-xs transition-all", filterColor === "all" ? "bg-white/15 text-white" : "text-white/40 hover:text-white")}
            >
              All
            </button>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setFilterColor(c)}
                title={c}
                className={cn("w-6 h-6 rounded flex items-center justify-center transition-all", filterColor === c ? "ring-2 ring-white/40" : "opacity-60 hover:opacity-100")}
              >
                <span className={cn("w-3 h-3 rounded-full", COLOR_MAP[c].dot)} />
              </button>
            ))}
          </div>

          {/* File filter */}
          {highlightedFiles.length > 1 && (
            <select
              value={filterFileId}
              onChange={(e) => setFilterFileId(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white outline-none"
            >
              <option value="all">All files</option>
              {highlightedFiles.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Highlights list */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/20">
          <Highlighter size={36} className="mx-auto mb-3 opacity-30" />
          {highlights.length === 0 ? (
            <>
              <p className="text-sm">No highlights yet</p>
              <p className="text-xs mt-1">Select text in the editor or preview, then click "Highlight"</p>
            </>
          ) : (
            <p className="text-sm">No highlights match this filter</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((h) => {
          const colors = COLOR_MAP[h.color];
          return (
            <div key={h.id} className={cn("rounded-xl border p-4 transition-all group", colors.bg, colors.border)}>
              {/* Source file */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => openFile(h.fileId)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <FileText size={11} />
                  {h.fileName}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white/25">{formatDate(h.createdAt)}</span>
                  <button onClick={() => copyText(h.text)} title="Copy" className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
                    <Clipboard size={11} />
                  </button>
                  <button onClick={() => startEdit(h.id, h.note)} title="Add note" className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => { deleteHighlight(h.id); toast.success("Highlight removed"); }} title="Delete" className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Highlighted text */}
              <p className={cn("text-sm leading-relaxed font-medium", colors.text)}>
                "{h.text}"
              </p>

              {/* Note */}
              {editingId === h.id ? (
                <div className="mt-2 flex gap-1">
                  <input
                    autoFocus
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                    placeholder="Add a note…"
                    className="flex-1 text-xs bg-black/20 border border-white/10 rounded px-2 py-1 text-white placeholder:text-white/25 outline-none"
                  />
                  <button onClick={commitEdit} className="p-1 rounded hover:bg-white/10 text-green-400"><Check size={13} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-white/10 text-white/30"><X size={13} /></button>
                </div>
              ) : h.note ? (
                <p className="mt-2 text-xs text-white/50 italic border-t border-white/10 pt-2">
                  Note: {h.note}
                  <button onClick={() => startEdit(h.id, h.note)} className="ml-1 opacity-50 hover:opacity-100"><Edit2 size={9} className="inline" /></button>
                </p>
              ) : (
                <button
                  onClick={() => startEdit(h.id, "")}
                  className="mt-1.5 text-xs text-white/20 hover:text-white/40 transition-colors"
                >
                  + Add note
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Floating highlight picker (shown on text selection) ────────────────────

interface FloatingHighlightProps {
  selection: { text: string; x: number; y: number } | null;
  onHighlight: (color: HighlightColor) => void;
  onDismiss: () => void;
}

export function FloatingHighlightPicker({ selection, onHighlight, onDismiss }: FloatingHighlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    if (selection) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selection, onDismiss]);

  if (!selection) return null;

  return (
    <div
      ref={ref}
      style={{ left: selection.x, top: selection.y - 44, transform: "translateX(-50%)" }}
      className="fixed z-50 flex items-center gap-1 bg-[hsl(222_47%_9%)] border border-white/15 rounded-lg shadow-2xl px-2 py-1.5"
      onMouseDown={(e) => e.preventDefault()} // prevent selection loss
    >
      <Highlighter size={12} className="text-white/40 mr-1" />
      {COLORS.map((c) => (
        <button
          key={c}
          title={`Highlight ${c}`}
          onClick={() => onHighlight(c)}
          className={cn("w-5 h-5 rounded-full transition-transform hover:scale-125", COLOR_MAP[c].dot)}
        />
      ))}
    </div>
  );
}
