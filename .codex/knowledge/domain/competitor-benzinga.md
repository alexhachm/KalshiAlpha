# Competitor Analysis: Benzinga Pro

> Last updated: 2026-03-23 (Iteration 0, Loop 4)
> Source: Domain knowledge (research queue unavailable)

## Overview
Benzinga Pro is a real-time news and data platform for active traders. Primary value proposition: fastest actionable news delivery for day traders. Web-based SPA. Focused on equities and options with some crypto. $117-$177/month (Essential/Pro). Competes primarily on news speed and scanner integration.

## Scanner / Screener Capabilities
- **Stock screener**: Real-time screener with technical and fundamental filters.
- **Signals scanner**: Pre-built scans for unusual options activity, insider trades, analyst ratings, earnings movers.
- **Movers scanner**: Top gainers, losers, most active, unusual volume in real-time.
- **Options scanner**: Unusual options activity with flow analysis — large block trades, sweeps.
- **Squeeze scanner**: Short squeeze candidates based on short interest + volume.
- **Custom scans**: Create custom scan criteria combining multiple conditions.
- **Audio alerts**: Squawk box announces significant scanner hits audibly.

### vs Our App
Benzinga's scanners are news-and-flow-oriented (options flow, insider trades, analyst ratings). Our scanner is price-action-oriented (momentum breakout, bid-lift, drift, chop signals). Different approaches — Benzinga scans for catalysts, we scan for technical patterns.

## Alert System
- **News alerts**: Real-time notifications on breaking news matching watchlist or criteria.
- **Price alerts**: Basic price-level crossing alerts.
- **Movers alerts**: Get notified of unusual volume or price moves.
- **Squawk box**: Audio feed of breaking news — traders hear news before reading it.
- **Desktop notifications**: Browser-based push notifications.
- **Mobile push**: Alert delivery to Benzinga mobile app.
- **No webhook/API-based alerts.**

### vs Our App
Benzinga's alert strength is NEWS speed (squawk box). Our alerts are technical (price, volume, percentage). Complementary rather than competing.

## Charting Features & Indicator Library
- **Basic charting**: Integrated charts with standard technical indicators.
- **NOT a charting platform**: Charts are secondary to news/scanner features.
- **Standard indicators**: Moving averages, RSI, MACD, Bollinger Bands.
- **Drawing tools**: Basic — trendlines, horizontals, Fibonacci.
- **No custom indicators or scripting.**
- **No advanced chart types** (no footprint, volume profile, market profile).

### vs Our App
Benzinga's charting is basic — comparable to ours. Neither platform competes on charting depth. Both treat charting as a supporting feature.

## Custom Formula / Scripting Support
- **None.** Benzinga Pro has no scripting language or custom formula system.
- **API for news data**: REST API for programmatic news access (separate product).

### vs Our App
Neither has scripting for indicators/strategies. Both lack this capability.

## Order Flow & DOM Trading
- **No DOM trading**: Benzinga is not a trading platform — no direct execution.
- **Options flow**: Unusual options activity analysis (large trades, sweeps, block trades).
- **No order book, no Level 2, no price ladder.**
- **Broker integration**: Links to broker for execution (click-to-trade via URL schemes).

### vs Our App
We have PriceLadder and OrderBook — direct execution tools. Benzinga has no execution features. We're ahead here. However, Benzinga's options flow analysis is a scanner category we don't have.

## News & Data Integration
- **THIS IS BENZINGA'S CORE STRENGTH.**
- **Benzinga Newswire**: Proprietary news production with focus on speed.
- **Squawk box**: Audio feed — human narrator reads breaking headlines in real-time.
- **News categories**: Earnings, FDA, analyst ratings, insider trading, SEC filings, macro, crypto.
- **Speed**: Often among the first to deliver actionable news (sub-second from press release to feed).
- **Sentiment tagging**: News items tagged with bullish/bearish sentiment.
- **Contextual news**: News linked to specific tickers with historical context.
- **Calendar suite**: Earnings, economic, FDA, IPO, dividends, splits calendars.
- **Press release feed**: Direct access to company press releases.
- **Social sentiment**: Trending tickers on social media.

### vs Our App
Benzinga's news is world-class for day traders. Our NewsChat is a stub. For a Kalshi-focused terminal, we need event-specific news (political, sports, economic outcomes) rather than equity-focused news.

## Hotkeys / Keyboard Shortcuts
- **Basic shortcuts**: Standard web app shortcuts.
- **Not extensively customizable.**
- **No profiles, no DSL.**

### vs Our App
Our hotkey system is far superior — profiles, DSL, conflict detection. Benzinga treats hotkeys as a basic UI feature.

## Layout / Workspace Customization
- **Dashboard widgets**: Configurable dashboard with moveable widgets.
- **Saved layouts**: Save custom dashboard configurations.
- **Widget types**: News feed, watchlist, scanner, chart, calendar.
- **Multi-monitor**: Can pop out widgets to separate browser windows.
- **Decent flexibility** for a web-based platform.

### vs Our App
Comparable approaches — both are web-based with draggable widgets. Our window management (tab merging, snap positioning, color link bus) is more sophisticated.

## Social / Community Features
- **Benzinga Community**: Forums and social features.
- **Trading ideas**: Some community-generated content.
- **Live audio**: Benzinga produces live market commentary (Benzinga Live).
- **Less emphasis on social** compared to TradingView.

### vs Our App
Benzinga has modest community features. We have none.

## API / Automation Capabilities
- **Benzinga Data API**: REST API for news, financials, analyst ratings, options activity.
- **Newsfeed API**: Real-time streaming news via API.
- **Calendar API**: Earnings, economic events via API.
- **Pricing**: API is a separate product from Benzinga Pro, priced per endpoint/volume.
- **No in-platform scripting or automation.**

### vs Our App
Benzinga's API is data-focused (news, financials). Ours is trading-focused (Kalshi API). Both have REST APIs but for different purposes.

## Unique Differentiators
1. **News speed** — among fastest actionable news delivery for retail traders
2. **Squawk box** — audio news feed is unique value proposition
3. **Options flow** — unusual activity scanner for options traders
4. **Calendar suite** — comprehensive earnings/economic/FDA/IPO calendars
5. **Sentiment tagging** — automatic bullish/bearish classification
6. **Accessibility** — web-based, no installation required
7. **News API** — programmatic access to news for algo traders

## Pricing (2025)
- Benzinga Pro Essential: ~$117/month (annual) / ~$177/month (monthly)
- Benzinga Pro: ~$177/month (annual) / ~$237/month (monthly)
- Additional data feeds and API access priced separately
- Free tier: Basic Benzinga.com with delayed news and limited features
