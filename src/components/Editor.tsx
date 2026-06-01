"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, Code, Link2, List, ListOrdered, Quote, Minus, Table, Heading1, Heading2 } from "lucide-react";
import { useStore, type HighlightColor } from "@/lib/store";
import { wordCount, cn } from "@/lib/utils";
import { FloatingHighlightPicker } from "@/components/Highlights";
import { toast } from "sonner";

export default function Editor() {
  const { files, activeFileId, updateFile, addHighlight, touchSaved, lastSavedAt } = useStore();
  const activeFile = files.find((f) => f.id === activeFileId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [floatingPicker, setFloatingPicker] = useState<{ text: string; x: number; y: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const content = activeFile?.content ?? "";

  // Auto-focus when file changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeFileId]);

  const handleSelectionMouseUp = useCallback((e: React.MouseEvent) => {
    const el = textareaRef.current;
    if (!el || !activeFile) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) { setFloatingPicker(null); return; }
    const text = content.slice(start, end).trim();
    if (text.length < 3) return;
    setFloatingPicker({ text, x: e.clientX, y: e.clientY });
  }, [content, activeFile]);

  const handleHighlight = useCallback((color: HighlightColor) => {
    if (!floatingPicker || !activeFile) return;
    addHighlight(activeFile.id, activeFile.name, floatingPicker.text, color);
    toast.success("Added to highlights");
    setFloatingPicker(null);
  }, [floatingPicker, activeFile, addHighlight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeFile) return;
    const newContent = e.target.value;
    updateFile(activeFile.id, { content: newContent });
    // Save indicator
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus("saved"), 800);
  };

  // Tab key handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S / Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      touchSaved();
      setSaveStatus("saved");
      toast.success("Saved", { duration: 1500 });
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = textareaRef.current!;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newContent = content.slice(0, start) + "  " + content.slice(end);
      updateFile(activeFile!.id, { content: newContent });
      // Restore cursor
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertWrap = useCallback((before: string, after: string, placeholder = "") => {
    const el = textareaRef.current;
    if (!el || !activeFile) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    updateFile(activeFile.id, { content: newContent });
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    }, 0);
  }, [content, activeFile, updateFile]);

  const insertLine = useCallback((prefix: string, sample = "") => {
    const el = textareaRef.current;
    if (!el || !activeFile) return;
    const pos = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
    const insert = prefix + (sample || "text");
    const newContent = content.slice(0, lineStart) + insert + "\n" + content.slice(lineStart);
    updateFile(activeFile.id, { content: newContent });
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = lineStart + prefix.length + (sample ? sample.length : 4);
    }, 0);
  }, [content, activeFile, updateFile]);

  const stats = wordCount(content);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/20 select-none">
        <p className="text-sm">Select or create a file to start editing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mini toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/[0.06] bg-[hsl(222_47%_5%)] shrink-0 overflow-x-auto">
        <ToolBtn title="Heading 1" onClick={() => insertLine("# ", "Heading 1")}><Heading1 size={13} /></ToolBtn>
        <ToolBtn title="Heading 2" onClick={() => insertLine("## ", "Heading 2")}><Heading2 size={13} /></ToolBtn>
        <Sep />
        <ToolBtn title="Bold" onClick={() => insertWrap("**", "**", "bold text")}><Bold size={13} /></ToolBtn>
        <ToolBtn title="Italic" onClick={() => insertWrap("_", "_", "italic text")}><Italic size={13} /></ToolBtn>
        <ToolBtn title="Inline code" onClick={() => insertWrap("`", "`", "code")}><Code size={13} /></ToolBtn>
        <Sep />
        <ToolBtn title="Bullet list" onClick={() => insertLine("- ", "List item")}><List size={13} /></ToolBtn>
        <ToolBtn title="Numbered list" onClick={() => insertLine("1. ", "List item")}><ListOrdered size={13} /></ToolBtn>
        <ToolBtn title="Blockquote" onClick={() => insertLine("> ", "Quote")}><Quote size={13} /></ToolBtn>
        <Sep />
        <ToolBtn title="Code block" onClick={() => insertWrap("```\n", "\n```", "code here")}>
          <span className="font-mono text-[11px] font-bold">{"{ }"}</span>
        </ToolBtn>
        <ToolBtn title="Horizontal rule" onClick={() => {
          if (!activeFile) return;
          const el = textareaRef.current!;
          const pos = el.selectionStart;
          const newContent = content.slice(0, pos) + "\n---\n" + content.slice(pos);
          updateFile(activeFile.id, { content: newContent });
          setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = pos + 5; }, 0);
        }}><Minus size={13} /></ToolBtn>
        <ToolBtn title="Link" onClick={() => insertWrap("[", "](https://)", "link text")}><Link2 size={13} /></ToolBtn>
        <ToolBtn title="Table" onClick={() => {
          if (!activeFile) return;
          const t = "\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n";
          const el = textareaRef.current!;
          const pos = el.selectionStart;
          const newContent = content.slice(0, pos) + t + content.slice(pos);
          updateFile(activeFile.id, { content: newContent });
          setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = pos + t.length; }, 0);
        }}><Table size={13} /></ToolBtn>

        <div className="flex-1" />

        {/* Save status */}
        {saveStatus && (
          <span className={cn("text-[10px] whitespace-nowrap transition-all", saveStatus === "saved" ? "text-green-400/70" : "text-white/30")}>
            {saveStatus === "saving" ? "Saving…" : "✓ Saved"}
          </span>
        )}
        <div className="w-px h-3 bg-white/10 mx-1" />

        {/* Stats */}
        <span className="text-[10px] text-white/25 whitespace-nowrap">
          {stats.lines}L · {stats.words}W · {stats.chars}C
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelectionMouseUp}
        className="md-editor flex-1"
        placeholder="Start writing in Markdown…"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      <FloatingHighlightPicker
        selection={floatingPicker}
        onHighlight={handleHighlight}
        onDismiss={() => setFloatingPicker(null)}
      />
    </div>
  );
}

function ToolBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors shrink-0"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />;
}
