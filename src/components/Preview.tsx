"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStore, type HighlightColor } from "@/lib/store";
import { FloatingHighlightPicker } from "@/components/Highlights";
import { toast } from "sonner";

export default function Preview() {
  const { files, activeFileId, addHighlight } = useStore();
  const activeFile = files.find((f) => f.id === activeFileId);
  const [floatingPicker, setFloatingPicker] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setFloatingPicker(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 3) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setFloatingPicker({ text, x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleHighlight = useCallback((color: HighlightColor) => {
    if (!floatingPicker || !activeFile) return;
    addHighlight(activeFile.id, activeFile.name, floatingPicker.text, color);
    toast.success("Added to highlights");
    window.getSelection()?.removeAllRanges();
    setFloatingPicker(null);
  }, [floatingPicker, activeFile, addHighlight]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/20 select-none">
        <p className="text-sm">No file selected</p>
      </div>
    );
  }

  return (
    <>
      <div className="md-preview flex-1 overflow-y-auto" onMouseUp={handleMouseUp}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            input: ({ type, checked, ...props }) =>
              type === "checkbox" ? (
                <input type="checkbox" checked={checked} readOnly className="mr-1 accent-blue-500" />
              ) : (
                <input type={type} {...props} />
              ),
            a: ({ href, children, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {activeFile.content}
        </ReactMarkdown>
        {!activeFile.content.trim() && (
          <p className="text-white/20 text-sm italic">Nothing to preview yet.</p>
        )}
      </div>
      <FloatingHighlightPicker
        selection={floatingPicker}
        onHighlight={handleHighlight}
        onDismiss={() => setFloatingPicker(null)}
      />
    </>
  );
}
