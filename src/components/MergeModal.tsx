"use client";

import { useState } from "react";
import { X, Merge, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { sanitizeName, cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
  initialSelected?: Set<string>;
}

export default function MergeModal({ onClose, initialSelected = new Set() }: Props) {
  const { files, categories, mergeFiles } = useStore();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [targetName, setTargetName] = useState("Merged Document");
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleMerge = () => {
    if (selected.size < 2) { toast.error("Select at least 2 files to merge"); return; }
    const name = sanitizeName(targetName) || "Merged Document";
    mergeFiles(Array.from(selected), name, targetCategoryId);
    toast.success(`Merged ${selected.size} files → "${name}"`);
    onClose();
  };

  // Preview merge order
  const orderedFiles = Array.from(selected)
    .map((id) => files.find((f) => f.id === id))
    .filter(Boolean);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[hsl(222_47%_7%)] border border-white/10 rounded-xl shadow-2xl w-[540px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Merge size={16} className="text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Merge Files</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* File selector */}
          <div>
            <p className="text-xs font-medium text-white/50 mb-2">Select files to merge ({selected.size} selected)</p>
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {/* Categorized files */}
              {sortedCategories.map((cat) => {
                const catFiles = files.filter((f) => f.categoryId === cat.id);
                if (!catFiles.length) return null;
                return (
                  <div key={cat.id}>
                    <p className="text-[11px] text-white/30 px-2 py-1 font-medium">{cat.name}</p>
                    {catFiles.map((f) => (
                      <FileCheckItem key={f.id} file={f} checked={selected.has(f.id)} onToggle={() => toggle(f.id)} />
                    ))}
                  </div>
                );
              })}
              {/* Uncategorized */}
              {files.filter((f) => !f.categoryId).length > 0 && (
                <div>
                  {sortedCategories.length > 0 && <p className="text-[11px] text-white/30 px-2 py-1 font-medium">Uncategorized</p>}
                  {files.filter((f) => !f.categoryId).map((f) => (
                    <FileCheckItem key={f.id} file={f} checked={selected.has(f.id)} onToggle={() => toggle(f.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Merge order preview */}
          {selected.size >= 2 && (
            <div>
              <p className="text-xs font-medium text-white/50 mb-2">Merge order</p>
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-lg p-3 space-y-1">
                {orderedFiles.map((f, i) => (
                  <div key={f!.id} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="text-white/25 w-4 text-right">{i + 1}.</span>
                    <FileText size={11} className="text-blue-400 shrink-0" />
                    <span>{f!.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/30 mt-1">Each file will be separated with a horizontal rule</p>
            </div>
          )}

          {/* Output name */}
          <div>
            <label className="text-xs font-medium text-white/50 block mb-1.5">Output file name</label>
            <input
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="Merged Document"
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          {/* Target category */}
          <div>
            <label className="text-xs font-medium text-white/50 block mb-1.5">Save to category</label>
            <div className="relative">
              <select
                value={targetCategoryId ?? ""}
                onChange={(e) => setTargetCategoryId(e.target.value || null)}
                className="w-full appearance-none bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
              >
                <option value="">No category</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.07] bg-white/[0.02]">
          <p className="text-xs text-white/30">
            {selected.size < 2 ? "Select at least 2 files" : `Will merge ${selected.size} files`}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-white/50 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={selected.size < 2}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all",
                selected.size >= 2
                  ? "bg-orange-500 hover:bg-orange-400 text-white"
                  : "bg-white/[0.05] text-white/30 cursor-not-allowed"
              )}
            >
              <Merge size={13} />
              Merge {selected.size >= 2 ? `${selected.size} files` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileCheckItem({ file, checked, onToggle }: { file: { id: string; name: string }; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all text-left",
        checked ? "bg-blue-500/15 text-blue-300" : "text-white/55 hover:bg-white/[0.04] hover:text-white/80"
      )}
    >
      <div className={cn("w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all",
        checked ? "bg-blue-500 border-blue-500" : "border-white/20"
      )}>
        {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
      </div>
      <FileText size={11} className={checked ? "text-blue-400" : "text-white/30"} />
      {file.name}
    </button>
  );
}
