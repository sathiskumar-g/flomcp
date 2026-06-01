"use client";

import { useState, useRef } from "react";
import { BookOpen, FileText, ChevronUp, ChevronDown, X, Printer, GripVertical, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BookBuilder() {
  const { files } = useStore();
  const activeFiles = files.filter((f) => f.trashedAt == null);

  const [selected, setSelected] = useState<string[]>([]);
  const [bookTitle, setBookTitle] = useState("My Book");
  const [bookAuthor, setBookAuthor] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const move = (from: number, to: number) => {
    const next = [...selected];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSelected(next);
  };

  const selectedFiles = selected
    .map((id) => activeFiles.find((f) => f.id === id))
    .filter(Boolean) as typeof activeFiles;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const body = selectedFiles
      .map((f, i) => `<section class="chapter"><div class="chapter-num">Chapter ${i + 1}</div><h1 class="chapter-title">${escapeHtml(f.name)}</h1><div class="content">${markdownToHtml(f.content)}</div></section>`)
      .join('<div class="page-break"></div>');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(bookTitle)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Georgia&family=Inter:wght@400;600;700&display=swap');
  body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; }
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; padding: 60px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; }
  .cover-title { font-size: 48px; font-weight: 700; letter-spacing: -1px; margin-bottom: 16px; font-family: Georgia, serif; }
  .cover-author { font-size: 18px; opacity: 0.7; margin-bottom: 48px; }
  .cover-meta { font-size: 13px; opacity: 0.4; }
  .toc { padding: 60px; page-break-after: always; }
  .toc h2 { font-size: 28px; margin-bottom: 32px; font-weight: 700; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
  .toc-item { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0; border-bottom: 1px dotted #e2e8f0; font-size: 15px; }
  .toc-item span { color: #94a3b8; font-size: 13px; }
  .chapter { padding: 60px; max-width: 720px; margin: 0 auto; }
  .chapter-num { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #94a3b8; margin-bottom: 8px; font-family: Inter, sans-serif; }
  .chapter-title { font-size: 36px; font-weight: 700; color: #0f172a; margin-bottom: 40px; line-height: 1.2; }
  .content { font-size: 16px; line-height: 1.8; color: #334155; }
  .content h1, .content h2, .content h3, .content h4 { color: #1e293b; margin: 32px 0 12px; font-weight: 700; line-height: 1.3; }
  .content h1 { font-size: 28px; } .content h2 { font-size: 22px; } .content h3 { font-size: 18px; }
  .content p { margin-bottom: 16px; }
  .content ul, .content ol { margin: 0 0 16px 24px; }
  .content li { margin-bottom: 6px; }
  .content blockquote { border-left: 4px solid #3b82f6; padding: 12px 20px; margin: 24px 0; background: #f8fafc; color: #475569; border-radius: 0 8px 8px 0; }
  .content code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: monospace; color: #0f172a; }
  .content pre { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 20px 0; font-size: 13px; line-height: 1.6; }
  .content pre code { background: none; color: inherit; padding: 0; }
  .content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
  .content th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  .content td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
  .content a { color: #3b82f6; }
  .content strong { font-weight: 700; color: #0f172a; }
  .content hr { border: none; border-top: 2px solid #e2e8f0; margin: 32px 0; }
  .page-break { page-break-after: always; }
  @media print {
    .cover { min-height: 100vh; page-break-after: always; }
    .toc { page-break-after: always; }
    .chapter { page-break-before: always; }
  }
</style>
</head>
<body>
<div class="cover">
  <div class="cover-title">${escapeHtml(bookTitle)}</div>
  ${bookAuthor ? `<div class="cover-author">by ${escapeHtml(bookAuthor)}</div>` : ""}
  <div class="cover-meta">${selectedFiles.length} chapters · ${new Date().getFullYear()}</div>
</div>
<div class="toc">
  <h2>Table of Contents</h2>
  ${selectedFiles.map((f, i) => `<div class="toc-item">${i + 1}. ${escapeHtml(f.name)}<span>Chapter ${i + 1}</span></div>`).join("")}
</div>
<div class="page-break"></div>
${body}
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-white/[0.07] bg-[hsl(222_47%_5%)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen size={22} className="text-purple-400" /> Book Builder
            </h1>
            <p className="text-sm text-white/40 mt-0.5">Select files, arrange chapters, export as PDF</p>
          </div>
          {selected.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20"
            >
              <Printer size={15} /> Export PDF ({selected.length} chapters)
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          {/* Left: File picker */}
          <div>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Select Files ({selected.length} selected)
            </h2>
            <div className="space-y-1.5">
              {activeFiles.length === 0 ? (
                <p className="text-sm text-white/30 py-4 text-center">No files yet</p>
              ) : (
                activeFiles.map((file) => {
                  const isSelected = selected.includes(file.id);
                  return (
                    <button
                      key={file.id}
                      onClick={() => toggle(file.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border",
                        isSelected
                          ? "bg-purple-500/15 border-purple-500/40 text-white"
                          : "bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-purple-500" : "bg-white/10")}>
                        {isSelected ? <Check size={12} className="text-white" /> : <FileText size={11} className="text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-white/30 truncate">
                          {file.content.trim().slice(0, 60).replace(/#+\s/g, "").replace(/\*+/g, "") || "Empty"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Book config + chapter order */}
          <div className="space-y-5">
            {/* Metadata */}
            <div>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Book Details</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Title</label>
                  <input
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="My Book"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Author (optional)</label>
                  <input
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Chapter order */}
            {selected.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Chapter Order</h2>
                <div className="space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border transition-colors",
                        dragOver === idx ? "border-purple-500/50 bg-purple-500/10" : "border-white/[0.07]"
                      )}
                      draggable
                      onDragStart={() => { dragItem.current = idx; }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={() => {
                        if (dragItem.current !== null && dragItem.current !== idx) {
                          move(dragItem.current, idx);
                        }
                        setDragOver(null);
                        dragItem.current = null;
                      }}
                    >
                      <GripVertical size={13} className="text-white/20 cursor-grab shrink-0" />
                      <span className="text-xs text-white/30 w-5 shrink-0">{idx + 1}.</span>
                      <span className="text-sm text-white/80 flex-1 truncate">{file.name}</span>
                      <div className="flex gap-0.5">
                        <button onClick={() => idx > 0 && move(idx, idx - 1)} disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white disabled:opacity-20">
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => idx < selected.length - 1 && move(idx, idx + 1)} disabled={idx === selected.length - 1}
                          className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white disabled:opacity-20">
                          <ChevronDown size={12} />
                        </button>
                        <button onClick={() => toggle(file.id)} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-xl">
                <BookOpen size={28} className="text-white/20 mb-3" />
                <p className="text-sm text-white/30">Select files to build your book</p>
                <p className="text-xs text-white/20 mt-1">They'll appear here in chapter order</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markdownToHtml(md: string): string {
  // Simple but effective md→html for print
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_m, code) => `<pre><code>${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold / Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // HR
    .replace(/^---+$/gm, "<hr>")
    // Unordered lists
    .replace(/^\s*[-*+] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Paragraphs
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
  return html;
}
