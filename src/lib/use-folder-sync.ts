/**
 * useFolderSync — subscribes to store slices and auto-syncs all data to the
 * linked root folder whenever it changes. Call this hook once in the app root.
 *
 * Sync map:
 *   files        → documents/[category]/name.md  (non-trashed only)
 *   trashed files → trash/name.md
 *   reminderNotes → reminders/reminders.json
 *   queItems      → quelist/quelist.json
 *   highlights    → highlights/highlights.json
 *   stickyNotes   → notes/[category]/note-{id}.json (each note individual file)
 *   kanbanTasks   → progress/tasks.json
 */
"use client";

import { useEffect, useRef } from "react";
import { useStore } from "./store";
import {
  syncFile,
  syncTrashFile,
  syncReminders,
  syncQueList,
  syncHighlights,
  syncNote,
  syncKanban,
  syncPrompts,
  syncSkills,
  getRootHandle,
} from "./folder-root";

function shallowEqual(a: unknown, b: unknown) {
  return a === b;
}

export function useFolderSync() {
  const files = useStore((s) => s.files);
  const reminderNotes = useStore((s) => s.reminderNotes);
  const queItems = useStore((s) => s.queItems);
  const highlights = useStore((s) => s.highlights);
  const stickyNotes = useStore((s) => s.stickyNotes);
  const kanbanTasks = useStore((s) => s.kanbanTasks);
  const prompts = useStore((s) => s.prompts);
  const skills = useStore((s) => s.skills);
  const categories = useStore((s) => s.categories);

  const prevFiles = useRef(files);
  const prevReminders = useRef(reminderNotes);
  const prevQue = useRef(queItems);
  const prevHighlights = useRef(highlights);
  const prevNotes = useRef(stickyNotes);
  const prevKanban = useRef(kanbanTasks);
  const prevPrompts = useRef(prompts);
  const prevSkills = useRef(skills);

  // Sync files (active + trashed) when they change
  useEffect(() => {
    if (shallowEqual(prevFiles.current, files)) return;
    prevFiles.current = files;
    if (!getRootHandle()) return;

    for (const file of files) {
      if (file.trashedAt) {
        syncTrashFile(file);
      } else {
        const cat = categories.find((c) => c.id === file.categoryId);
        syncFile(file, cat?.name ?? null);
      }
    }
  }, [files, categories]);

  // Sync reminders
  useEffect(() => {
    if (shallowEqual(prevReminders.current, reminderNotes)) return;
    prevReminders.current = reminderNotes;
    if (!getRootHandle()) return;
    syncReminders(reminderNotes);
  }, [reminderNotes]);

  // Sync que list
  useEffect(() => {
    if (shallowEqual(prevQue.current, queItems)) return;
    prevQue.current = queItems;
    if (!getRootHandle()) return;
    syncQueList(queItems);
  }, [queItems]);

  // Sync highlights
  useEffect(() => {
    if (shallowEqual(prevHighlights.current, highlights)) return;
    prevHighlights.current = highlights;
    if (!getRootHandle()) return;
    syncHighlights(highlights);
  }, [highlights]);

  // Sync sticky notes (each note individually)
  useEffect(() => {
    if (shallowEqual(prevNotes.current, stickyNotes)) return;
    prevNotes.current = stickyNotes;
    if (!getRootHandle()) return;
    for (const note of stickyNotes) {
      syncNote(note);
    }
  }, [stickyNotes]);

  // Sync kanban tasks
  useEffect(() => {
    if (shallowEqual(prevKanban.current, kanbanTasks)) return;
    prevKanban.current = kanbanTasks;
    if (!getRootHandle()) return;
    syncKanban(kanbanTasks);
  }, [kanbanTasks]);

  // Sync prompts
  useEffect(() => {
    if (shallowEqual(prevPrompts.current, prompts)) return;
    prevPrompts.current = prompts;
    if (!getRootHandle()) return;
    syncPrompts(prompts);
  }, [prompts]);

  // Sync skills
  useEffect(() => {
    if (shallowEqual(prevSkills.current, skills)) return;
    prevSkills.current = skills;
    if (!getRootHandle()) return;
    syncSkills(skills);
  }, [skills]);
}
