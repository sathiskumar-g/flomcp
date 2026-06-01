"use client";

import { useState } from "react";
import { Trash2, RotateCcw, FileText, AlertTriangle } from "lucide-react";
import { useStore, type MDFile } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Trash() {
  const { files, restoreFile, permanentDeleteFile } = useStore();
  const [confirmAll, setConfirmAll] = useState(false);

  const trashed = [...files]
    .filter((f) => f.trashedAt != null)
    .sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));

  const emptyTrash = () => {
    trashed.forEach((f) => permanentDeleteFile(f.id));
    setConfirmAll(false);
    toast.success("Trash emptied");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-white/[0.07] bg-[hsl(222_47%_5%)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trash2 size={22} className="text-red-400" /> Trash
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              {trashed.length === 0 ? "Empty" : `${trashed.length} deleted file${trashed.length !== 1 ? "s" : ""} — restore or permanently delete`}
            </p>
          </div>
          {trashed.length > 0 && (
            <div>
              {confirmAll ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Are you sure?</span>
                  <button
                    onClick={emptyTrash}
                    className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                  >
                    Yes, empty trash
                  </button>
                  <button
                    onClick={() => setConfirmAll(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAll(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium transition-colors border border-red-500/20"
                >
                  <Trash2 size={13} /> Empty Trash
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        {trashed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <Trash2 size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">Trash is empty</p>
            <p className="text-white/20 text-xs mt-1">Files moved to trash will appear here</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300/80">
                Files in trash are still stored locally. Permanently deleting cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              {trashed.map((file) => (
                <TrashItem
                  key={file.id}
                  file={file}
                  onRestore={() => { restoreFile(file.id); toast.success(`"${file.name}" restored`); }}
                  onDelete={() => { permanentDeleteFile(file.id); toast.success(`"${file.name}" permanently deleted`); }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TrashItem({
  file,
  onRestore,
  onDelete,
}: {
  file: MDFile;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const preview = file.content.replace(/#+\s*/g, "").replace(/\*+/g, "").trim().slice(0, 120);

  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
        <FileText size={15} className="text-red-400/70" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-white/80 truncate">{file.name}</span>
          <span className="text-xs text-white/25">.md</span>
        </div>
        {preview && <p className="text-xs text-white/30 truncate">{preview}</p>}
        <p className="text-[11px] text-white/20 mt-1">
          Deleted {file.trashedAt ? formatDate(file.trashedAt) : "recently"}
        </p>
        {file.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {file.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRestore}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-colors border border-green-500/20"
        >
          <RotateCcw size={12} /> Restore
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onDelete}
              className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1.5 rounded-lg bg-white/10 text-white/50 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors border border-red-500/20"
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
