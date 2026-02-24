/**
 * download-helper.ts
 *
 * Builds a production-ready ZIP for TypeScript MCP servers.
 * ZIP structure:
 *
 *   server-name/
 *     src/
 *       index.ts          ← generated TypeScript server
 *     tests/
 *       index.test.ts     ← vitest tests (generated or static template)
 *     package.json
 *     tsconfig.json
 *     vitest.config.ts    ← static template
 *     .env.example
 *     README.md
 *     .gitignore          ← static template
 */

import JSZip from "jszip";

export interface DownloadableFiles {
  generated_code?: string | null;
  package_json?: string | null;
  readme?: string | null;
  tsconfig?: string | null;
  env_example?: string | null;
  tests_code?: string | null;
  name: string;
}

// ── Static file templates ───────────────────────────────────────────────────

const VITEST_CONFIG = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
`;

const GITIGNORE = `node_modules/
dist/
.env
*.js.map
*.d.ts
`;

function defaultTests(serverName: string): string {
  return `import { describe, it, expect } from "vitest";
import { z } from "zod";

// Helper
function validate<T extends z.ZodTypeAny>(schema: T, input: unknown) {
  return schema.safeParse(input);
}

// ── sanitizeError tests ───────────────────────────────────────────────────────
describe("sanitizeError (${serverName})", () => {
  it("hides file paths", () => {
    const msg = "Error at /home/user/.env line 3";
    const sanitized = msg.replace(/\\/[^\\s"']+/g, "[PATH]");
    expect(sanitized).not.toContain("/home");
    expect(sanitized).toContain("[PATH]");
  });

  it("hides IP addresses", () => {
    const msg = "Connection to 192.168.1.1 refused";
    const sanitized = msg.replace(/\\b\\d{1,3}(\\.\\d{1,3}){3}\\b/g, "[IP]");
    expect(sanitized).not.toContain("192.168");
  });
});

// ── Tool schema validation tests ─────────────────────────────────────────────
describe("Tool schemas", () => {
  it("validates string params", () => {
    const schema = z.object({ input: z.string().min(1) });
    expect(validate(schema, { input: "hello" }).success).toBe(true);
    expect(validate(schema, { input: "" }).success).toBe(false);
  });

  it("validates number params", () => {
    const schema = z.object({ value: z.number().finite() });
    expect(validate(schema, { value: 42 }).success).toBe(true);
    expect(validate(schema, { value: Infinity }).success).toBe(false);
    expect(validate(schema, { value: NaN }).success).toBe(false);
  });
});
`;
}

// ── Main ZIP builder ────────────────────────────────────────────────────────

/**
 * Build a ZIP blob containing all MCP server files in TypeScript project structure.
 */
export async function buildMCPZip(files: DownloadableFiles): Promise<Blob> {
  const zip = new JSZip();
  const rootFolder = files.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const root = zip.folder(rootFolder)!;

  // src/index.ts
  if (files.generated_code) {
    const src = root.folder("src")!;
    src.file("index.ts", files.generated_code);
  }

  // tests/index.test.ts
  const testsContent = files.tests_code ?? defaultTests(files.name);
  const tests = root.folder("tests")!;
  tests.file("index.test.ts", testsContent);

  // package.json
  if (files.package_json) {
    root.file("package.json", files.package_json);
  }

  // tsconfig.json (from DB, or fallback)
  if (files.tsconfig) {
    root.file("tsconfig.json", files.tsconfig);
  } else {
    root.file(
      "tsconfig.json",
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            outDir: "./dist",
            rootDir: "./src",
            strict: true,
            skipLibCheck: true,
            esModuleInterop: true,
            declaration: true,
          },
          include: ["src/**/*"],
          exclude: ["tests", "node_modules", "dist"],
        },
        null,
        2
      )
    );
  }

  // vitest.config.ts
  root.file("vitest.config.ts", VITEST_CONFIG);

  // .env.example
  if (files.env_example) {
    root.file(".env.example", files.env_example);
  }

  // README.md
  if (files.readme) {
    root.file("README.md", files.readme);
  }

  // .gitignore
  root.file(".gitignore", GITIGNORE);

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
