# Competitor Gap Analysis: Our App vs Trading Terminal Landscape

> Last updated: 2026-03-23 (Iteration 0, Loop 4)
> Sources: competitor-tradingview.md, competitor-bloomberg.md, competitor-sierrachart.md, competitor-benzinga.md, component-inventory.md, trading-features.md, gaps-and-todos.md

## Executive Summary

Our app is a **Kalshi-focused prediction market trading terminal** — a niche that none of the four competitors directly serve. This is both our biggest advantage (no direct competition) and our biggest risk (no template to follow, smaller market). Compared to these platforms, we are **strong in window management and hotkeys**, **competitive in DOM/order flow basics**, but have **critical gaps in charting, alerts, news, data depth, and automation**.

---

## Feature-by-Feature Comparison

### 1. Scanner / Screener

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Real-time scanner | Yes (LiveScanner) | Yes (multi-asset) | Yes (EQS/SRCH) | Yes (spreadsheet) | Yes (movers/signals) |
| Conviction scoring | Yes (1-5) | No | No | No | No |
| Strategy labeling | Yes (Momentum, Bid-Lift, etc.) | No | No | No | No |
| Multi-asset | No (Kalshi only) | Yes | Yes | Yes | Yes (equities) |
| Custom filters | Limited | 150+ filters | Hundreds | Custom C++ | Dozens |
| Options flow | N/A | No | Yes | No | Yes (core feature) |
| Historical scanner | Yes (stub) | No | Yes (backtest) | Yes (replay) | No |

**Our advantage**: Conviction scoring and strategy labeling are unique. No other platform auto-classifies scan results by trading strategy with confidence levels.

**Our gap**: Limited to Kalshi markets. No custom filter dimensions. No fundamental data filters.

### 2. Alert System

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Price alerts | Yes | Yes | Yes | Yes | Yes |
| Volume alerts | Yes | Yes | Yes | Yes | Yes |
| Pct change alerts | Yes | No | Yes | Yes | No |
| Custom conditions | No | Yes (Pine) | Yes | Yes (ACSIL) | No |
| Server-side | **No** | Yes | Yes | No | Partial |
| Webhook delivery | **No** | Yes | No | No | No |
| Push/SMS/Email | **No** | Yes (all) | Yes (email/app) | No | Yes (push) |
| Sound alerts | Yes | Yes | Yes | Yes | Yes |
| Thesis/invalidation | Yes | No | No | No | No |

**Our advantage**: Thesis/invalidation fields on alerts (unique). Web Worker non-blocking evaluation.

**Critical gap**: No server-side alerts. Browser must be open for alerts to fire. This is table-stakes for a trading terminal. Need server-side alert execution.

### 3. Charting

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Chart types | Candlestick only | 15+ | 100+ | 20+ | Basic |
| Technical indicators | **0 (all STUBs)** | 100+ built-in | 200+ | 300+ | ~20 |
| Custom indicators | No | Pine Script | BCF | ACSIL (C++) | No |
| Drawing tools | **None** | 80+ | Full set | Full set | Basic |
| Replay/backtest | No | Yes | Yes | Yes (tick) | No |
| Volume profile | No | Yes (paid) | Yes | Yes (core) | No |
| Multi-timeframe | Basic | Yes | Yes | Yes | Basic |
| Multi-chart | Via windows | 2-8 synced | 4 panels | Unlimited | 1 |

**Our advantage**: None in charting.

**Critical gap**: Zero implemented indicators (VWAP, EMA, SMA, Bollinger are all STUBs). No drawing tools. For a trading terminal, this is the #1 feature gap. Must at minimum implement the 4 stub indicators.

### 4. Order Flow / DOM Trading

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Price ladder / DOM | Yes | Basic (broker) | Yes (EMSX) | Yes (core) | No |
| Click-to-trade | Broken (local only) | Via broker | Yes | Yes | No |
| Order book display | Yes | Limited | Yes | Yes | No |
| Time & Sales | Yes | Basic | Yes | Yes (filtered) | No |
| Footprint charts | No | No | No | Yes (core) | No |
| Volume profile | No | Yes | Yes | Yes (core) | No |
| Cumulative delta | No | No | No | Yes (core) | No |
| Bracket/OCO orders | No | Via broker | Yes | Yes | No |
| Algorithmic orders | No | No | Yes (VWAP etc) | No | No |

**Our advantage**: We have purpose-built DOM/order flow components — ahead of TradingView and Benzinga.

**Critical gap**: Click-to-trade is broken. Need to fix PriceLadder order submission (already identified as req-eb3755f0). No advanced order types (bracket, OCO, trailing stop). No footprint or delta analysis.

### 5. News & Data Integration

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| News feed | Stub (NewsChat) | Yes (multi-source) | Yes (proprietary) | No | Yes (core) |
| Economic calendar | No | Yes | Yes (ECOF) | No | Yes |
| Earnings calendar | No | Yes | Yes | No | Yes |
| Fundamental data | No | Yes | Yes | No | Partial |
| Event calendars | No | No | Yes | No | Yes (FDA/IPO) |
| Audio news | No | No | No | No | Yes (squawk) |

**Our advantage**: None currently.

**Strategic note**: For Kalshi (prediction markets), the relevant "news" is different — political events, economic data releases, sports outcomes, weather. A Kalshi-specific event calendar and news feed would be a unique differentiator no competitor offers.

### 6. Hotkeys / Keyboard Shortcuts

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Customizable | Yes | Limited | No (fixed) | Yes | Minimal |
| Profiles | Yes | No | No | No | No |
| DSL language | Yes | No | No (GO cmds) | No | No |
| Conflict detection | Yes | No | N/A | No | No |
| Context-aware | Yes | Partial | Yes (function) | Yes (context) | No |

**Our advantage**: Best-in-class hotkey system. Profiles + DSL + conflict detection is unique across all competitors.

### 7. Layout / Workspace

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Draggable windows | Yes | Partial | Yes (Launchpad) | Yes | Yes |
| Tab merging | Yes | No | No | Yes (tabs) | No |
| Pop-out windows | Yes | No | Yes | Yes | Yes |
| Snap positioning | Yes | No | No | No | No |
| Color link bus | Yes | No | No | Yes (linking) | No |
| Saved layouts | Stub | Yes (cloud) | Yes (cloud) | Yes (local) | Yes |
| Multi-monitor | Partial (pop-out) | Yes | Yes | Yes | Partial |

**Our advantage**: Tab merging, snap positioning, and color link bus are sophisticated features. Only Sierra Chart has comparable linking.

**Gap**: Layout persistence is a stub — must implement save/restore.

### 8. Scripting / Automation

| Feature | Us | TradingView | Bloomberg | Sierra Chart | Benzinga Pro |
|---------|-----|-------------|-----------|--------------|--------------|
| Scripting language | No | Pine Script | BQL/BCF | ACSIL (C++) | No |
| Strategy backtest | No | Yes | Yes | Yes | No |
| Auto-trading | No | Via webhooks | SAPI/EMSX | ACSIL | No |
| API access | Kalshi REST/WS | Webhooks | BLPAPI | DTC/ACSIL | News API |
| Webhook support | No | Yes | No | No | No |

**Our advantage**: Direct Kalshi API integration (no broker middleman).

**Gap**: No scripting, no backtesting, no auto-trading. For power users, this limits the platform significantly.

---

## Priority Rankings for Our App

### P0 — Critical (must fix for basic credibility as a trading terminal)
1. **Fix click-to-trade** — PriceLadder order submission is broken. Core trading function.
2. **Implement basic indicators** — VWAP, EMA, SMA, Bollinger are all stubs. A charting terminal with zero indicators is not viable.
3. **Server-side alerts** — All competitors except Sierra have server-side alerts. Browser-only alerts are not reliable for trading.
4. **Layout persistence** — Save/restore layouts is a stub. Every competitor has this.

### P1 — High (differentiation and retention)
5. **Kalshi-specific event calendar** — Political, economic, sports, weather event calendars tied to Kalshi markets. Unique differentiator no competitor offers.
6. **Advanced order types** — Bracket orders, OCO, trailing stops. Standard for any DOM trading platform.
7. **Drawing tools on charts** — At minimum: trendlines, horizontals, Fibonacci. Expected by every trader.
8. **News/event feed** — Wire up NewsChat to real Kalshi-relevant news sources.

### P2 — Medium (power user features)
9. **Volume profile** — Sierra and TradingView both offer this. Important for level-based trading.
10. **Replay mode** — Tick-by-tick replay for practice/backtesting. Sierra and TradingView have this.
11. **Webhook/API alerts** — Enable automation through webhook-triggered alerts.
12. **Multi-monitor optimization** — Important for professional traders.

### P3 — Long-term (platform evolution)
13. **Scripting language** — Pine Script equivalent for Kalshi strategies. High effort, high value.
14. **Strategy backtesting** — Test strategies against historical prediction market data.
15. **Social features** — Community trade ideas, public predictions. TradingView's social network is key to growth.
16. **Mobile companion** — Bloomberg, TradingView, Benzinga all have mobile apps.

---

## What We Do Better Than Everyone

1. **Hotkey system** — Profiles + DSL + conflict detection. Best-in-class across all 4 competitors.
2. **Conviction scoring** — No other platform auto-scores scan results with strategy classification.
3. **Color link bus** — Only Sierra has comparable window linking. TradingView and Bloomberg lack this.
4. **Kalshi-native** — Purpose-built for prediction markets. Zero competitors serve this niche.
5. **Window management** — Tab merging + snap positioning + pop-out is uniquely flexible.

---

## State of Trading Terminals (2025-2026)

### Trends
1. **Web-first**: TradingView proved browser-based can compete with native apps. Benzinga is web-only. Even Bloomberg added web/mobile.
2. **AI integration**: Platforms adding AI-assisted analysis, natural language queries, pattern recognition. Bloomberg has GPT integration. TradingView adding AI features.
3. **Order flow democratization**: Footprint charts and delta analysis moving from institutional (Bloomberg) to retail (Sierra, BookMap, Jigsaw).
4. **Social trading growth**: TradingView's community network is its moat. Copy trading, idea sharing, public portfolios.
5. **Automation/webhooks**: TradingView webhooks + Pine Script enable retail algo trading without coding infrastructure.
6. **Multi-asset convergence**: Prediction markets, crypto, traditional assets converging. Platform that bridges these wins.
7. **Real-time collaboration**: Shared workspaces, live streaming, community-driven research.

### Implications for Our App
- Our web-first approach is aligned with the market direction.
- Prediction markets are an emerging asset class — first-mover advantage is real.
- AI-assisted event analysis (probability estimation, sentiment) could be a unique feature.
- Community features around prediction markets (consensus views, expert tracks) could build network effects.
- The Kalshi niche means we don't need to match Bloomberg or Sierra on every feature — we need to be the BEST tool for prediction market trading specifically.
