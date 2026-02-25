# Domain: scanners
<!-- Updated 2026-02-25T07:10:00Z by worker-5. Max ~800 tokens. -->

## Key Files
- `src/components/scanners/LiveScanner.jsx` — Real-time scanner with streaming mock alerts, filtering, sorting, click-to-link
- `src/components/scanners/LiveScanner.css` — LiveScanner styles
- `src/components/scanners/HistoricalScanner.jsx` — Historical pattern scanner with date range, CSV export, confidence bars
- `src/components/scanners/HistoricalScanner.css` — HistoricalScanner styles
- `src/components/scanners/MarketClock.jsx` — Precision clock (HH:MM:SS), optional ms, UTC/local
- `src/components/scanners/MarketClock.css` — MarketClock styles
- `src/components/scanners/MarketClockSettings.jsx` — Overlay settings panel for clock
- `src/services/mockData.js` — Contains `subscribeToScanner()` and `getHistoricalScanResults()` mock data functions
- `src/services/linkBus.js` — Color link event bus for cross-window market linking

## Gotchas & Undocumented Behavior
- WindowManager passes `windowId` prop to all components — use for localStorage key namespacing
- `emitLinkedMarket(windowId, ticker)` from linkBus for cross-window market sync on row clicks
- MarketClock uses requestAnimationFrame when ms enabled (performance-sensitive) vs setInterval(1000) when not
- Settings pattern: some components use inline settings (LiveScanner, HistoricalScanner), others use overlay panels (MarketClock, Montage)
- Stray merge conflict markers in Shell.jsx have been a recurring issue — always check after merging

## Patterns That Work
- `DEFAULT_SETTINGS` const + localStorage persistence with `{component}-settings-{windowId}` key pattern
- `useCallback` for settings updates, `React.memo` on export for performance
- Inline styles via `document.createElement('style')` with data-attribute dedup check for settings overlays (MontageSettings pattern)
- lucide-react icons (Settings, Trash2, etc.) for toolbar buttons

## Testing Strategy
- `npm run build` — must pass
- `npm start` + check for console errors
- Visual: open component from Scanners menu, verify display, toggle settings

## Recent State
- All 3 scanner components built: LiveScanner, HistoricalScanner, MarketClock
- Alert & Trigger still placeholder
- All registered in WindowManager COMPONENT_REGISTRY
