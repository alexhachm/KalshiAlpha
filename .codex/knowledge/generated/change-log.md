
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

## [39] Fix real-time chart updates — unwrap {type, candle} wrapper in Chart.jsx — 2026-03-28
- Domain: trading-ui
- Files: src/components/quotes/Chart.jsx
- What changed: subscribeToOHLCV callbacks now check msg.type === 'update' and extract msg.candle before passing to series.update(). Fixed both normal mode (~line 540) and overlay mode (~line 521) callbacks. Real-time candle updates now render correctly.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/237
