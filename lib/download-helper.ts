/**
 * download-helper.ts
 *
 * Task 2.4.2: Implement download functionality
 * - Creates a proper ZIP file using JSZip
 * - Preserves folder structure (src/index.ts goes inside src/)
 * - Includes all generated files
 */

import JSZip from "jszip";

export interface DownloadableFiles {
  generated_code?: string | null;
  package_json?: string | null;
  readme?: string | null;
  tsconfig?: string | null;
  env_example?: string | null;
  name: string;
}

/**
 * Build a ZIP blob containing all MCP server files in correct folder structure:
 *
 *   my-mcp-server/
 *     src/
 *       index.ts
 *     package.json
 *     tsconfig.json
 *     .env.example
 *     README.md
 */
export async function buildMCPZip(files: DownloadableFiles): Promise<Blob> {
  const zip = new JSZip();
  // Root folder name derived from the server name
  const rootFolder = files.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const root = zip.folder(rootFolder)!;

  if (files.generated_code) {
    const src = root.folder("src")!;
    src.file("index.ts", files.generated_code);
  }

  if (files.package_json) {
    root.file("package.json", files.package_json);
  }

  if (files.tsconfig) {
    root.file("tsconfig.json", files.tsconfig);
  }

  if (files.env_example) {
    root.file(".env.example", files.env_example);
  }

  if (files.readme) {
    root.file("README.md", files.readme);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/**
 * Trigger a browser download of a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * One-call helper: build + trigger ZIP download for an MCP server.
 */
export async function downloadMCPServerAsZip(files: DownloadableFiles): Promise<void> {
  const blob = await buildMCPZip(files);
  const filename = `${files.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-mcp-server.zip`;
  triggerBlobDownload(blob, filename);
}
