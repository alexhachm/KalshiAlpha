# Domain: trade
<!-- Updated 2026-02-25T19:46:00Z by worker-2. Max ~800 tokens. -->

## Key Files
- `src/components/trade/Montage.jsx` — Order entry window. Uses useTickerData + useOrderEntry hooks. BID/ASK book display, limit/market orders, working orders panel.
- `src/components/trade/PriceLadder.jsx` — DOM visualization. Uses useTickerData + useOrderEntry. Full 1-99 price ladder, click-to-trade, volume bars.
- `src/components/trade/Positions.jsx` — Open positions only. Uses usePortfolio + useKalshiConnection. Mock fallback with mapApiPositions().
- `src/components/trade/TradeLog.jsx` — All positions (open + closed). Uses usePortfolio + useKalshiConnection. mapApiFillsToTradeLog() maps API fills to trade log rows.
- `src/components/trade/EventLog.jsx` — System event log. Uses useKalshiConnection. Logs real connection status changes + simulated periodic events.
- `src/components/trade/Accounts.jsx` — Account overview. Uses usePortfolio + useKalshiConnection. Builds real account data from balance/positions/fills when connected.
- Each component has a matching `*Settings.jsx` and `*.css` file.

## Gotchas & Undocumented Behavior
- All trade components use internal mock data generators as fallback when `connected === false` — the mock generators are NOT in mockData.js, they're inline in each component.
- TradeLog has a `mapApiFillsToTradeLog` helper that maps API fills + positions into the unified row format with Open/Closed status.
- Accounts derives realized PnL from fills and unrealized from positions — this is an approximation, not exact API fields.
- Line-ending normalization (CRLF→LF) was needed for all CSS/settings files on WSL.

## Patterns That Work
- `connected && apiData.length > 0 ? apiData : mockData` — clean connected/mock split
- Mock refresh intervals only run when `if (connected) return` guard is active
- usePortfolio refreshInterval matches component's settings.refreshInterval * 1000

## Testing Strategy
- `npm run build` — verifies all imports resolve and JSX compiles
- Dev server smoke test — start vite, check for runtime errors in console

## Recent State
- All 6 trade components fully migrated from mockData to useKalshiData hooks
- Zero mockData imports remain in trade domain
- PR #19 open for merge
