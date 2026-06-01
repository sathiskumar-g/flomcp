"use client";

import { useRef, useState, useEffect } from "react";
import {
  ChevronRight, ChevronDown, FilePlus, FolderPlus, Trash2, Edit2,
  MoreHorizontal, CheckSquare, Square, Folder, FolderOpen,
  FileText, X, ArrowUp, ArrowDown, MoveRight, Pin, Tag, RotateCcw,
  Bell, BellOff, Eye, Upload, Merge,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type MDFile, type Category } from "@/lib/store";
import { sanitizeName, formatDate, cn } from "@/lib/utils";
import { readFileObject } from "@/lib/fs-api";

interface Props {
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onClose?: () => void;
  onMergeOpen?: () => void;
  onImport?: () => void;
}

export default function Sidebar({ selectedIds, onSelectToggle, onClose, onMergeOpen, onImport }: Props) {
  const {
    files, categories, activeFileId, searchQuery,
    createFile, deleteFile, trashFile, updateFile, duplicateFile, moveFile,
    createCategory, updateCategory, deleteCategory, toggleCategory, reorderCategory,
    setActiveFile, togglePinFile, toggleWatchFile, addFileTag, removeFileTag, setAppView,
    reminderNotes, toggleReminderDone, toggleReminderEnabled, deleteReminderNote,
  } = useStore();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renameCatValue, setRenameCatValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [catContextMenu, setCatContextMenu] = useState<{ x: number; y: number; catId: string } | null>(null);
  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<string | null>(null);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const q = searchQuery.toLowerCase();

  const filteredFiles = q
    ? files.filter((f) => f.trashedAt == null && (f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)))
    : files.filter((f) => f.trashedAt == null);

  const trashedCount = files.filter((f) => f.trashedAt != null).length;

  // Due / overdue reminders — show if due within ±1 day and not done and enabled
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const dueReminders = reminderNotes.filter(
    (r: any) => !r.done && r.enabled !== false && r.dueAt != null &&
      r.dueAt >= now - DAY && r.dueAt <= now + DAY
  ).sort((a: any, b: any) => (a.dueAt ?? 0) - (b.dueAt ?? 0));

  // Close context menus on outside click
  useEffect(() => {
    const close = () => { setContextMenu(null); setCatContextMenu(null); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleNewFile = (categoryId: string | null = null) => {
    const name = sanitizeName(`Note ${files.length + 1}`);
    createFile(name, categoryId);
  };

  const handleRenameFile = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setContextMenu(null);
  };

  const commitRename = (id: string) => {
    const n = sanitizeName(renameValue);
    if (n) updateFile(id, { name: n });
    setRenamingId(null);
  };

  const handleRenameCat = (id: string, currentName: string) => {
    setRenamingCatId(id);
    setRenameCatValue(currentName);
    setCatContextMenu(null);
  };

  const commitRenameCat = (id: string) => {
    const n = sanitizeName(renameCatValue);
    if (n) updateCategory(id, { name: n });
    setRenamingCatId(null);
  };

  // Drag-drop from desktop
  const handleDropOnSidebar = async (e: React.DragEvent, categoryId: string | null) => {
    e.preventDefault();
    setDragOverCat(null);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.match(/\.(md|txt|markdown)$/i)
    );
    for (const file of droppedFiles) {
      const content = await readFileObject(file);
      const name = file.name.replace(/\.(md|txt|markdown)$/i, "");
      createFile(name, categoryId, content);
    }
    if (droppedFiles.length) toast.success(`Imported ${droppedFiles.length} file(s)`);
  };

  const filesInCategory = (catId: string | null) =>
    filteredFiles.filter((f) => f.categoryId === catId);

  const uncategorized = filesInCategory(null);

  return (
    <aside
      ref={sidebarRef}
      className="flex flex-col h-full bg-[hsl(222_47%_4%)] border-r border-white/[0.07] overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setDragOverCat("root"); }}
      onDragLeave={() => setDragOverCat(null)}
      onDrop={(e) => handleDropOnSidebar(e, null)}
    >
      {/* Header */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        {/* Action buttons row */}
        <div className="flex items-center gap-1 mb-1.5">
          <button
            onClick={() => handleNewFile(null)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-[13px] font-medium transition-colors flex-1 justify-center"
            title="New file"
          >
            <FilePlus size={16} /> New
          </button>
          <button
            onClick={() => {
              const name = prompt("Category name:");
              if (name?.trim()) createCategory(sanitizeName(name));
            }}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors"
            title="New category"
          >
            <FolderPlus size={16} />
          </button>
          {onImport && (
            <button
              onClick={onImport}
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
              title="Import .md files"
            >
              <Upload size={16} />
            </button>
          )}
          {onMergeOpen && (
            <button
              onClick={selectedIds.size >= 2 ? onMergeOpen : undefined}
              className={cn(
                "flex items-center gap-1 px-2.5 py-2 rounded-lg transition-colors",
                selectedIds.size >= 2
                  ? "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 cursor-pointer"
                  : "bg-white/[0.03] text-white/20 cursor-default"
              )}
              title={selectedIds.size >= 2 ? "Merge selected files" : "Select 2+ files to merge"}
            >
              <Merge size={16} />
            </button>
          )}
          {/* Mobile close */}
          {onClose && (
            <button onClick={onClose} className="md:hidden ml-auto p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        {/* Selected count hint */}
        {selectedIds.size > 0 && (
          <div className="px-1 mb-1">
            <span className="text-[11px] text-white/30">{selectedIds.size} file{selectedIds.size !== 1 ? "s" : ""} selected</span>
          </div>
        )}
      </div>

      {/* Drop hint */}
      {dragOverCat === "root" && (
        <div className="mx-2 mb-1 border border-dashed border-blue-400/60 rounded-md text-blue-400 text-xs text-center py-1">
          Drop .md files here
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {/* Categories */}
        {sortedCategories.map((cat) => (
          <CategorySection
            key={cat.id}
            cat={cat}
            files={filesInCategory(cat.id)}
            activeFileId={activeFileId}
            selectedIds={selectedIds}
            renamingId={renamingId}
            renameValue={renameValue}
            renamingCatId={renamingCatId}
            renameCatValue={renameCatValue}
            movingFileId={movingFileId}
            categories={categories}
            onSelect={setActiveFile}
            onSelectToggle={onSelectToggle}
            onToggle={() => toggleCategory(cat.id)}
            onDelete={() => { deleteCategory(cat.id); toast.success("Category deleted"); }}
            onRenameStart={() => handleRenameCat(cat.id, cat.name)}
            onRenameValueChange={setRenameCatValue}
            onRenameCommit={() => commitRenameCat(cat.id)}
            onRenameCancel={() => setRenamingCatId(null)}
            onNewFile={() => handleNewFile(cat.id)}
            onFileRenameStart={handleRenameFile}
            onFileRenameValueChange={setRenameValue}
            onFileRenameCommit={commitRename}
            onFileRenameCancel={() => setRenamingId(null)}
            onFileDelete={(id) => { trashFile(id); toast.success("Moved to trash"); }}
            onFileDuplicate={duplicateFile}
            onFilePinToggle={togglePinFile}
            onFileWatchToggle={toggleWatchFile}
            onFileTagAdd={addFileTag}
            onFileTagRemove={removeFileTag}
            onFileMoveStart={setMovingFileId}
            onFileMoveEnd={() => setMovingFileId(null)}
            onFileMoveTarget={(fileId, catId) => { moveFile(fileId, catId); setMovingFileId(null); }}
            onDrop={(e) => handleDropOnSidebar(e, cat.id)}
            onReorderUp={() => reorderCategory(cat.id, "up")}
            onReorderDown={() => reorderCategory(cat.id, "down")}
          />
        ))}

        {/* Uncategorized */}
        <div className="mt-1">
          <div className="px-2 py-0.5 flex items-center justify-between group">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
              {sortedCategories.length > 0 ? "Uncategorized" : "All Files"}
            </span>
            <button
              onClick={() => handleNewFile(null)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/8 text-white/40 hover:text-blue-400 transition-all"
            >
              <FilePlus size={11} />
            </button>
          </div>
          {uncategorized.length === 0 && (
            <p className="text-xs text-white/20 px-3 py-2">Drop .md files here</p>
          )}
          {uncategorized.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isActive={file.id === activeFileId}
              isSelected={selectedIds.has(file.id)}
              isRenaming={renamingId === file.id}
              renameValue={renameValue}
              categories={categories}
              isMoving={movingFileId === file.id}
              onSelect={() => setActiveFile(file.id)}
              onSelectToggle={() => onSelectToggle(file.id)}
              onRenameStart={() => handleRenameFile(file.id, file.name)}
              onRenameValueChange={setRenameValue}
              onRenameCommit={() => commitRename(file.id)}
              onRenameCancel={() => setRenamingId(null)}
              onDelete={() => { trashFile(file.id); toast.success("Moved to trash"); }}
              onDuplicate={() => duplicateFile(file.id)}
              onPinToggle={() => togglePinFile(file.id)}
              onWatchToggle={() => toggleWatchFile(file.id)}
              onTagAdd={(tag) => addFileTag(file.id, tag)}
              onTagRemove={(tag) => removeFileTag(file.id, tag)}
              onMoveStart={() => setMovingFileId(file.id)}
              onMoveEnd={() => setMovingFileId(null)}
              onMoveTarget={(catId) => { moveFile(file.id, catId); setMovingFileId(null); }}
            />
          ))}
        </div>

        {/* Empty state */}
        {files.length === 0 && (
          <div className="px-3 py-6 text-center">
            <FileText size={24} className="mx-auto text-white/20 mb-2" />
            <p className="text-xs text-white/30">No files yet</p>
            <button onClick={() => handleNewFile()} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
              Create your first file
            </button>
          </div>
        )}

        {/* Search empty state */}
        {q && filteredFiles.length === 0 && (
          <p className="text-xs text-white/30 px-3 py-2">No results for "{searchQuery}"</p>
        )}
      </div>

      {/* Due reminders notification panel */}
      {dueReminders.length > 0 && (
        <div className="mx-2 mb-1 rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-yellow-500/10">
            <Bell size={11} className="text-yellow-400 shrink-0" />
            <span className="text-[11px] font-semibold text-yellow-300">Reminders</span>
            <button onClick={() => setAppView("dashboard")} className="ml-auto text-[10px] text-yellow-400/60 hover:text-yellow-400 transition-colors">View all</button>
          </div>
          <div className="divide-y divide-yellow-500/10">
            {dueReminders.slice(0, 4).map((r: any) => {
              const overdue = r.dueAt <= now;
              const dueLabel = new Date(r.dueAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
              return (
                <div key={r.id} className="flex items-start gap-1.5 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/75 truncate leading-snug">{r.text}</p>
                    <p className={`text-[10px] mt-0.5 font-medium ${overdue ? "text-red-400" : "text-yellow-400"}`}>
                      {overdue ? `Overdue · ${dueLabel}` : `Due ${dueLabel}`}
                    </p>
                  </div>
                  {/* Toggle enabled */}
                  <button
                    onClick={() => toggleReminderEnabled(r.id)}
                    title={r.enabled !== false ? "Disable reminder" : "Enable reminder"}
                    className="shrink-0 mt-0.5 text-white/20 hover:text-yellow-400 transition-colors"
                  >
                    {r.enabled !== false ? <Bell size={11} /> : <BellOff size={11} />}
                  </button>
                  {/* Mark done */}
                  <button
                    onClick={() => toggleReminderDone(r.id)}
                    title="Mark done"
                    className="shrink-0 mt-0.5 text-white/20 hover:text-green-400 transition-colors"
                  >
                    <CheckSquare size={11} />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteReminderNote(r.id)}
                    title="Delete reminder"
                    className="shrink-0 mt-0.5 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
            {dueReminders.length > 4 && (
              <p className="px-3 py-1.5 text-[10px] text-white/30">+{dueReminders.length - 4} more</p>
            )}
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-white/[0.05] shrink-0 space-y-1">
        <div className="text-[10px] text-white/25">
          {files.filter((f) => f.trashedAt == null).length} file{files.filter((f) => f.trashedAt == null).length !== 1 ? "s" : ""} · {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </div>
        {trashedCount > 0 && (
          <button
            onClick={() => setAppView("trash")}
            className="flex items-center gap-1.5 text-[11px] text-red-400/70 hover:text-red-400 transition-colors"
          >
            <Trash2 size={10} /> Trash ({trashedCount})
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── CategorySection ────────────────────────────────────────────────────────

interface CatProps {
  cat: Category;
  files: MDFile[];
  activeFileId: string | null;
  selectedIds: Set<string>;
  renamingId: string | null;
  renameValue: string;
  renamingCatId: string | null;
  renameCatValue: string;
  movingFileId: string | null;
  categories: Category[];
  onSelect: (id: string) => void;
  onSelectToggle: (id: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onRenameStart: () => void;
  onRenameValueChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onNewFile: () => void;
  onFileRenameStart: (id: string, name: string) => void;
  onFileRenameValueChange: (v: string) => void;
  onFileRenameCommit: (id: string) => void;
  onFileRenameCancel: () => void;
  onFileDelete: (id: string) => void;
  onFileDuplicate: (id: string) => void;
  onFilePinToggle: (id: string) => void;
  onFileWatchToggle: (id: string) => void;
  onFileTagAdd: (id: string, tag: string) => void;
  onFileTagRemove: (id: string, tag: string) => void;
  onFileMoveStart: (id: string) => void;
  onFileMoveEnd: () => void;
  onFileMoveTarget: (fileId: string, catId: string | null) => void;
  onDrop: (e: React.DragEvent) => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
}

function CategorySection({
  cat, files, activeFileId, selectedIds, renamingId, renameValue,
  renamingCatId, renameCatValue, movingFileId, categories,
  onSelect, onSelectToggle, onToggle, onDelete, onRenameStart,
  onRenameValueChange, onRenameCommit, onRenameCancel, onNewFile,
  onFileRenameStart, onFileRenameValueChange, onFileRenameCommit,
  onFileRenameCancel, onFileDelete, onFileDuplicate, onFilePinToggle, onFileWatchToggle, onFileTagAdd, onFileTagRemove,
  onFileMoveStart, onFileMoveEnd, onFileMoveTarget, onDrop,
  onReorderUp, onReorderDown,
}: CatProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn("mb-1 rounded-md transition-colors", dragOver && "bg-purple-500/5")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { setDragOver(false); onDrop(e); }}
    >
      {/* Category header */}
      <div className="flex items-center gap-1 px-1 py-0.5 group rounded-md hover:bg-white/[0.03]">
        <button onClick={onToggle} className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-white/30 shrink-0">
            {cat.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          {cat.expanded ? (
            <FolderOpen size={12} className="text-purple-400 shrink-0" />
          ) : (
            <Folder size={12} className="text-purple-400 shrink-0" />
          )}
          {renamingCatId === cat.id ? (
            <input
              autoFocus
              value={renameCatValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onRenameValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameCommit();
                if (e.key === "Escape") onRenameCancel();
              }}
              onBlur={onRenameCommit}
              className="flex-1 min-w-0 bg-white/10 text-[13px] text-white rounded px-1 outline-none border border-white/20"
            />
          ) : (
            <span className="text-[13px] font-medium text-white/65 truncate">{cat.name}</span>
          )}
          <span className="text-[10px] text-white/25 ml-auto shrink-0">{files.length}</span>
        </button>

        {/* Category actions */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all">
          <button onClick={onNewFile} title="New file in category" className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-blue-400">
            <FilePlus size={11} />
          </button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s); }} className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white">
              <MoreHorizontal size={11} />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-[hsl(222_47%_8%)] border border-white/10 rounded-lg shadow-xl py-1 w-36" onClick={(e) => e.stopPropagation()}>
                <MenuItem icon={<ArrowUp size={12} />} label="Move up" onClick={() => { onReorderUp(); setShowMenu(false); }} />
                <MenuItem icon={<ArrowDown size={12} />} label="Move down" onClick={() => { onReorderDown(); setShowMenu(false); }} />
                <MenuItem icon={<Edit2 size={12} />} label="Rename" onClick={() => { onRenameStart(); setShowMenu(false); }} />
                <div className="my-1 border-t border-white/10" />
                <MenuItem icon={<Trash2 size={12} />} label="Delete" danger onClick={() => { onDelete(); setShowMenu(false); }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Files in category */}
      {cat.expanded && (
        <div className="ml-3 border-l border-white/[0.06] pl-1">
          {files.length === 0 && (
            <p className="text-[11px] text-white/20 px-2 py-1">Empty — drop .md files here</p>
          )}
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isActive={file.id === activeFileId}
              isSelected={selectedIds.has(file.id)}
              isRenaming={renamingId === file.id}
              renameValue={renameValue}
              categories={categories}
              isMoving={movingFileId === file.id}
              onSelect={() => onSelect(file.id)}
              onSelectToggle={() => onSelectToggle(file.id)}
              onRenameStart={() => onFileRenameStart(file.id, file.name)}
              onRenameValueChange={onFileRenameValueChange}
              onRenameCommit={() => onFileRenameCommit(file.id)}
              onRenameCancel={onFileRenameCancel}
              onDelete={() => onFileDelete(file.id)}
              onDuplicate={() => onFileDuplicate(file.id)}
              onPinToggle={() => onFilePinToggle(file.id)}
              onWatchToggle={() => onFileWatchToggle(file.id)}
              onTagAdd={(tag) => onFileTagAdd(file.id, tag)}
              onTagRemove={(tag) => onFileTagRemove(file.id, tag)}
              onMoveStart={() => onFileMoveStart(file.id)}
              onMoveEnd={onFileMoveEnd}
              onMoveTarget={(catId) => onFileMoveTarget(file.id, catId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FileItem ────────────────────────────────────────────────────────────────

interface FileItemProps {
  file: MDFile;
  isActive: boolean;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  categories: Category[];
  isMoving: boolean;
  onSelect: () => void;
  onSelectToggle: () => void;
  onRenameStart: () => void;
  onRenameValueChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPinToggle: () => void;
  onWatchToggle: () => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onMoveTarget: (catId: string | null) => void;
}

function FileItem({
  file, isActive, isSelected, isRenaming, renameValue, categories,
  isMoving, onSelect, onSelectToggle, onRenameStart, onRenameValueChange,
  onRenameCommit, onRenameCancel, onDelete, onDuplicate, onPinToggle, onTagAdd, onTagRemove,
  onMoveStart, onMoveEnd, onMoveTarget, onWatchToggle,
}: FileItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState("");

  const TAG_PRESETS = ["important", "pin", "todo", "reference", "draft", "done"];
  const TAG_COLORS: Record<string, string> = {
    important: "bg-red-500/20 text-red-300",
    pin: "bg-yellow-500/20 text-yellow-300",
    todo: "bg-blue-500/20 text-blue-300",
    reference: "bg-purple-500/20 text-purple-300",
    draft: "bg-orange-500/20 text-orange-300",
    done: "bg-green-500/20 text-green-300",
  };

  const commitTag = () => {
    const t = tagValue.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !file.tags.includes(t)) onTagAdd(t);
    setTagValue("");
    setShowTagInput(false);
  };

  return (
    <div className="group">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all text-[13px] relative",
          isActive ? "bg-white/[0.09] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white/80",
          isSelected && "ring-1 ring-blue-500/40"
        )}
        onClick={onSelect}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelectToggle(); }}
          className={cn("shrink-0 transition-opacity text-blue-400", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60")}
        >
          {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
        </button>

        {file.pinned
          ? <Pin size={11} className="shrink-0 text-yellow-400" />
          : <FileText size={13} className={cn("shrink-0", isActive ? "text-blue-400" : "text-white/30")} />}

        {file.watched && (
          <Eye size={11} className="shrink-0 text-blue-400/60" />
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameCommit();
              if (e.key === "Escape") onRenameCancel();
            }}
            onBlur={onRenameCommit}
            className="flex-1 min-w-0 bg-white/10 text-white rounded px-1 outline-none border border-white/20 text-[13px]"
          />
        ) : (
          <span className="flex-1 truncate text-[13px]">{file.name}</span>
        )}

        {/* Modified indicator */}
        <span className={cn("text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0", "text-white/25")}>
          {formatDate(file.updatedAt)}
        </span>

        {/* Context menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-all shrink-0 relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s); setShowMoveMenu(false); }}
            className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
          >
            <MoreHorizontal size={11} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 z-50 bg-[hsl(222_47%_8%)] border border-white/10 rounded-lg shadow-xl py-1 w-40"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem icon={<Edit2 size={12} />} label="Rename" onClick={() => { onRenameStart(); setShowMenu(false); }} />
              <MenuItem icon={<FileText size={12} />} label="Duplicate" onClick={() => { onDuplicate(); setShowMenu(false); }} />
              <MenuItem icon={<Pin size={12} />} label={file.pinned ? "Unpin" : "Pin"} onClick={() => { onPinToggle(); setShowMenu(false); }} />
              <MenuItem icon={<Eye size={12} />} label={file.watched ? "Unwatch" : "Watch"} onClick={() => { onWatchToggle(); setShowMenu(false); }} />
              <MenuItem icon={<Tag size={12} />} label="Add tag" onClick={() => { setShowTagInput(true); setShowMenu(false); }} />
              <div className="relative">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                  onClick={() => setShowMoveMenu((s) => !s)}
                >
                  <MoveRight size={12} />
                  Move to…
                </button>
                {showMoveMenu && (
                  <div className="absolute left-full top-0 ml-1 bg-[hsl(222_47%_8%)] border border-white/10 rounded-lg shadow-xl py-1 w-40 z-50">
                    <MenuItem label="(No category)" onClick={() => { onMoveTarget(null); setShowMenu(false); setShowMoveMenu(false); }} />
                    {categories.map((c) => (
                      <MenuItem key={c.id} icon={<Folder size={12} />} label={c.name} onClick={() => { onMoveTarget(c.id); setShowMenu(false); setShowMoveMenu(false); }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="my-1 border-t border-white/10" />
              <MenuItem icon={<Trash2 size={12} />} label="Move to Trash" danger onClick={() => { onDelete(); setShowMenu(false); }} />
            </div>
          )}
        </div>
      </div>

      {/* Tag input */}
      {showTagInput && (
        <div className="px-2 pb-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 flex-wrap mb-1">
            {TAG_PRESETS.filter((t) => !file.tags.includes(t)).map((t) => (
              <button key={t} onClick={() => { onTagAdd(t); }} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 hover:bg-white/20">{t}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <input autoFocus value={tagValue} onChange={(e) => setTagValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitTag(); if (e.key === "Escape") setShowTagInput(false); }}
              placeholder="custom tag…" className="flex-1 bg-white/10 text-xs text-white rounded px-1.5 py-0.5 outline-none border border-white/20" />
            <button onClick={() => setShowTagInput(false)} className="text-white/30 hover:text-white"><X size={10} /></button>
          </div>
        </div>
      )}

      {/* Tag chips */}
      {file.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap px-6 pb-1">
          {file.tags.map((t) => (
            <span key={t} className={cn("text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5", TAG_COLORS[t] ?? "bg-white/10 text-white/50")}>
              {t}
              <button onClick={(e) => { e.stopPropagation(); onTagRemove(t); }} className="hover:text-white ml-0.5"><X size={8} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger = false }: {
  icon?: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
        danger ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-white/60 hover:text-white hover:bg-white/[0.05]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
