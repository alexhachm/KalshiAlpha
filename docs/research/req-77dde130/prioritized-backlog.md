# Prioritized Feature Backlog

**Request:** req-77dde130
**Date:** 2026-03-08
**Derived from:** gap-analysis.md (current capabilities vs. research from academic.md, chatrooms.md, communities.md, platforms.md)

---

## Scoring Methodology

Each backlog item is scored on three dimensions (1-5 scale):

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| **Impact** | Nice-to-have for few users | Addresses a known pain point | Addresses a critical gap identified by 3+ independent research sources |
| **Effort** | 5+ weeks, deep architecture changes | 2-3 weeks, moderate complexity | < 1 week, builds on existing components |
| **Confidence** | Speculative benefit, weak evidence | Moderate evidence from 1-2 sources | Strong evidence from multiple independent sources (academic + community + platform) |

**Priority Score** = Impact × Confidence / Effort (higher = do first)

---

## Ranked Backlog

| Rank | Item | Impact | Effort | Confidence | Score | Sources |
|---:|---|:---:|:---:|:---:|:---:|---|
| 1 | **Risk Guardrails Engine** | 5 | 4 | 5 | 6.25 | communities P0, platforms #6, academic |
| 2 | **Pre-Trade Decision Card** | 5 | 4 | 5 | 6.25 | academic #1, communities P0, platforms |
| 3 | **Performance Journal & Calibration** | 5 | 3 | 5 | 8.33 | academic #5, communities P1, platforms #8, chatrooms P2 |
| 4 | **Enhanced Scanner Filters** | 4 | 4 | 5 | 5.00 | platforms #1, communities, chatrooms P0 |
| 5 | **Real News Integration** | 5 | 2 | 5 | 12.50 | platforms #5, communities |
| 6 | **Strategy/Setup Tagging System** | 4 | 3 | 5 | 6.67 | communities P1, chatrooms, academic |
| 7 | **Premarket Triage Board** | 4 | 3 | 4 | 5.33 | chatrooms P0, platforms |
| 8 | **Execution Quality Telemetry** | 4 | 2 | 4 | 8.00 | academic, communities P0, platforms (Bloomberg TCA) |
| 9 | **Workspace Presets / Channel Bar** | 3 | 4 | 4 | 3.00 | platforms #3 (Trade-Ideas, Bloomberg) |
| 10 | **Structured Alert Envelope** | 4 | 4 | 4 | 4.00 | chatrooms P0 |
| 11 | **Backtest Realism (Walk-Forward + Costs)** | 3 | 2 | 5 | 7.50 | communities (r/algotrading), platforms #10 |
| 12 | **Feedback-Frequency Controls** | 3 | 4 | 4 | 3.00 | academic (Benartzi/Thaler, Thaler et al.) |
| 13 | **AI Signal Generation** | 4 | 1 | 3 | 12.00 | platforms #9 (Trade-Ideas Holly) |
| 14 | **Room / Social Trading System** | 4 | 1 | 4 | 16.00 | chatrooms (full scope), communities |
| 15 | **Natural-Frequency Probability Display** | 2 | 5 | 4 | 1.60 | academic (Gigerenzer) |
| 16 | **Routing Transparency View** | 3 | 3 | 4 | 4.00 | academic (SEC 605/606) |
| 17 | **Disposition-Bias Diagnostic** | 3 | 3 | 4 | 4.00 | academic (Odean 1998) |
| 18 | **Lot-Aware Analytics** | 2 | 3 | 3 | 2.00 | communities (r/stocks) |
| 19 | **Single-Screen Optimized Mode** | 2 | 4 | 3 | 1.50 | platforms (DTD) |

> **Note on effort inversion:** Effort is scored 1-5 where 5 = easiest (< 1 week). The score formula rewards low-effort, high-impact items. Items like "Real News Integration" (effort=2, complex API work) score high on impact/confidence but are penalized for difficulty. Conversely, "Natural-Frequency Probability Display" (effort=5, simple UI change) is easy but low-impact.

---

## Top 3 Implementation Candidates

### Candidate 1: Risk Guardrails Engine

**Why first:** The single most repeated pain point across all research. Communities (6/7 coverage, 18 independent mentions) report discipline/risk-process breakdown as the #1 cause of losses. Lightspeed SRM is the benchmark. Academic evidence (Benartzi/Thaler, Barber/Odean) confirms that uncontrolled trading behavior degrades returns.

**Acceptance Criteria:**
1. User can configure daily max loss limit (dollar amount); when hit, new order submission is blocked and an interruptive modal warns the user
2. User can configure max position size (contracts per market); order entry rejects orders exceeding the limit with a clear error message
3. User can configure max open positions (across all markets); new orders blocked when limit reached
4. User can enable streak-based cooldown: after N consecutive losses (configurable, default 3), a 5-minute trading pause is enforced with a countdown timer
5. Kill-switch button in the menu bar: one-click cancels all open orders and flattens all positions with confirmation dialog
6. All risk limits persist across sessions (localStorage) and are configurable in Settings → Trading tab
7. Risk state (daily P&L, consecutive losses, position count) is visible in a compact status bar widget

**File-Level Targets:**
| File | Change |
|---|---|
| `src/services/riskEngine.js` | **New** — risk state machine: daily P&L accumulator, position counter, streak tracker, limit evaluation, cooldown timer |
| `src/components/trade/RiskStatusBar.jsx` | **New** — compact widget showing daily P&L vs limit, position count vs max, cooldown state |
| `src/components/SettingsPanel.jsx` | **Edit** — add Risk Management sub-tab under Trading with limit configuration fields |
| `src/services/omsService.js` | **Edit** — add pre-submission hook calling riskEngine.evaluate() before forwarding to API |
| `src/components/trade/KillSwitch.jsx` | **New** — kill-switch button component with cancel-all + flatten logic |
| `src/components/MenuBar.jsx` | **Edit** — add KillSwitch to the menu bar |
| `src/services/settingsStore.js` | **Edit** — add risk settings schema (dailyMaxLoss, maxPositionSize, maxOpenPositions, streakCooldownN, streakCooldownMinutes) |

---

### Candidate 2: Pre-Trade Decision Card

**Why second:** Academic research ranks this as the highest-leverage single UI addition (academic.md #1). It addresses the intersection of execution cost blindness (Bertsimas/Lo, Almgren/Chriss), overconfidence (Biais et al.), and lack of pre-trade process (communities: Elite Trader, Trade2Win). Pro platforms (Bloomberg EMSX, Lightspeed SRM) include pre-trade analytics.

**Acceptance Criteria:**
1. When a user is about to submit an order, a Decision Card panel appears (can be toggled on/off in settings) showing:
   - Expected cost: spread cost + estimated slippage based on order size vs. order book depth
   - Edge estimate: difference between user's entry price and mid-market, expressed as cents and percentage
   - Fee summary: Kalshi exchange fee for the trade
   - Total implementation cost: spread + slippage + fees
2. Decision Card includes a **Confidence selector** (1-5 scale) and a **Rationale text field** (optional, max 280 chars)
3. Confidence and rationale entries are stored locally and linked to the resulting fill for post-trade review
4. After resolution, the journal system (Candidate 3) can score the prediction against the outcome
5. Card is dismissable with a single click ("Submit Anyway") for speed; not a hard block
6. Card data persists in localStorage keyed by fill ID

**File-Level Targets:**
| File | Change |
|---|---|
| `src/components/trade/DecisionCard.jsx` | **New** — pre-trade summary panel: cost breakdown, confidence selector, rationale input, submit/cancel buttons |
| `src/services/costEstimator.js` | **New** — spread cost, slippage estimate (size vs book depth), fee lookup |
| `src/components/trade/Montage.jsx` | **Edit** — integrate DecisionCard as an intermediate step before order submission |
| `src/components/trade/PriceLadder.jsx` | **Edit** — integrate DecisionCard on click-to-trade actions |
| `src/services/journalStore.js` | **New** — localStorage persistence for confidence/rationale entries keyed by fill ID |
| `src/services/settingsStore.js` | **Edit** — add `decisionCardEnabled` toggle (default: true) |

---

### Candidate 3: Performance Journal & Calibration Scorecard

**Why third:** Closes the feedback loop opened by the Decision Card. Academic evidence (Mellers et al. 2014, Brier 1950) shows structured post-mortems and calibration scoring improve forecasting accuracy. Communities report journaling as the #1 self-improvement tool (5/7 coverage). DTD's auto-journaling and Bloomberg TCA are the benchmarks.

**Acceptance Criteria:**
1. Every completed trade (fill → settlement/exit) generates an auto-journal entry containing: market, side, entry price, exit price, realized P&L, confidence at entry (from Decision Card), rationale at entry, hold duration
2. Journal entries are browsable in a new **Journal** window with filters: date range, market, P&L positive/negative, confidence level
3. A **Calibration Scorecard** tab shows:
   - Brier score (rolling 30-day) for trades where confidence was recorded
   - Calibration chart: confidence bucket (1-5) vs. actual win rate
   - Average P&L by confidence level
4. A **Weekly Review** prompt appears (dismissable) every 7 days summarizing: total trades, win rate, best/worst trade, most common market, average confidence vs actual outcome
5. Journal entries are exportable as CSV
6. Journal data persists in localStorage (with IndexedDB migration path for scale)

**File-Level Targets:**
| File | Change |
|---|---|
| `src/components/analytics/Journal.jsx` | **New** — journal browser with filters, sort, search; card layout per trade |
| `src/components/analytics/CalibrationScorecard.jsx` | **New** — Brier score display, calibration chart (confidence vs win rate), P&L by confidence |
| `src/services/journalStore.js` | **Edit** (created in Candidate 2) — add auto-entry generation on trade close, query/filter API, CSV export |
| `src/services/calibrationCalc.js` | **New** — Brier score computation, confidence-bucket aggregation, weekly summary generation |
| `src/components/analytics/WeeklyReview.jsx` | **New** — modal/overlay with weekly performance summary and calibration feedback |
| `src/config/toolManifest.js` | **Edit** — add `journal` and `calibration` tool entries |
| `src/components/MenuBar.jsx` | **Edit** — add Journal and Calibration entries under a new Analytics submenu |

---

## Dependency Graph

```
Candidate 1 (Risk Guardrails)     Candidate 2 (Decision Card)
         │                                  │
         │                                  ▼
         │                        Candidate 3 (Journal)
         │                                  │
         ▼                                  ▼
   [Independent]               [Decision Card → Journal
                                 creates the confidence/
                                 rationale data that Journal
                                 scores and reviews]
```

**Recommended sequence:** Candidates 1 and 2 can be built in parallel (no code dependency). Candidate 3 depends on the `journalStore.js` created by Candidate 2.

---

## Items Not Selected (and Why)

| Item | Why deferred |
|---|---|
| Real News Integration | High impact but effort=2 (requires external news API contract, ongoing cost, rate limiting, data normalization). Better as a follow-up once core trading loop is strengthened. |
| Enhanced Scanner Filters | Important but the existing scanner is functional. Event-contract-specific filters can be added incrementally. |
| AI Signal Generation | Highest potential differentiation but lowest confidence in implementation path (effort=1). Requires ML infrastructure, training data pipeline, model validation. Phase 2+. |
| Room / Social Trading | Large scope (effort=1) that introduces moderation, trust/safety, and infrastructure concerns. Better as a dedicated initiative after individual trading experience is solid. |
| Premarket Triage Board | Valuable but can be built as a scanner preset + workspace preset combination once Candidates 1-3 are in place. |

---

## Implementation Estimates

| Candidate | Components | Est. Files Touched | Build Complexity |
|---|---|---|---|
| 1. Risk Guardrails | 3 new, 4 edited | 7 | Medium — state machine + UI + OMS hook; no external API dependency |
| 2. Decision Card | 3 new, 3 edited | 6 | Medium — cost estimation is arithmetic; main complexity is UX flow integration |
| 3. Journal & Calibration | 4 new, 3 edited | 7 | Medium — data persistence + aggregation + visualization; no external dependency |

All three candidates are **self-contained** (no external API dependencies beyond existing Kalshi integration), **incrementally shippable** (each adds standalone value), and **evidence-backed** (3+ independent research sources per candidate).
