# Competitor Analysis: Bloomberg Terminal

> Last updated: 2026-03-23 (Iteration 0, Loop 4)
> Source: Domain knowledge (research queue unavailable)

## Overview
Bloomberg Terminal (Bloomberg Professional Service) is the gold standard institutional trading platform. ~325,000 subscribers globally. Desktop application (Bloomberg Anywhere for remote). $24,000/year per seat ($2,000/month). Covers every asset class, every market, with unmatched data depth.

## Scanner / Screener Capabilities
- **EQS (Equity Screening)**: Hundreds of fundamental, technical, ESG, supply chain, ownership filters.
- **SRCH**: Broad search across all asset classes — equities, fixed income, commodities, FX.
- **Custom screening**: Boolean logic, composite scores, relative value metrics.
- **Backtested screens**: Screen results can be backtested historically.
- **Real-time updating**: Screens update in real-time as market data changes.
- **Excel integration**: Screen results export directly to Excel via Bloomberg API.
- **Multi-asset**: Unified screening across stocks, bonds, derivatives, commodities, funds.

### vs Our App
Our scanner is Kalshi-only with momentum/volume signals. Bloomberg's screening is comprehensive across all asset classes with vastly more dimensions. However, Bloomberg doesn't have conviction scoring or strategy labeling like our scanner engine.

## Alert System
- **MSG alerts**: Price, volume, news, index, economic event alerts.
- **Delivery**: Bloomberg terminal pop-up, Bloomberg mobile app, email.
- **Portfolio alerts**: Alerts tied to portfolio positions and risk thresholds.
- **News alerts**: Keyword-based news monitoring with instant delivery.
- **Server-side**: All alerts are server-side, 24/7.
- **API alerts**: Programmatic alert creation via Bloomberg API.
- **Customizable conditions**: Complex multi-condition alerts.

### vs Our App
Bloomberg alerts are professional-grade, server-side, multi-channel. Our alerts are browser-local only. Massive gap.

## Charting Features & Indicator Library
- **GP (Graph)**: Full charting with 100+ chart types and studies.
- **Chart types**: Candlestick, bar, line, point & figure, equivolume, market profile, etc.
- **Technical studies**: 200+ built-in indicators and overlays.
- **Custom studies**: Bloomberg's proprietary scripting for custom indicators.
- **Multi-security overlay**: Chart multiple securities on same axis.
- **Event overlay**: Earnings, dividends, splits, economic events on charts.
- **Annotation tools**: Lines, channels, Fibonacci, text, shapes.
- **Historical depth**: Decades of tick/daily data depending on asset.
- **Intraday charting**: Tick-level to daily bars.

### vs Our App
Our charting is TradingView Lightweight Charts with no indicators implemented. Bloomberg has institutional-grade charting with decades of data depth. Massive gap.

## Custom Formula / Scripting Support
- **Bloomberg Custom Formulas (BCF)**: Create custom real-time fields and calculations.
- **Bloomberg API (BLPAPI)**: Full programmatic access — Python, Java, C++, C#, Excel VBA.
- **Excel Add-in (BDH, BDP, BDS functions)**: Real-time and historical data in Excel.
- **Bloomberg Query Language (BQL)**: SQL-like language for quantitative analysis.
- **BQNT**: Bloomberg Quant environment (Jupyter-like) for Python research.
- **Apps (APPS)**: Terminal app store with third-party and custom applications.

### vs Our App
We have no scripting or formula capabilities. Bloomberg has multiple scripting/API layers for different use cases.

## Order Flow & DOM Trading
- **EMSX (Execution Management)**: Full EMS with algorithmic routing, multi-broker.
- **FIT (Fixed Income Trading)**: Specialized fixed income execution.
- **FXGO**: FX trading desk.
- **DOM/depth of market**: Full Level 2 across all asset classes.
- **Time & Sales**: Complete tape with filtering and analysis.
- **Transaction Cost Analysis (TCA)**: Post-trade analysis of execution quality.
- **Dark pool routing**: Access to alternative trading systems.
- **Algorithmic orders**: VWAP, TWAP, IS, percent of volume, and custom algos.

### vs Our App
Bloomberg's execution capabilities are institutional-grade with multi-broker routing, algorithmic orders, and TCA. We have basic PriceLadder and OrderBook for Kalshi only.

## News & Data Integration
- **Bloomberg News**: Proprietary newsroom with 2,700+ journalists globally.
- **First word on breaking stories**: Often first to report market-moving events.
- **NEWS function**: Filtered, real-time news feed.
- **NH (News Headlines)**: Customizable headline monitors.
- **Research**: Broker research, sell-side reports, Bloomberg Intelligence.
- **Economic data (ECOF, ECO)**: Comprehensive economic indicators for every country.
- **Company data**: Financials, supply chain, ESG, ownership, management, peer analysis.
- **Government & municipal data**: Bond terms, credit ratings, fiscal data.
- **Alternative data**: Satellite, social sentiment, web traffic, patent filings.

### vs Our App
Bloomberg's data breadth is unmatched. We have a basic NewsChat component. Not comparable.

## Hotkeys / Keyboard Shortcuts
- **Function key navigation**: F-keys map to major sections (F2=News, F3=Govt, F5=Muni, etc.).
- **GO commands**: Type function name + GO (Enter) — e.g., "DES GO" for description.
- **Speed keys**: Single-letter shortcuts within functions.
- **Autocomplete**: Type partial function names for suggestions.
- **Not configurable**: Fixed shortcuts, cannot rebind.

### vs Our App
Bloomberg uses a command-line paradigm (GO commands) rather than hotkeys. Our hotkey system with profiles and DSL is more flexible for keyboard power users.

## Layout / Workspace Customization
- **4-panel layout**: Classic Bloomberg has 4 panels (Panels 1-4).
- **Launchpad**: Customizable dashboard with tiled monitors and widgets.
- **BLP Launchpad**: Multi-monitor support with custom widget arrangements.
- **Templates**: Save and load workspace configurations.
- **Cloud sync**: Settings sync across Bloomberg terminals.
- **Multi-monitor**: Designed for 2-6 monitor setups.

### vs Our App
Bloomberg is designed for multi-monitor professional setups. Our window management is flexible but single-display focused. We lack multi-monitor optimization.

## Social / Community Features
- **IB (Instant Bloomberg)**: Professional messaging between terminal users.
- **MSG**: Email-like messaging within Bloomberg network.
- **PEOP**: Professional directory and networking.
- **Bloomberg Communities**: Discussion forums by topic/sector.
- **Collaboration tools**: Shared watchlists, shared screens.

### vs Our App
Bloomberg has professional networking. We have no social features. Different market segment.

## API / Automation Capabilities
- **BLPAPI**: Full C++, Java, Python, C# API for real-time and historical data.
- **B-PIPE**: Enterprise data feed for redistribution.
- **SAPI**: Server API for automated trading systems.
- **Excel integration**: Real-time data feeds in Excel.
- **BQNT**: Jupyter-style quant research environment.
- **PORT API**: Portfolio analytics programmatic access.

### vs Our App
Bloomberg has comprehensive APIs for institutional use. We have Kalshi REST + WebSocket API integration. Different scale entirely.

## Unique Differentiators
1. **Unmatched data depth** — every asset class, every market, decades of history
2. **Bloomberg News** — proprietary newsroom, often first on breaking stories
3. **Professional network** — 325K subscribers = built-in counterparty network
4. **IB messaging** — industry-standard professional communication
5. **EMSX** — institutional execution management with algo routing
6. **BQL/BQNT** — quantitative research environment
7. **Regulatory/compliance tools** — built-in compliance workflow
8. **Terminal-as-identity** — Bloomberg access signals institutional credibility

## Pricing (2025)
- $24,000/year ($2,000/month) per terminal
- Volume discounts for large deployments
- Bloomberg Anywhere: Remote access add-on
- No free tier, no trial (demonstrations only)
