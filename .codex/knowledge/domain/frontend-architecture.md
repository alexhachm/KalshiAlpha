# Frontend Architecture

## Tech Stack
- **Framework**: Vite + React 18 (SPA)
- **Desktop**: Electron (current wrapper, planned migration to Tauri)
- **Charting**: TradingView Lightweight Charts v5
- **Icons**: Lucide React
- **Styling**: Plain CSS (no CSS-in-JS, no Tailwind)
- **State**: React hooks + module-level singletons (no Redux/Context)
- **Build**: Vite 5, vite-plugin-electron for desktop builds

## Entry Flow
1. `main.jsx` → `initAppearanceRuntime()` → `ReactDOM.createRoot` → `<App />`
2. `App.jsx` → `useKalshiConnection()` hook, subscribes to settings changes, renders `<TitleBar />` + `<Shell />`
3. `Shell.jsx` → Window manager via `useReducer`, renders `<MenuBar />`, `<WindowManager />`, `<SettingsPanel />`

## Window Management (Shell.jsx)
- **Reducer-based**: `windowReducer` handles OPEN/CLOSE/FOCUS/MERGE/DETACH/POP_OUT/POP_IN/SET_ACTIVE_TAB/UPDATE_TICKER
- **z-index stacking**: Each focus bumps nextZ counter
- **Tab merging**: Drag windows onto each other to create tab groups
- **Pop-out**: Windows can be detached to OS-level windows (via PopoutWindow.jsx)
- **Snap positioning**: `SnapManager.jsx` finds open positions for new windows
- **Custom events**: Components dispatch `open-window` and `window-ticker-update` events

## Tool Manifest (src/config/toolManifest.js)
Single source of truth for all window types. Each entry:
- `type`, `category`, `label`, `shortcut`, `defaultSize`, `settingsKey`, `linkBus`, `focusTarget`

### Categories & Tools
| Category | Tools |
|----------|-------|
| login | Login |
| trade | Montage, Price Ladder, Accounts, Positions, Trade Log, Event Log, Order Book, Changes |
| quotes | Chart, Time/Sale, Market Viewer, News/Chat |
| scanners | Live Scanner, Historical Scanner, Alert & Trigger, Market Clock |
| setup | Hotkey Config |

## Settings System (settingsStore.js)
- localStorage-backed with `kalshi_settings` key
- Sections: connection, appearance, trading, colorCoordination, windows, notifications, scannerPresets
- Deep-merged with defaults on load (new keys always present)
- Pub/sub: `subscribe()`, `subscribeSection()` for granular change detection
- Appearance runtime: dynamically applies CSS variables for theme, font, accent color, opacity

## Color Link Bus (linkBus.js)
- 8 color groups (red, green, blue, yellow, purple, orange, cyan, white)
- Windows join color groups → when one window changes ticker, all linked windows follow
- Drag synchronization: linked windows can move together
- State persisted in localStorage, enabled/disabled via settingsStore

## Keyboard Navigation
- Ctrl+Tab / Ctrl+Shift+Tab: Cycle between windows
- Hotkey system: configurable bindings with profiles (hotkeyStore.js)
- DSL: `Buy=Route:LIMIT Price=Price+0.00 Share=1 TIF=DAY`, `Focus=Montage`, `CXL`
