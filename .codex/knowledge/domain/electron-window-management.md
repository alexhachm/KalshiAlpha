# Electron & Window Management Layer

## Electron Layer (`electron/`)

### main.js (102 lines)
Standard Electron main process for the desktop wrapper.

- **BrowserWindow config**: 1400×900 default, 800×600 min, `frame: false` (frameless/custom titlebar)
- **Security**: `contextIsolation: true`, `nodeIntegration: false` — secure preload bridge
- **Loading**: Vite dev server URL (`VITE_DEV_SERVER_URL`) or `dist/index.html` for production
- **IPC handlers**: `window-minimize`, `window-maximize` (toggle), `window-close`, `window-is-maximized`
- **Crash recovery**: Dialog on `render-process-gone` (Reload/Quit), dialog on `unresponsive` (Wait/Reload/Quit)
- **Maximize events**: Sends `maximize-change` to renderer on maximize/unmaximize
- **macOS support**: `app.on('activate')` creates window if none exist; stays open on all-windows-closed on Darwin

### preload.js (13 lines)
Exposes `window.electronAPI` via `contextBridge`:
- `minimize()`, `maximize()`, `close()`, `isMaximized()` — all via `ipcRenderer.invoke`
- `onMaximizeChange(callback)` — listener with cleanup return function

**Note**: PROJECT_ARCHITECTURE.md says "NOT Electron" but this layer exists and is functional.

---

## Shell.jsx (420 lines) — Application Root Layout

The main application shell, owns all window state.

### Window State Management
Uses `useReducer` with `windowReducer`:
- **State shape**: `{ windows: {id: WindowObj}, nextId: number, nextZ: number }`
- **WindowObj**: `{ id, settingsId, type, title, initialX, initialY, initialWidth, initialHeight, zIndex, ticker?, tabs?, activeTabIndex?, poppedOut? }`

### Reducer Actions
| Action | Description |
|--------|-------------|
| `OPEN_WINDOW` | Creates new window with auto-positioned placement via SnapManager |
| `CLOSE_WINDOW` | Removes window from state |
| `FOCUS_WINDOW` | Bumps window's zIndex to top |
| `MERGE_WINDOWS` | Combines source into target as tabs; removes source |
| `SET_ACTIVE_TAB` | Switches active tab in merged window |
| `DETACH_TAB` | Splits tab out as new window; unwraps if 1 tab remains |
| `POP_OUT_WINDOW` | Marks window as `poppedOut: true` |
| `POP_IN_WINDOW` | Marks window as `poppedOut: false`, re-adds to z-order |
| `UPDATE_WINDOW_TICKER` | Updates ticker context on window by id, settingsId, or tab match |

### Key Features
- **Custom events**: Listens for `open-window` and `window-ticker-update` DOM events from child components
- **Keyboard nav**: `Ctrl+Tab` / `Ctrl+Shift+Tab` cycles non-popped-out windows by zIndex order
- **Per-type sizing**: `getTypeSizes()` from `toolManifest.js` for default dimensions
- **Connection status bar**: Displays `Mock Mode`, `Connecting`, `Live`, `Reconnecting`, `Disconnected`
- **Hotkey integration**: `useHotkeyDispatch` hook with focus/window state
- **STUB**: Layout persistence (save/restore to localStorage) — not implemented

---

## Window.jsx (655 lines) — Individual Window Component

The core draggable/resizable window container. `React.memo`-ized.

### Props
`id, title, type, initialX/Y, initialWidth/Height, zIndex, onClose, onFocus, onPopOut, onMerge, tabs, activeTabIndex, onSetActiveTab, onDetachTab, minWidth (200), minHeight (150), children`

### Position/Size Management
- Uses `useRef` for `posRef` and `sizeRef` (avoids re-render on drag/resize)
- Direct DOM manipulation for performance during drag/resize
- Forces rerender via `useState` counter on mouseup

### Color Link System
- Each window has optional color link (index into `LINK_COLORS` from linkBus)
- **Color chip**: Click opens dropdown picker, Shift+click cycles colors
- **Linked drag**: Emits `emitDragDelta` to move all same-color windows together via `subscribeToDrag`
- **Unlink**: Removes from color group

### Drag System
- `handleTitleBarMouseDown` → `onMove` → `onUp` pipeline
- Calculates snap position via `SnapManager.calculateSnap`
- Emits drag delta to linked color group
- Merge detection during drag (highlight target) and on drop (trigger merge)
- Skips if clicking on `.window-controls` or `.window-color-chip`

### Resize System
- 8-direction resize handles: n, s, e, w, ne, nw, se, sw
- Respects `minWidth`/`minHeight` constraints
- Updates SnapManager registry during resize

### Context Menu (right-click titlebar)
- **Pop Out** → opens in PopoutWindow
- **Pin to Top** → sets `zIndex: 99999`
- **Hide Title Bar** → persists to `localStorage` per type
- **Settings** → dispatches `toggle-settings` CustomEvent
- **Close**

### Tab Bar
- Renders when `tabs.length > 1`
- Arrow key navigation between tabs
- Detach button on each tab

### Recovery Strip
- Shown when titlebar is hidden
- Provides show-titlebar button and close button
- Supports drag and context menu

### Potential Issue
`handleContextMenu` (line 345-353) dispatches `toggle-settings` as a side effect of showing the context menu. Then `handleOpenSettings` (menu item) dispatches it again. This means right-click = open context menu + toggle settings ON, then clicking "Settings..." = toggle settings OFF. Likely a double-toggle bug — needs verification of how child components consume `toggle-settings`.

---

## WindowManager.jsx (127 lines) — Component Router

Maps window state objects to React components.

### Component Registry (18 types)
| Type Key | Component | Category |
|----------|-----------|----------|
| `login` | Placeholder | Auth |
| `montage` | Montage | Trade |
| `price-ladder` | PriceLadder | Trade |
| `accounts` | Accounts | Trade |
| `positions` | Positions | Trade |
| `trade-log` | TradeLog | Trade |
| `event-log` | EventLog | Trade |
| `order-book` | OrderBook | Trade |
| `changes` | ChangesTab | Trade |
| `chart` | Chart | Quotes |
| `time-sale` | TimeSale | Quotes |
| `market-viewer` | MarketViewer | Market |
| `news-chat` | NewsChat | Trade |
| `live-scanner` | LiveScanner | Scanners |
| `historical-scanner` | HistoricalScanner | Scanners |
| `alert-trigger` | AlertTrigger | Scanners |
| `market-clock` | MarketClock | Scanners |
| `hotkey-config` | HotkeyManager | Config |

### Rendering Logic
- Each window gets `windowId` (from active tab's settingsId or window's settingsId or id)
- `hostWindowId` = actual window container id
- Ticker passed through if present
- Popped-out windows → `PopoutWindow` portal
- Fallback to `Placeholder` for unknown types
- `time-sale` gets special `minWidth: 50, minHeight: 30`

---

## PopoutWindow.jsx (129 lines) — Browser Window Portal

Renders React children into a detached browser `window.open()` popup.

### Implementation
- Opens centered popup window with specified dimensions
- **Style sync**: Copies all `<style>` and `<link>` elements from parent document
- **CSS var sync**: Copies `:root` custom properties, subscribes to settings changes for live updates
- **Portal**: Uses `createPortal` to render React tree into popup's mount div
- **Cleanup**: Module-level `openPopouts` Set with `beforeunload` listener closes all on parent exit
- **Blocked popup handling**: Calls `onClose` immediately if `window.open` returns null

### Stale Closure Note
The `useEffect` has `// eslint-disable-line react-hooks/exhaustive-deps` — deps array is empty but depends on `title`, `width`, `height`, `onClose`. The `onClose` ref could become stale if parent re-renders.

---

## SnapManager.jsx (195 lines) — Position Registry & Snapping

Singleton module (not a React component despite .jsx extension) managing window positions.

### Registry
- `Map<id, { x, y, width, height }>` — all active window positions
- API: `register(id, rect)`, `unregister(id)`, `update(id, rect)`, `getRect(id)`

### calculateSnap(id, x, y, width, height, snapDistance=10)
Snaps dragged window to:
1. **Screen edges**: left, right, top, bottom (with titlebar height offset for bottom)
2. **Other window edges**: left↔right, right↔left, left↔left, right↔right (same for Y axis)
- Returns `{ x, y, didSnapX, didSnapY }`
- `TITLEBAR_HEIGHT = 32` used for bottom-edge snap offset

### findMergeTarget(draggedId, dragX, dragY, dragWidth)
- Checks if dragged window's center-top falls within another window's titlebar zone
- Returns target window id or null

### findOpenPosition(width, height)
- Grid-based search with step = max(dimension, 100/80)
- Returns first non-overlapping position
- Fallback: cascade from top-left with 30px offset based on window count

---

## Architecture Summary

```
Shell (useReducer: windowReducer)
 ├── MenuBar → dispatches OPEN_WINDOW
 ├── Account Bar (connection status)
 ├── WindowManager
 │    ├── Window (drag/resize/snap/link/tabs/context-menu)
 │    │    └── <Component> (from COMPONENTS map)
 │    └── PopoutWindow (portal to browser popup)
 │         └── <Component>
 ├── SettingsPanel (global settings overlay)
 └── SnapManager (singleton registry, no render)
```

**Event flow**: Child components dispatch DOM `CustomEvent` to communicate upward:
- `open-window` → Shell opens new window
- `window-ticker-update` → Shell updates ticker on window
- `toggle-settings` → Window body handles per-component settings

**State ownership**: Shell owns all window state via reducer. Window components are stateless regarding position (use refs for perf). SnapManager is a separate singleton registry that mirrors window positions for snap calculations.
