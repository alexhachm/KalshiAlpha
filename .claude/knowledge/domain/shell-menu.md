# Domain: shell-menu
<!-- Updated 2026-03-09T01:00:00Z by worker-2. Max ~800 tokens. -->

## Key Files
- `src/components/MenuBar.jsx` — Keyboard-navigable menubar with ARIA. Imports getMenuConfig from toolManifest.
- `src/components/Shell.jsx` — windowReducer (OPEN/CLOSE/FOCUS/MERGE_WINDOWS etc). Imports getTypeSizes from toolManifest.
- `src/config/toolManifest.js` — Canonical tool manifest. Single source of truth for labels, shortcuts, default sizes, categories, link bus, focus targets.
- `src/services/settingsStore.js` — localStorage-backed settings. Layout presets in windows.savedLayouts.

## Gotchas
- MenuBar items with action vs type need branching in both click and keyboard handlers.
- onAction must be in handleItemKeyDown useCallback dependency array.
- RESTORE_LAYOUT replaces ALL windows, resets nextId/nextZ. Not additive.
- gh CLI does NOT work inside worktree directories. Must cd to main repo for PRs.
- getMenuConfig and getTypeSizes create new objects each call. Call once at module level.

## Patterns That Work
- Module-level const from manifest accessors: const MENU_CONFIG = getMenuConfig()
- Action items in submenus: add action property alongside label.
- settingsStore CRUD: load, clone array, mutate, assign, save.

## Testing Strategy
- Build: npm run build (fast, catches import/syntax errors).
- Dev: npm run dev (auto-incremented port in worktree).
- Manual: Open each menu category, verify items and shortcuts.

## Recent State
- MenuBar and Shell now source all metadata from toolManifest.js (PR #147).
- No duplicate menu labels, shortcuts, or window sizes remain in these files.
- Layout preset feature previously complete (Save/Load/Rename/Delete in Setup menu).
