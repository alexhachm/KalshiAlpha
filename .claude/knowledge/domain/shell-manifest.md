# Domain: shell-manifest
<!-- Updated 2026-03-09T01:15:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/config/toolManifest.js` — canonical manifest for all 18 app tools. Defines type, category, label, shortcut, defaultSize, settingsKey, linkBus, focusTarget per tool. Exports accessor functions.

## Duplicated Metadata Locations (migration targets)
- `src/components/WindowManager.jsx` — COMPONENT_REGISTRY (type → React component)
- `src/components/Shell.jsx` — TYPE_SIZES (type → {width, height})
- `src/components/MenuBar.jsx` — MENU_CONFIG (menu structure with labels, shortcuts)
- `src/hooks/useHotkeyDispatch.js` — FOCUS_TYPE_MAP (focusTarget → type)
- `src/services/hotkeyLanguage.js` — FOCUS_TARGETS array

## Gotchas & Undocumented Behavior
- `order-book` and `changes` have no entries in Shell TYPE_SIZES (use default 400x300)
- Chart uses underscore settings key `chart_settings` while others use hyphens
- `gh pr create` fails from worktree dirs — must `cd` to main repo dir first
- COMPONENT_REGISTRY maps to React components which can't be in the manifest (stays in WindowManager)

## Patterns That Work
- Build accessor functions that return data in the exact shape consumers expect (drop-in replacement)
- Build an index map at import time for O(1) lookups by type
- Keep manifest as plain data array — no runtime mutation

## Testing Strategy
- `npm run build` verifies the module is valid ES
- Dev server start verifies no import errors
- Cross-check manifest types against COMPONENT_REGISTRY for completeness

## Recent State
- Manifest created with all 18 tools. PR #172. Not yet consumed by any downstream file — follow-up migration tasks needed.
