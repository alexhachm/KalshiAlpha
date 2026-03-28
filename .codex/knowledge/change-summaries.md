# Change Summaries

Workers append summaries here after completing each task. Newest entries at the top.

## [35] Fix stale lastTrade data in dataFeed.js subscribeToTicker — 2026-03-24
- Domain: api-layer
- Files: src/services/dataFeed.js
- What changed: Added `wrappedCallback()` call after `lastTickerData` update in the `subscribeTicker` handler so trade data propagates to consumers immediately instead of waiting for the next orderbook change.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/233

## [T-4] Fix Sharpe ratio rfPerTrade formula — 2026-03-24
- Domain: analytics
- Files: src/services/analyticsCalc.js
- What changed: Removed erroneous `/n` factor from rfPerTrade computation in sharpeRatio(). Old formula `riskFreeRate / (annualizationFactor ** 2 / n || 1)` incorrectly scaled risk-free rate with sample size; corrected to `riskFreeRate / (annualizationFactor ** 2 || 1)`.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/207
