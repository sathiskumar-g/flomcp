/** Save a string as a .md file to disk. Uses File System Access API with fallback. */
export async function saveFileToDisk(name: string, content: string): Promise<void> {
  const safeName = name.endsWith(".md") ? name : `${name}.md`;

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      // @ts-expect-error – File System Access API not in all TS libs
      const handle = await window.showSaveFilePicker({
        suggestedName: safeName,
        types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return; // user cancelled
      // fall through to download
    }
  }

  // Fallback: anchor download
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export multiple files as individual downloads (ZIP not used to keep deps minimal) */
export async function saveAllFiles(files: { name: string; content: string }[]): Promise<void> {
  for (const f of files) {
    await saveFileToDisk(f.name, f.content);
    await new Promise((r) => setTimeout(r, 120)); // small delay so browser doesn't block
  }
}

/** Read a File object into text */
export async function readFileObject(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string ?? "");
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}
