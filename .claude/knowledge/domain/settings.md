# Domain: settings
<!-- Updated 2026-02-25T05:32:00Z by worker-6. Max ~800 tokens. -->

## Key Files
- `src/components/SettingsPanel.jsx` — Full settings modal with sidebar nav + 6 section components
- `src/components/SettingsPanel.css` — Sidebar layout, controls (toggle, number, select, slider, color picker, password input)
- `src/services/settingsStore.js` — localStorage-backed settings store with deep-merge defaults, pub/sub, reset
- `src/services/linkBus.js` — Color coordination state (read by Color Coordination section)
- `src/components/Shell.jsx` — Opens SettingsPanel via `isSettingsOpen` state, triggered by MenuBar `onOpenSettings`

## Gotchas & Undocumented Behavior
- SettingsPanel is a modal overlay (z-index 10000), NOT a WindowManager window. It bypasses the window system.
- Shell.jsx had a stale `<<<<<<< HEAD` merge conflict marker from PR merges — watch for this pattern on main branch.
- linkBus `isLinkingEnabled` is a function (not a value) — call it with () to get current state.
- settingsStore `load()` does deep merge: new default keys are auto-added when stored settings are missing them.

## Patterns That Work
- Sidebar tab pattern: TABS array → map to sidebar buttons → SECTIONS object → render active section component
- Reusable control components (Toggle, NumberInput, Select, Row) defined in same file — keeps settings self-contained
- Section components receive `settings` + `onUpdate(section, key, value)` — consistent API across all sections

## Testing Strategy
- Open Settings from menu bar → verify all 6 tabs render content
- Change values → close → reopen → verify persistence
- Check localStorage for `kalshi_settings` key
- `npm run build` must pass

## Recent State
- All 6 sections implemented with real controls (not placeholders)
- Settings window is complete per spec requirements
- No downstream consumers of settingsStore yet — other components will need to subscribe for theme/font changes
