"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/lib/store";
import Toolbar from "@/components/Toolbar";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import MergeModal from "@/components/MergeModal";
import Dashboard from "@/components/Dashboard";
import { HighlightsPanel } from "@/components/Highlights";
import Trash from "@/components/Trash";
import BookBuilder from "@/components/BookBuilder";
import PromptsView from "@/components/PromptsView";
import SkillsView from "@/components/SkillsView";
import { cn } from "@/lib/utils";
import { readFileObject } from "@/lib/fs-api";
import { FileText } from "lucide-react";
import { useFolderSync } from "@/lib/use-folder-sync";
import { toast } from "sonner";

export default function App() {
  const {
    viewMode, sidebarWidth, setSidebarWidth, createFile, files, activeFileId,
    appView, sidebarOpen, setSidebarOpen, setAppView,
  } = useStore();

  const [mergeOpen, setMergeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleImport = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.txt,.markdown";
    input.multiple = true;
    input.onchange = async () => {
      const fileList = Array.from(input.files ?? []);
      for (const f of fileList) {
        const content = await readFileObject(f);
        const name = f.name.replace(/\.(md|txt|markdown)$/i, "");
        createFile(name, null, content);
      }
      if (fileList.length) toast.success(`Imported ${fileList.length} file(s)`);
      setAppView("editor");
    };
    input.click();
  }, [createFile, setAppView]);

  // Auto-sync everything to root folder whenever store data changes
  useFolderSync();

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onSelectToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  // Desktop sidebar resize
  const startResize = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      setSidebarWidth(startWidth.current + delta);
    };
    const onUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setSidebarWidth]);

  // Global drag-drop
  const handleGlobalDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.match(/\.(md|txt|markdown)$/i)
    );
    for (const file of droppedFiles) {
      const content = await readFileObject(file);
      const name = file.name.replace(/\.(md|txt|markdown)$/i, "");
      createFile(name, null, content);
    }
  }, [createFile]);

  const activeFile = files.find((f) => f.id === activeFileId);

  const effectiveViewMode = viewMode;

  return (
    <div
      className="flex flex-col h-dvh overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGlobalDrop}
    >
      <Toolbar onMergeOpen={() => setMergeOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — only shown in editor view */}
        {appView === "editor" && (
        <div
          className={cn(
            "flex flex-col overflow-hidden shrink-0 transition-transform duration-200",
            "fixed md:relative inset-y-0 left-0 z-40 md:z-auto",
            "md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "w-72 md:w-auto"
          )}
          style={{ width: undefined }}
        >
          <div className="h-full md:hidden" style={{ width: 288 }}>
            <Sidebar selectedIds={selectedIds} onSelectToggle={onSelectToggle} onClose={() => setSidebarOpen(false)} onMergeOpen={() => setMergeOpen(true)} onImport={handleImport} />
          </div>
          <div className="hidden md:block h-full" style={{ width: sidebarWidth }}>
            <Sidebar selectedIds={selectedIds} onSelectToggle={onSelectToggle} onClose={() => setSidebarOpen(false)} onMergeOpen={() => setMergeOpen(true)} onImport={handleImport} />
          </div>
        </div>
        )}

        {/* Resize handle — desktop only, editor only */}
        {appView === "editor" && (
        <div
          onMouseDown={startResize}
          className="hidden md:block w-1 cursor-col-resize hover:bg-blue-500/40 bg-transparent transition-colors shrink-0"
        />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[hsl(222_47%_5.5%)] min-w-0">
          {appView === "dashboard" && <Dashboard />}
          {appView === "highlights" && <HighlightsPanel />}
          {appView === "trash" && <Trash />}
          {appView === "book" && <BookBuilder />}
          {appView === "prompts" && <PromptsView />}
          {appView === "skills" && <SkillsView />}

          {appView === "editor" && (
            <>
              {activeFile && (
                <div className="flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/[0.06] bg-[hsl(222_47%_5%)] shrink-0">
                  <FileText size={13} className="text-blue-400 shrink-0" />
                  <span className="text-sm font-medium text-white/80 truncate">{activeFile.name}</span>
                  <span className="text-xs text-white/25">.md</span>
                  {selectedIds.size > 0 && (
                    <span className="ml-auto flex items-center gap-2 text-xs text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      {selectedIds.size} selected
                      <button onClick={() => setMergeOpen(true)} className="text-orange-400 hover:text-orange-300 font-medium">Merge</button>
                      <button onClick={() => setSelectedIds(new Set())} className="text-white/30 hover:text-white/60">✕</button>
                    </span>
                  )}
                </div>
              )}

              <div className={cn("flex-1 overflow-hidden", effectiveViewMode === "split" && "flex")}>
                {(effectiveViewMode === "editor" || effectiveViewMode === "split") && (
                  <div className={cn("overflow-hidden flex flex-col", effectiveViewMode === "split" ? "w-1/2 border-r border-white/[0.06]" : "w-full h-full")}>
                    <Editor />
                  </div>
                )}
                {(effectiveViewMode === "preview" || effectiveViewMode === "split") && (
                  <div className={cn("overflow-hidden flex flex-col", effectiveViewMode === "split" ? "w-1/2" : "w-full h-full")}>
                    <Preview />
                  </div>
                )}
              </div>

              {!activeFile && (
                <div className="flex-1 flex flex-col items-center justify-center text-white/20 select-none">
                  <FileText size={40} className="mb-3 text-white/10" />
                  <p className="text-sm">Open or create a file</p>
                  <p className="text-xs mt-1">Drag & drop .md files anywhere</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mergeOpen && (
        <MergeModal
          onClose={() => setMergeOpen(false)}
          initialSelected={selectedIds.size >= 2 ? selectedIds : new Set()}
        />
      )}
    </div>
  );
}
