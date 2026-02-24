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

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  fields: SchemaField[];
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
}

export interface GeneratorState {
  // ── Navigation ──
  step: 1 | 2 | 3 | 4 | 5;

  // ── Step 1: Description ──
  description: string;

  // ── Step 2: API Config ──
  apiConfig: ApiConfig;

  // ── Step 3: Tool Config ──
  tools: ToolDefinition[];
  suggestionsLoading: boolean;

  // ── Step 5: Post-generation ──
  generatedResult: GeneratedResult | null;

  // ── Actions ──
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1
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

  // Step 5
  setGeneratedResult: (result: GeneratedResult) => void;
  addToolField: (toolId: string) => void;
  updateToolField: (toolId: string, fieldId: string, patch: Partial<Omit<SchemaField, "id">>) => void;
  removeToolField: (toolId: string, fieldId: string) => void;

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

const INITIAL_STATE = {
  step: 1 as const,
  description: "",
  apiConfig: DEFAULT_API_CONFIG,
  tools: [defaultTool()],
  suggestionsLoading: false,
  generatedResult: null as GeneratedResult | null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGeneratorStore = create<GeneratorState>((set) => ({
  ...INITIAL_STATE,

  // Navigation
  setStep: (step) => set({ step }),
  nextStep: () =>
    set((s) => ({ step: Math.min(5, s.step + 1) as 1 | 2 | 3 | 4 | 5 })),
  prevStep: () =>
    set((s) => ({ step: Math.max(1, s.step - 1) as 1 | 2 | 3 | 4 | 5 })),

  // Step 1
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

  // Step 5
  setGeneratedResult: (generatedResult) => set({ generatedResult }),

  // Reset
  reset: () => set({ ...INITIAL_STATE, tools: [defaultTool()], generatedResult: null, suggestionsLoading: false }),
}));
