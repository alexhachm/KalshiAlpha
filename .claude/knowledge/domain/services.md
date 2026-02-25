# Domain: services
<!-- Updated 2026-02-25T07:30:00Z by worker-2. Max ~800 tokens. -->

## Key Files
- `src/services/kalshiApi.js` — REST client for Kalshi API. RSA-PSS auth via Web Crypto API. All market data, portfolio, and trading endpoints.
- `src/services/kalshiWebSocket.js` — WebSocket client. Auto-reconnect (exp backoff, max 5 attempts), 30s heartbeat, channel subscriptions (orderbook_delta, ticker, trade, lifecycle, user_orders, user_fills, market_positions).
- `src/services/dataFeed.js` — Adapter bridging real Kalshi data and mockData.js behind same interface. Falls back to mock when not connected. Manages orderbook state machine (YES/NO hash maps → synthetic DOM).
- `src/services/mockData.js` — Mock data generators. DO NOT modify — components still depend on it.
- `src/services/linkBus.js` — Color link event bus for window market linking. DO NOT modify.
- `src/hooks/useKalshiData.js` — React hooks: useTickerData, useMarketRace, useScannerAlerts, useOHLCV, useKalshiConnection, usePortfolio, useOrderEntry, useMarketSearch.

## Gotchas & Undocumented Behavior
- Browser WebSocket API does NOT support custom headers on handshake. Kalshi auth is sent as a post-connect command message instead.
- Kalshi uses centi-cents in WS market_positions channel (divide by 10,000 for dollars). REST uses cents. Always check which unit a field uses.
- Query params are EXCLUDED from the RSA signing string — #1 cause of 401 errors.
- Private key must be PKCS#8 format for Web Crypto API. PKCS#1 keys need conversion.

## Patterns That Work
- Same-interface adapter pattern: dataFeed re-exports subscribeToTicker/subscribeToMarketRace/subscribeToScanner with same signatures as mockData. Components can switch imports without code changes.
- Orderbook state machine: snapshot clears maps, deltas update individual levels, quantity==0 means delete.

## Testing Strategy
- `npm run build` catches all import/module errors.
- To test real connection: configure API key in settings, check Event Log for connection status.
- Mock fallback: all components work without API key configured.

## Recent State
- All 4 service files committed and pushed. Build passes. No components have been migrated from mockData to dataFeed yet — that's the next step for domain workers building components.
