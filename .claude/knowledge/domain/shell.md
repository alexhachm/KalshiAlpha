# Domain: shell
<!-- Updated 2026-02-25T05:16:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/components/Shell.jsx` — Root shell. useReducer with 8 action types: OPEN/CLOSE/FOCUS_WINDOW, MERGE_WINDOWS, SET_ACTIVE_TAB, DETACH_TAB, POP_OUT_WINDOW, POP_IN_WINDOW. TYPE_SIZES map for per-type defaults.
- `src/components/MenuBar.jsx` — 6 menus via MENU_CONFIG array. Login/Settings are actions, rest have dropdowns.
- `src/components/WindowManager.jsx` — COMPONENT_REGISTRY maps 16 types. Renders normal windows in Window, popped-out in PopoutWindow. Passes all merge/tab/popout props through.
- `src/components/Window.jsx` — Draggable (snap-aware), resizable, focusable. Color chip (linkBus), right-click context menu (Pop Out, Pin to Top, Settings), tab bar for merged windows, double-click titlebar to pop out. Uses SnapManager for edge snapping + merge detection during drag.
- `src/components/PopoutWindow.jsx` — window.open() + createPortal. Copies parent styles + CSS vars into popup. Header bar with Pop In button.
- `src/components/SnapManager.jsx` — Singleton registry. register/unregister/update window rects. calculateSnap(id, x, y, w, h, dist) checks screen + other windows. findMergeTarget(id, x, y, w) detects titlebar overlap.
- `src/components/Window.css` — All window styles: titlebar, resize handles, context menu, tab bar, merge target highlight, popout header.
- `src/components/SettingsPanel.jsx` — Modal settings with color coordination toggle.

## Gotchas & Undocumented Behavior
- CRLF line endings: Write tool may produce CRLF on WSL2 — always `sed -i 's/\r$//'` before committing.
- dist/ is tracked in git — build artifacts need to be committed.
- SnapManager is a JS module singleton (not React) — Map-based registry, no state subscriptions.
- Window.jsx uses refs (posRef, sizeRef) for position/size during drag — state only updates on mouseup.
- Merge detection uses data-window-id DOM attribute + direct classList manipulation for highlight.
- gh CLI not installed in this environment — PRs must be created via web or compare URL.

## Patterns That Work
- COMPONENT_REGISTRY in WindowManager for type→component mapping.
- TYPE_SIZES map in Shell.jsx for per-type default window dimensions.
- Shell reducer pattern: each window management feature = new action type, reducer handles state.
- SnapManager singleton registry avoids lifting position state to React — windows self-register.
- PopoutWindow copies all parent <style>/<link> + CSS vars for consistent styling in popups.

## Testing Strategy
- `npm run build` must pass (Vite build)
- Dev server `npm run dev` should start without errors
- All 16 menu items should open windows
- Right-click context menu: Pop Out, Pin to Top
- Drag windows near edges → snap behavior
- Drag window header onto another → tab merge

## Recent State
- All 4 window management features complete: pop-out, snap, merge/tabs, pin-to-top
- 8 reducer actions in Shell.jsx
- All 16 placeholder components registered
- PR submitted at compare/main...agent-1-new
