"use client";

import { useState, useRef } from "react";
import {
  Plus, Trash2, Edit3, X, ChevronRight, ClipboardList,
  Loader2, AlertCircle, CheckCircle2, Copy,
} from "lucide-react";
import { useStore, type KanbanTask, type KanbanColumn, type StickyNote } from "@/lib/store";
import { cn } from "@/lib/utils";

const COLUMNS: { id: KanbanColumn; label: string; color: string; bg: string; dot: string }[] = [
  { id: "todo",        label: "Todo",        color: "text-blue-300",   bg: "bg-blue-500/10 border-blue-500/20",   dot: "bg-blue-400" },
  { id: "in-progress", label: "In Progress", color: "text-yellow-300", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400" },
  { id: "blocked",     label: "Blocked",     color: "text-red-300",    bg: "bg-red-500/10 border-red-500/20",     dot: "bg-red-400" },
  { id: "done",        label: "Done",        color: "text-green-300",  bg: "bg-green-500/10 border-green-500/20", dot: "bg-green-400" },
];

export default function ProgressBoard() {
  const { kanbanTasks, addKanbanTask, updateKanbanTask, moveKanbanTask, deleteKanbanTask, stickyNotes } = useStore();

  // drag-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<KanbanColumn | null>(null);

  // new task form per column
  const [addingCol, setAddingCol] = useState<KanbanColumn | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // editing task
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // copy-note picker
  const [showNotePicker, setShowNotePicker] = useState<KanbanColumn | null>(null);

  const handleAddTask = (col: KanbanColumn) => {
    if (!newTitle.trim()) return;
    addKanbanTask(newTitle.trim(), newContent.trim(), col);
    setNewTitle("");
    setNewContent("");
    setAddingCol(null);
  };

  const handleCopyNote = (note: StickyNote, col: KanbanColumn) => {
    addKanbanTask(
      `Note: ${new Date(note.createdAt).toLocaleDateString()}`,
      note.content,
      col,
      note.id,
    );
    setShowNotePicker(null);
  };

  const startEdit = (t: KanbanTask) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditContent(t.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateKanbanTask(editingId, { title: editTitle.trim() || "Untitled", content: editContent });
    setEditingId(null);
  };

  // Drag handlers
  const onDragStart = (id: string) => setDraggingId(id);
  const onDragEnd = () => { setDraggingId(null); setOverCol(null); };
  const onDragOver = (e: React.DragEvent, col: KanbanColumn) => { e.preventDefault(); setOverCol(col); };
  const onDrop = (col: KanbanColumn) => {
    if (draggingId) moveKanbanTask(draggingId, col);
    setDraggingId(null);
    setOverCol(null);
  };

  const colIcon = { todo: <ClipboardList size={14} />, "in-progress": <Loader2 size={14} />, blocked: <AlertCircle size={14} />, done: <CheckCircle2 size={14} /> };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 shrink-0">
        <h2 className="text-xl font-bold text-white">Progress Board</h2>
        <p className="text-sm text-white/40 mt-0.5">Manage tasks across stages. Drag cards between columns or use arrows.</p>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full px-4 md:px-6 pb-6 min-w-[720px]">
          {COLUMNS.map((col) => {
            const tasks = kanbanTasks.filter((t) => t.column === col.id);
            const isOver = overCol === col.id;

            return (
              <div
                key={col.id}
                className={cn(
                  "flex flex-col rounded-2xl border flex-1 min-w-[200px] transition-all",
                  col.bg,
                  isOver && "ring-2 ring-white/20 scale-[1.01]",
                )}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDrop={() => onDrop(col.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("p-1 rounded", col.color)}>{colIcon[col.id]}</span>
                    <span className={cn("text-sm font-semibold", col.color)}>{col.label}</span>
                    <span className="text-xs text-white/30 bg-white/10 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                  </div>
                  <div className="flex gap-1">
                    {/* Copy from notes */}
                    <button
                      onClick={() => setShowNotePicker(showNotePicker === col.id ? null : col.id)}
                      title="Copy note to column"
                      className="p-1 rounded-md hover:bg-white/15 text-white/30 hover:text-white/70 transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                    {/* Add task */}
                    <button
                      onClick={() => { setAddingCol(col.id); setNewTitle(""); setNewContent(""); }}
                      title="Add task"
                      className="p-1 rounded-md hover:bg-white/15 text-white/30 hover:text-white/70 transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Note picker dropdown */}
                {showNotePicker === col.id && (
                  <div className="mx-2 mb-2 rounded-xl border border-white/15 bg-[hsl(222_47%_6%)] overflow-hidden shadow-xl">
                    <p className="text-[11px] text-white/40 px-3 py-2 border-b border-white/10">Copy sticky note to {col.label}</p>
                    <div className="max-h-48 overflow-y-auto">
                      {stickyNotes.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-white/30">No notes yet</p>
                      ) : (
                        stickyNotes.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleCopyNote(n, col.id)}
                            className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors"
                          >
                            <p className="text-xs text-white/70 truncate">{n.content || "(empty note)"}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{n.category} · {new Date(n.createdAt).toLocaleDateString()}</p>
                          </button>
                        ))
                      )}
                    </div>
                    <button onClick={() => setShowNotePicker(null)} className="w-full px-3 py-1.5 text-xs text-white/30 hover:text-white/60 border-t border-white/10">Cancel</button>
                  </div>
                )}

                {/* Add task form */}
                {addingCol === col.id && (
                  <div className="mx-2 mb-2 rounded-xl border border-white/15 bg-[hsl(222_47%_6%)] p-3 space-y-2">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(col.id); if (e.key === "Escape") setAddingCol(null); }}
                      placeholder="Task title…"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50"
                    />
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Notes (optional)…"
                      rows={2}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAddTask(col.id)} className="flex-1 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition-colors">Add</button>
                      <button onClick={() => setAddingCol(null)} className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/40 text-xs transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Task cards */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                  {tasks.length === 0 && !addingCol && (
                    <p className="text-xs text-white/20 text-center py-6">Drop tasks here</p>
                  )}
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      columns={COLUMNS}
                      isDragging={draggingId === task.id}
                      isEditing={editingId === task.id}
                      editTitle={editTitle}
                      editContent={editContent}
                      setEditTitle={setEditTitle}
                      setEditContent={setEditContent}
                      onEdit={() => startEdit(task)}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditingId(null)}
                      onDelete={() => deleteKanbanTask(task.id)}
                      onMove={(col) => moveKanbanTask(task.id, col)}
                      onDragStart={() => onDragStart(task.id)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task, columns, isDragging, isEditing,
  editTitle, editContent, setEditTitle, setEditContent,
  onEdit, onSaveEdit, onCancelEdit, onDelete, onMove, onDragStart, onDragEnd,
}: {
  task: KanbanTask;
  columns: typeof COLUMNS;
  isDragging: boolean;
  isEditing: boolean;
  editTitle: string;
  editContent: string;
  setEditTitle: (v: string) => void;
  setEditContent: (v: string) => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onMove: (col: KanbanColumn) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const otherCols = columns.filter((c) => c.id !== task.column);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative rounded-xl border border-white/10 bg-[hsl(222_47%_7%)] p-3 cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-40 scale-95",
      )}
    >
      {isEditing ? (
        <div className="space-y-2">
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.06] border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white outline-none resize-none"
          />
          <div className="flex gap-1.5">
            <button onClick={onSaveEdit} className="flex-1 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium">Save</button>
            <button onClick={onCancelEdit} className="px-3 py-1 rounded-lg bg-white/[0.05] text-white/40 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-white/85 leading-snug mb-1">{task.title}</p>
          {task.content && (
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{task.content}</p>
          )}
          {task.noteId && (
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300/70">from note</span>
          )}
          <p className="text-[10px] text-white/20 mt-2">{new Date(task.createdAt).toLocaleDateString()}</p>

          {/* Actions — visible on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all bg-[hsl(222_47%_9%)] rounded-lg p-0.5 border border-white/10">
            {/* Move arrows */}
            {otherCols.map((c) => (
              <button
                key={c.id}
                onClick={() => onMove(c.id)}
                title={`Move to ${c.label}`}
                className={cn("p-1 rounded-md text-[10px] transition-colors", c.color, "hover:bg-white/10")}
              >
                <ChevronRight size={10} />
              </button>
            ))}
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors">
              <Edit3 size={10} />
            </button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors">
              <Trash2 size={10} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
