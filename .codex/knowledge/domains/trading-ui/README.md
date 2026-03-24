# Domain: trading-ui

## Key Files
- `src/hooks/useKalshiData.js` — React hooks for data subscriptions (market data, alerts, candles, portfolio)
- `src/hooks/useKalshiConnection.js` — canonical connection hook; `useKalshiConnection` lives HERE only
- `src/App.jsx` — imports `useKalshiConnection` from `./hooks/useKalshiConnection`

## Invariants
- `useKalshiConnection` is only exported from `src/hooks/useKalshiConnection.js`. Any duplicate in `useKalshiData.js` is dead code.

## Changelog (last 5)
- [T-18] Removed dead `useKalshiConnection` export from `useKalshiData.js`
