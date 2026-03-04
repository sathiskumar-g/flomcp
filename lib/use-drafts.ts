"use client";

/**
 * useDrafts — localStorage-backed draft CRUD
 *
 * A "draft" is a saved wizard state (serverName, description, apiConfig, tools,
 * resources, prompts) that was NOT yet generated.  Free users can store up to
 * DRAFT_FREE_LIMIT drafts.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  ApiConfig,
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
} from "./stores/generator-store";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "flomcp_drafts";
export const DRAFT_FREE_LIMIT = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedDraft {
  id: string;
  serverName: string;
  description: string;
  apiConfig: ApiConfig;
  tools: ToolDefinition[];
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];
  savedAt: string; // ISO string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readDrafts(): SavedDraft[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeDrafts(drafts: SavedDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // storage full or private mode — silently ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDrafts() {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  // Hydrate from localStorage once on mount (avoids SSR mismatch)
  useEffect(() => {
    setDrafts(readDrafts());
  }, []);

  const saveDraft = useCallback(
    (data: Omit<SavedDraft, "id" | "savedAt">): { ok: boolean; reason?: string } => {
      const current = readDrafts();
      if (current.length >= DRAFT_FREE_LIMIT) {
        return {
          ok: false,
          reason: `Free plan is limited to ${DRAFT_FREE_LIMIT} saved drafts. Delete one to make room.`,
        };
      }
      const next: SavedDraft = {
        ...data,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
      };
      const updated = [next, ...current];
      writeDrafts(updated);
      setDrafts(updated);
      return { ok: true };
    },
    []
  );

  const deleteDraft = useCallback((id: string) => {
    const updated = readDrafts().filter((d) => d.id !== id);
    writeDrafts(updated);
    setDrafts(updated);
  }, []);

  return { drafts, saveDraft, deleteDraft, freeLimit: DRAFT_FREE_LIMIT };
}
