# Change Summaries

Workers append summaries here after completing each task. Newest entries at the top.

## [T-4] Fix Sharpe ratio rfPerTrade formula — 2026-03-24
- Domain: analytics
- Files: src/services/analyticsCalc.js
- What changed: Removed erroneous `/n` factor from rfPerTrade computation in sharpeRatio(). Old formula `riskFreeRate / (annualizationFactor ** 2 / n || 1)` incorrectly scaled risk-free rate with sample size; corrected to `riskFreeRate / (annualizationFactor ** 2 || 1)`.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/207
