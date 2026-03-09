# Domain: shell-windows
<!-- Updated 2026-03-09T00:10:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- src/components/WindowManager.jsx — renders all windows, maps type to component via COMPONENT_REGISTRY, passes componentProps (title, windowId, hostWindowId, type, ticker) to child tools
- src/components/Window.jsx — window chrome (drag, resize, tabs, color link groups). Uses id (container window ID) for linkBus drag sync
- src/services/linkBus.js — color link event bus. windowId to colorId mapping, pub/sub for linked market events, drag sync

## Gotchas & Undocumented Behavior
- windowId in componentProps is TAB-scoped: win.tabs?.[win.activeTabIndex]?.id ?? win.id — changes on tab switch
- hostWindowId is CONTAINER-scoped: always win.id — stable across tab switches
- Window.jsx uses id (= win.id) for its own linkBus operations — already host-scoped
- Child components still use windowId for BOTH settings persistence AND linkBus — not yet migrated to hostWindowId
- 12+ components import from linkBus

## Patterns That Work
- Adding props to componentProps in WindowManager passes them to ALL components uniformly
- COMPONENT_REGISTRY maps type strings to React components — add new tools here
- PopoutWindow and Window both receive same componentProps
- Roving tabindex pattern: active tab gets tabIndex=0, others get tabIndex=-1, arrow keys move focus

## Testing Strategy
- npm run build — Vite production build (1553 modules)
- npm run dev — dev server smoke test, check console for errors
- No unit test suite configured

## Recent State
- Added hostWindowId: win.id to componentProps (PR #157)
- Keyboard-operable merged-tab controls already in main (commit 11cac9b2)
- Child components still need migration to use hostWindowId for linkBus calls (separate task)
