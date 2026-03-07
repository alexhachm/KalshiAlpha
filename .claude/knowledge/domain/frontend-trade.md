# Domain: frontend/trade
<!-- Updated 2026-03-07T11:05:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/components/trade/OrderBook.jsx/css` — Tabbed panel (Orders/Fills/Positions) with omsService integration
- `src/components/trade/PriceLadder.jsx/css` — Full 1-99 price ladder with click-to-trade, volume bars
- `src/components/trade/Montage.jsx/css` — Level II book + order entry form with search
- `src/components/trade/Positions.jsx/css` — Mock positions table with P&L coloring
- `src/components/trade/TradeLog.jsx/css` — Filterable trade log with CSV export
- `src/components/trade/EventLog.jsx/css` — System event log with level filtering
- `src/components/trade/NewsChat.jsx/css` — Simulated news feed with ticker filter
- `src/components/trade/Accounts.jsx/css` — Account overview table with totals row
- `src/components/quotes/TimeSale.jsx/css` — Streaming time & sales tape
- `src/components/quotes/Chart.jsx/css` — Candlestick chart with lightweight-charts

## Gotchas & Undocumented Behavior
- Accounts.jsx had NO CSS file until this session — all `acct-*` classes were undefined
- Chart canvas uses hardcoded hex colors (#121212, #00c853, #ff1744) NOT design tokens
- TimeSale imports from `mockData` directly, not via hooks like other components
- Settings panels inject styles via `document.createElement('style')` with hardcoded px values
- PriceLadder JSX had `setData(null)` call that would error (data comes from hook not state)
- `color-mix(in srgb, ...)` is used throughout — requires modern browser support

## Patterns That Work
- Column headers: 10px, uppercase, letter-spacing 0.05em, --text-muted color
- Row heights: 22px standard for compact tables
- P&L: Use pnl-positive/pnl-negative/pnl-zero classes (scoped per component)
- All price/number cells: font-family var(--font-mono), font-variant-numeric: tabular-nums
- Flash animations: Use color-mix with accent colors at 20-30% opacity, 0.3-0.8s duration
- Cell padding: var(--spacing-xs) var(--spacing-sm) = 2px 4px

## Testing Strategy
- `npm run build` — must pass (vite production build)
- `npm run dev` — dev server starts cleanly, no console errors
- Visual check: verify row heights, header styling, P&L colors render correctly

## Recent State
- All table headers standardized to 10px/0.05em/--text-muted
- Row heights normalized to 22px
- P&L classes added (Positions, TradeLog)
- EventLog has pill badges, TradeLog has row tinting
- TimeSale uses yellow row-flash animation
- Accounts.css created with full styling
- NewsChat has bubble styling
