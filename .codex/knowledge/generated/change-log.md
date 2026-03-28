
## [42] FIX: merge conflict for task #41 — change-log.md dirty during rebase — 2026-03-28
- Domain: trading-ui
- Files: .codex/knowledge/generated/change-log.md, .codex/knowledge/domains/trading-ui/README.md, .codex/knowledge/signals/uses/2026-03.md
- What changed: Committed uncommitted knowledge files in wt-2 (agent-2 branch), rebased agent-2 on origin/main skipping already-merged commit 18ab3ea9, pushed with force-with-lease. PR #239 is clean.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/239

## [35] Fix stale lastTrade data in dataFeed.js subscribeToTicker — 2026-03-24
- Domain: api-layer
- Files: src/services/dataFeed.js
- What changed: Added `wrappedCallback()` invocation after `lastTickerData` update in the `subscribeTicker` handler so trade data propagates to consumers immediately instead of waiting for the next orderbook change.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/229

## [19] Fix WebSocket auth failure silently ignored in handleOpen() — 2026-03-24
- Domain: trading-ui
- Files: src/services/kalshiWebSocket.js
- What changed: Moved setState(CONNECTED)/startHeartbeat/resubscribeAll inside try block; catch block now calls scheduleReconnect() and returns instead of falling through to connected state on auth error.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/218

## [6] FIX: Add research CLI case blocks — 2026-03-23
- Domain: coordinator
- Files: coordinator/bin/mac10 (in setup-agents-codex10 repo)
- What changed: Verified all 8 research CLI case blocks already present from auto-save commit. PR #311 already open.
- PR: https://github.com/alexhachm/setup-agents-codex10/pull/311

## [41] Wrap PopoutWindow components with ErrorBoundary in WindowManager.jsx — 2026-03-28
- Domain: trading-ui
- Files: src/components/WindowManager.jsx
- What changed: Imported ErrorBoundary and wrapped Component in PopoutWindow branch with ErrorBoundary, matching existing docked panel protection in Window.jsx.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/239

## [39] Fix real-time chart updates — unwrap {type, candle} wrapper in Chart.jsx — 2026-03-28
- Domain: trading-ui
- Files: src/components/quotes/Chart.jsx
- What changed: subscribeToOHLCV callbacks now check msg.type === 'update' and extract msg.candle before passing to series.update(). Fixed both normal mode (~line 540) and overlay mode (~line 521) callbacks. Real-time candle updates now render correctly.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/237
