import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "split" | "editor" | "preview";
export type AppView = "editor" | "dashboard" | "highlights" | "trash" | "book" | "prompts" | "skills";

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  format: "md" | "txt";
  category: string; // e.g. "writing" | "coding" | "planning" | "general"
  createdAt: number;
  updatedAt: number;
}

export interface SkillFile {
  id: string;
  title: string;
  content: string;
  tags: string[];
  topic: string; // e.g. "TypeScript" | "React" | "Python" | "general"
  level: "beginner" | "intermediate" | "advanced";
  createdAt: number;
  updatedAt: number;
}

export interface QueItem {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export interface ReminderNote {
  id: string;
  text: string;
  done: boolean;
  enabled: boolean;
  createdAt: number;
  dueAt: number | null;
}

export interface MDFile {
  id: string;
  name: string;
  content: string;
  categoryId: string | null;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  pinned: boolean;
  trashedAt: number | null;
  watched: boolean;
}

export interface Category {
  id: string;
  name: string;
  expanded: boolean;
  order: number;
}

export type HighlightColor = "yellow" | "blue" | "green" | "pink";

export interface Highlight {
  id: string;
  fileId: string;
  fileName: string;
  text: string;
  note: string;
  color: HighlightColor;
  createdAt: number;
}

export interface StickyNote {
  id: string;
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple" | "white";
  category: "product" | "personal" | "idea" | "general";
  createdAt: number;
  updatedAt: number;
}

export type KanbanColumn = "todo" | "in-progress" | "blocked" | "done";

export interface KanbanTask {
  id: string;
  title: string;
  content: string;
  column: KanbanColumn;
  noteId?: string; // linked sticky note id
  createdAt: number;
  updatedAt: number;
}

export interface Badge {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

export const ALL_BADGES: Record<string, Badge> = {
  first_note:  { id: "first_note",  label: "First Note",    desc: "Created your first file",   icon: "📝" },
  five_files:  { id: "five_files",  label: "Collector",     desc: "Have 5 files",              icon: "📚" },
  ten_files:   { id: "ten_files",   label: "Librarian",     desc: "Have 10 files",             icon: "🏛️" },
  wordsmith:   { id: "wordsmith",   label: "Wordsmith",     desc: "Write 1,000 total words",   icon: "✍️" },
  prolific:    { id: "prolific",    label: "Prolific",      desc: "Write 5,000 total words",   icon: "📖" },
  archivist:   { id: "archivist",   label: "Archivist",     desc: "Create 3 categories",       icon: "📁" },
  highlighter: { id: "highlighter", label: "Highlighter",   desc: "Add 5 highlights",          icon: "🖊️" },
  streak_3:    { id: "streak_3",    label: "On a Roll",     desc: "3-day writing streak",      icon: "🔥" },
  streak_7:    { id: "streak_7",    label: "Week Warrior",  desc: "7-day writing streak",      icon: "⚡" },
};

export const XP_THRESHOLDS = [0, 100, 300, 600, 1100, 2000, 3500, 5500, 8500, 13000];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 10);
}

export function xpToNextLevel(xp: number): { current: number; needed: number; level: number } {
  const level = getLevel(xp);
  const base = XP_THRESHOLDS[level - 1] ?? 0;
  const next = XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 5000;
  return { current: xp - base, needed: next - base, level };
}

interface Store {
  files: MDFile[];
  categories: Category[];
  highlights: Highlight[];
  queItems: QueItem[];
  reminderNotes: ReminderNote[];
  stickyNotes: StickyNote[];
  kanbanTasks: KanbanTask[];
  prompts: PromptItem[];
  skills: SkillFile[];
  activeFileId: string | null;
  viewMode: ViewMode;
  appView: AppView;
  sidebarOpen: boolean;
  sidebarWidth: number;
  searchQuery: string;
  // Save indicator
  lastSavedAt: number;

  // File actions
  createFile: (name: string, categoryId?: string | null, content?: string) => string;
  updateFile: (id: string, patch: Partial<Pick<MDFile, "name" | "content" | "categoryId">>) => void;
  deleteFile: (id: string) => void;
  trashFile: (id: string) => void;
  restoreFile: (id: string) => void;
  permanentDeleteFile: (id: string) => void;
  duplicateFile: (id: string) => void;
  mergeFiles: (ids: string[], targetName: string, targetCategoryId: string | null) => void;
  importFile: (name: string, content: string, categoryId?: string | null) => void;
  moveFile: (fileId: string, categoryId: string | null) => void;
  togglePinFile: (id: string) => void;
  toggleWatchFile: (id: string) => void;
  addFileTag: (id: string, tag: string) => void;
  removeFileTag: (id: string, tag: string) => void;

  // Category actions
  createCategory: (name: string) => string;
  updateCategory: (id: string, patch: Partial<Pick<Category, "name" | "expanded">>) => void;
  deleteCategory: (id: string) => void;
  toggleCategory: (id: string) => void;
  reorderCategory: (id: string, direction: "up" | "down") => void;

  // Highlight actions
  addHighlight: (fileId: string, fileName: string, text: string, color?: HighlightColor, note?: string) => void;
  deleteHighlight: (id: string) => void;
  updateHighlightNote: (id: string, note: string) => void;

  // Que List actions
  addQueItem: (title: string, url: string) => void;
  deleteQueItem: (id: string) => void;
  updateQueItem: (id: string, title: string, url: string) => void;

  // Reminder actions
  addReminderNote: (text: string, dueAt?: number | null) => void;
  deleteReminderNote: (id: string) => void;
  updateReminderNote: (id: string, text: string) => void;
  toggleReminderDone: (id: string) => void;
  toggleReminderEnabled: (id: string) => void;
  setReminderDue: (id: string, dueAt: number | null) => void;
  clearAllReminders: () => void;

  // Que List actions (extra)
  clearAllQueItems: () => void;

  // Highlight actions (extra)
  clearAllHighlights: () => void;

  // Sticky Note bulk clear
  clearAllStickyNotes: () => void;

  // Sticky Note actions
  addStickyNote: (content: string, color?: StickyNote["color"], category?: StickyNote["category"]) => string;
  updateStickyNote: (id: string, patch: Partial<Pick<StickyNote, "content" | "color" | "category">>) => void;
  deleteStickyNote: (id: string) => void;

  // Kanban actions
  addKanbanTask: (title: string, content?: string, column?: KanbanColumn, noteId?: string) => string;
  updateKanbanTask: (id: string, patch: Partial<Pick<KanbanTask, "title" | "content" | "column">>) => void;
  moveKanbanTask: (id: string, column: KanbanColumn) => void;
  deleteKanbanTask: (id: string) => void;

  // Prompt actions
  addPrompt: (title: string, content: string, tags?: string[], category?: string, format?: PromptItem["format"]) => string;
  updatePrompt: (id: string, patch: Partial<Pick<PromptItem, "title" | "content" | "tags" | "category" | "format">>) => void;
  deletePrompt: (id: string) => void;

  // Skill actions
  addSkill: (title: string, content: string, tags?: string[], topic?: string, level?: SkillFile["level"]) => string;
  updateSkill: (id: string, patch: Partial<Pick<SkillFile, "title" | "content" | "tags" | "topic" | "level">>) => void;
  deleteSkill: (id: string) => void;

  // UI
  setActiveFile: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setAppView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  setSearchQuery: (q: string) => void;
  touchSaved: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_CONTENT = `# Welcome to flomcpmemory

A fast, offline Markdown workspace that lives in your browser.

## Quick start

- **New file** — click \`+ New File\` in the sidebar
- **Categories** — click \`+ Category\` to group files into accordion folders
- **Drag & drop** — drag \`.md\` files from your desktop to import
- **Merge** — select files with checkboxes, then click **Merge**
- **Save to disk** — toolbar → **Download**

## Formatting cheatsheet

| Syntax | Result |
|--------|--------|
| \`**bold**\` | **bold** |
| \`_italic_\` | _italic_ |
| \`\`\`code\`\`\` | \`code\` |
| \`## Heading\` | Heading |
| \`- item\` | bullet list |
| \`> quote\` | blockquote |

## Code block

\`\`\`typescript
function hello(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Start writing — your work saves automatically to browser storage.
`;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      files: [
        {
          id: "welcome",
          name: "Welcome",
          content: DEFAULT_CONTENT,
          categoryId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
          pinned: false,
          trashedAt: null,
          watched: false,
        },
      ],
      categories: [],
      highlights: [],
      queItems: [],
      reminderNotes: [],
      stickyNotes: [],
      kanbanTasks: [],
      prompts: [],
      skills: [],
      activeFileId: "welcome",
      viewMode: "split",
      appView: "editor",
      sidebarOpen: false,
      sidebarWidth: 260,
      searchQuery: "",
      lastSavedAt: 0,

      createFile: (name, categoryId = null, content = "") => {
        const id = uid();
        set((s) => ({
          files: [...s.files, { id, name, content, categoryId: categoryId ?? null, createdAt: Date.now(), updatedAt: Date.now(), tags: [], pinned: false, trashedAt: null, watched: false }],
          activeFileId: id,
        }));
        return id;
      },

      updateFile: (id, patch) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f
          ),
          lastSavedAt: Date.now(),
        })),

      deleteFile: (id) =>
        set((s) => {
          const remaining = s.files.filter((f) => f.id !== id);
          const active = remaining.filter((f) => f.trashedAt == null);
          const next =
            s.activeFileId === id
              ? active.length > 0 ? active[active.length - 1].id : null
              : s.activeFileId;
          return { files: remaining, activeFileId: next };
        }),

      trashFile: (id) =>
        set((s) => {
          const active = s.files.filter((f) => f.trashedAt == null && f.id !== id);
          const next = s.activeFileId === id
            ? active.length > 0 ? active[active.length - 1].id : null
            : s.activeFileId;
          return {
            files: s.files.map((f) => f.id === id ? { ...f, trashedAt: Date.now() } : f),
            activeFileId: next,
          };
        }),

      restoreFile: (id) =>
        set((s) => ({ files: s.files.map((f) => f.id === id ? { ...f, trashedAt: null } : f) })),

      permanentDeleteFile: (id) =>
        set((s) => {
          const remaining = s.files.filter((f) => f.id !== id);
          const active = remaining.filter((f) => f.trashedAt == null);
          const next = s.activeFileId === id
            ? active.length > 0 ? active[active.length - 1].id : null
            : s.activeFileId;
          return { files: remaining, activeFileId: next };
        }),

      duplicateFile: (id) => {
        const f = get().files.find((x) => x.id === id);
        if (!f) return;
        const newId = uid();
        set((s) => ({
          files: [
            ...s.files,
            { ...f, id: newId, name: `${f.name} (copy)`, createdAt: Date.now(), updatedAt: Date.now(), trashedAt: null },
          ],
          activeFileId: newId,
        }));
      },

      togglePinFile: (id) =>
        set((s) => ({ files: s.files.map((f) => f.id === id ? { ...f, pinned: !f.pinned } : f) })),

      toggleWatchFile: (id) =>
        set((s) => ({ files: s.files.map((f) => f.id === id ? { ...f, watched: !f.watched } : f) })),

      addFileTag: (id, tag) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id && !f.tags.includes(tag) ? { ...f, tags: [...f.tags, tag] } : f
          ),
        })),

      removeFileTag: (id, tag) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, tags: f.tags.filter((t) => t !== tag) } : f
          ),
        })),

      recordWriting: (_wordsDelta: number) => {},

      mergeFiles: (ids, targetName, targetCategoryId) => {
        const { files } = get();
        const toMerge = ids
          .map((id) => files.find((f) => f.id === id))
          .filter(Boolean) as MDFile[];
        const merged = toMerge
          .map((f) => `# ${f.name}\n\n${f.content}`)
          .join("\n\n---\n\n");
        const newId = uid();
        set((s) => ({
          files: [
            ...s.files,
            {
              id: newId,
              name: targetName,
              content: merged,
              categoryId: targetCategoryId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              tags: [],
              pinned: false,
              trashedAt: null,
              watched: false,
            } as MDFile,
          ],
          activeFileId: newId,
        }));
      },

      importFile: (name, content, categoryId = null) => {
        const id = uid();
        set((s) => ({
          files: [...s.files, { id, name, content, categoryId: categoryId ?? null, createdAt: Date.now(), updatedAt: Date.now(), tags: [], pinned: false, trashedAt: null, watched: false }],
          activeFileId: id,
        }));
        return id;
      },

      moveFile: (fileId, categoryId) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === fileId ? { ...f, categoryId, updatedAt: Date.now() } : f
          ),
        })),

      createCategory: (name) => {
        const id = uid();
        set((s) => ({
          categories: [...s.categories, { id, name, expanded: true, order: s.categories.length }],
        }));
        return id;
      },

      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          files: s.files.map((f) =>
            f.categoryId === id ? { ...f, categoryId: null } : f
          ),
        })),

      toggleCategory: (id) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, expanded: !c.expanded } : c
          ),
        })),

      reorderCategory: (id, direction) =>
        set((s) => {
          const sorted = [...s.categories].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((c) => c.id === id);
          const swap = direction === "up" ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= sorted.length) return {};
          const a = sorted[idx].order;
          sorted[idx] = { ...sorted[idx], order: sorted[swap].order };
          sorted[swap] = { ...sorted[swap], order: a };
          return { categories: sorted };
        }),

      addStickyNote: (content = "", color = "yellow", category = "general") => {
        const id = uid();
        set((s) => ({ stickyNotes: [...s.stickyNotes, { id, content, color, category, createdAt: Date.now(), updatedAt: Date.now() }] }));
        return id;
      },
      updateStickyNote: (id, patch) =>
        set((s) => ({ stickyNotes: s.stickyNotes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n) })),
      deleteStickyNote: (id) =>
        set((s) => ({ stickyNotes: s.stickyNotes.filter((n) => n.id !== id) })),

      setActiveFile: (id) => set({ activeFileId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setAppView: (view) => set({ appView: view }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(480, w)) }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      touchSaved: () => set({ lastSavedAt: Date.now() }),

      addHighlight: (fileId, fileName, text, color = "yellow", note = "") => {
        const id = uid();
        set((s) => ({
          highlights: [...s.highlights, { id, fileId, fileName, text: text.slice(0, 2000), note, color, createdAt: Date.now() }],
        }));
      },

      deleteHighlight: (id) =>
        set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),

      updateHighlightNote: (id, note) =>
        set((s) => ({
          highlights: s.highlights.map((h) => (h.id === id ? { ...h, note } : h)),
        })),

      addQueItem: (title, url) =>
        set((s) => ({ queItems: [...s.queItems, { id: uid(), title: title.trim(), url: url.trim(), createdAt: Date.now() }] })),
      deleteQueItem: (id) =>
        set((s) => ({ queItems: s.queItems.filter((q) => q.id !== id) })),
      updateQueItem: (id, title, url) =>
        set((s) => ({ queItems: s.queItems.map((q) => q.id === id ? { ...q, title, url } : q) })),

      addReminderNote: (text, dueAt = null) =>
        set((s) => ({ reminderNotes: [...s.reminderNotes, { id: uid(), text: text.trim(), done: false, createdAt: Date.now(), dueAt: dueAt ?? null, enabled: true }] })),
      deleteReminderNote: (id) =>
        set((s) => ({ reminderNotes: s.reminderNotes.filter((r) => r.id !== id) })),
      updateReminderNote: (id, text) =>
        set((s) => ({ reminderNotes: s.reminderNotes.map((r) => r.id === id ? { ...r, text } : r) })),
      toggleReminderDone: (id) =>
        set((s) => ({ reminderNotes: s.reminderNotes.map((r) => r.id === id ? { ...r, done: !r.done } : r) })),
      toggleReminderEnabled: (id) =>
        set((s) => ({ reminderNotes: s.reminderNotes.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r) })),
      setReminderDue: (id, dueAt) =>
        set((s) => ({ reminderNotes: s.reminderNotes.map((r) => r.id === id ? { ...r, dueAt } : r) })),
      clearAllReminders: () => set({ reminderNotes: [] }),
      clearAllQueItems: () => set({ queItems: [] }),
      clearAllHighlights: () => set({ highlights: [] }),
      clearAllStickyNotes: () => set({ stickyNotes: [] }),

      addKanbanTask: (title, content = "", column = "todo", noteId) => {
        const id = uid();
        set((s) => ({ kanbanTasks: [...s.kanbanTasks, { id, title, content, column, noteId, createdAt: Date.now(), updatedAt: Date.now() }] }));
        return id;
      },
      updateKanbanTask: (id, patch) =>
        set((s) => ({ kanbanTasks: s.kanbanTasks.map((t) => t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t) })),
      moveKanbanTask: (id, column) =>
        set((s) => ({ kanbanTasks: s.kanbanTasks.map((t) => t.id === id ? { ...t, column, updatedAt: Date.now() } : t) })),
      deleteKanbanTask: (id) =>
        set((s) => ({ kanbanTasks: s.kanbanTasks.filter((t) => t.id !== id) })),

      addPrompt: (title, content, tags = [], category = "general", format = "md") => {
        const id = uid();
        set((s) => ({ prompts: [...s.prompts, { id, title: title.trim(), content, tags, category, format, createdAt: Date.now(), updatedAt: Date.now() }] }));
        return id;
      },
      updatePrompt: (id, patch) =>
        set((s) => ({ prompts: s.prompts.map((p) => p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p) })),
      deletePrompt: (id) =>
        set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),

      addSkill: (title, content, tags = [], topic = "general", level = "intermediate") => {
        const id = uid();
        set((s) => ({ skills: [...s.skills, { id, title: title.trim(), content, tags, topic, level, createdAt: Date.now(), updatedAt: Date.now() }] }));
        return id;
      },
      updateSkill: (id, patch) =>
        set((s) => ({ skills: s.skills.map((sk) => sk.id === id ? { ...sk, ...patch, updatedAt: Date.now() } : sk) })),
      deleteSkill: (id) =>
        set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) })),
    }),
    {
      name: "mdvault-storage",
      version: 8,
      migrate: (state: any, version: number) => {
        if (version < 3) {
          if (state.files) state.files = state.files.map((f: any) => ({ tags: [], pinned: false, trashedAt: null, ...f } as MDFile));
          state.writingXP = 0; state.writingStreak = 0; state.lastWrittenDate = ""; state.earnedBadges = []; state.lastSavedAt = 0;
        }
        if (version < 4) { state.stickyNotes = []; }
        if (version < 5) {
          if (state.reminderNotes) state.reminderNotes = state.reminderNotes.map((r: any) => ({ dueAt: null, ...r }));
        }
        if (version < 6) {
          state.kanbanTasks = [];
          if (state.reminderNotes) state.reminderNotes = state.reminderNotes.map((r: any) => ({ enabled: true, ...r }));
        }
        if (version < 7) {
          state.prompts = [];
          state.skills = [];
        }
        if (version < 8) {
          if (state.files) state.files = state.files.map((f: any) => ({ watched: false, ...f }));
          // strip gamification keys that are no longer used
          delete state.writingXP;
          delete state.writingStreak;
          delete state.lastWrittenDate;
          delete state.earnedBadges;
        }
        return state;
      },
    }
  )
);
