"use client";

/**
 * useSavedPrompts — localStorage-backed prompt library CRUD
 *
 * Saved prompts are reusable description texts the user wants to keep across
 * generation sessions.  Free users can store up to PROMPT_FREE_LIMIT prompts.
 */

import { useCallback, useEffect, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "flomcp_saved_prompts";
export const PROMPT_FREE_LIMIT = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedPrompt {
  id: string;
  name: string;    // short label chosen by user
  text: string;    // full description text
  mimeType: "text/plain" | "text/markdown"; // content type
  createdAt: string; // ISO string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readPrompts(): SavedPrompt[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writePrompts(prompts: SavedPrompt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch {
    // storage full or private mode — silently ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSavedPrompts() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);

  // Hydrate from localStorage once on mount (avoids SSR mismatch)
  useEffect(() => {
    setPrompts(readPrompts());
  }, []);

  const savePrompt = useCallback(
    (name: string, text: string, mimeType: "text/plain" | "text/markdown" = "text/plain"): { ok: boolean; reason?: string } => {
      const current = readPrompts();
      if (current.length >= PROMPT_FREE_LIMIT) {
        return {
          ok: false,
          reason: `Free plan is limited to ${PROMPT_FREE_LIMIT} saved prompts. Delete one to make room.`,
        };
      }
      const next: SavedPrompt = {
        id: crypto.randomUUID(),
        name: name.trim().slice(0, 60) || "Untitled Prompt",
        text,
        mimeType,
        createdAt: new Date().toISOString(),
      };
      const updated = [next, ...current];
      writePrompts(updated);
      setPrompts(updated);
      return { ok: true };
    },
    []
  );

  const deletePrompt = useCallback((id: string) => {
    const updated = readPrompts().filter((p) => p.id !== id);
    writePrompts(updated);
    setPrompts(updated);
  }, []);

  const updatePrompt = useCallback(
    (id: string, patch: Partial<Pick<SavedPrompt, "name" | "text" | "mimeType">>) => {
      const updated = readPrompts().map((p) =>
        p.id === id ? { ...p, ...patch } : p
      );
      writePrompts(updated);
      setPrompts(updated);
    },
    []
  );

  return { prompts, savePrompt, deletePrompt, updatePrompt, freeLimit: PROMPT_FREE_LIMIT };
}
