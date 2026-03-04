/**
 * Generator Store — Zustand
 *
 * Holds all state for the 4-step MCP generation wizard.
 * Persists nothing — resets on page unload.
 */

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthType = "none" | "api_key" | "bearer" | "oauth";

export interface SchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description: string;
}

export interface ConfigOption {
  id: string;
  key: string;
  value: string;
}

export type ToolAnnotation = "query" | "create" | "update" | "delete" | "search" | "execute";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  fields: SchemaField[];
  annotation?: ToolAnnotation;
  exampleOutput?: string; // optional sample response / output description
}

export type ResourceMimeType = "text/plain" | "text/markdown" | "application/json";
export type PromptMimeType = "text/plain" | "text/markdown";
export type ToolScope = "all" | string; // "all" or a tool id

export interface ResourceDefinition {
  id: string;
  name: string;           // slug: "company-overview"
  description: string;    // human label shown to LLM
  content: string;        // the actual text content
  mimeType: ResourceMimeType;
  toolScope: ToolScope;   // "all" or specific tool id
}

export interface PromptDefinition {
  id: string;
  name: string;           // slug: "sales-context"
  description: string;
  content: string;
  mimeType: PromptMimeType;
  toolScope: ToolScope;
}

export interface ApiConfig {
  enabled: boolean;
  baseUrl: string;
  authType: AuthType;
  apiDocUrl: string;
  inputSchema: SchemaField[];
  configOptions: ConfigOption[];
}

export interface GeneratedResult {
  id: string;
  tools: ToolDefinition[];
  /** From `type: "security"` SSE event */
  securityScore?: number;
  securityGrade?: string;
  blockDownload?: boolean;
}

export interface GeneratorState {
  // ── Navigation ──
  step: 1 | 2 | 3 | 4 | 5 | 6;

  // ── Step 1: Description ──
  serverName: string;
  description: string;

  // ── Step 2: API Config ──
  apiConfig: ApiConfig;

  // ── Step 3: Tool Config ──
  tools: ToolDefinition[];
  suggestionsLoading: boolean;

  // ── Step 4: Resources & Prompts ──
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];

  // ── Step 6: Post-generation ──
  generatedResult: GeneratedResult | null;

  // ── Actions ──
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1
  setServerName: (name: string) => void;
  setDescription: (desc: string) => void;

  // Step 2
  setApiEnabled: (enabled: boolean) => void;
  setApiUrl: (url: string) => void;
  setAuthType: (type: AuthType) => void;
  setApiDocUrl: (url: string) => void;
  addSchemaField: () => void;
  updateSchemaField: (id: string, patch: Partial<Omit<SchemaField, "id">>) => void;
  removeSchemaField: (id: string) => void;
  addConfigOption: () => void;
  updateConfigOption: (id: string, patch: Partial<Omit<ConfigOption, "id">>) => void;
  removeConfigOption: (id: string) => void;

  // Step 3
  setTools: (tools: ToolDefinition[]) => void;
  setSuggestionsLoading: (loading: boolean) => void;
  addTool: () => void;
  updateTool: (id: string, patch: Partial<Omit<ToolDefinition, "id">>) => void;
  removeTool: (id: string) => void;

  // Step 4 — resources
  addResource: () => void;
  updateResource: (id: string, patch: Partial<Omit<ResourceDefinition, "id">>) => void;
  removeResource: (id: string) => void;
  addResourceFromFile: (file: File) => void;

  // Step 4 — prompts
  addPrompt: () => void;
  updatePrompt: (id: string, patch: Partial<Omit<PromptDefinition, "id">>) => void;
  removePrompt: (id: string) => void;
  addPromptFromFile: (file: File) => void;

  // Step 6
  setGeneratedResult: (result: GeneratedResult) => void;
  addToolField: (toolId: string) => void;
  updateToolField: (toolId: string, fieldId: string, patch: Partial<Omit<SchemaField, "id">>) => void;
  removeToolField: (toolId: string, fieldId: string) => void;

  // Load a saved draft back into the wizard
  loadDraft: (data: Pick<GeneratorState, "serverName" | "description" | "apiConfig" | "tools" | "resources" | "prompts">) => void;

  // Reset
  reset: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultTool(): ToolDefinition {
  return {
    id: uid(),
    name: "",
    description: "",
    fields: [defaultField()],
    exampleOutput: "",
  };
}

function defaultField(): SchemaField {
  return {
    id: uid(),
    name: "",
    type: "string",
    required: true,
    description: "",
  };
}

const DEFAULT_API_CONFIG: ApiConfig = {
  enabled: false,
  baseUrl: "",
  authType: "none",
  apiDocUrl: "",
  inputSchema: [],
  configOptions: [],
};

function defaultResource(): ResourceDefinition {
  return {
    id: uid(),
    name: "",
    description: "",
    content: "",
    mimeType: "text/plain",
    toolScope: "all",
  };
}

function defaultPrompt(): PromptDefinition {
  return {
    id: uid(),
    name: "",
    description: "",
    content: "",
    mimeType: "text/plain",
    toolScope: "all",
  };
}

function mimeTypeFromFilename(filename: string): ResourceMimeType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md" || ext === "mdx") return "text/markdown";
  if (ext === "json") return "application/json";
  return "text/plain";
}

function slugFromFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const INITIAL_STATE = {
  step: 1 as const,
  serverName: "",
  description: "",
  apiConfig: DEFAULT_API_CONFIG,
  tools: [defaultTool()],
  suggestionsLoading: false,
  resources: [] as ResourceDefinition[],
  prompts: [] as PromptDefinition[],
  generatedResult: null as GeneratedResult | null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGeneratorStore = create<GeneratorState>((set) => ({
  ...INITIAL_STATE,

  // Navigation
  setStep: (step) => set({ step }),
  nextStep: () =>
    set((s) => ({ step: Math.min(6, s.step + 1) as 1 | 2 | 3 | 4 | 5 | 6 })),
  prevStep: () =>
    set((s) => ({ step: Math.max(1, s.step - 1) as 1 | 2 | 3 | 4 | 5 | 6 })),

  // Step 1
  setServerName: (serverName) => set({ serverName }),
  setDescription: (description) => set({ description }),

  // Step 2 — api config
  setApiEnabled: (enabled) =>
    set((s) => ({ apiConfig: { ...s.apiConfig, enabled } })),
  setApiUrl: (baseUrl) =>
    set((s) => ({ apiConfig: { ...s.apiConfig, baseUrl } })),
  setAuthType: (authType) =>
    set((s) => ({ apiConfig: { ...s.apiConfig, authType } })),
  setApiDocUrl: (apiDocUrl) =>
    set((s) => ({ apiConfig: { ...s.apiConfig, apiDocUrl } })),

  addSchemaField: () =>
    set((s) => ({
      apiConfig: {
        ...s.apiConfig,
        inputSchema: [...s.apiConfig.inputSchema, defaultField()],
      },
    })),
  updateSchemaField: (id, patch) =>
    set((s) => ({
      apiConfig: {
        ...s.apiConfig,
        inputSchema: s.apiConfig.inputSchema.map((f) =>
          f.id === id ? { ...f, ...patch } : f
        ),
      },
    })),
  removeSchemaField: (id) =>
    set((s) => ({
      apiConfig: {
        ...s.apiConfig,
        inputSchema: s.apiConfig.inputSchema.filter((f) => f.id !== id),
      },
    })),

  addConfigOption: () =>
    set((s) => ({
      apiConfig: {
        ...s.apiConfig,
        configOptions: [
          ...s.apiConfig.configOptions,
          { id: uid(), key: "", value: "" },
        ],
      },
    })),
  updateConfigOption: (id, patch) =>
    set((s) => ({
      apiConfig: {
        ...s.apiConfig,
        configOptions: s.apiConfig.configOptions.map((o) =>
          o.id === id ? { ...o, ...patch } : o
        ),
      },
    })),
  removeConfigOption: (id) =>
    set((s) => ({
      apiConfig: {
        ...s.apiConfig,
        configOptions: s.apiConfig.configOptions.filter((o) => o.id !== id),
      },
    })),

  // Step 3 — tools
  setTools: (tools) => set({ tools }),
  setSuggestionsLoading: (suggestionsLoading) => set({ suggestionsLoading }),
  addTool: () =>
    set((s) => ({ tools: [...s.tools, defaultTool()] })),
  updateTool: (id, patch) =>
    set((s) => ({
      tools: s.tools.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  removeTool: (id) =>
    set((s) => ({ tools: s.tools.filter((t) => t.id !== id) })),

  addToolField: (toolId) =>
    set((s) => ({
      tools: s.tools.map((t) =>
        t.id === toolId
          ? { ...t, fields: [...t.fields, defaultField()] }
          : t
      ),
    })),
  updateToolField: (toolId, fieldId, patch) =>
    set((s) => ({
      tools: s.tools.map((t) =>
        t.id === toolId
          ? {
              ...t,
              fields: t.fields.map((f) =>
                f.id === fieldId ? { ...f, ...patch } : f
              ),
            }
          : t
      ),
    })),
  removeToolField: (toolId, fieldId) =>
    set((s) => ({
      tools: s.tools.map((t) =>
        t.id === toolId
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t
      ),
    })),

  // Step 4 — resources
  addResource: () =>
    set((s) => ({ resources: [...s.resources, defaultResource()] })),
  updateResource: (id, patch) =>
    set((s) => ({
      resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  removeResource: (id) =>
    set((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),
  addResourceFromFile: (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      const mimeType = mimeTypeFromFilename(file.name);
      const slug = slugFromFilename(file.name);
      const resource: ResourceDefinition = {
        id: uid(),
        name: slug,
        description: "",
        content,
        mimeType,
        toolScope: "all",
      };
      useGeneratorStore.setState((s) => ({ resources: [...s.resources, resource] }));
    };
    reader.readAsText(file);
  },

  // Step 4 — prompts
  addPrompt: () =>
    set((s) => ({ prompts: [...s.prompts, defaultPrompt()] })),
  updatePrompt: (id, patch) =>
    set((s) => ({
      prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  removePrompt: (id) =>
    set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),
  addPromptFromFile: (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType: PromptMimeType = ext === "md" ? "text/markdown" : "text/plain";
      const slug = slugFromFilename(file.name);
      const prompt: PromptDefinition = {
        id: uid(),
        name: slug,
        description: "",
        content,
        mimeType,
        toolScope: "all",
      };
      useGeneratorStore.setState((s) => ({ prompts: [...s.prompts, prompt] }));
    };
    reader.readAsText(file);
  },

  // Step 6
  setGeneratedResult: (generatedResult) => set({ generatedResult }),

  // Load a saved draft (pre-fills wizard and resets to step 1)
  loadDraft: (data) =>
    set({
      serverName: data.serverName,
      description: data.description,
      apiConfig: data.apiConfig,
      tools: data.tools.length > 0 ? data.tools : [defaultTool()],
      resources: data.resources,
      prompts: data.prompts,
      step: 1,
      generatedResult: null,
      suggestionsLoading: false,
    }),

  // Reset
  reset: () => set({ ...INITIAL_STATE, tools: [defaultTool()], resources: [], prompts: [], generatedResult: null, suggestionsLoading: false }),
}));
