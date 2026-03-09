# Domain: shell-window-manager
<!-- Updated 2026-03-09T01:00:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/components/WindowManager.jsx` — Maps manifest type keys to React components, renders windows (inline or popped out)
- `src/config/toolManifest.js` — Canonical tool manifest (type, category, label, shortcut, defaultSize, settingsKey, linkBus, focusTarget). Single source of truth for all tool metadata.
- `src/components/Window.jsx` — Draggable/resizable window chrome
- `src/components/PopoutWindow.jsx` — Browser popup portal for popped-out windows
- `src/components/Shell.jsx` — Imports WindowManager, manages window state (create/close/focus/merge/tabs)

## Gotchas & Undocumented Behavior
- `COMPONENT_REGISTRY` was renamed to `COMPONENTS` — any old references in docs/knowledge files are stale
- `time-sale` window type has hardcoded `minWidth: 50, minHeight: 30` in WindowManager render — not yet in manifest
- Placeholder component is used for `login` type and any unknown types — it shows "(Coming Soon)"
- WindowManager is only imported by Shell.jsx — no other consumers
- The manifest does NOT import React components (by design) — component bindings stay in WindowManager

## Patterns That Work
- Manifest accessor functions (getToolByType, getToolTypes) are O(1) via pre-built index
- Title fallback chain: `win.title || entry?.label || win.type` — safe with optional chaining
- Component map uses same type keys as manifest — keep them in sync

## Testing Strategy
- `npm run build` — catches import resolution and syntax errors
- Dev server (`npm run dev`) — catches runtime module errors
- Visual: open each tool type and verify it renders the correct component

## Recent State
- WindowManager now consumes canonical toolManifest.js (PR #177)
- COMPONENT_REGISTRY → COMPONENTS rename complete
- All 18 tool types render correctly
