# Domain: frontend/trade
<!-- Updated 2026-03-07T20:30:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- `src/components/trade/OrderBook.jsx` — OMS-connected order management with orders/fills/positions tabs
- `src/components/trade/PriceLadder.jsx` — Full 1-99 price ladder with bid/ask depth, click-to-trade
- `src/components/trade/Montage.jsx` — Level II book + order entry panel with search, confirm dialog
- `src/components/trade/TradeLog.jsx` — Trade blotter with sort/filter, CSV export, date range filtering
- `src/components/trade/Positions.jsx` — Open positions table with P&L, sorting, flash on change
- `src/components/trade/EventLog.jsx` — System event log with auto-scroll, level filtering, export
- `src/components/trade/NewsChat.jsx` — Mock news feed with market search filtering
- `src/components/trade/Accounts.jsx` — Account overview with totals row, P&L coloring
- `src/components/quotes/Chart.jsx` — lightweight-charts integration, overlay mode, OHLCV data
- `src/components/quotes/TimeSale.jsx` — Time & sales tape with large trade highlighting

## Gotchas & Undocumented Behavior
- OrderBook sub-panels (OrdersPanel, FillsPanel, PositionsPanel) are plain functions, not React.memo — they re-render with parent
- PriceLadder builds full 1-99 ladder every data update; no virtual scrolling
- Montage stores settings globally (no windowId prefix) unlike other components
- TimeSale uses mockData import while other trade components use useKalshiData hooks
- `gh pr create` fails from worktree dirs — must cd to main repo

## Patterns That Work
- useGridCustomization hook provides column drag, font size, row height, color overrides
- linkBus (subscribeToLink/emitLinkedMarket) syncs tickers across components via color groups
- Settings pattern: loadSettings/saveSettings to localStorage, DEFAULT_SETTINGS merge
- All components wrapped in React.memo at export

## Testing Strategy
- `npm run build` catches all syntax/import errors
- Components use mock data generators so they render standalone
- No unit tests — verification is build + visual inspection

## Recent State
- All 10 components now have useMemo/useCallback optimizations
- 30 improvement stubs added (3 per component)
- Dead code cleaned (unused refs in TimeSale, Positions)
