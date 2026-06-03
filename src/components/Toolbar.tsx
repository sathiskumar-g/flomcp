"use client";

import { useState, useEffect } from "react";
import {
  FileText, Merge, Search, SplitSquareHorizontal,
  Eye, Code2, ChevronDown, DownloadCloud,
  Menu, X, LayoutDashboard, Highlighter, Trash2, BookOpen,
  FolderOpen, FolderCheck, ExternalLink, Zap, LogIn, LogOut, User,
  Terminal, BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type ViewMode, type AppView } from "@/lib/store";
import { saveAllFiles, readFileObject } from "@/lib/fs-api";
import { sanitizeName, cn } from "@/lib/utils";
import { linkRootFolder, unlinkRootFolder, getRootHandle, getRootPath, openRootInExplorer, pullFilesFromRoot, restoreRootFolder } from "@/lib/folder-root";
import { useAuth } from "@/lib/auth-context";
import { ProInterestModal } from "./ProInterestModal";

interface Props {
  onMergeOpen: () => void;
}

export default function Toolbar({ onMergeOpen }: Props) {
  const {
    files, activeFileId, viewMode, appView, highlights,
    categories, createCategory,
    setViewMode, setAppView, importFile,
    setSearchQuery, searchQuery, toggleSidebar, sidebarOpen,
  } = useStore();

  const { user, signOut } = useAuth();

  const activeFile = files.find((f) => f.id === activeFileId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rootLinked, setRootLinked] = useState(() => !!getRootHandle());
  const [rootPath, setRootPath] = useState(() => getRootPath());
  const [proOpen, setProOpen] = useState(false);

  // Restore root folder from IndexedDB on mount (survives page reload / re-login)
  useEffect(() => {
    restoreRootFolder().then((res) => {
      if (res) {
        setRootLinked(true);
        setRootPath(res.path);
      }
    });
  }, []);

  const handleLinkFolder = async () => {
    if (rootLinked) {
      unlinkRootFolder();
      setRootLinked(false);
      setRootPath("");
      toast("Folder unlinked");
      return;
    }
    const result = await linkRootFolder();
    if (result) {
      setRootLinked(true);
      setRootPath(result.path);
      toast.success(`Linked folder: ${result.path}`);
    }
  };

  const handleSaveAll = async () => {
    if (!files.length) { toast.error("No files to save"); return; }
    await saveAllFiles(files.map((f) => ({ name: f.name, content: f.content })));
    toast.success(`Saved ${files.length} files`);
  };

  const handleSyncFromFolder = async () => {
    const pulled = await pullFilesFromRoot();
    if (!pulled.length) { toast("No .md files found in linked folder's documents/"); return; }
    let added = 0;
    // Map each subfolder name → category id, finding an existing category
    // (case-insensitive) or creating a new one, so files land under the
    // category matching their folder rather than as uncategorized.
    const catIdByName = new Map<string, string>();
    for (const c of categories) catIdByName.set(c.name.toLowerCase(), c.id);
    const resolveCategoryId = (name: string | null): string | null => {
      if (!name) return null;
      const key = name.toLowerCase();
      const existing = catIdByName.get(key);
      if (existing) return existing;
      const id = createCategory(name);
      catIdByName.set(key, id);
      return id;
    };
    for (const f of pulled) {
      const exists = files.some((existing) => existing.name === f.name && existing.trashedAt == null);
      if (!exists) {
        importFile(f.name, f.content, resolveCategoryId(f.category));
        added++;
      }
    }
    toast.success(`Synced ${added} new file(s) (${pulled.length} found, ${pulled.length - added} already exist)`);
    if (added > 0) setAppView("editor");
  };

  const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "editor", icon: <Code2 size={16} />, label: "Edit" },
    { mode: "split", icon: <SplitSquareHorizontal size={16} />, label: "Split" },
    { mode: "preview", icon: <Eye size={16} />, label: "Preview" },
  ];

  const appViews: { view: AppView; icon: React.ReactNode; label: string; badge?: number }[] = [
    { view: "editor", icon: <FileText size={12} />, label: "Editor" },
    { view: "dashboard", icon: <LayoutDashboard size={12} />, label: "Dashboard" },
    { view: "highlights", icon: <Highlighter size={12} />, label: "Highlights", badge: highlights.length || undefined },
    { view: "prompts", icon: <Terminal size={12} />, label: "Prompts" },
    { view: "skills", icon: <BrainCircuit size={12} />, label: "Skills" },
    { view: "book", icon: <BookOpen size={12} />, label: "Book" },
    { view: "trash", icon: <Trash2 size={12} />, label: "Trash" },
  ];

  return (
    <header className="shrink-0 border-b border-white/[0.07] bg-[hsl(222_47%_5%)]">
      <div className="h-9 flex items-center gap-1 px-2 select-none">
        {/* Mobile hamburger */}
        <button onClick={toggleSidebar} className="md:hidden p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white mr-1">
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1.5 mr-2">
          <FileText size={16} className="text-blue-400" />
          <span className="text-sm font-semibold tracking-tight text-white">flomcpmemory</span>
        </div>

        {/* App view nav — desktop */}
        <div className="hidden md:flex items-center gap-0.5 bg-white/[0.04] rounded-md p-0.5 border border-white/[0.07] mr-2">
          {appViews.map(({ view, icon, label, badge }) => (
            <button
              key={view}
              onClick={() => setAppView(view)}
              className={cn(
                "relative flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all",
                appView === view ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {icon} {label}
              {badge ? <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-yellow-500 text-black text-[9px] font-bold rounded-full">{badge > 9 ? "9+" : badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="hidden md:block w-px h-5 bg-white/10 mx-1" />

        {/* Actions — desktop */}
        <div className="hidden md:flex items-center gap-0.5">
          <button onClick={handleSaveAll} className={btn("text-white/70 hover:text-white hover:bg-white/8")}><DownloadCloud size={15} /><span className="hidden lg:block">Save All</span></button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button
            onClick={handleLinkFolder}
            title={rootLinked ? `Unlink folder: ${rootPath}` : "Link root folder (S:\\MD)"}
            className={btn(rootLinked ? "text-emerald-400 hover:bg-emerald-500/15" : "text-white/40 hover:text-white/70 hover:bg-white/8")}
          >
            {rootLinked ? <FolderCheck size={14} /> : <FolderOpen size={14} />}
            <span className="hidden lg:block">{rootLinked ? rootPath : "Link Folder"}</span>
          </button>
          {rootLinked && (
            <button
              onClick={() => openRootInExplorer(rootPath)}
              title="Open folder in Explorer"
              className={btn("text-white/40 hover:text-white/70 hover:bg-white/8")}
            >
              <ExternalLink size={14} />
            </button>
          )}
          {rootLinked && (
            <button
              onClick={handleSyncFromFolder}
              title="Pull .md files from linked folder"
              className={btn("text-cyan-400 hover:bg-cyan-500/15")}
            >
              <DownloadCloud size={14} />
              <span className="hidden lg:block">Sync ↓</span>
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className={cn("flex items-center gap-1 rounded-md transition-all overflow-hidden", searchOpen ? "bg-white/[0.06] border border-white/10 pl-2 pr-1 py-0.5 w-36 md:w-48" : "w-7")}>
          {searchOpen && (
            <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
              placeholder="Search…"
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 outline-none border-none w-full"
            />
          )}
          <button onClick={() => { setSearchOpen((s) => !s); if (searchOpen) setSearchQuery(""); }} className="text-white/50 hover:text-white p-1 rounded">
            <Search size={14} />
          </button>
        </div>

        {appView === "editor" && <div className="hidden md:block w-px h-5 bg-white/10 mx-1" />}

        {/* View mode — desktop (only shown for editor tab) */}
        {appView === "editor" && (
          <div className="hidden md:flex items-center gap-0.5 bg-white/[0.04] rounded-md p-0.5 border border-white/[0.07]">
            {views.map(({ mode, icon, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-all", viewMode === mode ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70")}
              >
                {icon}<span className="hidden lg:block">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mobile more button */}
        <button onClick={() => setMobileMenuOpen((s) => !s)} className="md:hidden p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white ml-1">
          <ChevronDown size={14} className={cn("transition-transform", mobileMenuOpen && "rotate-180")} />
        </button>

        {/* Pro Interest + Auth — desktop */}
        <div className="hidden md:flex items-center gap-1 ml-1">
          <button
            onClick={() => setProOpen(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/25 text-blue-300 hover:text-blue-200 hover:border-blue-400/40 transition-all font-medium"
            title="Interested in Pro features?"
          >
            <Zap size={12} />
            <span className="hidden lg:block">Pro</span>
          </button>
          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden xl:block text-xs text-white/40 max-w-[100px] truncate px-1">{user.email}</span>
              <button onClick={() => signOut()} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all" title="Sign out">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <a href="/signin" className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all border border-white/[0.07]">
              <LogIn size={13} />
              <span className="hidden lg:block">Sign in</span>
            </a>
          )}
        </div>
      </div>

      {proOpen && <ProInterestModal onClose={() => setProOpen(false)} />}

      {/* Mobile expanded */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.07] px-3 pb-3 pt-2 space-y-2">
          <div className="flex gap-1.5">
            {appViews.map(({ view, icon, label, badge }) => (
              <button key={view} onClick={() => { setAppView(view); setMobileMenuOpen(false); }}
                className={cn("relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                  appView === view ? "bg-white/15 text-white" : "bg-white/[0.04] text-white/50 border border-white/[0.07]")}
              >
                {icon} {label}
                {badge ? <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-yellow-500 text-black text-[9px] font-bold rounded-full">{badge > 9 ? "9+" : badge}</span> : null}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { icon: <DownloadCloud size={13} />, label: "Save All", color: "text-white/60", fn: () => { handleSaveAll(); setMobileMenuOpen(false); } },
              { icon: <Merge size={13} />, label: "Merge", color: "text-orange-400", fn: () => { onMergeOpen(); setMobileMenuOpen(false); } },
            ].map(({ icon, label, color, fn }) => (
              <button key={label} onClick={fn} className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.07]", color)}>{icon} {label}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {[views[0], views[2]].map(({ mode, icon, label }) => (
              <button key={mode} onClick={() => { setViewMode(mode); setMobileMenuOpen(false); }}
                className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-all",
                  viewMode === mode ? "bg-white/15 text-white" : "bg-white/[0.04] text-white/40 border border-white/[0.07]")}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function btn(extra = "") {
  return cn("flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md transition-all font-medium whitespace-nowrap", extra);
}
