# Domain: frontend/shell
<!-- Updated 2026-03-07T11:06:00Z by worker-4. Max ~800 tokens. -->

## Key Files
- src/components/TitleBar.jsx + .css — App-level title bar (Electron). 28px compact, hover-reveal controls.
- src/components/Window.jsx + .css — Draggable/resizable panel frames. Sharp corners, accent borders, color-linked drag groups, tab merge system, context menu.
- src/components/Shell.jsx + .css — Root layout: MenuBar + workspace. Window reducer handles OPEN/CLOSE/FOCUS/MERGE/TAB/POP operations.
- src/components/MenuBar.jsx + .css — Top navigation. MENU_CONFIG array defines all menus. Dropdown menus with keyboard shortcuts.
- src/components/PopoutWindow.jsx — Portal-based detached windows. Copies parent stylesheets + CSS variables. Uses var() for body styles.
- src/components/WindowManager.jsx — Renders Window components, dispatches PopoutWindow for popped-out panels.
- src/components/SnapManager.js — Edge-snapping logic, merge target detection, open position finder.

## Gotchas & Undocumented Behavior
- Window.css uses color-mix() for accent borders at opacity — not all browsers support this (Chromium 111+)
- PopoutWindow copies CSS vars from computed styles; if tokens change dynamically, popouts will be stale until reopened
- Window body has padding:0 now — individual panel components must handle their own padding
- TitleBar controls are opacity:0 by default, only visible on hover — accessibility concern for keyboard-only users

## Patterns That Work
- Use CSS variables from index.css for all colors/spacing — never hardcode hex values
- Sharp corners (border-radius: 0) on all window frames and dropdowns for Bloomberg aesthetic
- Accent highlight at 20% opacity for default borders, 40% for focus/active states
- Uppercase + letter-spacing 0.05em for all titles and labels in the chrome

## Testing Strategy
- npm run build must pass
- npm run dev — check for console errors in first 8 seconds
- Visual: verify windows have sharp corners, compact chrome, hover-reveal titlebar controls

## Recent State
- All shell chrome components updated to Bloomberg-style aesthetic (PR #77)
- Window body padding removed — panels manage their own internal spacing
