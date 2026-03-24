# api-layer Domain Knowledge

## Key Files
- `src/services/dataFeed.js` — Unified subscription API. Wraps real Kalshi WS or mock data.
- `src/services/kalshiWebSocket.js` — WebSocket connection management.

## Patterns

### subscribeToTicker Architecture
- `wrappedCallback` is a closure that builds synthetic DOM + lastTrade and calls the consumer callback.
- `wrappedCallback` is registered in `store.listeners` (a Set).
- `notifyOrderbookListeners(ticker)` iterates `store.listeners` and calls each with `cb(dom)` — but `wrappedCallback` ignores the arg and rebuilds itself.
- `subscribeTicker` WS handler updates `lastTickerData` but must also call `wrappedCallback()` directly so trade updates propagate immediately (not just on next orderbook change).

## Invariants
- After updating `lastTickerData` in the `subscribeTicker` handler, always call `wrappedCallback()` so consumers get fresh data immediately.
- `wrappedCallback` takes no arguments; it reads from closure variables (`lastTickerData`, `ticker`).

## Changelog (last 5)
- [35] Added `wrappedCallback()` call after `lastTickerData` update in `subscribeToTicker`'s ticker handler — fixes stale lastTrade data.
