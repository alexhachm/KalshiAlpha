# Domain: trading-ui

## Key Files
- `src/hooks/useKalshiData.js` — React hooks for data subscriptions (market data, alerts, candles, portfolio)
- `src/hooks/useKalshiConnection.js` — canonical connection hook; `useKalshiConnection` lives HERE only
- `src/App.jsx` — imports `useKalshiConnection` from `./hooks/useKalshiConnection`
- `src/components/quotes/Chart.jsx` — TradingView Lightweight Charts component; handles subscribeToOHLCV callbacks

## Invariants
- `useKalshiConnection` is only exported from `src/hooks/useKalshiConnection.js`. Any duplicate in `useKalshiData.js` is dead code.
- `subscribeToOHLCV` callbacks receive `{ type, candle }` or `{ type, candles }` wrapper objects — always check `msg.type` and extract `msg.candle` before using candle fields.

## Changelog (last 5)
- [T-39] Unwrapped {type,candle} in Chart.jsx subscribeToOHLCV callbacks (both normal + overlay modes)
- [T-18] Removed dead `useKalshiConnection` export from `useKalshiData.js`
