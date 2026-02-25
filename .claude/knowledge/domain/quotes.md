# Domain: quotes
<!-- Updated 2026-02-25T05:30:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- `src/components/quotes/Chart.jsx` — TradingView Lightweight Charts wrapper. Candlestick/line/area types, 6 timeframes, OHLC bar, volume, settings panel, linkBus integration
- `src/components/quotes/Chart.css` — Chart styling using CSS vars from index.css
- `src/components/MarketViewer.jsx` — Ticker data display (YES/NO prices, depth table), linkBus consumer
- `src/components/MarketViewer.css` — MarketViewer styling
- `src/services/mockData.js` — Mock data: subscribeToTicker (200ms), generateOHLCV (historical candles), subscribeToOHLCV (streaming bars)
- `src/services/linkBus.js` — Color link event bus for window market linking

## Gotchas & Undocumented Behavior
- mockData prices are 1-99 centi-cents, random walk — not realistic movement
- linkBus subscribeToLink requires both colorId AND windowId to prevent self-notification loops
- TradingView Lightweight Charts: chart.remove() must be called in useEffect cleanup or you get canvas leak
- ResizeObserver is essential — chart won't auto-resize with window; observe the container div
- Flash animations (.flash-up/.flash-down) are global in index.css
- Chart settings panel uses position:absolute — needs chart-component to have position:relative context (window-body handles this)
- The `lightweight-charts` library exports from `lightweight-charts` not from `lightweight-charts/dist`

## Patterns That Work
- React.memo on data-heavy components to prevent unnecessary rerenders
- subscribeToTicker/subscribeToOHLCV return unsub functions — use as useEffect cleanup
- CSS variables: --accent-win (green), --accent-loss (red), --accent-highlight (blue), --font-mono
- WindowManager COMPONENT_REGISTRY maps win.type string to React component
- Components receive props: title, windowId, type from WindowManager → Window → children
- localStorage per-window settings: key pattern `{component}_settings_{windowId}`

## Testing Strategy
- `npm run build` for compilation check
- Open via Quotes > Chart in menu bar
- Test chart type switches (Candle/Line/Area), timeframe changes
- Test color linking by opening Chart + MarketViewer in same color group

## Recent State
- Chart component built with full TradingView LW Charts integration (PR pending)
- MarketViewer built and merged (#3)
- Time/Sale and News/Chat not yet built
