# Loop Findings

## Successful Patterns
- First submission format that passed quality gate: include explicit PRODUCTION IMPACT section describing user-facing consequence, not just technical description

## Failed Patterns
- Research queue commands (`queue-research`, `research-status`) are listed in mac10 help but return "Unknown command" — ROOT CAUSE FOUND: server-side handlers exist in cli-server.js but the client switch statement in coordinator/bin/mac10 has zero `case 'research-*'` entries. Fix submitted as req-45c443cf.

## Codebase Gaps
- **No test suite**: No test files or test runner. package.json has no test script. High-confidence improvement opportunity.
- **No React error boundaries**: App has no error boundaries, so any component crash brings down the whole UI.
- **No layout persistence**: Shell.jsx has a STUB comment for save/restore window layouts to localStorage.
- **Token-bucket rate limiter**: RESOLVED — kalshiApi.js now has TokenBucket class (lines 139-163).
- **WS command ack tracking**: RESOLVED — kalshiWebSocket.js now has pendingCommands Map with timeout/resolve/reject (lines 23, 130-141, 251-263).
- **Positions unrealized PnL always $0**: Positions.jsx:45 calls getPositionSummaries({}) with empty currentPrices, causing fallback to avgCost in omsService.js:395, which makes getUnrealizedPnl return 0 always. Fix submitted as req-159cb71f.
- **Electron still present**: PROJECT_ARCHITECTURE.md says "NOT Electron" but electron/ dir exists with main.js and preload.js. Contradicts architectural intent.
- **No backend services**: All backend infrastructure (Supabase, Railway, Redis) described in architecture doc is unbuilt.
- **PriceLadder click-to-trade is broken**: handleLevelClick creates local-only working orders without API submission (req-eb3755f0 submitted).
- **Hardcoded TICKERS duplication**: Same TICKERS array duplicated in Montage.jsx:18, PriceLadder.jsx:24, Chart.jsx:16 — DRY violation.
- **Extensive STUB comments**: PriceLadder has 3 stubs (price clustering, P&L per level, cumulative depth), OrderBook has 3 stubs (order flow imbalance, bid/ask aggregation, cancel-all), Chart has 4 stubs (VWAP, EMA/SMA, Bollinger, data gaps), LiveScanner has 1 stub (row virtualization).

## Failed Patterns
- First submission attempt for PriceLadder fix was suppressed by quality_gate for "missing production impact/risk signal (WHY)" — reformulated with explicit PRODUCTION IMPACT section and it passed

## Competitor Research (Loop 4)
- **Research queue still broken** (iteration 0): `queue-research` and `research-status` both return "Unknown command" despite being listed in help. Used training knowledge instead.
- **Competitor profiles written**: competitor-tradingview.md, competitor-bloomberg.md, competitor-sierrachart.md, competitor-benzinga.md, competitor-gap-analysis.md — all in .codex/knowledge/domain/
- **Our strengths vs competitors**: Hotkey system (best-in-class), conviction scoring (unique), color link bus (only Sierra comparable), Kalshi-native (zero competition)
- **Critical gaps identified**: (1) Zero chart indicators (all 4 are STUBs), (2) No server-side alerts, (3) Broken click-to-trade, (4) No layout persistence, (5) No news/event integration
- **EMA/SMA indicator request submitted**: req-ee5c84c7 — most fundamental charting gap, prerequisite for Bollinger Bands
- **Strategic insight**: Kalshi-specific event calendars (political, sports, economic outcomes) would be a unique differentiator no competitor offers

## False Positives

## Codebase Gaps (Window Layer)
- **Window.jsx handleContextMenu double-toggle bug (needs verification)**: Right-clicking titlebar dispatches `toggle-settings` AND opens context menu. Then clicking "Settings..." from the context menu dispatches `toggle-settings` again, toggling it OFF. The initial dispatch in handleContextMenu (line 353) appears accidental. Needs verification of how child components consume the event before submitting.
- **PopoutWindow stale onClose closure**: useEffect has empty deps array but captures `onClose` — if parent re-renders with new onClose, the popout's beforeunload calls the stale version. Low severity since PopoutWindow is rarely re-rendered.
- **SnapManager is .jsx but not a React component**: Pure JS module using .jsx extension — cosmetic, not a bug.

## Indexing Progress
- **state-management.md**: Deep doc written for settingsStore.js, hotkeyStore.js, hotkeyLanguage.js, linkBus.js
- **electron-window-management.md**: Deep doc written for electron/main.js, electron/preload.js, Shell.jsx, Window.jsx, WindowManager.jsx, PopoutWindow.jsx, SnapManager.jsx
- **hooks.md**: Deep doc written for all 6 hooks: useKalshiData.js, useKalshiConnection.js, useGridCustomization.js, useCombobox.js, useDialogFocusTrap.js, useHotkeyDispatch.js
- **analytics-audit-alerts-oms.md**: Deep doc written for analyticsCalc.js, analyticsService.js, auditStateService.js, alertService.js, alertEngine.worker.js, omsEngine.js, omsService.js
- **Hooks dead code found**: useKalshiData.js:130 exports `useKalshiConnection()` that is never imported — duplicate of the full version in useKalshiConnection.js
- **Sharpe ratio bug found**: analyticsCalc.js:187 rfPerTrade formula wrong by factor of n when riskFreeRate!=0. Fix submitted as req-6f1a750c.
- **Remaining areas**: interactionAuditService.js, changeTrackingService.js, displayFormat.js, researchLoop.js, scanner components (MarketClock exchange calendar STUB)
- **Completed deep-dives (iter 11)**: mockData.js (clean, no bugs), kalshiApi.js (clean, rate limiter present), kalshiWebSocket.js (clean, ack tracking present), omsService.js (dedup STUB known), Positions.jsx (PnL bug found), NewsChat.jsx (clean, external-dependency STUBs only)
- **Remaining implementable STUBs**: TradeLog fill rate/slippage/grouping, Accounts margin util/equity curve, OrderBook flow imbalance/aggregation, PriceLadder clustering/PnL/depth, EventLog persistence, LiveScanner row virtualization, MarketClock exchange calendar

## Infrastructure Notes
- Coordinator is running (`ping` → `pong`)
- `codex10` is a namespace wrapper around `mac10` binary
- Research queue is not functional — fix submitted (req-45c443cf). Root cause: client-side routing missing in coordinator/bin/mac10. Server handlers exist in cli-server.js.
- Quality gate requires explicit "PRODUCTION IMPACT" or "RISK" section in submissions — confirmed across multiple loops
