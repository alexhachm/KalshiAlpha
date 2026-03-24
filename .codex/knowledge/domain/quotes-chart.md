# Domain: quotes-chart

Component: `src/components/quotes/Chart.jsx`, `src/components/quotes/ChartSettings.jsx`

## Overview

Candlestick chart using `lightweight-charts` v5 (`createChart`, `CandlestickSeries`, `HistogramSeries`, `LineSeries`). Settings are persisted per-windowId via `localStorage`. Chart re-creates on key settings changes (ticker, chartType, timeframe, colors, indicators).

## Key Invariants

- `LineSeries` is imported from `lightweight-charts` and passed to `chart.addSeries(LineSeries, options)` — NOT `chart.addLineSeries()`
- Chart is destroyed and recreated when the main `useEffect` dependency array changes (not patched incrementally)
- Real-time updates are handled in a separate `useEffect` that subscribes to ticker updates
- `DEFAULT_SETTINGS` defines the shape of all settings; new settings keys go there with defaults
- `indicatorSeriesRef` holds `{ type, period, series, lastEMA }` entries for incremental real-time EMA updates

## Indicator Math

- **SMA**: `sum(close[i-N+1..i]) / N` — O(N) per bar on initial load
- **EMA**: `k = 2/(N+1)`, seed = SMA of first N bars, then `ema = close * k + prevEMA * (1-k)`
- Incremental real-time EMA: store `lastEMA` in `indicatorSeriesRef` entry; update each tick

## Settings UI Pattern

`ChartSettings.jsx` uses a local `draft` copy of settings. `updateDraft(key, value)` merges into draft. On Save, `onSave(draft)` propagates to parent. For array-typed settings (like `indicators`), spread the array before modifying to avoid mutation.

## Changelog (last 5)

- **2026-03-24 T-7**: Added EMA/SMA toggleable indicator overlays — `calcSMA`, `calcEMA` pure functions, `indicatorSeriesRef` for real-time tracking, `ChartSettings` UI with toggle/period/color per indicator.
