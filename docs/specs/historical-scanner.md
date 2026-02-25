# Historical Scanner

## Purpose
Scan historical data for pattern matching across Kalshi markets. Users define a date range and pattern criteria, then review results in a sortable table.

## Data Flow
1. User sets date range (from/to) and selects pattern criteria
2. User clicks "Scan" to trigger search
3. Mock data generator produces results matching criteria
4. Results displayed in sortable table with click-to-link-market

## Features
- **Date range selector** — two date inputs (from/to), defaults to last 30 days
- **Pattern criteria** — dropdown with: All Patterns, Volume Breakout, Price Reversal, Momentum Shift, Mean Reversion, Gap Fill
- **Scan button** — triggers historical scan with loading state
- **Results table** — sortable columns: Date, Ticker, Pattern, Signal (bull/bear/neutral), ROI %, Confidence (1-5 bars)
- **Click-to-link** — clicking a row emits the ticker via linkBus for cross-window sync
- **Export to CSV** — download results as CSV file

## Right-Click Header Settings
- **Max Results** — limit number of results (10-500, default 100)
- **Default Range (days)** — initial date range on open (1-365, default 30)
- **Confidence Bars** — toggle visual bars vs. numeric display

## Component API
```jsx
<HistoricalScanner windowId={string} />
```

## Files
- `src/components/scanners/HistoricalScanner.jsx` — main component
- `src/components/scanners/HistoricalScanner.css` — styles (hs- prefix)
- `src/services/mockData.js` — `getHistoricalScanResults()` function

## Registration
Registered in `WindowManager.jsx` under `'historical-scanner'` type.
