# Codebase Insights

## Tech Stack
- React 18 + Vite 5 (SPA, no SSR)
- Electron 40 for desktop shell (frameless BrowserWindow, custom titlebar)
- JavaScript only (no TypeScript)
- lightweight-charts (TradingView) for charting
- lucide-react for icons
- localStorage for all persistence (settings, alerts, analytics cache)
- Web Workers for alert engine (`alertEngine.worker.js`)

## Build & Test
- Build: `vite build`
- Dev: `vite` (web) / `cross-env ELECTRON=1 vite` (electron)
- Electron build: `cross-env ELECTRON=1 vite build && electron-builder`
- Test: none configured
- Lint: eslint configured (devDeps) but no script

## Directory Structure
- `src/` — React app source
  - `components/` — UI: Shell, Window, WindowManager, MenuBar, TitleBar, SettingsPanel, HotkeyManager, PopoutWindow, SnapManager, GridSettingsPanel, MarketViewer
  - `components/trade/` — Montage, PriceLadder, OrderBook, Positions, Accounts, TradeLog, EventLog, ChangesTab, NewsChat (+Settings variants)
  - `components/quotes/` — Chart, TimeSale, ChartSettings
  - `components/scanners/` — LiveScanner, HistoricalScanner, AlertTrigger, MarketClock (+Settings)
  - `config/` — toolManifest.js (canonical tool/window registry)
  - `hooks/` — useKalshiConnection, useKalshiData, useHotkeyDispatch, useCombobox, useDialogFocusTrap, useGridCustomization
  - `services/` — dataFeed, kalshiApi, kalshiWebSocket, omsEngine, omsService, alertService, alertEngine.worker, analyticsService, analyticsCalc, settingsStore, hotkeyStore, hotkeyLanguage, linkBus, mockData, researchLoop, interactionAuditService, auditStateService, changeTrackingService, displayFormat
  - `utils/` — dialogA11y.js
- `electron/` — main.js (Electron main process), preload.js
- `dist/` — Vite build output
- `docs/` — specs (accounts, montage, positions, price-ladder, historical-scanner, time-sale), audit, research
- `.worktrees/` — git worktrees wt-1 through wt-4 for parallel worker development

## Domain Map
- **trade**: Montage, PriceLadder, OrderBook, Positions, Accounts, TradeLog, EventLog, ChangesTab, NewsChat, omsEngine, omsService
- **quotes**: Chart, TimeSale, MarketViewer, lightweight-charts integration
- **scanners**: LiveScanner, HistoricalScanner, AlertTrigger, MarketClock, alertService, alertEngine.worker
- **data**: dataFeed (adapter), kalshiApi (REST), kalshiWebSocket, mockData
- **settings**: settingsStore, hotkeyStore, hotkeyLanguage, linkBus (color linking)
- **analytics**: analyticsService, analyticsCalc
- **shell**: Shell, Window, WindowManager, MenuBar, TitleBar, PopoutWindow, SnapManager, GridSettingsPanel, HotkeyManager
- **electron**: main.js, preload.js (IPC bridge)

## Key Patterns
- **Tool Manifest**: Single source of truth in `src/config/toolManifest.js` — all window types, sizes, categories, shortcuts, link-bus membership
- **Window System**: Shell reducer dispatches OPEN/CLOSE/FOCUS/MOVE/RESIZE; WindowManager maps type→component; PopoutWindow for detached windows
- **Data Layer**: dataFeed.js bridges kalshiApi (REST) + kalshiWebSocket (streaming) with mockData fallback
- **OMS**: Pure state machine (omsEngine) + API bridge (omsService) separation
- **Settings**: localStorage-backed store with pub/sub (settingsStore.subscribe/subscribeSection)
- **Color Linking**: linkBus pub/sub — windows in same color group share market context
- **Hotkeys**: hotkeyStore + hotkeyLanguage DSL + useHotkeyDispatch hook + HotkeyManager UI

## Entry Points
- Web: `src/main.jsx` → `App.jsx` → `Shell.jsx`
- Electron: `electron/main.js` → loads Vite dev server or dist/index.html

## Coupling Hotspots
- hotkeyStore.js ↔ useHotkeyDispatch.js ↔ HotkeyManager.jsx
- alertService.js ↔ AlertTrigger.jsx
- settingsStore.js ↔ SettingsPanel.jsx ↔ Montage.jsx
- dataFeed.js ↔ all trade/quote components

## Large Files (potential split candidates)
- dataFeed.js (~1301 lines)
- Montage.jsx (~680 lines)
- AlertTrigger.jsx (~676 lines)
- Window.jsx (~660 lines)
- OrderBook.jsx (~644 lines)
- Chart.jsx (~643 lines)
- interactionAuditService.js (~631 lines)
- researchLoop.js (~608 lines)
- HotkeyManager.jsx (~588 lines)
- alertService.js (~557 lines)
- PriceLadder.jsx (~542 lines)
- mockData.js (~538 lines)
- HistoricalScanner.jsx (~536 lines)
- LiveScanner.jsx (~508 lines)
- omsEngine.js (~505 lines)

Last scanned: 2026-03-23
