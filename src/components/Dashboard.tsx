"use client";

import { useMemo, useState, useRef } from "react";
import {
  FileText, Folder, Highlighter, Hash, Clock, TrendingUp, Plus,
  Trash2, Link2, PlayCircle, CheckCircle2, Circle, ExternalLink,
  LayoutGrid, ListChecks, BookMarked, StickyNote, X, Edit3, CalendarClock, Kanban, Eye,
} from "lucide-react";
import { useStore, type StickyNote as StickyNoteType, type ReminderNote } from "@/lib/store";
import { syncNote, deleteNoteFile } from "@/lib/folder-root";
import ProgressBoard from "@/components/ProgressBoard";
import { formatDate, cn } from "@/lib/utils";

type Tab = "overview" | "notes" | "progress" | "quelist" | "reminders";

export default function Dashboard() {
  const {
    files, categories, highlights, setActiveFile, setAppView, createFile, createCategory,
    queItems, addQueItem, deleteQueItem, clearAllQueItems,
    reminderNotes, addReminderNote, deleteReminderNote, updateReminderNote, toggleReminderDone, setReminderDue, clearAllReminders,
    stickyNotes, addStickyNote, updateStickyNote, deleteStickyNote, clearAllStickyNotes,
    kanbanTasks, prompts, skills, toggleWatchFile,
  } = useStore();

  const [tab, setTab] = useState<Tab>("overview");

  const sortedRecent = useMemo(
    () => [...files].filter((f) => f.trashedAt == null).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8),
    [files]
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const openFile = (id: string) => {
    setActiveFile(id);
    setAppView("editor");
  };

  const activeFiles = useMemo(() => files.filter((f) => f.trashedAt == null), [files]);

  const statCards = [
    { label: "Files",      value: activeFiles.length,                                           icon: <FileText size={20} />,   color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Categories", value: categories.length,                                           icon: <Folder size={20} />,     color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Highlights", value: highlights.length,                                           icon: <Highlighter size={20} />, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Reminders",  value: reminderNotes.filter((r) => !r.done).length,                 icon: <ListChecks size={20} />, color: "text-green-400",  bg: "bg-green-500/10" },
    { label: "Notes",      value: stickyNotes.length,                                          icon: <StickyNote size={20} />, color: "text-pink-400",   bg: "bg-pink-500/10" },
    { label: "Prompts",    value: prompts.length,                                              icon: <Hash size={20} />,       color: "text-teal-400",   bg: "bg-teal-500/10" },
    { label: "Skills",     value: skills.length,                                               icon: <TrendingUp size={20} />, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Tasks",      value: kanbanTasks.filter((t) => t.column !== "done").length,       icon: <Kanban size={20} />,     color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  const watchlist = useMemo(
    () => activeFiles.filter((f) => !f.watched).sort((a, b) => b.updatedAt - a.updatedAt),
    [activeFiles]
  );

  const tabs: { id: Tab; icon: React.ReactNode; label: string; count?: number }[] = [
    { id: "overview",  icon: <LayoutGrid size={15} />,   label: "Overview" },
    { id: "notes",     icon: <StickyNote size={15} />,   label: "Notes",     count: stickyNotes.length || undefined },
    { id: "progress",  icon: <Kanban size={15} />,       label: "Progress" },
    { id: "quelist",   icon: <BookMarked size={15} />,   label: "Que List",  count: queItems.length || undefined },
    { id: "reminders", icon: <ListChecks size={15} />,   label: "Reminders", count: reminderNotes.filter((r: any) => !r.done && r.enabled !== false).length || undefined },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 md:px-6 pt-5 pb-0 border-b border-white/[0.07] bg-[hsl(222_47%_5%)] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-white/40 mt-0.5">Your markdown workspace</p>
          </div>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
                tab === t.id
                  ? "text-white border-blue-400 bg-white/[0.05]"
                  : "text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.03]"
              }`}
            >
              {t.icon} {t.label}
              {t.count !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "overview" && (
          <OverviewTab
            statCards={statCards}
            sortedRecent={sortedRecent}
            sortedCategories={sortedCategories}
            files={activeFiles}
            categories={categories}
            openFile={openFile}
            createFile={createFile}
            createCategory={createCategory}
            setAppView={setAppView}
            watchlist={watchlist}
            toggleWatchFile={toggleWatchFile}
          />
        )}
        {tab === "progress" && <ProgressBoard />}
        {tab === "notes" && (
          <NotesTab
            stickyNotes={stickyNotes}
            addStickyNote={addStickyNote}
            updateStickyNote={updateStickyNote}
            deleteStickyNote={deleteStickyNote}
            clearAllStickyNotes={clearAllStickyNotes}
          />
        )}
        {tab === "quelist" && (
          <QueListTab queItems={queItems} addQueItem={addQueItem} deleteQueItem={deleteQueItem} clearAllQueItems={clearAllQueItems} />
        )}
        {tab === "reminders" && (
          <RemindersTab
            reminderNotes={reminderNotes}
            addReminderNote={addReminderNote}
            deleteReminderNote={deleteReminderNote}
            updateReminderNote={updateReminderNote}
            toggleReminderDone={toggleReminderDone}
            setReminderDue={setReminderDue}
            clearAllReminders={clearAllReminders}
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ statCards, sortedRecent, sortedCategories, files, categories, openFile, createFile, createCategory, setAppView, watchlist, toggleWatchFile }: any) {

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s: any) => (
          <div key={s.label} className={`bg-white/[0.04] border border-white/[0.08] rounded-xl p-4`}>
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${s.bg}`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { createFile(`Note ${files.length + 1}`); setAppView("editor"); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 rounded-xl text-sm font-medium text-blue-300 transition-colors"
        >
          <Plus size={16} /> New File
        </button>
        <button
          onClick={() => { const n = prompt("Category name:"); if (n?.trim()) createCategory(n.trim()); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 rounded-xl text-sm font-medium text-purple-300 transition-colors"
        >
          <Plus size={16} /> New Category
        </button>
        <button
          onClick={() => setAppView("highlights")}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/20 rounded-xl text-sm font-medium text-yellow-300 transition-colors"
        >
          <Highlighter size={16} /> View Highlights
        </button>
      </div>

      {/* ── Watchlist (unwatched files) ── */}
      {watchlist.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Eye size={14} className="text-blue-400" /> Watchlist <span className="text-white/25 font-normal normal-case tracking-normal">(unwatched)</span>
          </h2>
          <div className="space-y-1.5">
            {watchlist.slice(0, 10).map((f: any) => {
              const cat = categories.find((c: any) => c.id === f.categoryId);
              return (
                <div key={f.id} className="flex items-center gap-2 p-2.5 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] rounded-xl group transition-all">
                  <button onClick={() => openFile(f.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                    <FileText size={13} className="text-blue-400 shrink-0" />
                    <span className="text-sm text-white/75 truncate group-hover:text-white">{f.name}</span>
                    {cat && <span className="text-xs text-purple-400/60 shrink-0">{cat.name}</span>}
                  </button>
                  <button
                    onClick={() => toggleWatchFile(f.id)}
                    title="Mark as watched"
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/15 transition-all shrink-0"
                  >
                    <Eye size={12} /> Watch
                  </button>
                </div>
              );
            })}
            {watchlist.length > 10 && (
              <p className="text-xs text-white/25 pl-2">{watchlist.length - 10} more unwatched files</p>
            )}
          </div>
        </section>
      )}

      {sortedRecent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={14} /> Recent Files
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sortedRecent.map((f: any) => {
              const cat = categories.find((c: any) => c.id === f.categoryId);
              const preview = f.content.replace(/#+\s/g, "").replace(/[*_`]/g, "").trim().slice(0, 100);
              return (
                <button
                  key={f.id}
                  onClick={() => openFile(f.id)}
                  className="text-left p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] rounded-xl transition-all group"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <FileText size={15} className="text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-white/85 truncate group-hover:text-white">{f.name}</p>
                      {cat && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-400/80 mt-0.5">
                          <Folder size={10} /> {cat.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/30 shrink-0">{formatDate(f.updatedAt)}</span>
                  </div>
                  {preview && (
                    <p className="text-sm text-white/30 leading-relaxed line-clamp-2 ml-[26px]">{preview}</p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {sortedCategories.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Folder size={14} /> Categories
          </h2>
          <div className="space-y-2">
            {sortedCategories.map((cat: any) => {
              const catFiles = files.filter((f: any) => f.categoryId === cat.id);
              return (
                <div key={cat.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <Folder size={15} className="text-purple-400" />
                    <span className="text-base font-medium text-white/80 flex-1">{cat.name}</span>
                    <span className="text-sm text-white/30">{catFiles.length} file{catFiles.length !== 1 ? "s" : ""}</span>
                  </div>
                  {catFiles.length > 0 && (
                    <div className="border-t border-white/[0.05] px-4 py-2.5 flex flex-wrap gap-2">
                      {catFiles.slice(0, 6).map((f: any) => (
                        <button
                          key={f.id}
                          onClick={() => openFile(f.id)}
                          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FileText size={11} /> {f.name}
                        </button>
                      ))}
                      {catFiles.length > 6 && (
                        <span className="text-sm text-white/25 px-2 py-1.5">+{catFiles.length - 6} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {files.length <= 1 && categories.length === 0 && (
        <div className="text-center py-16 text-white/20">
          <TrendingUp size={44} className="mx-auto mb-4 opacity-30" />
          <p className="text-base">Start creating files and categories</p>
          <p className="text-sm mt-1">Your workspace overview will appear here</p>
        </div>
      )}
    </div>
  );
}

function QueListTab({ queItems, addQueItem, deleteQueItem, clearAllQueItems }: any) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const isYoutube = (u: string) => /youtube\.com|youtu\.be/.test(u);

  const handleAdd = () => {
    const t = title.trim();
    const u = url.trim();
    if (!t || !u) return;
    addQueItem(t, u);
    setTitle("");
    setUrl("");
    titleRef.current?.focus();
  };

  const sortedItems = [...queItems].sort((a: any, b: any) => b.createdAt - a.createdAt);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Que List</h2>
        <p className="text-sm text-white/40">Save important links, articles, and YouTube videos to revisit later.</p>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-white/60">Add to queue</p>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) handleAdd(); }}
          placeholder="Title or description…"
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-base text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) handleAdd(); }}
          placeholder="https://…"
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-base text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!title.trim() || !url.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:pointer-events-none border border-blue-500/25 rounded-xl text-sm font-medium text-blue-300 transition-colors"
        >
          <Plus size={15} /> Add to Que
        </button>
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <BookMarked size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-base">No items yet</p>
          <p className="text-sm mt-1">Add links and videos above</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={() => { if (confirm("Clear all queue items?")) clearAllQueItems(); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 border border-red-500/15 transition-colors">Clear All</button>
          </div>
          <div className="space-y-2">
          {sortedItems.map((item: any) => {
            const isYT = isYoutube(item.url);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] rounded-xl group transition-all"
              >
                <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${isYT ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                  {isYT ? <PlayCircle size={16} /> : <Link2 size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-white/85 mb-0.5 truncate">{item.title}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-400/70 hover:text-blue-400 truncate transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={11} />
                    <span className="truncate">{item.url}</span>
                  </a>
                  <p className="text-xs text-white/25 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => deleteQueItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}

function RemindersTab({ reminderNotes, addReminderNote, deleteReminderNote, updateReminderNote, toggleReminderDone, setReminderDue, clearAllReminders }: any) {
  const [draft, setDraft] = useState("");
  const [draftDue, setDraftDue] = useState("");   // datetime-local string
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleAdd = () => {
    if (!draft.trim()) return;
    const dueAt = draftDue ? new Date(draftDue).getTime() : null;
    addReminderNote(draft, dueAt);
    setDraft("");
    setDraftDue("");
  };

  const pending = [...reminderNotes].filter((r: any) => !r.done).sort((a: any, b: any) => {
    // Sort: overdue first, then by dueAt asc, then no-due by createdAt desc
    const aHasDue = a.dueAt != null;
    const bHasDue = b.dueAt != null;
    if (aHasDue && bHasDue) return a.dueAt - b.dueAt;
    if (aHasDue) return -1;
    if (bHasDue) return 1;
    return b.createdAt - a.createdAt;
  });
  const done = [...reminderNotes].filter((r: any) => r.done).sort((a: any, b: any) => b.createdAt - a.createdAt);

  const startEdit = (r: any) => { setEditingId(r.id); setEditText(r.text); };
  const saveEdit = (id: string) => { if (editText.trim()) updateReminderNote(id, editText.trim()); setEditingId(null); };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Reminder Notes</h2>
        <p className="text-sm text-white/40">Keep track of things to do or remember.</p>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-white/60">New reminder</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd(); }}
          placeholder="Write a reminder note… (Ctrl+Enter to add)"
          rows={2}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-base text-white placeholder:text-white/25 outline-none focus:border-green-500/50 transition-colors resize-none leading-relaxed"
        />
        {/* Date + time picker inline */}
        <div className="flex items-center gap-2">
          <CalendarClock size={14} className="text-white/30 shrink-0" />
          <input
            type="datetime-local"
            value={draftDue}
            onChange={(e) => setDraftDue(e.target.value)}
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-green-500/40 transition-colors"
            style={{ colorScheme: "dark" }}
          />
          {draftDue && (
            <button onClick={() => setDraftDue("")} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500/15 hover:bg-green-500/25 disabled:opacity-30 disabled:pointer-events-none border border-green-500/20 rounded-xl text-sm font-medium text-green-300 transition-colors"
        >
          <Plus size={15} /> Add Reminder
        </button>
      </div>

      {pending.length === 0 && done.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <ListChecks size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-base">No reminders yet</p>
          <p className="text-sm mt-1">Add a note above to get started</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={() => { if (confirm("Clear all reminders?")) clearAllReminders(); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 border border-red-500/15 transition-colors">Clear All</button>
          </div>
          {pending.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3">Pending · {pending.length}</h3>
              <div className="space-y-2">
                {pending.map((r: any) => (
                  <ReminderCard
                    key={r.id} r={r}
                    editingId={editingId} editText={editText}
                    setEditText={setEditText} startEdit={startEdit}
                    saveEdit={saveEdit} setEditingId={setEditingId}
                    toggleReminderDone={toggleReminderDone} deleteReminderNote={deleteReminderNote}
                    setReminderDue={setReminderDue}
                  />
                ))}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section className="opacity-60">
              <h3 className="text-sm font-semibold text-white/30 uppercase tracking-widest mb-3">Done · {done.length}</h3>
              <div className="space-y-2">
                {done.map((r: any) => (
                  <ReminderCard
                    key={r.id} r={r}
                    editingId={editingId} editText={editText}
                    setEditText={setEditText} startEdit={startEdit}
                    saveEdit={saveEdit} setEditingId={setEditingId}
                    toggleReminderDone={toggleReminderDone} deleteReminderNote={deleteReminderNote}
                    setReminderDue={setReminderDue}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ReminderCard({ r, editingId, editText, setEditText, startEdit, saveEdit, setEditingId, toggleReminderDone, deleteReminderNote, setReminderDue }: any) {
  const now = Date.now();
  const isOverdue = r.dueAt && !r.done && r.dueAt <= now;
  const isDueSoon = r.dueAt && !r.done && r.dueAt > now && r.dueAt - now <= 24 * 60 * 60 * 1000;

  // Convert timestamp → "YYYY-MM-DDTHH:mm" for datetime-local input (LOCAL time)
  const toDTLocal = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const dueValue = r.dueAt ? toDTLocal(r.dueAt) : "";

  const handleDueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // datetime-local gives "YYYY-MM-DDTHH:mm" → parse as local time
    setReminderDue(r.id, val ? new Date(val).getTime() : null);
  };

  // Human-friendly due label
  const dueLabelStr = r.dueAt
    ? new Date(r.dueAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <div className={`flex items-start gap-3 p-4 bg-white/[0.03] border rounded-xl group transition-all ${
      isOverdue ? "border-red-500/30 bg-red-500/5" : isDueSoon ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/[0.07] hover:border-white/[0.12]"
    }`}>
      <button onClick={() => toggleReminderDone(r.id)} className="mt-0.5 shrink-0 text-white/30 hover:text-green-400 transition-colors">
        {r.done ? <CheckCircle2 size={20} className="text-green-400" /> : <Circle size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        {editingId === r.id ? (
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit(r.id); if (e.key === "Escape") setEditingId(null); }}
            rows={2}
            className="w-full bg-white/[0.06] border border-white/[0.15] rounded-lg px-3 py-2 text-base text-white outline-none focus:border-blue-500/50 transition-colors resize-none leading-relaxed"
          />
        ) : (
          <p
            className={`text-base leading-relaxed cursor-pointer ${r.done ? "line-through text-white/30" : "text-white/80"}`}
            onDoubleClick={() => startEdit(r)}
          >
            {r.text}
          </p>
        )}

        {/* Date + time picker row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <CalendarClock size={12} className={`shrink-0 ${isOverdue ? "text-red-400" : isDueSoon ? "text-yellow-400" : "text-white/25"}`} />
          <input
            type="datetime-local"
            value={dueValue}
            onChange={handleDueChange}
            className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-white/70 outline-none focus:border-blue-500/40 transition-colors"
            style={{ colorScheme: "dark" }}
          />
          {r.dueAt && (
            <>
              {isOverdue && <span className="text-[10px] font-semibold text-red-400">Overdue</span>}
              {isDueSoon && !isOverdue && <span className="text-[10px] font-semibold text-yellow-400">Due soon</span>}
              <button onClick={() => setReminderDue(r.id, null)} title="Clear due date" className="text-white/20 hover:text-white/50 transition-colors"><X size={10} /></button>
            </>
          )}
        </div>

        {r.dueAt && dueLabelStr && (
          <p className={`text-[11px] mt-1 font-medium ${isOverdue ? "text-red-400/80" : isDueSoon ? "text-yellow-400/80" : "text-white/30"}`}>
            {isOverdue ? "⚠ " : "🕐 "}{dueLabelStr}
          </p>
        )}

        {editingId === r.id && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => saveEdit(r.id)} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">Save</button>
            <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 bg-white/[0.06] text-white/40 rounded-lg hover:bg-white/[0.1] transition-colors">Cancel</button>
          </div>
        )}
        <p className="text-xs text-white/20 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
      </div>
      <button
        onClick={() => deleteReminderNote(r.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── NotesTab ────────────────────────────────────────────────────────────────

const NOTE_COLORS: Record<StickyNoteType["color"], string> = {
  yellow:  "bg-yellow-400/15 border-yellow-400/30 text-yellow-100",
  blue:    "bg-blue-400/15   border-blue-400/30   text-blue-100",
  green:   "bg-green-400/15  border-green-400/30  text-green-100",
  pink:    "bg-pink-400/15   border-pink-400/30   text-pink-100",
  purple:  "bg-purple-400/15 border-purple-400/30 text-purple-100",
  white:   "bg-white/[0.06]  border-white/15       text-white/80",
};

const NOTE_CATEGORIES: { value: StickyNoteType["category"]; label: string; color: string }[] = [
  { value: "general",  label: "General",  color: "bg-white/10 text-white/50" },
  { value: "product",  label: "Product",  color: "bg-blue-500/20 text-blue-300" },
  { value: "personal", label: "Personal", color: "bg-green-500/20 text-green-300" },
  { value: "idea",     label: "Idea",     color: "bg-purple-500/20 text-purple-300" },
];

function NotesTab({ stickyNotes, addStickyNote, updateStickyNote, deleteStickyNote, clearAllStickyNotes }: {
  stickyNotes: StickyNoteType[];
  addStickyNote: (content: string, color?: StickyNoteType["color"], category?: StickyNoteType["category"]) => string;
  updateStickyNote: (id: string, patch: Partial<Pick<StickyNoteType, "content" | "color" | "category">>) => void;
  deleteStickyNote: (id: string) => void;
  clearAllStickyNotes: () => void;
}) {
  const [newColor, setNewColor] = useState<StickyNoteType["color"]>("yellow");
  const [newCategory, setNewCategory] = useState<StickyNoteType["category"]>("general");
  const [filterCat, setFilterCat] = useState<StickyNoteType["category"] | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const id = addStickyNote("", newColor, newCategory);
    setEditingId(id);
  };

  const filtered = filterCat === "all" ? stickyNotes : stickyNotes.filter((n) => n.category === filterCat);
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="p-4 md:p-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/25 rounded-xl text-sm font-medium text-yellow-300 transition-colors"
        >
          <Plus size={15} /> New Note
        </button>

        {/* Color picker */}
        <div className="flex items-center gap-1.5">
          {(Object.keys(NOTE_COLORS) as StickyNoteType["color"][]).map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className={cn("w-5 h-5 rounded-full border-2 transition-all", {
                yellow: "bg-yellow-400",
                blue:   "bg-blue-400",
                green:  "bg-green-400",
                pink:   "bg-pink-400",
                purple: "bg-purple-400",
                white:  "bg-white/60",
              }[c], newColor === c ? "border-white scale-125" : "border-transparent opacity-60")}
            />
          ))}
        </div>

        {/* Category picker */}
        <div className="flex gap-1.5">
          {NOTE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setNewCategory(cat.value)}
              className={cn("text-xs px-2.5 py-1 rounded-lg border transition-all", cat.color, newCategory === cat.value ? "border-white/30 opacity-100" : "border-transparent opacity-50 hover:opacity-80")}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {[{ value: "all", label: "All" }, ...NOTE_CATEGORIES].map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value as any)}
              className={cn("text-xs px-2.5 py-1 rounded-lg transition-all",
                filterCat === c.value ? "bg-white/15 text-white" : "bg-white/[0.04] text-white/40 hover:text-white/70"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        {stickyNotes.length > 0 && (
          <button onClick={() => { if (confirm("Clear all notes?")) clearAllStickyNotes(); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 border border-red-500/15 transition-colors">Clear All</button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <StickyNote size={36} className="text-white/15 mb-3" />
          <p className="text-white/30 text-sm">No notes yet</p>
          <p className="text-white/20 text-xs mt-1">Click "New Note" to add your first sticky note</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((note) => (
            <StickyCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onStartEdit={() => setEditingId(note.id)}
              onStopEdit={() => setEditingId(null)}
              onUpdate={(patch) => {
                updateStickyNote(note.id, patch);
                syncNote({ ...note, ...patch });
              }}
              onDelete={() => {
                deleteStickyNote(note.id);
                deleteNoteFile(note.id, note.category);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StickyCard({ note, isEditing, onStartEdit, onStopEdit, onUpdate, onDelete }: {
  note: StickyNoteType;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (patch: Partial<Pick<StickyNoteType, "content" | "color" | "category">>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(note.content);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when editing starts
  useState(() => { if (isEditing) setTimeout(() => textRef.current?.focus(), 50); });

  const save = () => {
    onUpdate({ content: draft });
    onStopEdit();
  };

  const catDef = NOTE_CATEGORIES.find((c) => c.value === note.category);
  const noteDate = new Date(note.createdAt);
  const autoName = `Note ${noteDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} #${note.id.slice(-4)}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border p-4 min-h-[160px] max-h-[220px] transition-all",
        NOTE_COLORS[note.color],
        isEditing && "ring-2 ring-white/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", catDef?.color ?? "bg-white/10 text-white/50")}>
            {catDef?.label ?? note.category}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all">
          <button onClick={isEditing ? save : onStartEdit} className="p-1 rounded-md hover:bg-white/20 text-white/50 hover:text-white transition-colors">
            <Edit3 size={11} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-md hover:bg-red-500/20 text-white/30 hover:text-red-300 transition-colors">
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Escape") { setDraft(note.content); onStopEdit(); } }}
          placeholder="Write your note..."
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-current placeholder:opacity-40 w-full"
        />
      ) : (
        <p
          className="flex-1 text-sm leading-relaxed overflow-hidden cursor-pointer whitespace-pre-wrap break-words"
          style={{ display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
          onClick={onStartEdit}
        >
          {note.content || <span className="opacity-40 italic">Empty — click to write</span>}
        </p>
      )}

      {/* Footer */}
      <p className="text-[10px] opacity-40 mt-2 shrink-0 truncate">{autoName}</p>
    </div>
  );
}
