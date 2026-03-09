# Domain: shell-state
<!-- Updated 2026-03-08T23:55:00Z by worker-7. Max ~800 tokens. -->

## Key Files
- `src/components/Shell.jsx` — Main shell component with windowReducer managing all window state (open/close/focus/merge/tabs/pop-out/ticker). Contains useEffect listeners for custom events (`open-window`, `window-ticker-update`).
- `src/components/WindowManager.jsx` — Renders windows from Shell's state, receives callbacks for close/focus/merge/tab/pop operations.
- `src/components/SnapManager.js` — `findOpenPosition()` used by Shell to auto-place new windows.
- `src/hooks/useHotkeyDispatch.js` — Keyboard shortcut dispatch, receives focusWindow/getFocusedWindow/windows from Shell.

## Gotchas & Undocumented Behavior
- Window `id` is an auto-incrementing integer (`state.nextId`), NOT a string. Tab ids reuse the original window id from before merge.
- `getFocusedWindow()` returns the window with highest `zIndex` — memoized on `state.windows`.
- Merged/tabbed windows: tabs array lives on the owning window. Each tab has `{id, type, title}`. The owning window's top-level `type`/`title` mirror the active tab.
- `dispatch` from `useReducer` is stable across renders — safe to omit from effect deps.
- The `window-ticker-update` custom event expects `detail: { id, ticker }` where `id` can be a window id OR a tab id.

## Patterns That Work
- Follow the existing custom event pattern (like `open-window`) for Shell-level event listeners.
- Reducer cases should always check for existence before operating, returning `state` unchanged for no-ops.
- Use `Object.entries(state.windows)` for tab-to-window lookups.

## Testing Strategy
- `npm run build` for compilation verification (no test framework configured).
- Manual: dispatch custom events via browser console to verify reducer behavior.
- Check that all existing flows (open/close/focus/merge/tab/detach/pop) remain unregressed after changes.

## Recent State
- Added `UPDATE_WINDOW_TICKER` reducer action and `window-ticker-update` event listener (PR #159).
- Shell.jsx is ~420 lines. No lint or test config exists.
