/**
 * Folder Root — manages the linked root directory (File System Access API)
 * All data is organised into subfolders under the root:
 *
 *   root/
 *     documents/
 *       [uncategorized]/   ← md files with no category
 *       [category-name]/   ← md files per category
 *     notes/               ← sticky notes as .json
 *     reminders/           ← reminders.json
 *     quelist/             ← quelist.json
 *     highlights/          ← highlights.json
 *     merged/              ← merged md files
 *     trash/               ← trashed md files
 *     books/               ← reserved for future book exports
 */

type DirHandle = FileSystemDirectoryHandle;

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
const IDB_NAME = "flomcpmemory-fs";
const IDB_STORE = "handles";
const IDB_KEY = "root";

function _openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function _saveHandleIDB(handle: DirHandle): Promise<void> {
  try {
    const db = await _openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

async function _deleteHandleIDB(): Promise<void> {
  try {
    const db = await _openIDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

async function _loadHandleIDB(): Promise<DirHandle | null> {
  try {
    const db = await _openIDB();
    return new Promise<DirHandle | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as DirHandle) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ── Singleton handle stored in module scope (survives component re-renders) ──
let _rootHandle: DirHandle | null = null;
let _rootPath: string = "";

export function getRootHandle() { return _rootHandle; }
export function getRootPath() { return _rootPath; }

export async function linkRootFolder(): Promise<{ handle: DirHandle; path: string } | null> {
  if (!("showDirectoryPicker" in window)) {
    alert("Your browser does not support the File System Access API. Use Chrome or Edge.");
    return null;
  }
  try {
    // @ts-expect-error FSA API
    const handle: DirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    _rootHandle = handle;
    _rootPath = handle.name;
    await _saveHandleIDB(handle);
    return { handle, path: handle.name };
  } catch (e: any) {
    if (e?.name === "AbortError") return null;
    console.error("linkRootFolder:", e);
    return null;
  }
}

export function unlinkRootFolder() {
  _rootHandle = null;
  _rootPath = "";
  _deleteHandleIDB();
}

/**
 * Restore root folder from IndexedDB on app load.
 * Returns { path } if restored, null if not available or permission denied.
 */
export async function restoreRootFolder(): Promise<{ path: string } | null> {
  try {
    const handle = await _loadHandleIDB();
    if (!handle) return null;
    // Re-request permission
    // @ts-expect-error FSA API
    const perm = await handle.queryPermission({ mode: "readwrite" });
    if (perm === "granted") {
      _rootHandle = handle;
      _rootPath = handle.name;
      return { path: handle.name };
    }
    // Try to request permission (requires a user gesture — may fail silently)
    // @ts-expect-error FSA API
    const req = await handle.requestPermission({ mode: "readwrite" }).catch(() => "denied");
    if (req === "granted") {
      _rootHandle = handle;
      _rootPath = handle.name;
      return { path: handle.name };
    }
    return null;
  } catch {
    return null;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateDir(parent: DirHandle, name: string): Promise<DirHandle> {
  return parent.getDirectoryHandle(sanitizeDirName(name), { create: true });
}

async function writeTextFile(dir: DirHandle, filename: string, content: string): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function deleteFileIfExists(dir: DirHandle, filename: string): Promise<void> {
  try {
    await dir.removeEntry(filename);
  } catch (_) {/* ignore */}
}

function sanitizeDirName(n: string) {
  return n.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").trim() || "unnamed";
}

// ── Public write helpers called after each store mutation ────────────────────

/** Write a single MDFile into documents/[category|uncategorized]/ */
export async function syncFile(
  file: { id: string; name: string; content: string; categoryId: string | null; trashedAt: number | null },
  categoryName: string | null,
): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const docs = await getOrCreateDir(root, "documents");
  const dirName = categoryName ? categoryName : "uncategorized";
  const dir = await getOrCreateDir(docs, dirName);
  const safeName = file.name.replace(/[<>:"/\\|?*]/g, "-");
  await writeTextFile(dir, `${safeName}.md`, file.content);
}

/** Move a file into trash/ folder */
export async function syncTrashFile(
  file: { name: string; content: string },
): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const trashDir = await getOrCreateDir(root, "trash");
  const safeName = file.name.replace(/[<>:"/\\|?*]/g, "-");
  await writeTextFile(trashDir, `${safeName}.md`, file.content);
}

/** Remove a file from documents/ when permanently deleted */
export async function removeFileFromDocs(
  file: { name: string },
  categoryName: string | null,
): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  try {
    const docs = await getOrCreateDir(root, "documents");
    const dirName = categoryName ? categoryName : "uncategorized";
    const dir = await getOrCreateDir(docs, dirName);
    const safeName = file.name.replace(/[<>:"/\\|?*]/g, "-");
    await deleteFileIfExists(dir, `${safeName}.md`);
  } catch (_) {/* ignore */}
}

/** Write all reminders to reminders/reminders.json */
export async function syncReminders(reminders: object[]): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "reminders");
  await writeTextFile(dir, "reminders.json", JSON.stringify(reminders, null, 2));
}

/** Write all que items to quelist/quelist.json */
export async function syncQueList(items: object[]): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "quelist");
  await writeTextFile(dir, "quelist.json", JSON.stringify(items, null, 2));
}

/** Write all highlights to highlights/highlights.json */
export async function syncHighlights(highlights: object[]): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "highlights");
  await writeTextFile(dir, "highlights.json", JSON.stringify(highlights, null, 2));
}

/** Write a sticky note to notes/[category]/note-{id}.json */
export async function syncNote(note: { id: string; content: string; color: string; category: string; createdAt: number; updatedAt: number }): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const notesDir = await getOrCreateDir(root, "notes");
  const catDir = await getOrCreateDir(notesDir, note.category);
  await writeTextFile(catDir, `note-${note.id}.json`, JSON.stringify(note, null, 2));
}

/** Delete a sticky note file from notes/[category]/ */
export async function deleteNoteFile(id: string, category: string): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  try {
    const notesDir = await getOrCreateDir(root, "notes");
    const catDir = await getOrCreateDir(notesDir, category);
    await deleteFileIfExists(catDir, `note-${id}.json`);
  } catch (_) {/* ignore */}
}

/** Write all kanban/progress tasks to progress/tasks.json */
export async function syncKanban(tasks: object[]): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "progress");
  await writeTextFile(dir, "tasks.json", JSON.stringify(tasks, null, 2));
}

/** Write all prompts to prompts/prompts.json */
export async function syncPrompts(prompts: object[]): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "prompts");
  await writeTextFile(dir, "prompts.json", JSON.stringify(prompts, null, 2));
}

/** Write all skill files to skills/skills.json */
export async function syncSkills(skills: object[]): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "skills");
  await writeTextFile(dir, "skills.json", JSON.stringify(skills, null, 2));
}

/** Write a merged file to merged/ */
export async function syncMergedFile(name: string, content: string): Promise<void> {
  const root = _rootHandle;
  if (!root) return;
  const dir = await getOrCreateDir(root, "merged");
  const safeName = name.replace(/[<>:"/\\|?*]/g, "-");
  await writeTextFile(dir, `${safeName}.md`, content);
}

/** Open the root folder in OS file explorer via API route */
export async function openRootInExplorer(path: string): Promise<void> {
  try {
    await fetch("/api/open-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch (_) {/* ignore */}
}

/** Pull .md files from the linked folder's documents/ subfolders */
export async function pullFilesFromRoot(): Promise<{ name: string; content: string; category: string | null }[]> {
  if (!_rootHandle) return [];
  const results: { name: string; content: string; category: string | null }[] = [];

  try {
    // Get or skip documents directory
    let docsDir: FileSystemDirectoryHandle | null = null;
    try {
      docsDir = await _rootHandle.getDirectoryHandle("documents");
    } catch (_) { return results; }

    // Iterate entries in documents/
    for await (const [entryName, entry] of (docsDir as any)) {
      if (entry.kind === "directory") {
        // This is a category subfolder
        const category = entryName === "uncategorized" ? null : entryName;
        for await (const [fileName, fileEntry] of (entry as any)) {
          if (fileEntry.kind === "file" && fileName.endsWith(".md")) {
            try {
              const file: File = await fileEntry.getFile();
              const content = await file.text();
              results.push({ name: fileName.replace(/\.md$/, ""), content, category });
            } catch (_) { /* skip unreadable */ }
          }
        }
      } else if (entry.kind === "file" && entryName.endsWith(".md")) {
        // Root-level md file (no category)
        try {
          const file: File = await entry.getFile();
          const content = await file.text();
          results.push({ name: entryName.replace(/\.md$/, ""), content, category: null });
        } catch (_) { /* skip */ }
      }
    }
  } catch (_) { /* ignore */ }

  return results;
}
