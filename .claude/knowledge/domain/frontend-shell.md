# Domain: frontend/scanners
<!-- Updated 2026-03-07T20:37:31Z by worker-4. Max ~800 tokens. -->

## Key Files
- scanners/LiveScanner.jsx — Real-time alert scanner with filtering, sorting, auto-scroll
- scanners/HistoricalScanner.jsx — Date-range pattern scanner with CSV export, grid customization
- scanners/MarketClock.jsx — Clock with DST-aware market session detection (PRE-MKT/OPEN/POST-MKT/CLOSED)
- scanners/AlertTrigger.jsx — Alert rule management with per-alert flash timers (Map-based)
- SettingsPanel.jsx — Global settings with tabbed sections, versioned localStorage
- GridSettingsPanel.jsx — Reusable grid column/style customization panel
- HotkeyManager.jsx — Hotkey profile editor with key capture and script validation
- Shell.jsx — Main app shell with window management reducer, Ctrl+Tab cycling
- MenuBar.jsx — App menu with keyboard arrow/escape navigation, ARIA roles
- MarketViewer.jsx — Market data viewer with price flash, search, link bus

## Gotchas & Undocumented Behavior
- Worktree path is .worktrees/wt-N, NOT main repo. gh CLI must run from main repo dir
- AlertTrigger had stale closure on settings — must use settingsRef pattern for callbacks
- MarketViewer handleLinkEvent had ticker in deps causing link bus re-subscription churn — use tickerRef
- MarketClock getMarketSession uses toLocaleString with America/New_York timezone for DST awareness
- GridSettingsPanel numericColumns was recomputed every render — needs useMemo

## Patterns That Work
- settingsRef pattern: useRef + sync effect for settings used inside stable callbacks
- tickerRef pattern: same for ticker values accessed in link bus subscriptions
- Stable sort: always add secondary sort key (e.g., id) to prevent UI flicker
- useMemo for filter+sort chains in scanner components

## Testing Strategy
- npm run build verifies compilation (1546 modules)
- npm run dev for runtime smoke test (check for console errors)
- Manual: keyboard nav in MenuBar, Ctrl+Tab in Shell, alert flash timing

## Recent State
- All 10 files audited with 30+ improvements shipped in PR #89
- STUB comments added for: row virtualization, exchange calendar, layout persistence, notification perms, alert dedup, settings import/export, hotkey docs
