# Research Dossier: req-77dde130

**Subject:** KalshiAlpha — Trader Tooling Research & Feature Strategy
**Date:** 2026-03-08 (research) / 2026-03-19 (implementation close)
**Status:** Implementation complete (Phase 1)

---

## 1. Purpose

This dossier consolidates all research artifacts and implemented work for request `req-77dde130`. It serves as the authoritative reference for what was studied, what gaps were identified, what was built, and what remains in the backlog.

---

## 2. Research Artifact Index

| File | What It Contains |
|---|---|
| [`academic.md`](./academic.md) | 13 peer-reviewed papers on behavioral finance and execution science, mapped to concrete UI capabilities |
| [`chatrooms.md`](./chatrooms.md) | 13 public live-trading chatroom artifacts analyzed for time-critical workflow patterns |
| [`communities.md`](./communities.md) | 24 threads from 7 trader communities (Reddit, Elite Trader, Trade2Win, StockTwits) with frequency-weighted pain points |
| [`platforms.md`](./platforms.md) | Deep-dive on 6 pro platforms (Trade-Ideas, Sierra Chart, DAS Trader, Lightspeed, Bloomberg, DayTrade Dash) with ranked top-10 feature list |
| [`gap-analysis.md`](./gap-analysis.md) | Capability-by-capability audit of KalshiAlpha vs. research findings across 8 domains |
| [`prioritized-backlog.md`](./prioritized-backlog.md) | 19-item scored backlog with acceptance criteria and file-level targets for top 3 candidates |
| [`implementation-summary.md`](./implementation-summary.md) | What was built (PRs, files changed, acceptance criteria met) and what remains |

---

## 3. Source Coverage Summary

### 3.1 Academic Sources (13 papers)

| Paper | Finding | Mapped UI Capability |
|---|---|---|
| Odean (1998) | Disposition effect degrades decision quality | Position-exit diagnostic with PGR/PLR bias stats |
| Barber & Odean (2000) | High turnover underperforms after costs | Turnover cost guardrail in pre-trade panel |
| Biais et al. (2005) | Overconfidence links to trading errors | Confidence discipline widget + calibration tracking |
| Benartzi & Thaler (1995) | Myopic loss aversion from frequent evaluation | Evaluation-horizon controls (weekly/monthly defaults) |
| Thaler et al. (1997) | Frequent feedback reduces risk-taking | Feedback-frequency presets (execution vs. monitor mode) |
| Bertsimas & Lo (1998) | Execution cost is a dynamic control problem | Pre-trade execution planner with urgency vs. cost |
| Almgren & Chriss (2000) | Market impact vs. volatility risk tradeoff | Execution frontier card (fast/neutral/passive) |
| SEC Rule 605 | Standardized execution-quality disclosures | Venue quality panel with 605 metrics |
| SEC Rule 606 | Order-routing transparency requirements | Routing transparency view |
| FINRA Rule 5310 | Best execution diligence requirements | Best-ex checklist before order submit |
| Brier (1950) | Proper scoring rules for forecast quality | Calibration scorecard with rolling Brier score |
| Mellers et al. (2014) | Structured methods improve forecasting accuracy | Decision journal + post-mortem loop |
| Gigerenzer & Hoffrage (1995) | Natural-frequency framing improves reasoning | "X out of 100 similar cases" probability display |

### 3.2 Community Pain Points (7 communities, 24 sources)

| Pattern | Coverage | Signal Tier |
|---|---|---|
| Discipline and risk-process breakdown | 6/7 communities, 18 mentions | **High** |
| Execution quality and reliability risk | 6/7 communities, 16 mentions | **High** |
| Feed noise and hype contamination | 6/7 communities, 15 mentions | **High** |
| Tracking and attribution gaps | 5/7 communities, 13 mentions | **High** |
| Backtest realism gap | 3/7 communities, 12 mentions | **High** |
| Tool fragmentation / context switching | 5/7 communities, 11 mentions | **Medium-High** |

### 3.3 Platform Benchmarks (6 platforms)

Key capability leaders:
- **Scanning:** Trade-Ideas (500+ filters, Holly AI, OddsMaker backtest)
- **Execution speed:** DAS Trader (advanced hotkey scripting, 100+ routes)
- **Risk controls:** Lightspeed SRM (daily loss limit, auto-flatten, per-user limits)
- **News integration:** Bloomberg Terminal (real-time, correlated with price)
- **Performance tracking:** DayTrade Dash (auto-journaling), Bloomberg (TCA)
- **Order flow:** Sierra Chart (Numbers Bars, DOM, Market Profile)

### 3.4 Chatroom Workflow Patterns (13 artifacts)

Core primitives identified:
1. **Structured alert envelope** — enforced schema with thesis, invalidation, TTL
2. **Premarket triage board** — ranked watchlist with lane tags and state machine
3. **Feed filter controls** — follow/mute/ticker-only with staleness badges
4. **Lifecycle update chips** — armed → entered → trimmed → closed
5. **Auto-recap builder** — session timeline from lifecycle events

---

## 4. Gap Analysis Summary

Full detail: [`gap-analysis.md`](./gap-analysis.md)

### Existing Strengths (10 capabilities)
Montage order entry, price ladder (DOM), hotkey scripting, charting, window management, color-linked sync, OMS engine, alert rules, position/P&L tracking, market clock.

### Gap Severity

| Severity | Count | Top Examples |
|---|---|---|
| Critical (3+ sources) | 6 | Risk guardrails, pre-trade decision card, execution quality telemetry, scanner depth, news integration, performance journal |
| Important (2 sources) | 8 | Premarket triage, routing transparency, strategy tags, calibration, AI signals, social/rooms, signal-to-noise, backtest realism |
| Nice-to-have (1 source) | 5 | Frequency-based probability display, feedback controls, single-screen mode, disposition diagnostics, lot-aware analytics |

### The Three Gap Themes

1. **Pre-trade discipline** — No risk guardrails, no pre-trade decision framework, no cost/edge estimates. #1 pain point across all research.
2. **Post-trade learning** — No journaling, no calibration scoring, no strategy-tagged attribution. The most common self-improvement tool traders report.
3. **Discovery & context** — Scanner is basic, news is mock-only, no premarket triage, no AI signals. Pro platforms differentiate on discovery quality.

---

## 5. Backlog Rationale

Full scoring: [`prioritized-backlog.md`](./prioritized-backlog.md)

The backlog uses **Priority Score = Impact × Confidence / Effort** (all 1–5, where Effort 5 = easiest). Top items:

| Rank | Item | Score | Why Prioritized |
|---:|---|:---:|---|
| 1 | Risk Guardrails Engine | 6.25 | P0 across communities + platforms + academic; binary outcomes demand hard rails |
| 2 | Pre-Trade Decision Card | 6.25 | Academic #1 recommendation; addresses cost blindness + overconfidence + lack of process |
| 3 | Performance Journal & Calibration | 8.33 | Closes the feedback loop; highest-scoring item when accounting for moderate effort |
| 4 | Enhanced Scanner Filters | 5.00 | Core discovery; event-contract-specific filters don't exist |
| 5 | Real News Integration | 12.50 | High impact, event contracts are news-driven; complex implementation deferred |

Items deferred (with rationale):
- **Real News Integration** — requires external API contract, ongoing cost, and data normalization. Phase 2.
- **AI Signal Generation** — highest potential but lowest confidence in implementation path. Phase 2+.
- **Room / Social Trading** — large scope, moderation/trust/safety concerns. Dedicated initiative.
- **Premarket Triage Board** — can be built as scanner preset combination once core loop is solid.

---

## 6. What Was Implemented

Full detail: [`implementation-summary.md`](./implementation-summary.md)

Four feature packages shipped across PRs #197–200:

| PR | Feature | Files Changed |
|---|---|---|
| #197 | News Intelligence (signal tagging, TTL/staleness) | `NewsChat.jsx/css`, `alertService.js` |
| #198 | Scanner Power Filters + Alert Refinements | `LiveScanner.jsx/css`, `HistoricalScanner.jsx/css`, `AlertTrigger.jsx/css`, `settingsStore.js` |
| #199 | Trade Execution (templates, quick-size, cost preview) | `Montage.jsx/css`, `PriceLadder.jsx/css`, `HotkeyManager.jsx/css`, `hotkeyStore.js`, `hotkeyLanguage.js`, `useHotkeyDispatch.js` |
| #200 | UI Polish (accessibility, error states, interactions) | `MenuBar.css`, `Shell.css`, `Window.css`, `index.css` |

**Measurable gap closures:**
- Alert staleness/TTL: 0% → 100% (full envelope with `invalidates_at`, `thesis`, `staleness` tracking)
- Scanner filter depth: added ticker-text filter, strategy dropdown, direction filter, ROI/confidence minimums, named preset save/load
- Pre-trade cost preview: added max-cost/max-profit display in Montage confirm dialog
- Quick-size execution: preset buttons [1, 5, 10, 25, 50, 100] in Montage and PriceLadder
- Order templates: CRUD in hotkeyStore, `LoadTemplate` hotkey command, UI in HotkeyManager
- Accessibility: `prefers-reduced-motion`, skip-link, `::selection` theming, WCAG-friendly error states

---

## 7. What Remains (Prioritized Backlog Residual)

Items from the backlog not yet implemented, in priority order:

| Rank | Item | Rationale for Deferral |
|---:|---|---|
| 1 | **Risk Guardrails Engine** | Highest-priority item; not yet built — hardest to ship without OMS hook access |
| 2 | **Pre-Trade Decision Card** | Partially addressed (cost preview in Montage); full card with confidence/rationale/journal not built |
| 3 | **Performance Journal & Calibration** | Not started; requires `journalStore.js` + `calibrationCalc.js` + new UI windows |
| 4 | **Premarket Triage Board** | Not started; candidate → armed → active state machine + lane tags |
| 5 | **Strategy/Setup Tagging** | Not started; needed for attribution and journal integration |
| 6 | **Execution Quality Telemetry** | Not started; post-trade analysis, TCA-style metrics |
| 7 | **Real News Integration** | Deferred — requires external news API (cost, rate limiting, normalization) |
| 8 | **Walk-Forward Backtest Validation** | Not started; `r/algotrading` community high priority |
| 9 | **Routing Transparency View** | Not started; SEC 606/FINRA 5310 compliance panel |
| 10 | **Room / Social Trading System** | Scoped out — dedicated initiative with moderation infrastructure |

---

## 8. Measurable User Impact

| Metric | Before | After | Source |
|---|---|---|---|
| Alert actionability | No thesis/invalidation fields | Structured alert envelope with `thesis`, `invalidates_at`, `risk_note` | PR #197 |
| Alert freshness tracking | No TTL concept | Staleness badges + `purgeExpiredRules` helper | PR #197 |
| Scanner filter depth | 3 filters (strategy, type, conviction) | + ticker text filter, direction, ROI/confidence minimums, named presets | PR #198 |
| Historical scanner granularity | No signal direction filter | Added signal direction + confidence/ROI floors | PR #198 |
| Execution speed (size selection) | Manual quantity input only | One-click preset sizes: 1, 5, 10, 25, 50, 100 | PR #199 |
| Pre-trade cost awareness | No cost estimate | Max cost / max profit shown before submission | PR #199 |
| Order template reuse | Manual re-entry each time | Saveable templates with `LoadTemplate` hotkey | PR #199 |
| Accessibility compliance | No reduced-motion, no skip-link | `prefers-reduced-motion`, skip-link, WCAG error states | PR #200 |

---

## 9. Recommended Next Steps

1. **Risk Guardrails Engine** — Implement `riskEngine.js` (state machine: daily P&L accumulator, position counter, streak tracker) + `RiskStatusBar.jsx` + OMS pre-submission hook. This is the #1 unmet gap.
2. **Pre-Trade Decision Card** — Full `DecisionCard.jsx` with confidence input, rationale field, and `journalStore.js` for persistence. The Montage cost preview (PR #199) provides the foundation.
3. **Performance Journal** — `Journal.jsx` browser + `CalibrationScorecard.jsx` + weekly review modal. Depends on journalStore from step 2.
4. **Strategy Tagging** — Add tags to fills and positions as a prerequisite for journal attribution.
5. **Real News Integration** — Evaluate Kalshi API for market-correlated news; define data contract before building.
