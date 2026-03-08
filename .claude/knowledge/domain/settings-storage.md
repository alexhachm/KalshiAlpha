# Domain: settings-storage
<!-- Updated 2026-03-08T23:50:00Z by worker-5. Max ~800 tokens. -->

## Key Files
- `src/services/settingsStore.js` — localStorage-backed settings with defaults, exports CRUD for all settings sections

## Gotchas & Undocumented Behavior
- `deepMerge` only merges keys present in DEFAULTS — extra stored keys are silently dropped on load
- `windows.savedLayouts` defaults to `[]` — always check `Array.isArray()` before operating on it
- `save()` notifies all listeners synchronously — avoid heavy work in subscribers
- Worktree git dirs break `gh pr create` — must `cd` to main repo dir and use `--head branch`

## Patterns That Work
- Use `load()` to get current state, mutate a copy, then `save({...s})` to persist + notify
- Always fall back to safe defaults when stored data could be missing/corrupt
- New CRUD helpers follow the pattern: read via `_getSavedLayouts()`, mutate copy, write back via `save()`
- Return booleans from mutation helpers to indicate success/failure

## Testing Strategy
- `npm run build` (vite build) — catches import/export errors and syntax issues
- `npm run dev` — quick smoke test for runtime errors
- No unit test framework observed in this project

## Recent State
- Added 5 layout preset CRUD helpers: list, get, save, rename, delete
- Schema: `{ name, layout, createdAt, updatedAt }` array under `windows.savedLayouts`
