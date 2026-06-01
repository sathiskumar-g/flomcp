# MDVault — Product Documentation

## Overview

MDVault is a browser-based Markdown file manager built with Next.js 15 (App Router) and React 19.
All data is stored locally — in browser localStorage and, optionally, in a linked folder on your disk.
No server, no account, no cloud required.

---

## Navigation

Five main views, selectable from the top toolbar:

| View | Description |
|---|---|
| **Editor** | Write and preview markdown files |
| **Dashboard** | Overview stats, sticky notes, que list, reminders, gamification |
| **Highlights** | All text highlights from your files |
| **Book** | Build a printable book from selected files |
| **Trash** | Recover or permanently delete trashed files |

---

## Editor

- **Modes**: Edit only · Split (edit + preview side by side) · Preview only
- **Auto-save indicator**: Every keystroke is debounced; the toolbar shows "Saving…" then "✓ Saved"
- **Ctrl+S / Cmd+S**: Force-save and show a toast notification
- **Text highlighting**: Select any text in Preview mode → a floating picker appears → choose a colour → saved to Highlights
- **Word count / XP**: Each new word written earns XP toward your level

---

## Sidebar (File Manager)

- **Categories**: Create folders to organise files (drag between categories with arrow buttons)
- **Search**: Type in the toolbar search box to filter files by name
- **Tags**: Add preset tags (important, todo, draft, done…) or custom tags to any file; click a tag chip to remove it
- **Pin**: Pin any file to keep it at the top of its category
- **Trash**: Delete → moves to trash (not permanent). Recover any time from the Trash view
- **Trash badge**: Footer shows how many files are in trash

---

## Dashboard

### Overview tab
Stats cards: file count, categories, highlights, total word count.

**Gamification**
- **Level & XP**: Write words to earn XP. Bar shows progress to next level (10 levels)
- **Streak**: Days in a row you've written. Resets if you skip a day
- **Badges**: Earn 9 badges for milestones (first note, 5 files, 10 files, word counts, streak days, highlights…)

### Notes tab (Sticky Notes)
- Create colour-coded sticky notes in six colours (yellow, blue, green, pink, purple, white)
- Assign a category: General · Product · Personal · Idea
- Each note auto-titles itself: `Note DD Mon #xxxx` based on creation date + ID
- Fixed height card grid; click a card to edit inline; blur or Escape saves
- When a root folder is linked, notes are synced to `notes/note-{id}.json` automatically

### Que List tab
Save links and resources. Each entry has a title + URL.

### Reminders tab
Checklist-style reminders. Mark done, edit inline, delete.

---

## Highlights

A dedicated view of every text highlight you've made across all files.

- Filter by colour or by source file
- Add/edit notes on each highlight
- Delete highlights you no longer need

---

## Book Builder

1. Select files (checkbox)
2. Set book title and author
3. Drag / reorder chapters with arrow buttons
4. Click **Print / Export PDF** — opens a formatted print window (use browser "Save as PDF")

---

## Trash

- Every "delete" in the sidebar moves the file to trash (soft delete)
- Trash view shows all trashed files, sorted by deletion date
- **Restore**: brings the file back to its original category
- **Permanent Delete**: requires confirmation, cannot be undone
- **Empty Trash**: clears all trashed files (two-step confirmation)

---

## Root Folder Linking

MDVault can write all your data to an organised folder on your disk.

### How to link
1. Click **Link Folder** in the toolbar (folder icon)
2. Pick any folder (e.g. `S:\MD`) via the browser's directory picker
3. The button turns green and shows the folder name — you're linked

### Folder structure created automatically

```
S:\MD\
  documents\
    uncategorized\   ← files with no category
    [Category Name]\ ← one subfolder per category
  notes\             ← note-{id}.json
  reminders\         ← reminders.json
  quelist\           ← quelist.json
  highlights\        ← highlights.json
  merged\            ← merged output files
  trash\             ← trashed files
  books\             ← reserved for future book exports
```

### Open in Explorer
When a folder is linked, an **↗ icon** appears next to the folder name.
Click it to open the folder in Windows Explorer (macOS: Finder; Linux: file manager).

### Unlinking
Click the green folder button again to unlink. Your data stays in localStorage unchanged.

> **Note**: The File System Access API requires Chrome or Edge. Firefox does not support `showDirectoryPicker()`.

---

## Import / Export

| Action | How |
|---|---|
| Import .md / .txt | Toolbar → **Import** (supports multiple files at once) |
| Save current file | Toolbar → **Save** (file picker dialog) |
| Save all files | Toolbar → **Save All** (one dialog per file) |
| Export as PDF | Book Builder → Print |
| Export que list / reminders | Link a root folder — JSON files are auto-synced |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` / `Cmd+S` | Force save active file |
| `Escape` | Close search · cancel sticky note edit |
| Text selection in preview | Opens highlight colour picker |

---

## Data Storage

All content is persisted in **browser localStorage** under the key `mdvault-storage`.
This means:
- Data survives page refreshes and browser restarts
- Data is **per browser** (not shared between browsers or devices)
- Clearing site data in browser settings will erase it — always keep a linked root folder as backup

---

## What's Stored Where

| Data | localStorage | Root folder (if linked) |
|---|---|---|
| Files & content | ✅ | `documents/` |
| Categories | ✅ | — |
| Highlights | ✅ | `highlights/highlights.json` |
| Sticky notes | ✅ | `notes/note-{id}.json` |
| Reminders | ✅ | `reminders/reminders.json` |
| Que list | ✅ | `quelist/quelist.json` |
| XP / Streak / Badges | ✅ | — |
| Trashed files | ✅ | `trash/` |
