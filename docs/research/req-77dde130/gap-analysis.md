# Gap Analysis: KalshiAlpha Current State vs. Research Findings

**Request:** req-77dde130
**Date:** 2026-03-08
**Method:** Audited every user-facing component in `src/` against synthesized findings from academic research, chatroom workflows, trader community pain points, and pro-platform feature inventories.

---

## Reading Guide

- **Have** = capability exists and is functional today
- **Partial** = foundation exists but is incomplete, mock-backed, or shallow
- **Gap** = capability is absent and was identified as important by 2+ research sources

Research sources referenced:
- `academic.md` — peer-reviewed behavioral finance / execution evidence
- `chatrooms.md` — live-trading chatroom workflow patterns
- `communities.md` — trader community pain points (Reddit, Elite Trader, StockTwits, Trade2Win)
- `platforms.md` — pro platform daily-use feature analysis (Trade-Ideas, Sierra Chart, DAS, Lightspeed, Bloomberg, DTD)

---

## 1. Market Discovery & Scanning

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| Real-time live scanner | **Have** | `LiveScanner.jsx` — strategy/type/conviction filters, sortable grid, pause/resume | Functional but limited filter set vs. Trade-Ideas' 500+ filters; no event-contract-specific filters (time-to-resolution, category, implied probability range) |
| Historical scanner / backtest | **Have** | `HistoricalScanner.jsx` — pattern types, ROI, confidence, CSV export | Missing walk-forward validation, realistic cost/slippage defaults flagged by r/algotrading (communities.md) |
| Custom alert rules | **Have** | `AlertTrigger.jsx` — price cross, % change, volume spike rules with history log | Missing: alert TTL/staleness badges, structured alert envelope with thesis/invalidation (chatrooms.md P0) |
| Premarket triage board | **Gap** | Not implemented | chatrooms.md P0: ranked candidates with catalyst, liquidity, event window, confidence; lane tags; state machine (candidate → armed → active → invalidated) |
| Scanner-first home screen | **Gap** | App opens to empty workspace; user must manually open windows | platforms.md #1: Trade-Ideas, DTD, Lightspeed all use scanner as the default landing experience |
| AI-powered signal generation | **Gap** | No AI/ML features | platforms.md #9: Trade-Ideas Holly AI nightly analysis, adaptive strategy suggestions; academic.md: calibration scoring |

## 2. Execution & Order Management

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| Montage / quick order entry | **Have** | `Montage.jsx` — search, bid/ask, order types, time-in-force, depth, sound alerts | Solid foundation; missing per-trade cost/slippage estimate (academic.md: pre-trade execution planner) |
| Price ladder (DOM) | **Have** | `PriceLadder.jsx` — full 1-99 ladder, click-to-trade, volume bars, working orders | Good implementation; lacks order-flow imbalance indicators (Sierra Chart model from platforms.md) |
| Hotkey-driven execution | **Have** | `HotkeyManager.jsx` — full scripting language, profiles, import/export, conflict detection | Strong — matches DAS Trader sophistication (platforms.md #2) |
| Direct order routing transparency | **Gap** | No venue/routing information exposed | academic.md: SEC 605/606 metrics, routing transparency, best-ex checklist; platforms.md: DAS 100+ routes, Lightspeed 100+ destinations |
| Pre-trade decision card | **Gap** | No unified pre-trade summary | academic.md #1 priority: expected edge, fees, slippage, implementation-shortfall estimate, confidence input, rationale field |
| Execution quality telemetry | **Gap** | No post-trade execution analysis | academic.md: venue quality panel, TCA; communities.md P0: execution quality telemetry; platforms.md: Bloomberg TCA |
| Structured execution callout (social) | **Gap** | Not implemented | chatrooms.md P0: enforced-schema callout composer with contract, direction, setup type, entry zone, stop, targets, size, confidence |

## 3. Risk Management & Behavioral Guardrails

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| Order confirmation dialog | **Have** | `Montage.jsx` — confirm-before-send toggle | Basic; not a full risk-gating workflow |
| Position/P&L tracking | **Have** | `Positions.jsx`, `omsEngine.js` — real-time position grid with unrealized/realized P&L | Functional but lacks strategy-tagged attribution (communities.md P1) |
| Hard risk rails (daily loss limit, max size) | **Gap** | Not implemented | communities.md P0: daily loss limit, max position size, streak-based cooldown; platforms.md #6: Lightspeed SRM auto-flatten |
| Turnover/cost guardrail | **Gap** | Not implemented | academic.md: pre-trade panel estimating annualized drag from turnover + fees; behavioral soft friction |
| Disposition-bias diagnostic | **Gap** | Not implemented | academic.md: gain/loss realization bias stats (PGR/PLR ratios), counterfactual outcomes before exit |
| Confidence discipline widget | **Gap** | Not implemented | academic.md: require confidence entry for discretionary trades, track calibration over time |
| Kill-switch / auto-flatten | **Gap** | Not implemented | communities.md: loss-streak shutdown rules; platforms.md: Lightspeed SRM auto-action on limit breach |

## 4. Portfolio Analytics & Attribution

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| P&L summary grid | **Have** | `Positions.jsx`, `Accounts.jsx` — per-position and per-account P&L | Present but lacks benchmarking and strategy-level breakdown |
| Trade log / fill history | **Have** | `TradeLog.jsx`, `OrderBook.jsx` — filterable grids with date/status filters | Functional; missing setup/strategy tag attribution |
| Performance tracker / journal | **Partial** | Trade log exists but no auto-journaling, no decision rationale capture, no outcome scoring | platforms.md #8: DTD auto-journaling; academic.md: decision journal + post-mortem loop; communities.md P1: strategy-tagged attribution |
| Calibration scorecard | **Gap** | Not implemented | academic.md: rolling Brier score by market/regime, monthly calibration review prompts |
| Lot-aware analytics | **Gap** | Not implemented | communities.md: lot-aware realized/unrealized analytics with benchmark context |
| Strategy/setup tagging | **Gap** | Not implemented | communities.md P1: tags from idea to execution to review; chatrooms.md: lane tags |

## 5. Information & News

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| News feed | **Partial** | `NewsChat.jsx` — mock headlines with ticker filter, auto-refresh | Mock data only; no real news integration; platforms.md #5: Bloomberg/Fly News real-time catalyst feed |
| Integrated news + contract correlation | **Gap** | Not implemented | platforms.md: news correlated with contract price movements; event contracts are news-driven |
| Natural-frequency probability display | **Gap** | Not implemented | academic.md: "X out of 100 similar cases" alongside percentages for key probabilities |

## 6. Workspace & UX

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| Multi-window workspace | **Have** | `WindowManager.jsx` — drag-to-create, snapping, tab grouping | Solid implementation |
| Color-linked window sync | **Have** | `linkBus.js` — inter-window market sync by color group | Matches DAS Trader color-linking model (platforms.md #4) |
| Market clock / session awareness | **Have** | `MarketClock.jsx` — session indicators, countdown | Basic implementation |
| Tabbed/channel workspaces | **Partial** | Tab grouping exists but no preset channels/layouts | platforms.md: Trade-Ideas Channel Bar (40 preset strategy channels); Bloomberg Launchpad (persistent monitors) |
| Feedback-frequency controls | **Gap** | Not implemented | academic.md: evaluation-horizon controls, default to weekly/monthly P&L views, "execution mode" vs "monitor mode" |
| Single-screen optimized layout | **Gap** | Not implemented as a mode | platforms.md: DTD single-view dashboard designed for single-monitor setups |

## 7. Social / Collaborative Trading

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| Room/chat system | **Gap** | NewsChat is a news feed, not a collaborative chat | chatrooms.md: full room architecture with lanes, moderation, follow/mute, structured callouts |
| Alert fanout / syndication | **Gap** | Not implemented | chatrooms.md P1: announcement bus, urgency bands, hours-based routing profiles |
| Follow/mute/ticker-only filters | **Gap** | Not implemented | chatrooms.md P0: per-user feed controls, saved presets; communities.md: aggressive mute/block/report UX |
| Auto-recap / session journal | **Gap** | Not implemented | chatrooms.md P2: lifecycle events → session timeline and P&L attribution; communities.md: session debriefs |
| Signal-to-noise controls | **Gap** | Not implemented | communities.md P0: source-quality scoring, separate high-signal vs firehose modes |

## 8. Backtesting & Strategy Validation

| Capability | Status | Current State | Research Gap |
|---|---|---|---|
| Historical pattern scanner | **Have** | `HistoricalScanner.jsx` — basic backtest with ROI, confidence | Present but shallow; missing walk-forward, cost realism, regime-aware validation |
| Strategy backtesting engine | **Gap** | No strategy-level backtest (only pattern-level) | platforms.md #10: Trade-Ideas OddsMaker tests scanner configs against historical data; communities.md: realistic cost/slippage defaults |
| Walk-forward validation | **Gap** | Not implemented | communities.md: walk-forward/leakage checks flagged as critical by r/algotrading |

---

## Gap Severity Summary

| Severity | Count | Description |
|---|---|---|
| **Critical gaps** (identified by 3+ sources) | 6 | Risk guardrails, pre-trade decision card, execution quality, scanner depth, news integration, performance journal |
| **Important gaps** (identified by 2 sources) | 8 | Premarket triage, routing transparency, strategy tags, calibration, AI signals, social/rooms, signal-to-noise, backtest realism |
| **Nice-to-have gaps** (1 source) | 5 | Frequency-based risk display, feedback controls, single-screen mode, disposition diagnostics, lot-aware analytics |
| **Existing strengths** | 10 | Montage, price ladder, hotkeys, charts, window management, color linking, OMS engine, alert rules, position tracking, market clock |

## Key Insight

KalshiAlpha has strong **execution plumbing** (order entry, OMS, hotkeys, price ladder, charting) comparable to DAS Trader / Lightspeed for core trading mechanics. The largest gaps cluster in three themes:

1. **Pre-trade discipline** — No risk guardrails, no pre-trade decision framework, no cost/edge estimates. This is the #1 pain point across communities and the #1 academic recommendation.
2. **Post-trade learning** — No journaling, no calibration scoring, no strategy-tagged attribution. Traders report this as their most common self-improvement tool.
3. **Discovery & context** — Scanner is basic, news is mock, no premarket triage, no AI-driven signals. Pro platforms differentiate on discovery quality.
