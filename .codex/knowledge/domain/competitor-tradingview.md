# Competitor Analysis: TradingView

> Last updated: 2026-03-23 (Iteration 0, Loop 4)
> Source: Domain knowledge (research queue unavailable)

## Overview
TradingView is the dominant retail charting and social trading platform. 50M+ monthly users, browser-based with optional desktop app (Electron). Freemium model ($0–$60/mo). Supports stocks, crypto, forex, futures, options. Broker integrations for direct trading.

## Scanner / Screener Capabilities
- **Stock Screener**: 150+ fundamental and technical filters. Real-time. Customizable columns, sortable.
- **Crypto Screener**: Dedicated screener with exchange-specific metrics.
- **Forex Screener**: Pairs with technical/fundamental data.
- **Screener alerts**: Can set alerts directly from screener results.
- **Custom screener formulas**: Pine Script conditions can drive screener filters (Pine Screener, released ~2024).
- **Heatmaps**: Visual market heatmaps by sector, market cap, performance.

### vs Our App
Our LiveScanner is event-driven (momentum breakout, bid-lift continuation signals) but limited to Kalshi markets. TradingView's screener is multi-asset with far more filter dimensions. We have conviction scoring (1-5) which TradingView lacks — ours is more opinionated.

## Alert System
- **Condition types**: Price crossing, indicator crossing, drawing tool interaction, volume conditions, custom Pine conditions.
- **Delivery**: App push, email, SMS, webhook, pop-up, sound.
- **Alert limits**: Free=1, Basic=20, Plus=100, Premium=400, Expert=800, Ultimate=unlimited.
- **Server-side execution**: Alerts run on TradingView servers, fire even when browser is closed.
- **Webhook integration**: POST to any URL on alert fire — enables automation via Zapier, custom bots, etc.
- **Expiration**: Alerts expire after 2 months (free) or can be set to "once" / "every time" / "once per bar".

### vs Our App
Our alertService.js supports price_crosses, pct_change, volume_spike with Web Worker evaluation. But alerts are LOCAL only (browser must be open). No server-side alerts, no webhook, no SMS/email. TradingView is vastly superior here.

## Charting Features & Indicator Library
- **Chart types**: 15+ (candlestick, Heikin-Ashi, Renko, Kagi, Point & Figure, line break, range, etc.)
- **Drawing tools**: 80+ (trendlines, Fibonacci, Gann, Elliott Wave, patterns, shapes, text, measure)
- **Built-in indicators**: 100+ (RSI, MACD, Bollinger, Ichimoku, VWAP, Volume Profile, etc.)
- **Community indicators**: 100,000+ public Pine Script indicators shared by users.
- **Multi-timeframe**: Seconds to monthly. Custom timeframes on paid plans.
- **Multi-chart layout**: Up to 8 charts per tab (Ultimate plan).
- **Replay mode**: Bar replay for backtesting strategies visually.
- **DOM/order flow**: Not a strength — basic Level 2 data available through broker integrations.
- **Indicator overlay**: Unlimited indicators on paid plans (3 on free).

### vs Our App
We use TradingView Lightweight Charts (OHLCV only). No drawing tools, no indicators (VWAP/EMA/SMA/Bollinger are STUBs), no replay, no community indicators. Our charting is minimal compared to TradingView.

## Pine Script / Custom Formula Support
- **Pine Script v5**: Full programming language for indicators, strategies, libraries.
- **Strategy backtesting**: Built-in strategy tester with P&L, trade list, equity curve.
- **Pine Editor**: Integrated IDE with autocomplete, documentation, debugging.
- **Library system**: Reusable Pine libraries published and imported by other scripts.
- **Request functions**: `request.security()` for multi-symbol, multi-timeframe data in scripts.
- **Arrays, maps, matrices**: Full data structures for complex calculations.
- **Publication system**: Publish scripts to community with markdown descriptions.

### vs Our App
We have a hotkey DSL (hotkeyLanguage.js) but no scripting language for indicators or strategies. No backtesting capability at all.

## Order Flow & DOM Trading
- **Level 2 / DOM**: Available through broker integrations (not native TradingView strength).
- **Time & Sales**: Basic tape through broker integration.
- **No native footprint charts, delta, CVD, or order flow analysis.**
- **DOM trading**: Ladder-style order entry through connected brokers.

### vs Our App
Our PriceLadder and OrderBook are purpose-built for DOM-style trading. We're actually AHEAD of TradingView here for order flow, though click-to-trade is currently broken (local-only working orders).

## News & Data Integration
- **News feed**: Integrated financial news (Benzinga, Reuters, etc.).
- **Economic calendar**: Built-in with consensus, actual, forecast.
- **Earnings calendar**: Upcoming earnings with EPS estimates.
- **Ideas stream**: Community-generated trade ideas with charts.
- **Fundamental data**: Balance sheet, income statement, cash flow for equities.
- **Data providers**: Multiple exchange feeds, real-time and delayed.

### vs Our App
We have a NewsChat component (stub/basic). No economic calendar, no earnings calendar, no fundamental data.

## Hotkeys / Keyboard Shortcuts
- **Basic shortcuts**: Chart navigation, drawing tools, order entry.
- **Customizable**: Limited — some shortcuts can be rebound.
- **No hotkey profiles or DSL.**
- **Trading hotkeys**: Through broker integration panel.

### vs Our App
Our hotkey system is SUPERIOR — profiles, DSL parser, conflict detection, context-aware dispatching. TradingView's keyboard support is basic.

## Layout / Workspace Customization
- **Multi-chart layouts**: 1-8 synchronized charts per tab.
- **Tabs**: Multiple workspaces saved.
- **Saved layouts**: Cloud-synced across devices.
- **Widget customization**: Watchlist, details, DOM panel positioning.
- **Template system**: Save chart templates (indicators, settings).
- **Drawing sync**: Drawings synced across devices and timeframes.

### vs Our App
Our window management (Shell.jsx) supports drag, resize, tab merging, pop-out, snap positioning, and color link bus. But no cloud sync, no saved layouts (STUB), no templates.

## Social / Community Features
- **Ideas**: Publish and follow trade ideas with chart annotations.
- **Streams**: Live streaming (removed/limited recently).
- **Public profiles**: Reputation system, follower counts.
- **Chat**: Direct messaging between users.
- **Script marketplace**: Community-published indicators/strategies.
- **Minds**: Social feed for quick posts.
- **Comments**: Discussion on ideas and scripts.

### vs Our App
We have no social features whatsoever.

## API / Automation Capabilities
- **Webhook alerts**: POST to external URLs on alert conditions.
- **Broker API integration**: Trade through connected brokers programmatically.
- **Pine Script automation**: Strategies can generate buy/sell signals piped to webhooks.
- **No official public REST API for data access** (charting library is separate product).
- **TradingView Charting Library**: Licensed embeddable widget (enterprise).

### vs Our App
We have Kalshi API integration (REST + WebSocket). TradingView has webhook-based automation. Different approaches — ours is direct API, theirs is event-driven.

## Unique Differentiators
1. **Largest charting community** — network effects from 50M+ users
2. **Pine Script ecosystem** — custom indicator/strategy language with massive library
3. **Cross-platform cloud sync** — seamless desktop/mobile/web experience
4. **Multi-broker integration** — trade from TradingView through many brokers
5. **Replay mode** — visual backtesting
6. **Heatmaps** — visual market overview not found in most platforms

## Pricing (2025)
- Free: 1 chart, 3 indicators, 1 alert
- Essential: $12.95/mo — 2 charts, 5 indicators, 20 alerts
- Plus: $24.95/mo — 4 charts, 10 indicators, 100 alerts
- Premium: $49.95/mo — 8 charts, 25 indicators, 400 alerts
- Expert: $59.95/mo — 10 charts, unlimited indicators, 800 alerts
- Ultimate: ~$69.95/mo — everything unlimited
