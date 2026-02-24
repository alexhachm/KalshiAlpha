# Trading Terminal Reference Sources

Compiled: 2026-02-24
Purpose: Reference index of open source trading terminals, platforms, and libraries to draw from when building the KalshiAlpha trading terminal. Each entry includes repo, stack, use case relevance, and specific features to consider pulling.

---

## How to Use This Document

Each section is organized by functional category. When building a feature, consult the relevant section to find prior art, borrow architecture patterns, or identify libraries already solving the problem. Links go directly to the source repository.

---

## 1. Full Algorithmic Trading Platforms (Multi-Asset)

### NautilusTrader
- **Repo:** https://github.com/nautechsystems/nautilus_trader
- **Stars:** 20,300 | **Status:** Actively maintained (Dec 2025)
- **Stack:** Rust (core engine), Python (API/strategy layer via Cython), async Tokio networking
- **Markets:** FX, Equities, Futures, Options, Crypto (spot + perps), DeFi, Prediction Markets (Polymarket), Betfair
- **License:** LGPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Prediction market integration** — already has a Polymarket adapter; this is the closest analog to Kalshi's event contract structure. Study how they model event instruments, settlement, and position tracking.
  - **Event-driven order engine** — nanosecond-resolution event bus architecture is directly applicable to a fast order management system (OMS) for prediction markets.
  - **Multi-venue backtesting** — simultaneously simulate across multiple event markets; useful for Kalshi + Polymarket + PredictIt spread strategies.
  - **Order type handling** — IOC, FOK, GTC, GTD, post-only, trailing stops; Kalshi supports limit and market orders and this covers the full spec.
  - **Internal message bus** — publish signals, Greeks, fills, and position updates to subscribers; use as the backbone for real-time dashboard data flow.
  - **Paper trading / live trading same code path** — critical for safely testing Kalshi strategies before going live.
- **Do not use:** No built-in charting UI; need to layer one on top.

---

### LEAN (QuantConnect)
- **Repo:** https://github.com/QuantConnect/Lean
- **Stars:** 16,900 | **Status:** Actively maintained (13,000+ commits)
- **Stack:** C# (primary), Python (strategy authoring), .NET runtime, Docker, Jupyter Lab
- **Markets:** Equities, Options, Futures, Forex, Crypto
- **License:** Apache 2.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Strategy isolation pattern** — clean separation between algorithm logic and execution infrastructure; copy this pattern so Kalshi strategies are portable and testable.
  - **Research environment** — Jupyter Lab integration for exploratory data analysis on Kalshi market data and historical prices.
  - **100+ technical indicators** — while Kalshi is event-based, price series of contract probabilities can still use indicators like RSI, MACD, Bollinger Bands on probability curves.
  - **Modular broker/data adapter system** — reference architecture for plugging in the Kalshi REST/WebSocket API as a custom data + execution adapter.
  - **Backtesting with no code changes for live** — enforce this same constraint in KalshiAlpha so strategies work identically in sim and live.
- **Do not use:** C# stack may not match target tech; use as architectural reference only.

---

### VeighNa (vnpy)
- **Repo:** https://github.com/vnpy/vnpy
- **Stars:** 36,800 | **Status:** Actively maintained (Dec 2025)
- **Stack:** Python, SQLite/MySQL/PostgreSQL/MongoDB/TDengine, event-driven architecture
- **Markets:** Chinese futures/options/equities, Interactive Brokers, Crypto
- **License:** MIT
- **Relevant Use Cases for KalshiAlpha:**
  - **Event engine architecture** — central event bus drives UI updates, order routing, and data recording; clean pattern for decoupled real-time systems.
  - **Database abstraction layer** — support for multiple backends (SQLite for local dev, PostgreSQL for production); borrow this pattern for storing Kalshi fills, positions, and market data.
  - **Real-time data recording module** — continuously write incoming Kalshi WebSocket ticks to a time-series store; reference vnpy's `DataRecorder`.
  - **CTA strategy module** — trend-following + mean-reversion strategy templates; adapt for Kalshi probability curve trading.
  - **Spread trading module** — model Kalshi contract spreads (e.g., YES vs NO, or cross-market correlated events).
  - **Async REST + WebSocket client patterns** — clean async implementation compatible with Kalshi's API style.
- **License is MIT** — most permissive of the major platforms; borrow code directly if needed.

---

### StockSharp (S#)
- **Repo:** https://github.com/StockSharp/StockSharp
- **Stars:** 9,200 | **Status:** Actively maintained (11,700+ commits)
- **Stack:** C# (.NET), Windows desktop + web components
- **Markets:** Stocks, Futures, Options, Forex, Crypto (50+ exchanges)
- **License:** Apache 2.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Designer (drag-and-drop strategy builder)** — visual strategy construction with a code editor and debugger; strong reference for a KalshiAlpha strategy builder UI.
  - **Charting terminal** — full-featured charting with Volume, Tick, Range, P&F, Renko candle types; reference for chart component design.
  - **Hydra (data collection tool)** — scheduled, automated market data collection and storage; reference for building a Kalshi historical data scraper/archiver.
  - **High compression data storage** — custom binary format for candle/tick data; useful if Kalshi tick data volumes become large.
  - **Backtesting with performance/equity reporting** — full PnL report generation with drawdown, Sharpe, win rate; reference for KalshiAlpha analytics dashboard.

---

### OpenAlgo
- **Repo:** https://github.com/marketcalls/openalgo
- **Stars:** 1,300 | **Status:** Actively maintained (Feb 2025)
- **Stack:** Python (Flask 3.0, SQLAlchemy, ZeroMQ), React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- **Markets:** Indian equities, futures, options (24+ brokers)
- **License:** AGPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Unified REST API layer** — 30+ endpoints (orders, portfolio, market data) wrapping broker APIs; mirror this pattern for Kalshi's API.
  - **ZeroMQ message bus** — real-time WebSocket streaming via ZeroMQ pub/sub; directly applicable to broadcasting Kalshi fills and quotes to multiple UI components.
  - **Flow (visual strategy builder)** — React Flow drag-and-drop interface; strong UI reference for KalshiAlpha strategy builder.
  - **API Analyzer Mode** — paper trading with virtual money; borrow for Kalshi paper trading mode.
  - **Python Strategy Manager with CodeMirror editor** — in-browser code editor for writing and deploying strategies; high-value feature to build into KalshiAlpha.
  - **MCP server integration** — AI agents (Claude, Cursor) can execute trades via tool calls; reference for AI-assisted trading features in KalshiAlpha.
  - **Telegram bot integration** — alert and execution via Telegram; useful for mobile-first notifications of Kalshi position changes.
  - **TradingView Lightweight Charts embedded** — same charting library already popular; copy the integration pattern.
  - **Options Greeks calculator** — adapt for Kalshi implied probability calculations and Kelly sizing.
- **Tech stack (React + TypeScript + Vite + Tailwind) is directly relevant** if KalshiAlpha uses the same frontend stack.

---

### OsEngine
- **Repo:** https://github.com/AlexWan/OsEngine
- **Stars:** 952 | **Status:** Actively maintained (Feb 2026)
- **Stack:** C# (.NET), Windows desktop
- **Markets:** Russian MOEX, Crypto (Bybit, Binance, OKX, etc.), Interactive Brokers
- **License:** Open source
- **Relevant Use Cases for KalshiAlpha:**
  - **OData (historical data downloader)** — candles, order books, tick data; reference for building a Kalshi historical fill/price data fetcher.
  - **Optimizer (strategy parameter optimization)** — brute-force and genetic optimization over strategy parameters; reference for tuning Kalshi strategy thresholds.
  - **Multi-strategy bot station** — run multiple Kalshi strategies simultaneously with individual P&L tracking per bot.
  - **Exchange emulator for backtesting** — simulated exchange that replays historical data; build an equivalent Kalshi market simulator using historical API data.

---

## 2. Crypto-Focused Platforms (Architecture Reference)

### Freqtrade
- **Repo:** https://github.com/freqtrade/freqtrade
- **Stars:** 47,100 | **Status:** Actively maintained (Jan 2026, v2026.1)
- **Stack:** Python 3.11+, SQLite, Docker, TA-Lib
- **Markets:** Crypto spot and futures (Binance, OKX, Bybit, Kraken, Hyperliquid DEX, etc.)
- **License:** GPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Dry-run paper trading** — complete paper trading mode that mirrors live trading exactly; copy the dry-run abstraction layer pattern.
  - **FreqAI (ML module)** — adaptive ML prediction models with continuous retraining on live data; adapt for predicting Kalshi contract probability movements.
  - **Telegram bot control interface** — full bot management (start/stop strategies, view positions, get alerts) via Telegram; high-value mobile interface for KalshiAlpha.
  - **Built-in web dashboard** — simple strategy monitoring dashboard; reference layout for KalshiAlpha's dashboard page.
  - **Backtesting + strategy analysis reports** — per-trade analytics with metrics (profit factor, max drawdown, win rate per market); adapt reporting for Kalshi contracts.
  - **Docker-compatible deployment** — containerize KalshiAlpha backend the same way for consistent deployment.
  - **Hyperopt parameter optimization** — Optuna-backed strategy parameter search; use same approach for tuning Kalshi entry/exit thresholds.

---

### Hummingbot
- **Repo:** https://github.com/hummingbot/hummingbot
- **Stars:** 17,400 | **Status:** Actively maintained (Jan 2026, v2.12.0)
- **Stack:** Python + Cython, TypeScript (Gateway), Docker
- **Markets:** CEX and DEX crypto (Binance, Hyperliquid, dYdX, Uniswap, Curve, etc.)
- **License:** Apache 2.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Market making strategies** — bid/ask spread placement and inventory management; directly applicable to Kalshi YES/NO market making.
  - **Arbitrage strategies** — cross-market arbitrage between correlated contracts (e.g., Kalshi vs Polymarket on the same event); Hummingbot's arbitrage framework is a strong reference.
  - **Gateway middleware** — abstraction layer for connecting to multiple venues; model the Kalshi API client as a Gateway-equivalent adapter.
  - **Connector architecture** — each exchange is a modular, community-maintained connector; use same pattern to support Kalshi + future prediction market venues.

---

### Jesse
- **Repo:** https://github.com/jesse-ai/jesse
- **Stars:** 7,500 | **Status:** Actively maintained (2025)
- **Stack:** Python + JavaScript, Docker, Optuna
- **Markets:** Crypto spot and futures
- **License:** MIT
- **Relevant Use Cases for KalshiAlpha:**
  - **300+ technical indicators** — even for event markets, apply TA indicators to rolling probability price series.
  - **Multi-symbol, multi-timeframe backtesting without look-ahead bias** — enforce strict data boundary discipline; reference Jesse's implementation to avoid data leakage.
  - **JesseGPT (AI assistant)** — GPT-based assistant that writes and debugs strategies; reference for building an AI strategy assistant in KalshiAlpha.
  - **Optuna AI optimize mode** — Bayesian hyperparameter optimization; use same library for KalshiAlpha strategy tuning.
  - **Risk management tools** — position sizing, max drawdown limits, per-trade risk controls; adapt for Kalshi contract sizing.
  - **Real-time alerts (Telegram, Slack, Discord)** — multi-channel alert system; reference for KalshiAlpha notification system.
  - **Built-in code editor** — browser-based editor for writing strategies; reference for KalshiAlpha's in-app editor.

---

### OctoBot
- **Repo:** https://github.com/Drakkar-Software/OctoBot
- **Stars:** 5,400 | **Status:** Actively maintained
- **Stack:** Python, CCXT, Docker
- **Markets:** 15+ crypto exchanges
- **License:** GPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **TradingView alert integration** — execute orders automatically on TradingView webhook alerts; build same for Kalshi (e.g., fire an order when a probability crosses a threshold signaled by a TradingView Pine Script).
  - **AI integration (OpenAI/Ollama)** — use LLM to analyze market conditions and recommend positions; reference for KalshiAlpha's AI features.
  - **Social sentiment analysis** — Google Trends + Reddit sentiment as alpha signals; relevant for Kalshi political/sports event markets where sentiment drives probability.
  - **Grid trading strategy** — place laddered limit orders across a probability range; directly applicable to Kalshi probability grids.
  - **DCA strategy** — dollar-cost averaging into a position as probability moves; adapt for scaling into Kalshi contracts.

---

### Superalgos
- **Repo:** https://github.com/Superalgos/Superalgos**
- **Stars:** 5,300 | **Status:** Maintained
- **Stack:** Node.js, JavaScript, Python 3 (TensorFlow optional), Electron, Vue.js
- **License:** Apache 2.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Visual bot design interface (no-code)** — node-based visual programming for strategies; reference for KalshiAlpha's visual strategy builder.
  - **Integrated charting system** — charts tightly coupled to the strategy builder; reference for the charting + strategy relationship in UI.
  - **Data mining tools** — extract and normalize historical exchange data; adapt for Kalshi historical contract data.
  - **Trade-by-trade visual simulation** — replay a backtest visually on a chart showing each entry/exit; high-value feature for understanding strategy behavior.
  - **Zero-code API map builder** — visual tool for mapping external API responses to internal data structures; reference for integrating novel data sources into Kalshi strategies.

---

## 3. Backtesting & Quantitative Research Frameworks

### Backtrader
- **Repo:** https://github.com/mementum/backtrader
- **Stars:** 20,500 | **Status:** Minimal recent updates (widely used, stable)
- **Stack:** Python, matplotlib
- **Markets:** Equities, Forex, any instrument via custom data feeds
- **License:** GPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Custom data feed interface** — clean abstract class for plugging in any data source; use as a reference for building a Kalshi historical data feed for backtesting.
  - **122 built-in indicators** — full TA library; apply to Kalshi probability price series.
  - **Portfolio analyzers** — Sharpe Ratio, Time Return, SQN, drawdown; essential analytics for measuring Kalshi strategy performance.
  - **Multiple simultaneous data feeds** — backtest strategies that trade correlated Kalshi contracts simultaneously.
  - **Resampling and replaying** — resample Kalshi tick data into minute/hourly bars; replay for backtesting at different granularities.
  - **Advanced order types** — Market, Limit, Stop, StopTrail, OCO; map to Kalshi's order API.
- **Widely documented** — extensive tutorials and community examples; useful for onboarding contributors.

---

### VectorBT
- **Repo:** https://github.com/polakowo/vectorbt
- **Stars:** 6,700 | **Status:** Actively maintained (Jan 2026, v0.28.4)
- **Stack:** Python, NumPy, Pandas, Numba (JIT), Plotly
- **License:** Apache 2.0 + Commons Clause
- **Relevant Use Cases for KalshiAlpha:**
  - **Vectorized backtesting engine** — test thousands of parameter combinations in seconds using NumPy arrays instead of loops; use for rapid strategy optimization.
  - **Multi-symbol, multi-strategy optimization** — run a grid search across Kalshi contract categories (sports, politics, economics) simultaneously.
  - **Interactive Plotly heatmaps** — visualize strategy performance across parameter space; use for KalshiAlpha's strategy optimization results UI.
  - **Hyperparameter search** — random signal generation + parameter sweeping; reference for KalshiAlpha's backtesting optimizer.
  - **Portfolio performance metrics** — comprehensive set of performance statistics on vectorized basis.
- **Caution:** Commons Clause restricts commercial sale; check licensing before incorporating code directly.

---

### QuantLib
- **Repo:** https://github.com/lballabio/QuantLib
- **Stars:** 6,800 | **Status:** Actively maintained (Jan 2026, v1.41)
- **Stack:** C++, Python/Java/C#/R bindings via SWIG
- **Markets:** Options, Bonds, Swaps, FX derivatives
- **License:** BSD 3-Clause
- **Relevant Use Cases for KalshiAlpha:**
  - **Binary option pricing** — Kalshi contracts are binary options (pay $1 at expiration if event occurs); QuantLib has binary/digital option pricing engines that can be used to derive fair value from implied probability.
  - **Greeks calculation** — Delta, Gamma, Theta, Vega for binary options; compute these on Kalshi contracts to understand sensitivity to time decay and volatility.
  - **Monte Carlo pricing** — simulate event probability paths for fair value estimation.
  - **Risk measures (VaR)** — compute value-at-risk for a Kalshi portfolio.
  - **Python bindings** — use QuantLib-Python (`pip install QuantLib`) without touching C++ directly.

---

### Zipline-Reloaded
- **Repo:** https://github.com/stefan-jansen/zipline-reloaded
- **Stars:** ~1,700 | **Status:** Actively maintained (Jul 2025)
- **Stack:** Python 3.9+
- **License:** Apache 2.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Pipeline API** — factor-based data pipeline for cross-sectional analysis; adapt for screening Kalshi contracts by implied probability, volume, spread, and time-to-expiry.
  - **Custom data bundles** — ingest arbitrary historical data sources; write a Kalshi bundle to enable full backtesting with Zipline's battle-tested engine.
  - **Companion to "ML for Algorithmic Trading" book** — direct tie-in to ML strategy development workflows; use as curriculum reference for adding ML features to KalshiAlpha.

---

## 4. Core Libraries and Infrastructure

### CCXT
- **Repo:** https://github.com/ccxt/ccxt
- **Stars:** 41,000 | **Status:** Actively maintained (Feb 2026, 93,784 commits)
- **Stack:** JavaScript/TypeScript, Python, C#, PHP, Go (multi-language)
- **Markets:** 110+ crypto exchanges (Binance, Bybit, OKX, Hyperliquid, dYdX, etc.)
- **License:** MIT
- **Relevant Use Cases for KalshiAlpha:**
  - **Unified exchange API pattern** — every exchange uses the same method names (`fetch_ticker`, `create_order`, `fetch_balance`); build the Kalshi API client using this same interface so future prediction market venues (Polymarket, PredictIt, Manifold) can be swapped in.
  - **WebSocket client architecture** — real-time order book, trades, and ticker streaming with automatic reconnect logic; reference for Kalshi WebSocket feed implementation.
  - **Error handling and retry patterns** — standardized network error handling, rate limit backoff, nonce management; copy these patterns for the Kalshi HTTP client.
  - **Normalized data structures** — unified order, trade, and ticker schemas regardless of exchange; use same approach so Kalshi data is portable across the codebase.
  - **Cross-language support** — if KalshiAlpha needs a Python backend and TypeScript frontend, CCXT shows how to maintain the same logic in both.

---

### TradingView Lightweight Charts
- **Repo:** https://github.com/tradingview/lightweight-charts
- **Stars:** 13,800 | **Status:** Actively maintained (Dec 2025, v5.1.0)
- **Stack:** TypeScript, HTML5 Canvas, npm
- **License:** Apache 2.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Primary charting library** — embed in KalshiAlpha frontend for rendering Kalshi contract probability price history as line/candlestick/area charts.
  - **Custom series plugin API** — build a custom "probability bar" chart type specific to binary event contracts.
  - **Real-time data updates** — designed for high-frequency streaming data; plug in Kalshi WebSocket feed directly.
  - **Lightweight footprint** — file size comparable to a static image; no performance penalty in the web UI.
  - **14,700+ dependent projects** — extremely well-documented with many integration examples to reference.
- **This should be the first charting dependency added to KalshiAlpha.**

---

## 5. TUI / Terminal Tools (Reference for CLI Mode)

### ticker
- **Repo:** https://github.com/achannarasappa/ticker
- **Stars:** 5,900 | **Status:** Actively maintained (Dec 2025, v5.2.0)
- **Stack:** Go, Bubbletea TUI framework, Termenv
- **Markets:** Stocks, ETFs, Crypto, Derivatives (Yahoo Finance, Coinbase)
- **License:** GPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **TUI layout design** — clean multi-column display of prices, positions, P&L; reference for a KalshiAlpha `--tui` mode or CLI dashboard.
  - **Multiple cost-basis lots** — track multiple entry lots per Kalshi contract for accurate P&L and tax calculation.
  - **Pre/post-market data pattern** — analogous to tracking Kalshi contracts near expiry (when probability collapses or spikes); reference the time-sensitive display logic.
  - **Bubbletea framework** — Go TUI framework; use if building a terminal-first interface for KalshiAlpha.
  - **Group-based watchlist** — organize Kalshi contracts by category (sports, politics, economics, weather) in a watchlist.

---

### cointop (ARCHIVED)
- **Repo:** https://github.com/cointop-sh/cointop
- **Stars:** 4,400 | **Status:** ARCHIVED Dec 2025 (read-only)
- **Stack:** Go, ~15 MB footprint
- **Relevant Use Cases for KalshiAlpha:**
  - **Vim-style keyboard navigation** — reference for KalshiAlpha's keyboard shortcut system in any TUI or web terminal.
  - **Favorites + portfolio tracking with P&L** — UI pattern for watching specific Kalshi contracts and tracking live unrealized P&L.
  - **ASCII price charts** — in-terminal sparkline charts for probability history; simple but useful in a CLI mode.
  - **Fuzzy search** — search across hundreds of Kalshi markets by keyword; reference for KalshiAlpha's market search.
  - **Multi-fiat currency conversion** — display Kalshi contract values in different currencies if the platform expands internationally.
- **Archived — do not depend on; use for reference only.**

---

## 6. Institutional / FIX Protocol Infrastructure

### Open Trading Platform (ettec/OTP)
- **Repo:** https://github.com/ettec/open-trading-platform
- **Stars:** 163 | **Status:** Low activity (Nov 2023)
- **Stack:** Go (backend), Java (FIX simulator), TypeScript/React (frontend), Kubernetes, Kafka, PostgreSQL, gRPC, Grafana/Prometheus
- **License:** GPL-3.0
- **Relevant Use Cases for KalshiAlpha:**
  - **Microservices architecture** — separate services for order management, market data, execution, and reporting; reference if KalshiAlpha scales to a multi-service deployment.
  - **Full order state history via Kafka** — immutable audit log of every order state change; implement same for regulatory compliance and debugging.
  - **Prometheus + Grafana monitoring** — instrument KalshiAlpha backend with Prometheus metrics; build Grafana dashboards for latency, fill rate, and error rate monitoring.
  - **gRPC-based internal communication** — high-performance service-to-service communication; reference if KalshiAlpha backend becomes multi-process.
  - **AG Grid integration** — high-performance data grid for order blotter and position table; use same library in KalshiAlpha's order management UI.

---

### Marketcetera
- **Repo:** https://github.com/Marketcetera/marketcetera
- **Stars:** 79 | **Status:** Low activity (Jan 2025)
- **Stack:** Java, PostgreSQL, Maven
- **Relevant Use Cases for KalshiAlpha:**
  - **Risk parameter management system** — per-strategy and per-user risk limits (max position size, max daily loss); reference for building KalshiAlpha's risk management layer.
  - **Distributed trading team provisioning** — multiple traders with different access levels; reference if KalshiAlpha becomes multi-user.
  - **Strategy execution engine design** — clean separation of strategy logic from execution routing; architectural reference.
- **Low activity — reference architecture only; do not depend on.**

---

## 7. Notable Abandoned Projects (Historical Reference Only)

### Gekko (ARCHIVED)
- **Repo:** https://github.com/askmike/gekko
- **Stars:** 10,200 | **Status:** ARCHIVED Feb 2020
- **Stack:** JavaScript, Node.js, Vue.js
- **Note:** Historically important as one of the first open source crypto trading bots with a web UI. Community forks exist but are unmaintained. **Do not use as a dependency.** Reference only for UI layout ideas from the web dashboard.

### Zipline / Quantopian (ABANDONED)
- **Repo:** https://github.com/quantopian/zipline
- **Stars:** 19,400 | **Status:** ABANDONED Oct 2020
- **Note:** Quantopian shut down. **Use zipline-reloaded fork instead** (see section 3 above). This repo exists for historical reference; all active development is in the community fork.

---

## 8. Direct-Access GUI Trading Terminals (DAS Trader Equivalents)

This category covers terminals built for human, manual trading — order entry panels, Level 2/DOM, time & sales, hotkeys, positions and P&L — as opposed to algo/bot frameworks. **This is the most relevant category for KalshiAlpha's front-end UI design.**

> **Key finding:** No fully open source terminal replicates DAS Trader Pro / Sterling Trader for US equities out of the box. The gap is structural — Level 2 data (NYSE TotalView, Nasdaq) requires expensive licensing incompatible with open source distribution. The closest options are below.

---

### Flowsurface
- **Repo:** https://github.com/flowsurface-rs/flowsurface
- **Stars:** Active | **Status:** Actively maintained (2024-2025)
- **Stack:** Rust, native cross-platform desktop (Windows, macOS, Linux)
- **Markets:** Crypto (Binance, Bybit, Hyperliquid, OKX via WebSocket)
- **License:** Open source
- **What it has:**
  - Level 2 / DOM (Depth of Market) price ladder — scrolling, real-time
  - Time & Sales — scrollable live tape of executed trades
  - Candlestick, heatmap, footprint, and comparison charts
  - Multi-window persistent layouts, customizable themes, sound effects
  - Native performance (Rust); no Electron overhead
- **What it lacks:** No order entry, no position tracking, no P&L, no watchlists, no hotkeys for execution. Visualization only.
- **Relevant Use Cases for KalshiAlpha:**
  - **Primary reference for the Level 2 / order book display UI** — the DOM layout, color coding, and price ladder interaction is directly applicable to a Kalshi order book panel.
  - **Time & Sales (tape) component** — reference how the scrollable trade feed is rendered and updated in real time; adapt for Kalshi matched trades.
  - **Heatmap chart** — visualize historical order book liquidity over time on Kalshi contracts; novel and useful for prediction markets.
  - **Footprint chart** — show buy vs sell volume at each price (probability) level within a candle; directly applicable to Kalshi contract price history.
  - **Rust native performance** — if KalshiAlpha has a native desktop mode, Rust + Iced/egui (what Flowsurface likely uses) is the reference stack.
- **This is the best open source reference for DOM/tape UI components.**

---

### VisualHFT
- **Repo:** https://github.com/visualHFT/VisualHFT
- **Stars:** Active | **Status:** Active (2024)
- **Stack:** C# / WPF (Windows desktop)
- **Markets:** Crypto (Binance, Bitfinex, Coinbase, Gemini, Kraken, KuCoin)
- **License:** Open source
- **What it has:**
  - Real-time limit order book visualization
  - Multi-venue price charts
  - Order flow analytics: VPIN, LOB Imbalance, Market Resilience, OTT Ratio
  - Plugin-based architecture for extensibility
  - Rules-based trigger/alert engine
- **What it lacks:** No order entry, no position tracking, no P&L, no watchlists, no hotkeys.
- **Relevant Use Cases for KalshiAlpha:**
  - **LOB (Limit Order Book) imbalance calculation** — measure buy vs sell pressure in the Kalshi order book; use as a real-time signal.
  - **VPIN (Volume-Synchronized Probability of Informed Trading)** — detect informed order flow in Kalshi markets; useful alpha signal for prediction markets.
  - **Market Resilience metric** — how quickly the Kalshi order book recovers after a large trade; useful for market quality monitoring.
  - **Plugin architecture** — reference how they allow adding new analytics without modifying core; use same pattern for KalshiAlpha analytics panels.
  - **WPF charting patterns** — if KalshiAlpha has a Windows desktop mode, reference the WPF data binding and rendering patterns.

---

### StockSharp Terminal (S# Terminal)
- **Repo:** https://github.com/StockSharp/StockSharp (S#.Shell framework)
- **Terminal:** https://stocksharp.com/store/trading-terminal/
- **Stars:** 9,200 | **Status:** Actively maintained
- **Stack:** C# (.NET / WPF), Windows desktop
- **Markets:** Stocks, Futures, Options, Forex, Crypto (50+ exchanges/brokers)
- **License:** Apache 2.0 (framework + Shell); Terminal binary is free
- **What it has (the most complete open source manual trading terminal):**
  - Order entry panel — market, limit, stop, algorithmic orders from a dedicated window or directly from charts
  - Level 2 / Order Book — two-column bid/ask display, color-coded background, sparse and grouped views, bubble-style tick chart
  - Time & Sales / Tape — tick trade display alongside the order book
  - Candlestick charts with chart trading (click to place orders on chart)
  - 9 candle types: Volume, Tick, Range, P&F, Renko, Cluster (footprint), Box
  - Volume Profile
  - 70+ technical indicators
  - Positions and P&L tracking
  - Connects to: Interactive Brokers, Rithmic, IQFeed, Alpaca, Binance, OKX, FIX/FAST, Tradovate, CQG, OANDA, FXCM, E*Trade, LMAX, Polygon.io, and 40+ more
  - S#.Shell: fully open source graphical framework with complete C# source code
- **Relevant Use Cases for KalshiAlpha:**
  - **S#.Shell as a UI framework skeleton** — if building a C#/WPF desktop terminal, fork S#.Shell and replace the connectors with a Kalshi API adapter. This is the fastest path to a DAS-style terminal.
  - **Order book display component** — reference the two-column bid/ask layout with background color intensity proportional to size; apply to Kalshi YES/NO order books.
  - **Chart trading implementation** — click on a chart at a price level to fire a limit order; adapt for Kalshi (click at a probability level to place a contract order).
  - **Candle type variety** — footprint/cluster candles applied to Kalshi probability price series reveal volume distribution at each probability level; directly useful.
  - **Volume Profile on probability axis** — show where the most contracts traded across a probability range; novel and useful for Kalshi.
  - **Multi-broker connector architecture** — abstracted connector interface; implement Kalshi as a connector using the same interface so future prediction market venues plug in identically.
- **This is the strongest foundation if building a desktop terminal in C#.**

---

### VeighNa Trader GUI
- *(See full entry in Section 1 — VeighNa)*
- **Summary for manual trading:** VeighNa's desktop GUI (PyQt5) includes order entry, positions, P&L, and real-time K-line charts. Full Level 2 is available via the CTP connector (Chinese futures). Less polished for Western markets but MIT licensed and directly borrowable.

---

### trade-frame (rburkholder)
- **Repo:** https://github.com/rburkholder/trade-frame
- **Stars:** Developer project | **Status:** Actively maintained (Linux/Debian)
- **Stack:** C++17, wxWidgets GUI
- **Markets:** US Equities, Futures, Options (IQFeed data + Interactive Brokers execution)
- **License:** GNU GPL
- **What it has:**
  - `DepthOfMarket` application — Level 2 price ladder with order entry via IB
  - `LiveChart` — real-time charting
  - `ComboTrading` — options strategy management with Greeks
  - `IndicatorTrading` — indicator-based trade management
  - Position and portfolio tracking
  - IQFeed + Interactive Brokers connectivity
- **What it lacks:** Not a polished end-user product. Requires compilation. Developer toolkit.
- **Relevant Use Cases for KalshiAlpha:**
  - **DepthOfMarket app** — the only open source Level 2 + IB order entry implementation for US markets; study the DOM-to-OMS connection code.
  - **C++ DOM implementation** — if KalshiAlpha needs extreme latency performance in a DOM component, reference this native C++ implementation.
  - **Options Greeks in a trading GUI** — reference how real-time Greeks are computed and displayed alongside position data; adapt for Kalshi implied probability derivatives.
  - **IQFeed integration pattern** — IQFeed has the most reliable historical tick data; reference the connector for pulling Kalshi-correlated asset data.

---

### EclipseTrader (ABANDONED — Reference Only)
- **SourceForge:** https://sourceforge.net/projects/eclipsetrader/
- **Status:** ABANDONED since January 2013
- **Stack:** Java, Eclipse RCP
- **What it had:** Full GUI trading terminal with Level 2, intraday and historical charts, news feed, order entry, automated trading, extensible plugins. The closest historical open source equivalent to DAS Trader.
- **Relevant Use Cases for KalshiAlpha:**
  - **Conceptual reference only** — demonstrates that a full open source Level 2 + order entry terminal is architecturally achievable.
  - **Eclipse RCP dockable panel pattern** — the windowing/layout system (dockable, resizable panels like DAS Trader's workspace) is worth studying even though the project is dead.
- **Do not use as a dependency. Reference architecture only.**

---

### Free Proprietary Terminals with Open SDK (Not Open Source, But Notable)

#### Quantower
- **Website:** https://www.quantower.com
- **Open SDK:** https://github.com/Quantower/Examples (C#)
- **What it has:** The closest feature-complete free equivalent to DAS Trader — DOM trader (price ladder), order entry, time & sales, footprint charts, volume profile, chart trading, 60+ brokers. Free through AMP Futures (futures market).
- **KalshiAlpha relevance:** Study Quantower's UX and layout as the target design bar for what a polished DOM/tape/chart terminal looks like. Use the open SDK examples as reference for custom panel implementation patterns.

#### CScalp
- **Website:** https://cscalp.net
- **What it has:** Free Windows scalping terminal (12,000+ daily users), order book, tape, cluster charts, fast order entry. Crypto only. Closed source.
- **KalshiAlpha relevance:** Study the UX for a lean, fast-entry scalping interface. The order book + tape side-by-side layout is directly applicable to a Kalshi scalping view.

---

## 9. Priority Recommendations for KalshiAlpha Build

Ordered by immediate applicability:

| Priority | Source | What to Pull |
|---|---|---|
| **1** | TradingView Lightweight Charts | Primary charting library — implement first |
| **2** | Flowsurface | DOM/Level 2 price ladder UI, Time & Sales tape component, footprint/heatmap chart design |
| **3** | StockSharp (S#.Shell) | Full desktop terminal skeleton; order book layout, chart trading, candle types, connector interface |
| **4** | OpenAlgo | REST API structure, ZeroMQ bus, React UI patterns, paper trading mode |
| **5** | NautilusTrader | Prediction market adapter patterns, event-driven OMS architecture, order type handling |
| **6** | Freqtrade | Paper trading abstraction, FreqAI ML module pattern, Telegram bot control |
| **7** | CCXT | Unified API client interface pattern; WebSocket reconnect logic; normalized data schemas |
| **8** | Jesse | Multi-symbol backtest engine, Optuna optimization, in-browser strategy editor |
| **9** | QuantLib | Binary option pricing, Greeks for Kalshi contracts, Kelly sizing inputs |
| **10** | VectorBT | Vectorized backtesting for fast parameter search |
| **11** | Hummingbot | Market making + arbitrage strategies for Kalshi YES/NO spreads and cross-venue arb |
| **12** | VisualHFT | LOB imbalance, VPIN, order flow analytics — alpha signals for Kalshi |
| **13** | trade-frame | DOM + IB order entry reference (C++); IQFeed integration pattern |
| **14** | ticker (TUI) | CLI/TUI dashboard mode, keyboard navigation patterns |

---

## 9. Data Sources Referenced Across Platforms

| Source | Type | Used By | Kalshi Relevance |
|---|---|---|---|
| Yahoo Finance | Equity/Crypto prices | Backtrader, VectorBT, ticker | Underlying asset price feeds for correlated Kalshi event markets |
| Polygon.io | Equity tick data | StockSharp, Zipline-Reloaded | High-quality historical data for correlated underlying assets |
| Databento | Multi-asset tick data | NautilusTrader | Institutional-grade tick data if KalshiAlpha needs correlated asset feeds |
| Tardis | Crypto tick data | NautilusTrader | CEX order book data for crypto-correlated Kalshi markets |
| CoinGecko / CoinMarketCap | Crypto prices | cointop | Crypto price feeds for crypto-correlated Kalshi markets |
| AlphaVantage | Stocks, Forex, Crypto | tstock | Free-tier market data API (500 calls/day) |
| Kalshi REST API | Event market data | — | Primary data source; historical prices, orderbook, fills |
| Kalshi WebSocket API | Real-time event data | — | Primary streaming data source; feed into Lightweight Charts |

---

## 10. Price Ladder / Order Book Tools

The open source landscape for dedicated price ladder trading tools is thin — most production DOM tools (Jigsaw Trading, CScalp, Bookmap) are commercial. What exists in open source breaks into three layers: UI visualization components, backend matching engines, and hotkey-driven execution tools. All three layers are needed for KalshiAlpha's DOM panel.

---

### mihailgaberov/orderbook ← Best UI Reference
- **Repo:** https://github.com/mihailgaberov/orderbook
- **Stars:** 334 | **Status:** Active | **License:** MIT
- **Stack:** React, TypeScript (98.6%), WebSockets (`react-use-websocket`), SASS
- **Live demo:** orderbook-mihailgaberov.vercel.app
- **What it has:**
  - Dual-sided bid/ask price ladder — price levels with size and cumulative total columns
  - Depth visualization — colored background bars proportional to size at each level (the standard DOM depth fill)
  - **Adjustable price level grouping** — combine levels by configurable tick size (e.g. 0.5, 1, 2.5); rounds down to nearest group size
  - Market switching — toggle between feeds with automatic grouping recalculation
  - Kill/restart button — pause and resume the WebSocket stream
  - Real-time WebSocket feed from Kraken; fully live, not mocked
- **What it lacks:** No order entry, no hotkeys, no position display. Visualization only.
- **KalshiAlpha use:**
  - **Primary UI reference for the KalshiAlpha DOM component.** The depth fill bar pattern, cumulative size column, and grouping control are exactly what the Kalshi YES/NO ladder needs.
  - The grouping logic (round price levels to nearest tick size) maps directly to Kalshi's 1-cent tick — implement a "group by 2¢, 5¢, 10¢" control for low-liquidity markets.
  - The kill/restart pattern is useful for the reconnect button in the terminal when the WebSocket drops.
  - Replace the Kraken WebSocket feed with the Kalshi `orderbook_delta` channel; apply the YES/NO inversion algorithm before rendering.
  - The cumulative total column is essential for DOM usability — shows the total contracts available up to each price level.

---

### fasenderos/nodejs-order-book ← Backend Matching Engine
- **Repo:** https://github.com/fasenderos/nodejs-order-book
- **Stars:** 194 | **Status:** Actively maintained (1,074 commits, Feb 2026) | **License:** MIT
- **Stack:** TypeScript, Node.js, CircleCI
- **Performance:** 300,000+ trades/second on 11th Gen Intel i7
- **What it has:**
  - Full limit order book implementation with price-time priority matching
  - Order types: limit, market, stop-limit, stop-market, OCO
  - Time-in-force: GTC, FOK, IOC
  - Post-only orders, order modification, cancellation
  - Snapshot and journaling for server recovery
  - Price-level organization with FIFO order queues per level
  - `limit()`, `market()`, `stopLimit()`, `stopMarket()`, `oco()`, `modify()`, `cancel()` API
- **KalshiAlpha use:**
  - **Backend order book engine for paper trading / simulation mode.** Run a local order book that mirrors Kalshi's state for simulating fills without sending live orders.
  - Use to power KalshiAlpha's paper trading mode — feed it Kalshi `orderbook_delta` snapshots to maintain a live local book, then simulate order matching locally.
  - The snapshot/journal feature enables persisting the local book state across restarts.
  - Reference the price-time priority matching logic when building KalshiAlpha's queue position display.

---

### joaquinbejar/OrderBook-rs ← High-Performance Analytics Engine
- **Repo:** https://github.com/joaquinbejar/OrderBook-rs
- **Stars:** 296 | **Status:** Active development | **License:** MIT + Apache 2.0
- **Stack:** Rust
- **Performance:** 200,000+ operations/second across 30 concurrent threads (Apple M4 Max)
- **What it has:**
  - Lock-free architecture using atomics and concurrent data structures
  - Order types: limit, iceberg, post-only, FOK, IOC, and more
  - Thread-safe price levels with concurrent modification
  - Built-in analytics: **VWAP, spread analysis, micro price estimation, order book imbalance detection, market impact simulation**
  - DashMap (O(1) order lookups by ID) + SegQueue (FIFO matching order)
- **KalshiAlpha use:**
  - **Order flow analytics layer.** The built-in imbalance detection, VWAP, and micro price estimation are directly usable as scanner signals on Kalshi order books.
  - Order book imbalance (bid qty vs ask qty at top N levels) is a real-time alpha signal — surface this in the KalshiAlpha DOM as a colored imbalance indicator.
  - Micro price estimation gives a fair value estimate between the YES bid and YES ask; use as the "true price" display in the terminal header.
  - If KalshiAlpha needs a native performance tier, compile this to WASM or call it from a Node.js native addon.

---

### nawwa_scalper_terminal ← Hotkey Execution Reference
- **Repo:** https://github.com/CryptoNawwa/nawwa_scalper_terminal
- **Stars:** 48 | **Status:** Last active Feb 2023 | **License:** Not specified
- **Stack:** TypeScript, Node.js, Yarn; pre-built binaries for Windows/macOS/Linux
- **Exchanges:** Binance, Bybit
- **What it has:**
  - **Scale orders** — place a ladder of reduce-only limit orders distributed across a % range from entry; configurable count and range
  - **Auto Take-Profit (ATP)** — detects new positions on any pair and automatically places configured TP orders
  - **Customizable command shortcuts** via JSON config — map any action to a short alias
  - Command history (arrow keys) and tab autocomplete in the CLI
  - Seamless exchange switching with persistent API key storage
  - Pre-built binaries — no build step for end users
- **KalshiAlpha use:**
  - **Reference for the scale-order feature** — placing a ladder of limit orders at evenly distributed probability levels (e.g. place 5 limit buys between 35¢ and 45¢ in 2¢ increments) is a high-value terminal feature for Kalshi.
  - The ATP pattern maps to a Kalshi equivalent: auto-place a take-profit limit when a contract position opens (e.g. if bought at 40¢, auto-post a sell at 55¢).
  - The JSON shortcut/alias config is a clean pattern for KalshiAlpha's hotkey system — map keyboard shortcuts to order actions in a user-editable config file.

---

### Landscape Summary

| Project | Stars | Layer | Key Value for KalshiAlpha |
|---|---|---|---|
| mihailgaberov/orderbook | 334 | UI visualization | Depth fill bars, grouping control, cumulative column — copy the DOM layout |
| joaquinbejar/OrderBook-rs | 296 | Analytics engine (Rust) | Imbalance detection, VWAP, micro price — DOM signal overlays |
| fasenderos/nodejs-order-book | 194 | Backend engine (TS) | Paper trading engine; local order book simulation; queue position logic |
| nawwa_scalper_terminal | 48 | Execution CLI | Scale order ladder pattern; ATP auto-orders; hotkey config system |

> **Note on the gap:** No single open source project delivers a complete interactive price ladder with order entry, hotkeys, DOM visualization, and position display equivalent to Jigsaw Trading or CScalp. KalshiAlpha will need to assemble this from the layers above: mihailgaberov/orderbook for the DOM UI, fasenderos for the backend engine, and nawwa_scalper_terminal for the scale-order and hotkey patterns.

---

## 11. Kalshi API Integration Spec

Translated from the Kalshi Architectural Blueprint (internal PDF, Feb 2026). Stripped of prose — structured for direct implementation use.

---

### Environments

| Environment | REST Base URL | WebSocket URL |
|---|---|---|
| **Production** | `https://api.elections.kalshi.com/trade-api/v2` | `wss://api.elections.kalshi.com/trade-api/ws/v2` |
| **Demo** | `https://demo-api.kalshi.co/trade-api/v2` | `wss://demo-api.kalshi.co/trade-api/ws/v2` |

> **Note:** The `elections` subdomain in the production URL is a misnomer — it is the master gateway for **all** market categories (economics, climate, sports, technology, etc.). Route all production requests through it regardless of market type. Code is identical between environments; only the base URL changes at deploy time.

---

### Authentication

Every HTTP request and WebSocket handshake requires three headers. No exceptions.

| Header | Value |
|---|---|
| `KALSHI-ACCESS-KEY` | Your static Key ID (UUID format, e.g. `a952bcbe-ec3b-4b5b...`) |
| `KALSHI-ACCESS-TIMESTAMP` | Current Unix epoch in **milliseconds** (not seconds) |
| `KALSHI-ACCESS-SIGNATURE` | Base64-encoded RSA-PSS + SHA-256 signature |

**Signature construction — exact steps:**

1. Get current timestamp in milliseconds as a string
2. Concatenate: `timestamp + HTTP_METHOD + path`
3. Example for `GET /trade-api/v2/portfolio/orders?limit=5`:
   - Sign string = `"1708800000000" + "GET" + "/trade-api/v2/portfolio/orders"`
   - **Query parameters are excluded from the signing string** — this is the #1 cause of `HTTP 401` errors
4. Sign the concatenated string using your RSA private key (`.key` / `.pem`) with RSA-PSS + SHA-256
5. Base64-encode the resulting signature bytes → put in `KALSHI-ACCESS-SIGNATURE`

**Key management rules:**
- Private key is never stored by Kalshi — only your Key ID is on their servers
- Store the private key in encrypted env vars or an HSM — never in source code
- If the key is compromised, immediately revoke it via the API dashboard and generate a new pair
- WebSocket auth: same headers are sent during the initial HTTP upgrade handshake, not after connection

**Public vs private channels:** Public WebSocket channels (ticker, trade, lifecycle) technically work without auth headers. Private channels (user_orders, user_fills, market_positions) require them. Best practice: always include auth headers on all connections.

---

### Market Data Hierarchy

Kalshi data is structured in three tiers. Understanding this is required before building the scanner.

```
Series  →  Event  →  Market
```

| Tier | What it is | Example |
|---|---|---|
| **Series** | Recurring template; defines rules, settlement sources, category | "Federal Reserve Interest Rate Decisions" |
| **Event** | Specific real-world instance of a Series | "Fed Rate Decision — Sep 14" |
| **Market** | Tradable binary outcome within an Event | "Will the Fed raise rates by ≥25bps?" |

- Order books exist **only at the Market level**
- All trade execution happens at the Market level
- Events are used to group Markets in the scanner UI (e.g. all 2026 Midterm contracts under one header)

---

### The YES/NO Inversion — Core Concept

**Every price in the system is in whole cents: $0.01 to $0.99.**

A Kalshi contract settles at $1.00 (YES wins) or $0.00 (NO wins). YES and NO are mathematical inverses: `YES_price + NO_price = 100`.

Buying NO at 30¢ is economically identical to shorting YES at 70¢.

To render a standard bid/ask DOM, the terminal must merge both sides using this conversion table:

| Raw API Order | Raw Price | Synthetic DOM | Implied Price | Logic |
|---|---|---|---|---|
| YES Bid (resting) | 60¢ | YES Bid | 60¢ | Direct display — buyer willing to pay 60¢ for YES |
| NO Bid (resting) | 30¢ | YES Ask | 70¢ | Buyer of NO at 30¢ implies seller of YES at 70¢ (`100 - 30`) |
| YES Ask (resting) | 65¢ | YES Ask | 65¢ | Direct display — seller willing to sell YES at 65¢ |
| NO Ask (resting) | 35¢ | YES Bid | 65¢ | Seller of NO at 35¢ implies buyer of YES at 65¢ (`100 - 35`) |

**OMS translation rule:** If a user clicks "Sell YES at 70¢" in the terminal UI, the OMS must send `{ side: "no", action: "buy", yes_price: 30 }` to the API. The UI speaks synthetic YES; the API speaks native dual-sided. The abstraction layer between them is mandatory.

---

### Scanner — REST Initialization Sequence

Run these calls in order on scanner startup:

**Step 1 — Load taxonomy (filter dropdowns)**
```
GET /search/tags_by_categories
```
Returns all category → tag mappings. Use to build the scanner's category/tag filter UI dynamically. Do not hardcode categories.

**Step 2 — Load series (asset class filter)**
```
GET /series-list
```
Filter by category (sports, politics, economics, weather). Capture `series_ticker` from each result — used to filter the market feed in Step 4.

**Step 3 — Load events (grouping)**
```
GET /events
```
Use to cluster individual markets under a parent event in the scanner UI (e.g. show all "2026 Midterms" contracts collapsed under one row).

**Step 4 — Load markets (main scanner feed)**
```
GET /markets?limit=1000
```
Returns: `yes_bid`, `no_bid`, `last_price`, `volume`, `open_interest` per market. Use cursor-based pagination — **not offset pagination**.

**Cursor pagination pattern:**
```
1. GET /markets?limit=1000
2. Response includes array of markets + cursor string
3. If cursor != empty: GET /markets?limit=1000&cursor=<string>
4. Merge into local store, repeat until cursor is empty
```
Offset pagination will skip or duplicate records in volatile markets. Never use it here.

**Step 5 — Load candlesticks (24h % change, sparklines)**
```
GET /market/candlesticks (batch endpoint)
```
- Accepts up to **100 tickers per request**
- Use `period_interval=1440` (daily) for 24h % change columns
- Formula for 24h change: `(close_of_most_recent_candle - previous_price) / previous_price`
- Candle fields: `open`, `high`, `low`, `close`, `mean`, `previous` — all in cents
- Use `period_interval=1` or `60` for intraday sparkline data in scanner rows

**Step 6 — Load recent trades (activity indicators)**
```
GET /market/trades
```
Returns `trade_id`, `price`, `count`, `taker_side`. Use to populate "recent activity" columns before WebSocket takes over.

---

### Scanner Filter Compatibility Matrix

The API enforces strict rules on which timestamp filters can be combined with which market statuses. Violating these returns `HTTP 400` and crashes the scanner feed.

| Filter Parameter | Compatible Status Values | Notes |
|---|---|---|
| `min_created_ts` / `max_created_ts` | `unopened`, `open`, or empty | Creation time filter. Fails if combined with `settled`. |
| `min_close_ts` / `max_close_ts` | `closed` or empty | Trading cessation filter. |
| `min_settled_ts` / `max_settled_ts` | `settled` or empty | Settled markets only. |
| `min_updated_ts` | Must use `mve_filter=exclude` | Tracks metadata changes. Incompatible with all other status filters. |

Enforce these exclusions in the scanner's query builder before the request is sent.

---

### Scanner — WebSocket Real-Time Hydration

After the REST initialization is complete, switch to WebSocket for all live updates. Do not continue polling REST.

**Channel 1: `ticker`**
- Subscribe with a list of `market_tickers`
- Receive: `yes_bid`, `no_bid`, `last_price`, `volume`, and fixed-point size fields (`yes_bid_size_fp`, `last_trade_size_fp`)
- Scanner rows update on price change **and** on liquidity depth change (size fields) even when price is flat

**Channel 2: `market_lifecycle_v2`**
- Subscribe once (global — no ticker list needed)
- Receive state transitions for every market: `created` → `activated` → `deactivated` → `close_date_updated` → `determined` → `settled`
- Payload includes `event_type` string and `additional_metadata` (strike type, exact rules, floor strikes)
- Use to power "New Markets" and "Halted Markets" scanner alerts
- **KXMVE prefixed tickers (multivariate/combo markets) are automatically filtered out of this channel** — no action needed

---

### Terminal — Order Book State Machine

Do not just open the WebSocket and listen to deltas. The correct initialization sequence is:

**Step 1 — Subscribe to `orderbook_delta` for the selected market ticker**

The Kalshi server automatically sends an `orderbook_snapshot` message immediately after subscription acknowledgment — before any deltas. Do not call `GET /market/orderbook` separately unless you need a one-time REST snapshot.

**Step 2 — On snapshot receipt:**
- Allocate two ordered hash maps in memory: `YES_book` and `NO_book`
- Keys = integer cents (1–99)
- Values = aggregate contract quantity at that price
- Snapshot format: arrays of `[price, quantity]` pairs sorted ascending

**Step 3 — On each `orderbook_delta` message:**
- Identify `side` (yes or no) and `price` (integer cents) and `quantity`
- Overwrite the value at that key in the appropriate hash map
- **If `quantity == 0`: delete the key entirely** — do not leave it at zero or the DOM will display phantom liquidity

**Step 4 — After every update:**
- Apply the inversion algorithm to merge YES and NO hash maps into a single synthetic DOM array
- Pass the unified DOM array to the UI rendering thread

**Advanced feature:** The `orderbook_delta` payload includes an optional `client_order_id` field. This is populated only when the book change was caused by the authenticated user's own order. Use this to visually highlight the user's resting liquidity in the DOM without any additional API calls.

**On reconnect:** Clear both hash maps completely. Do not resume processing deltas over stale state. Wait for a fresh snapshot before resuming the UI renderer.

---

### Terminal — Time & Sales and Charting

**Time & Sales tape:**
- WebSocket channel: `trade` (public — auth headers not strictly required but include them anyway)
- Receive: last traded price, size, timestamp for every execution on the exchange
- Feed directly into the scrolling tape component

**Price chart:**
- Initialize with `GET /market/candlesticks` (use 1m or 60m interval)
- Keep current by either:
  - Periodically re-fetching the latest candle via REST, **or**
  - Building the current candle in memory from incoming `trade` WebSocket messages (update `high`, `low`, `close`, `volume` on each trade event)

---

### OMS — Order Entry

**Endpoint:** `POST /trade-api/v2/portfolio/orders`

**Required payload fields:**

| Field | Type | Notes |
|---|---|---|
| `ticker` | String | Exact market ticker, e.g. `FED-23DEC-T3.00` |
| `side` | String | `"yes"` or `"no"` — the native side being traded |
| `action` | String | `"buy"` or `"sell"` |
| `type` | String | `"market"` or `"limit"` |
| `yes_price` | Integer | Limit price **in cents**. **Always expressed as a YES price** even when trading NO. If selling NO at 35¢, `yes_price = 35`. |
| `count_fp` | String | Contract quantity as a fixed-point string, e.g. `"10.00"`. Use decimal parsing — not float arithmetic. |
| `client_order_id` | String | UUIDv4 generated by the client. Required for idempotency. |

**`client_order_id` is mandatory for production:** If a network timeout occurs after the exchange processes the order but before the response arrives, a retry with the same `client_order_id` will return the original order status instead of creating a duplicate position.

**Batch orders:** `POST /trade-api/v2/portfolio/orders/batched`
- Accepts array of up to 20 order objects in one HTTP request
- Use for bracket orders, scaled ladder entries, and multi-level strategies
- All 20 orders are validated and submitted nearly concurrently to the matching engine
- Eliminates 19 TCP/TLS round-trips compared to sequential single orders

---

### OMS — Order Modification and Cancellation

**Amend (price or quantity change):**
```
POST /trade-api/v2/portfolio/orders/{order_id}/amend
```
- Updates price and/or quantity while preserving queue priority
- **Orders cannot be increased in size** — increasing requires cancel + new order (which loses queue position)
- To reduce size only: use the `decrease` endpoint with `reduce_by_fp` or `reduce_to_fp` parameters

**Cancel:**
```
DELETE /trade-api/v2/portfolio/orders/{order_id}
```
- Cancellation sets resting quantity to zero — the order record is not deleted
- The zeroed order object is returned in the response, confirming removal from the book

---

### Portfolio — Initialization on Boot

Run these three REST calls on terminal startup before subscribing to any WebSocket:

**1. Balance**
```
GET /trade-api/v2/portfolio/balance
```
- Returns `balance` (liquid cash) and `portfolio_value` (cash + mark-to-market of open positions)
- **Parse both fields as cents (integer)**. Do not treat as dollars.

**2. Open Positions**
```
GET /trade-api/v2/portfolio/positions?count_filter=position
```
- `count_filter=position` returns only positions where exposure > 0 (excludes closed history)
- Response contains:
  - `market_positions` — individual contract risk per market
  - `event_positions` — aggregated risk across all contracts in an event (use for max drawdown per event)

**3. Fill History**
```
GET /trade-api/v2/portfolio/fills
```
- Returns `fee_cost`, `client_order_id`, `is_taker` (true = taker, false = maker)
- Use for audit log and tax reconciliation

---

### Portfolio — WebSocket Streaming (Private Channels)

Subscribe to all three on terminal startup. Do not poll REST portfolio endpoints during active trading.

**Channel 1: `user_orders`**
- Lifecycle tracker for all of the user's active orders
- Receive state changes: resting → partially filled → filled / canceled
- Payload fields: `remaining_count_fp`, `fill_count_fp`, taker/maker fee costs

**Channel 2: `user_fills`**
- Fires on every execution of the user's orders
- Payload fields: `trade_id`, `count_fp`, `yes_price_dollars`, `post_position_fp` (resulting position size after the fill)

**Channel 3: `market_positions`**
- Fires on PnL changes and when markets settle
- Contains: `position_cost`, `realized_pnl`, `fees_paid`, `position_fee_cost`

> **CRITICAL — Unit mismatch trap:** REST endpoints and order prices use **cents**. The `market_positions` WebSocket stream transmits financial risk fields (`position_cost`, `realized_pnl`, `fees_paid`, `position_fee_cost`) in **centi-cents (1/10,000th of $1)**. Divide these fields by **10,000** before displaying. A raw value of `500000` = **$0.05**, not $500,000. Failure to handle this will corrupt the PnL display and risk engine.

---

### WebSocket Resiliency Rules

| Rule | Detail |
|---|---|
| **Heartbeat** | Send a WebSocket Ping frame (Opcode 0x9) every **30 seconds**. The server responds with Pong (Opcode 0xA). Kalshi also sends server-initiated Ping frames with body `"heartbeat"` — respond immediately with Pong or the session terminates. |
| **On disconnect** | Immediately clear all YES/NO hash maps. Do not resume processing deltas over stale state. Re-subscribe and wait for a fresh `orderbook_snapshot` before resuming the DOM renderer. |
| **Non-blocking I/O** | WebSocket message loops must be non-blocking. If the DOM rendering thread is slow, drop stale price updates rather than backing up the message queue. A slow UI consumer can cause a fatal disconnect if it blocks the WebSocket loop. |
| **Reconnect backoff** | Use exponential backoff on reconnect attempts. Do not hammmer the server on repeated failures. |

---

### Out of Scope for MVP

Do not implement these in the initial build:
- RFQ (Request for Quote) system
- Order Groups (auto-cancel groups)
- Subaccount routing (accounts 1–32)
- Multivariate events (`KXMVE` ticker prefix)

---

## 11. Charting Libraries

Core charting options for rendering probability price history, order flow, and real-time candlestick data in the KalshiAlpha terminal and scanner.

---

### TradingView Lightweight Charts ← Primary Choice
- **Repo:** https://github.com/tradingview/lightweight-charts
- **Stars:** 13,800 | **Status:** Actively maintained (Dec 2025, v5.1.0) | **License:** Apache 2.0
- **Stack:** TypeScript, HTML5 Canvas, npm
- **Size:** ~50 KB — comparable to a static image
- **Chart types:** Line, candlestick, bar, area, histogram, baseline
- **Key features:**
  - Designed for high-frequency streaming data — plug in a WebSocket feed and update in real time
  - Plugin API for custom series types — build a "probability bar" chart type specific to binary contracts
  - 14,700+ dependent projects; most widely integrated financial chart library in the JS ecosystem
  - Mobile-friendly, responsive
- **KalshiAlpha use:**
  - **Implement this first.** It is already the charting standard referenced across OpenAlgo, multiple crypto platforms, and the KalshiAlpha codebase
  - Render Kalshi contract probability price history as candlestick/line/area
  - Build a custom series plugin for a "probability band" visualization (YES price + NO implied price on a single axis)
  - Feed live candles from the `trade` WebSocket channel by updating the current bar's OHLCV fields on each incoming trade

---

### KLineChart
- **Repo:** https://github.com/klinecharts/KLineChart
- **Stars:** 3,600 | **Status:** Actively maintained (v10.0.0-beta1, Nov 2025) | **License:** Apache 2.0
- **Stack:** TypeScript (76%), JavaScript (16%), HTML5 Canvas, zero dependencies
- **Size:** ~40 KB gzipped
- **Chart types:** Candlestick (k-line), line, bar, area; built-in technical indicators; built-in drawing/annotation tools
- **Key features:**
  - Full TypeScript with complete type definitions — drop-in for a TypeScript codebase
  - Zero dependencies — no Lodash, no D3, no external libs
  - Built-in indicator library (MA, EMA, BOLL, MACD, RSI, KDJ, etc.)
  - Drawing tools built in (trend lines, Fibonacci, annotations) — no plugin needed
  - Mobile touch support
  - Rich style configuration API for full visual customization
  - **KLineChart Pro** (`github.com/klinecharts/pro`) — a ready-made full chart UI built on top; Apache 2.0, TypeScript 92%
- **KalshiAlpha use:**
  - Strong alternative to TradingView Lightweight Charts if the team needs **built-in drawing tools** (trend lines, price levels) without writing a plugin
  - KLineChart Pro gives a near-complete chart panel out of the box — use as the starting point for the terminal's chart component and customize for probability axis
  - The built-in indicator library means no separate TA library dependency for chart overlays
  - Drawing tools let traders annotate Kalshi probability charts directly in the terminal (key probability levels, trend lines on the price curve)

---

### uPlot
- **Repo:** https://github.com/leeoniya/uPlot
- **Stars:** 9,900 | **Status:** Actively maintained | **License:** MIT
- **Stack:** JavaScript (73%), ~50 KB minified, zero dependencies
- **Chart types:** Line, area, OHLC bars, time series; pluggable path renderers
- **Performance:**
  - Creates a 166,650-point interactive chart in 25ms from cold start
  - Streams 3,600 points at 60fps using 10% CPU and 12.3 MB RAM
  - Chart.js uses 40% CPU / 77 MB for the same workload; ECharts uses 70% / 85 MB
  - Scales linearly at ~100,000 pts/ms
- **Key features:**
  - Multiple y-axes, scales, and grids — useful for overlaying volume on probability price
  - Cursor sync across multiple charts — sync the terminal's probability chart with a volume chart
  - Live data streaming built in
  - Intentionally excludes animations, stacked series, and data aggregation to stay fast
- **KalshiAlpha use:**
  - **Best choice for the scanner's sparkline columns** — renders thousands of mini probability charts in rows without performance degradation
  - Use for any high-frequency real-time chart where rendering speed is the priority (e.g. a live probability tick chart updating on every trade)
  - Cursor sync makes it ideal for a multi-panel terminal layout where hovering one chart cross-hairs all panels simultaneously
  - MIT license — most permissive of the three; cleanest for commercial use

---

### Charting Library Decision Matrix

| Criterion | TradingView LW Charts | KLineChart | uPlot |
|---|---|---|---|
| **Stars** | 13,800 | 3,600 | 9,900 |
| **License** | Apache 2.0 | Apache 2.0 | MIT |
| **Bundle size** | ~50 KB | ~40 KB gzip | ~50 KB |
| **TypeScript** | Yes | Full (native) | No (JS only) |
| **Built-in indicators** | No | Yes | No |
| **Built-in drawing tools** | Plugin only | Yes (native) | No |
| **Custom series plugins** | Yes | Yes | Pluggable renderers |
| **Streaming/live data** | Yes | Yes | Yes (60fps) |
| **Raw performance** | High | High | Highest |
| **Mobile support** | Yes | Yes | Yes |
| **Ready-made UI (Pro)** | No | Yes (KLineChart Pro) | No |
| **Best for** | Main terminal chart | Terminal chart + drawing tools | Scanner sparklines, tick charts |

**Recommendation:** Use **TradingView Lightweight Charts** as the primary terminal chart (widest ecosystem, most examples). Use **uPlot** for the scanner's sparkline/mini-chart columns and any high-frequency tick displays. Keep **KLineChart** as a drop-in replacement if drawing tool functionality is needed without a custom plugin.

---

## 12. Scanner-Specific Repositories

Focused research on open source market scanners and screeners — tools that filter, sort, and screen instruments in real time. Organized by relevance to KalshiAlpha.

---

### Prediction Market Scanners (Most Relevant)

#### pmxt
- **Repo:** https://github.com/pmxt-dev/pmxt
- **Stars:** 718 | **Status:** Active | **License:** MIT
- **Stack:** TypeScript (78%), Python (11%)
- **Markets:** Polymarket, Kalshi, Limitless, Baozi, Myriad, Manifold, Metaculus, PredictIt
- **Filters:** Keyword search, market matching within events, query param filtering
- **UI:** npm package (`pmxtjs`) + pip package (`pmxt`) — library only, no UI
- **Real-time:** Both REST and WebSocket
- **KalshiAlpha use:** **This is the CCXT equivalent for prediction markets.** 48k+ downloads. Build the KalshiAlpha multi-venue scanner layer on top of this — handles Kalshi + Polymarket + others through a unified interface. Study the normalized Event → Market → Outcome schema.

---

#### dr-manhattan
- **Repo:** https://github.com/guzus/dr-manhattan
- **Stars:** 164 | **Status:** Active | **License:** Not specified
- **Stack:** Python
- **Markets:** Polymarket, Kalshi, Opinion, Limitless, Predict.fun
- **Filters:** Market fetching and programmatic discovery
- **UI:** Backend library only
- **Real-time:** WebSocket streaming + REST
- **KalshiAlpha use:** Python-native alternative to pmxt. Includes MCP server integration — Claude Desktop can query prediction markets directly. Reference for the Python backend client architecture. Dependencies: `requests`, `websockets`, `python-socketio`, `pandas`.

---

#### polymarket-arbitrage (ImMike)
- **Repo:** https://github.com/ImMike/polymarket-arbitrage
- **Stars:** 52 | **Status:** Active | **License:** MIT
- **Stack:** Python, FastAPI
- **Markets:** Polymarket + Kalshi (5,000+ markets)
- **Filters:** Minimum edge threshold (default 1% after fees), spread floor (5¢), position limits, global exposure caps, daily loss limits
- **UI:** FastAPI web dashboard at `localhost:8000` — live opportunity feed
- **Real-time:** Yes — WebSocket streaming for continuous orderbook updates
- **KalshiAlpha use:** **Cross-venue arb scanner** between Kalshi and Polymarket. Uses text similarity (60% threshold) to auto-match equivalent predictions across platforms. Reference for building a Kalshi ↔ Polymarket spread scanner column. WebSocket + live dashboard architecture is directly reusable.

---

#### polyterm
- **Repo:** https://github.com/NYTEMODEONLY/polyterm
- **Stars:** 18 | **Status:** Active | **License:** MIT
- **Stack:** Python
- **Markets:** Polymarket + Kalshi cross-platform comparison
- **Filters:** Volume thresholds, probability range, category, whale wallet activity (70%+ win rate), transaction volume, risk scoring (A–F), arb spread threshold (0.025+), intra-market YES+NO sum under $1.00
- **UI:** TUI (terminal interactive menus)
- **Real-time:** Live monitoring mode (continuous polling) + `--once` batch run + JSON/CSV export
- **KalshiAlpha use:** Best ready-to-use prediction market terminal scanner. Reference for scanner filter criteria design — specifically the whale activity, risk scoring, and arb detection logic. The YES+NO sum < $1.00 filter is a direct Kalshi-applicable arb signal.

---

#### Kalshi-Claw
- **Repo:** https://github.com/Kirubel125/Kalshi-Claw
- **Stars:** 551 | **Status:** Active | **License:** MIT
- **Stack:** TypeScript + Rust (napi-rs bridge)
- **Markets:** Kalshi only
- **Filters:** 24h volume sort, keyword search, hedge opportunity discovery with LLM-powered logic, Kelly criterion position sizing (Rust engine)
- **UI:** CLI with ANSI-formatted terminal output
- **Real-time:** Hybrid — live REST queries + batch hedge scanning
- **KalshiAlpha use:** Kalshi-native scanner with Kelly sizing already implemented in Rust. Reference the hedge discovery logic and Kelly criterion implementation. The TypeScript + Rust napi-rs architecture is a useful pattern if KalshiAlpha needs performance-critical computation in a JS/TS codebase.

---

#### prediction-market-analysis (Jon-Becker)
- **Repo:** https://github.com/Jon-Becker/prediction-market-analysis
- **Stars:** 2,000 | **Status:** Active | **License:** MIT
- **Stack:** Python
- **Markets:** Polymarket + Kalshi
- **Filters:** Historical batch analysis; claims to be the largest publicly available prediction market dataset
- **UI:** CLI scripts, Parquet/CSV/JSON/PNG/PDF output
- **Real-time:** Batch only — data stored in Parquet via Cloudflare R2
- **KalshiAlpha use:** Historical dataset for building and validating scanner criteria. Use to determine what volume/momentum thresholds are meaningful in prediction markets. Train scanner alert thresholds on this data before going live.

---

#### ryanschwarting/polymarket-api
- **Repo:** https://github.com/ryanschwarting/polymarket-api
- **Stars:** 1 | **Status:** Active | **License:** MIT
- **Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Markets:** Polymarket + Kalshi unified
- **Filters:** Category (Sports, Politics, Crypto, Economy), keyword search, sort by volume or liquidity, active status, pagination
- **UI:** The most polished prediction market web scanner UI found — full Next.js React frontend
- **Real-time:** Polling via Next.js API routes
- **KalshiAlpha use:** **Primary UI reference for the KalshiAlpha scanner page.** Despite only 1 star it has the exact layout — filter sidebar, sortable market table, category chips — that KalshiAlpha needs. Study the component structure and adapt.

---

### Stock Scanner Engines (Architecture Reference)

#### TradingView-Screener
- **Repo:** https://github.com/shner-elmo/TradingView-Screener
- **Stars:** 664 | **Status:** Active | **License:** MIT
- **Stack:** Python
- **Markets:** Stocks, Crypto, Forex, Futures, Bonds (all TradingView instruments)
- **Filters:** 3,000+ fields via SQL-like Python DSL — `col("volume") > 1e6`, `And(col("RSI") < 30, col("close") > col("VWAP"))`. Full boolean logic.
- **UI:** None — returns Pandas DataFrames
- **Real-time:** Batch by default (15min delay); live with TradingView session cookie
- **KalshiAlpha use:** Reference the SQL-like filter DSL design — use the same `col("yes_bid") > 50`, `And(col("volume") > 1000, col("close_pct_change") > 0.1)` syntax pattern for KalshiAlpha's programmatic scanner API.

---

#### xang1234/stock-screener
- **Repo:** https://github.com/xang1234/stock-screener
- **Stars:** ~2 | **Status:** Active | **License:** Not specified
- **Stack:** Python (FastAPI, SQLAlchemy, Celery, Redis), React 18 + Material UI + TanStack Table + Recharts + Lightweight Charts
- **Markets:** US equities
- **Filters:** 80+ filters across Fundamental, Technical, Rating categories. Pre-built screens: Minervini Trend Template, CANSLIM, IPO Scanner, Volume Breakthrough
- **UI:** Full React frontend — `/scan`, `/breadth`, `/groups`, `/themes`, `/chatbot` routes
- **Real-time:** Celery + Redis task queue; atomic pointer-swap for result publication
- **KalshiAlpha use:** **Most complete full-stack screener architecture reference.** FastAPI + Celery + Redis + React + TanStack Table is the exact stack to consider for KalshiAlpha's scanner backend. The atomic pointer-swap pattern for publishing scan results is directly applicable to a real-time scanner feed.

---

#### UnusualVolumeDetector
- **Repo:** https://github.com/SamPom100/UnusualVolumeDetector
- **Stars:** 978 | **Status:** Active | **License:** MIT
- **Stack:** Python + HTML/JS
- **Markets:** All equities
- **Filters:** Volume exceeding N standard deviations from 5-month historical mean within last 3 days. Configurable: lookback period, alert window, std deviation threshold, thread count
- **UI:** Python backend + HTML/JS web interface with graphing
- **Real-time:** Batch scan runs
- **KalshiAlpha use:** Reference the statistical volume spike detection algorithm — adapt for Kalshi contract volume anomalies. The std-deviation-from-historical-mean approach is directly applicable to detecting unusual contract activity.

---

#### PKScreener
- **Repo:** https://github.com/pkjmesra/PKScreener
- **Stars:** 316 | **Status:** Active | **License:** MIT
- **Stack:** Python, Telegram bot, Docker
- **Markets:** NSE India + limited NASDAQ
- **Filters:** 40+ scan strategies: RSI, MACD, CCI, ATR, VCP, consolidation, S/R testing, volume ratio, MA alignment, candlestick patterns
- **UI:** CLI menu + Telegram push alerts
- **Real-time:** Both — scheduled batch and on-demand
- **KalshiAlpha use:** Reference the **piped multi-condition scan** architecture — chain multiple filter passes rather than one giant query. Also reference the Telegram alert delivery system for KalshiAlpha's notification layer.

---

#### hackingthemarkets/candlestick-screener
- **Repo:** https://github.com/hackingthemarkets/candlestick-screener
- **Stars:** 630 | **Status:** Active | **License:** Not specified
- **Stack:** Python, Flask, TA-Lib, HTML
- **Markets:** Generic OHLCV (equities + crypto)
- **Filters:** TA-Lib candlestick patterns (Doji, Hammer, Engulfing, Shooting Star, Morning Star, etc.)
- **UI:** Flask web app with HTML dashboard
- **Real-time:** Batch/on-demand
- **KalshiAlpha use:** Apply TA-Lib candlestick pattern detection to Kalshi probability price series — e.g. detect a "bullish engulfing" pattern on a contract's probability chart as a scanner signal.

---

### Crypto Scanners (Real-Time Architecture Reference)

#### BinanceScanner
- **Repo:** https://github.com/cryptokrishtopher/binancescanner
- **Stars:** 99 | **Status:** Active
- **Stack:** Python, python-binance
- **Markets:** Binance (BTC, USDT, ETH, BNB pairs)
- **Filters:** Volume threshold (BTC-denominated), price diff %, volume diff % — all configurable
- **UI:** CLI with colorama color output
- **Real-time:** Yes — continuous WebSocket streaming via python-binance
- **KalshiAlpha use:** Reference for a **real-time WebSocket scanner loop** — the continuous monitoring pattern (subscribe → receive → evaluate → alert) is the exact pattern KalshiAlpha's scanner needs over the Kalshi `ticker` WebSocket channel.

---

#### CryptoScanBot
- **Repo:** https://github.com/CryptoMarius/CryptoScanBot
- **Stars:** 31 | **Status:** Active
- **Stack:** C# (.NET), WinForms
- **Markets:** Binance, Bybit, KuCoin, MEXC, OKX, Kraken, Hyperliquid (spot + futures)
- **Filters:** STOBB (oversold), SBM (strategy signals), JUMP (momentum), Fair Value Gap (FVG), dominant zone visualization
- **UI:** WinForms desktop app
- **Real-time:** Yes — exchange WebSocket streams
- **KalshiAlpha use:** Reference the **Fair Value Gap (FVG) detection** algorithm — adapt for detecting price gaps in Kalshi contract probability history. Also reference WinForms scanner layout if building a C# desktop scanner.

---

#### Gunbot Quant
- **Repo:** https://github.com/GuntharDeNiro/gunbot-quant
- **Stars:** 38 | **Status:** Active | **License:** MIT
- **Stack:** React + Vite (frontend), FastAPI + Python (backend)
- **Markets:** 13+ crypto exchanges via Gunbot + 20+ via CCXT; stocks/ETFs via Yahoo Finance
- **Filters:** RSI, Stochastic RSI, ADX, SMA positioning, 30-day avg volume, volume concentration %, volatility consistency, price-to-SMA ratios, liquidity thresholds
- **UI:** React + Vite frontend with FastAPI backend — the only open source crypto scanner with a proper React frontend
- **Real-time:** Batch-oriented with manual run trigger
- **KalshiAlpha use:** **Best React + FastAPI scanner architecture reference for crypto.** The frontend filter panel and results table design maps directly to what KalshiAlpha needs. Study how they pass filter params from React state → FastAPI query → scan engine → results table.

---

### Scanner UI Components (Frontend Building Blocks)

#### openstatusHQ/data-table-filters
- **Repo:** https://github.com/openstatusHQ/data-table-filters
- **Stars:** 1,900 | **Status:** Active | **License:** MIT
- **Stack:** TypeScript, Next.js, TanStack Table, TanStack Query, Zustand, shadcn/ui, nuqs, cmdk, dnd-kit
- **What it is:** The most directly reusable scanner table UI component. Advanced filter + sort patterns inspired by Datadog/Vercel dashboards.
- **Features:**
  - Paginated table with client-side filtering (Zustand state)
  - Infinite-scroll with server-side operations (URL state via `nuqs`)
  - Command-palette search (`cmdk`) — type to filter any column
  - Drag-and-drop column customization (`dnd-kit`)
  - BYOS adapter for swappable state management
  - shadcn/ui components throughout
- **KalshiAlpha use:** **Copy this component directly as the KalshiAlpha scanner table base.** Replace status data with Kalshi market data. The column filter panel, command palette search, and URL-synced filter state are exactly what a prediction market scanner needs.

---

#### TanStack Table
- **Repo:** https://github.com/TanStack/table
- **Stars:** 25,000+ | **Status:** Active | **License:** MIT
- **Stack:** TypeScript, framework-agnostic (React, Vue, Solid, Svelte)
- **What it is:** Headless table engine. Multi-column sort, global + column-level filtering, row virtualization (critical for 5,000+ Kalshi markets), custom sort functions, fuzzy matching.
- **KalshiAlpha use:** **The correct underlying table engine for the scanner.** Pair with `data-table-filters` above for a complete scanner table solution. Row virtualization handles the full Kalshi market count without performance degradation.

---

#### AG Grid Community
- **Repo/Site:** https://www.ag-grid.com
- **Stars:** 14,000+ | **Status:** Active | **License:** MIT (Community)
- **What it is:** Canvas-based data grid for real-time streaming rows — renders 100+ updates/second without full DOM re-render.
- **KalshiAlpha use:** Alternative to TanStack Table if scanner rows need to update at very high frequency (e.g. during a major event when all contract probabilities are moving simultaneously). AG Grid is used in production financial terminals (see Open Trading Platform in Section 6). Consider if TanStack Table shows performance issues at scale.

---

### Scanner Design Patterns to Adopt

These patterns emerge from reviewing all the above projects:

| Pattern | Source(s) | How to Apply to KalshiAlpha |
|---|---|---|
| **SQL-like filter DSL** | TradingView-Screener | `col("volume") > 1000 AND col("yes_bid") > 0.4` for programmatic scanner API |
| **WebSocket → evaluate → alert loop** | BinanceScanner, CryptoScanBot | Subscribe to Kalshi `ticker` channel; evaluate each message against scanner criteria; push matching rows to alert queue |
| **Cursor pagination for bulk market load** | Kalshi API spec | Load all 5,000+ Kalshi markets on startup via cursor loop before switching to WebSocket |
| **Atomic result pointer-swap** | xang1234/stock-screener | Pre-compute scan results in background; swap pointer when ready; prevents half-rendered scanner states |
| **Piped multi-condition scans** | PKScreener | Chain: volume filter → momentum filter → pattern filter; faster than one compound query |
| **Statistical volume anomaly** | UnusualVolumeDetector | Flag Kalshi markets where current volume exceeds N std deviations from 30-day mean |
| **Text similarity cross-venue matching** | polymarket-arbitrage | Match Kalshi markets to Polymarket equivalents by title similarity for cross-venue arb scanner |
| **Kelly criterion position sizing** | Kalshi-Claw | Compute optimal contract count for scanner alert signals using Kelly formula |
| **URL-synced filter state** | data-table-filters | Scanner filter state lives in the URL — shareable, bookmarkable, back-button navigable |
| **Row virtualization** | TanStack Table | Render only visible scanner rows; critical for 5,000+ market lists |

---

*Last updated: 2026-02-24. Update this file as new sources are identified or existing ones change status.*
