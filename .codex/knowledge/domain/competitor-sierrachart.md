# Competitor Analysis: Sierra Chart

> Last updated: 2026-03-23 (Iteration 0, Loop 4)
> Source: Domain knowledge (research queue unavailable)

## Overview
Sierra Chart is a professional-grade trading platform focused on futures, order flow, and high-performance charting. Windows-native (C++), extremely fast. Popular with serious day traders and scalpers. Known for depth of market (DOM) trading, footprint charts, and low-latency execution. $26-$56/month depending on package.

## Scanner / Screener Capabilities
- **Market scanner (Spreadsheet Study)**: Use spreadsheet studies to scan across symbols with custom conditions.
- **Alert-based scanning**: Combine studies with alert conditions to create effective scanners.
- **Custom study scanning**: Apply any custom study (C++) across multiple symbols.
- **Real-time updating**: Scans update as market data streams.
- **Limited UI**: No dedicated screener UI — uses spreadsheet paradigm, steep learning curve.

### vs Our App
Our LiveScanner has a dedicated UI with conviction scoring and strategy labels. Sierra's scanning is more powerful (custom C++ studies) but harder to use. Our approach is more user-friendly for the Kalshi use case.

## Alert System
- **Study-based alerts**: Any study/indicator can trigger alerts.
- **Alert types**: Audio, visual, pop-up, log entry.
- **Conditional alerts**: Complex multi-condition alert logic via studies.
- **Spreadsheet alerts**: Cell-based conditions in spreadsheet studies.
- **Local execution**: Alerts run on the local machine.
- **No remote/push notifications**: Must have Sierra Chart running.
- **Alert log**: Persistent alert history.

### vs Our App
Similar to ours — local execution, no server-side delivery. Sierra has more condition flexibility through studies. Neither has webhook/push support.

## Charting Features & Indicator Library
- **Chart types**: Candlestick, bar, line, point & figure, Kagi, Renko, range bars, volume bars, delta bars, reversal bars, tick charts.
- **Advanced chart types**: Market Profile (TPO), Volume Profile, footprint/cluster charts, numbers bars.
- **Built-in studies**: 300+ technical studies and indicators.
- **Custom studies (ACSIL)**: Full C++ SDK for custom indicators — compile to DLL, loaded at runtime.
- **Multi-chart linking**: Unlimited charts linked by symbol, timeframe.
- **Drawing tools**: Comprehensive — Fibonacci, Gann, Andrews Pitchfork, regression, shapes.
- **Replay**: Full tick-by-tick replay with speed control.
- **Historical data**: Extensive historical data depending on data feed provider.
- **Rendering**: Hardware-accelerated, handles millions of bars without lag.

### vs Our App
Sierra's charting is orders of magnitude more capable than ours. Footprint charts, volume/market profile, tick replay, 300+ studies, custom C++ studies. We have basic OHLCV candlestick via Lightweight Charts with no indicators.

## Custom Formula / Scripting Support
- **ACSIL (Advanced Custom Study Interface and Language)**: Full C++ SDK.
- **Compile to DLL**: Studies compile to native code — maximum performance.
- **Full API access**: Studies can access order book, time & sales, account data, place orders.
- **Spreadsheet studies**: Excel-like formulas for simpler calculations.
- **Study collections**: Share compiled studies with other users.
- **Auto-trading**: Studies can execute automated trading strategies.

### vs Our App
ACSIL is one of the most powerful customization systems in any trading platform. We have no scripting capability.

## Order Flow & DOM Trading
- **THIS IS SIERRA'S CORE STRENGTH.**
- **DOM (Depth of Market)**: Multiple DOM styles — standard, compact, large price ladder.
- **Footprint / Cluster Charts**: Bid×Ask volume at each price level per bar.
- **Numbers Bars**: Customizable display of bid/ask/delta/total volume per level.
- **Volume Profile**: Session, visible range, and fixed range profiles.
- **Market Profile (TPO)**: Time Price Opportunity charts.
- **Cumulative Delta**: Running delta (buy vs sell volume) as chart study.
- **Order Flow Studies**: Bid/ask volume ratio, delta divergence, absorption detection.
- **DOM trading**: Click-to-trade on price ladder with bracket orders, OCO, trailing stops.
- **Pulling/stacking detection**: Visualize large orders being pulled or stacked.
- **Reconstructed tape**: Filtered time & sales with aggressor detection.

### vs Our App
Sierra's order flow is the industry benchmark. Our PriceLadder and OrderBook are basic by comparison. We lack footprint charts, volume profile, market profile, cumulative delta, absorption detection, and bracket/OCO orders. Our click-to-trade is currently broken.

## News & Data Integration
- **Data feeds**: CQG, Rithmic, IQFeed, Interactive Brokers, Teton, and more.
- **No built-in news**: Relies on external news sources.
- **No economic calendar**: Must use external tools.
- **Historical data**: Quality depends on data feed provider.
- **Market data bandwidth**: Extremely efficient — handles high-frequency data feeds.

### vs Our App
Sierra doesn't compete on news/data — it's a pure charting and execution platform. Our NewsChat and scanner signals add value that Sierra doesn't offer.

## Hotkeys / Keyboard Shortcuts
- **Fully customizable**: Every function can be mapped to a shortcut.
- **Key assignment window**: UI for configuring shortcuts.
- **Context-specific**: Different shortcuts in chart vs DOM vs spreadsheet.
- **No profiles**: Single set of shortcuts.
- **No DSL**: Point-and-click configuration only.

### vs Our App
Both have customizable hotkeys. Ours adds profiles and DSL — more flexible. Sierra's is functional but less sophisticated.

## Layout / Workspace Customization
- **Chartbooks**: Save complete workspace configurations.
- **Multiple chartbooks**: Switch between different workspace setups.
- **Tabbed charts**: Multiple charts in tabbed windows.
- **Tiling**: Manual window arrangement within the application frame.
- **Multi-monitor**: Full multi-monitor support (popular with scalpers).
- **Templates**: Chart and study templates for quick setup.
- **No cloud sync**: Local configuration files.

### vs Our App
Both support flexible layouts. Sierra has chartbooks (our STUB layout persistence equivalent). Sierra has multi-monitor; we're single-display. Neither has cloud sync.

## Social / Community Features
- **Sierra Chart forum**: Active community forum for support and study sharing.
- **Study sharing**: Users share compiled ACSIL studies.
- **No social trading, no following, no publishing.**

### vs Our App
Neither platform has social features. Both are execution-focused tools.

## API / Automation Capabilities
- **ACSIL auto-trading**: C++ studies can place and manage orders programmatically.
- **DTC protocol**: Data and Trading Communications protocol for external connectivity.
- **FIX protocol support**: Through some data feed providers.
- **Excel DDE**: Real-time data in Excel via DDE.
- **No REST API**: No web-based API — native C++ only.

### vs Our App
Sierra's automation is C++ DLL-based. Ours is JavaScript/REST/WebSocket. Different paradigms — Sierra is lower-latency but harder to develop for.

## Unique Differentiators
1. **Order flow depth** — best-in-class footprint charts, delta analysis, DOM trading
2. **Performance** — C++ native, handles massive datasets with minimal latency
3. **ACSIL** — most powerful custom study system in retail trading
4. **Replay** — tick-by-tick replay for practice and backtesting
5. **Price per performance** — $26-56/mo for institutional-grade tools
6. **Scalper-focused UX** — DOM and execution optimized for active day trading
7. **Data feed agnostic** — works with multiple professional data feeds

## Pricing (2025)
- Sierra Chart Package 3: $26/month — charting + basic studies
- Sierra Chart Package 5: $36/month — full charting + advanced studies + DOM
- Sierra Chart Package 10: $46/month — everything + market depth
- Sierra Chart Package 11: $56/month — everything + multi-data-service
- Denali Exchange Feed: Additional $16-24/month for exchange direct data
- One-time purchase options available
