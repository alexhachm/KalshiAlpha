# Prioritized Enhancement Plan — req-519be397

**Date:** 2026-03-08
**Request:** Create an autonomous improvement loop — audit features, benchmark against external sources, and produce a prioritized enhancement plan.
**Method:** Synthesized findings from four input streams, scored each enhancement on Impact/Effort/Confidence, and ranked by composite score.

---

## Input Streams

| Stream | Source | Type | Key Contributions |
|---|---|---|---|
| **Internal Audit — Feature Inventory & Scoring Engine** | `src/services/auditStateService.js`, `src/services/researchLoop.js` | Code audit | Weighted rubric (completeness, accuracy, performance, uxQuality), autonomous function enumeration, heuristic scoring, improvement records pipeline |
| **Internal Audit — Interaction Audit Runner** | `src/services/interactionAuditService.js` | Flow audit | 5 critical user flows (navigation, scanning, order entry, alerts, settings) with 40+ pattern-based checks, severity-ranked findings |
| **External Benchmark — Community Sentiment** | `docs/audit/req-519be397/benchmark-communities.md` | Benchmark | 24-source sentiment analysis across Reddit, Discord, forums; frequency-weighted pain points (notification overload, alert latency, noise-to-signal, search gaps, trust/accountability, support friction) |
| **External Benchmark — Gap Analysis & Backlog** | `docs/research/req-77dde130/gap-analysis.md`, `prioritized-backlog.md`, `.claude/docs/gap-analysis-*.md` | Research synthesis | Academic research, chatroom workflows, community pain points, pro-platform feature inventories; component styling gaps, interactive pattern gaps, formatting/UX gaps, visual feedback gaps |

---

## Scoring Methodology

Each enhancement is scored on three dimensions (1–5 scale):

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| **Impact** | Nice-to-have for few users | Addresses a known pain point from 1 source | Addresses a critical gap identified by 3+ independent sources |
| **Effort** (inverted: 5=easiest) | 5+ weeks, deep architecture or external dependency | 2–3 weeks, moderate complexity | < 1 week, builds on existing components |
| **Confidence** | Speculative benefit, weak evidence | Moderate evidence from 1–2 sources | Strong evidence from multiple independent sources |

**Composite Score** = (Impact × Confidence) / Effort — higher = do first.

---

## Tier 1: Critical Enhancements (Score ≥ 5.0)

### E-01: Risk Guardrails Engine
**Score: 6.25** — Impact: 5 | Effort: 4 | Confidence: 5

**Evidence:**
- Communities benchmark: #1 pain point across 6/7 coverage areas, 18 independent mentions of discipline/risk-process breakdown
- Gap analysis: Hard risk rails, kill-switch, streak-based cooldown all absent
- Platform benchmark: Lightspeed SRM auto-flatten is the reference implementation
- Academic: Benartzi/Thaler, Barber/Odean confirm uncontrolled trading degrades returns
- Interaction audit: No risk gating in order-entry flow (order submission has no pre-check beyond optional confirmation dialog)

**Acceptance Criteria:**
1. User can configure daily max loss limit (dollar amount); breaching blocks new order submission with an interruptive modal
2. User can configure max position size (contracts per market); order entry rejects over-limit orders with a clear error
3. User can configure max open positions (all markets); new orders blocked at the limit
4. Streak-based cooldown: after N consecutive losses (configurable, default 3), a 5-minute trading pause is enforced with countdown timer
5. Kill-switch button in MenuBar: one-click cancels all open orders and flattens all positions (with confirmation dialog)
6. All risk limits persist across sessions (localStorage) and are configurable in Settings → Trading
7. Risk state (daily P&L, consecutive losses, position count) visible in a compact status bar widget

**File Targets:**
| File | Action |
|---|---|
| `src/services/riskEngine.js` | **New** — risk state machine: daily P&L accumulator, position counter, streak tracker, limit evaluation, cooldown timer |
| `src/components/trade/RiskStatusBar.jsx` | **New** — compact widget: daily P&L vs limit, position count vs max, cooldown state |
| `src/components/SettingsPanel.jsx` | **Edit** — add Risk Management sub-tab under Trading |
| `src/services/omsService.js` | **Edit** — add pre-submission hook calling `riskEngine.evaluate()` |
| `src/components/trade/KillSwitch.jsx` | **New** — kill-switch button with cancel-all + flatten logic |
| `src/components/MenuBar.jsx` | **Edit** — add KillSwitch to menu bar |
| `src/services/settingsStore.js` | **Edit** — add risk settings schema |

---

### E-02: Pre-Trade Decision Card
**Score: 6.25** — Impact: 5 | Effort: 4 | Confidence: 5

**Evidence:**
- Academic: #1 ranked recommendation — pre-trade execution planner with expected edge, fees, slippage, implementation-shortfall estimate
- Communities: Elite Trader, Trade2Win users report cost blindness as recurring problem
- Platform benchmark: Bloomberg EMSX pre-trade analytics, Lightspeed SRM cost display
- Interaction audit: `order-submit` step in order-entry flow has validation check but no cost/edge visibility

**Acceptance Criteria:**
1. When submitting an order, a Decision Card panel shows: spread cost + estimated slippage, edge estimate (entry vs mid-market), fee summary, total implementation cost
2. Decision Card includes a Confidence selector (1–5 scale) and Rationale text field (optional, max 280 chars)
3. Confidence and rationale stored locally and linked to resulting fill for post-trade review
4. Card is dismissable with single click ("Submit Anyway") — not a hard block
5. Toggleable on/off via Settings → Trading → Decision Card
6. Card data persists in localStorage keyed by fill ID

**File Targets:**
| File | Action |
|---|---|
| `src/components/trade/DecisionCard.jsx` | **New** — pre-trade summary: cost breakdown, confidence selector, rationale input |
| `src/services/costEstimator.js` | **New** — spread cost, slippage estimate, fee lookup |
| `src/components/trade/Montage.jsx` | **Edit** — integrate DecisionCard before order submission |
| `src/components/trade/PriceLadder.jsx` | **Edit** — integrate DecisionCard on click-to-trade |
| `src/services/journalStore.js` | **New** — localStorage persistence for confidence/rationale keyed by fill ID |
| `src/services/settingsStore.js` | **Edit** — add `decisionCardEnabled` toggle |

---

### E-03: Performance Journal & Calibration Scorecard
**Score: 8.33** — Impact: 5 | Effort: 3 | Confidence: 5

**Evidence:**
- Academic: Mellers et al. 2014, Brier 1950 — structured post-mortems improve forecasting accuracy
- Communities: Journaling reported as #1 self-improvement tool (5/7 coverage)
- Platform benchmark: DTD auto-journaling, Bloomberg TCA
- Chatrooms: P2 priority — lifecycle events → session timeline and P&L attribution
- Gap analysis: Trade log exists but no auto-journaling, no decision rationale capture, no outcome scoring

**Acceptance Criteria:**
1. Every completed trade auto-generates a journal entry: market, side, entry/exit price, realized P&L, confidence at entry, rationale at entry, hold duration
2. Journal window with filters: date range, market, P&L positive/negative, confidence level
3. Calibration Scorecard tab: rolling 30-day Brier score, calibration chart (confidence bucket vs actual win rate), average P&L by confidence level
4. Weekly Review prompt (dismissable) every 7 days: total trades, win rate, best/worst trade, most common market, avg confidence vs actual outcome
5. Journal entries exportable as CSV
6. Journal data persists in localStorage (with IndexedDB migration path)

**File Targets:**
| File | Action |
|---|---|
| `src/components/analytics/Journal.jsx` | **New** — journal browser with filters, sort, search |
| `src/components/analytics/CalibrationScorecard.jsx` | **New** — Brier score, calibration chart, P&L by confidence |
| `src/services/journalStore.js` | **Edit** — auto-entry generation on trade close, query/filter API, CSV export |
| `src/services/calibrationCalc.js` | **New** — Brier score computation, confidence-bucket aggregation, weekly summary |
| `src/components/analytics/WeeklyReview.jsx` | **New** — weekly performance summary modal |
| `src/config/toolManifest.js` | **Edit** — add journal and calibration tool entries |
| `src/components/MenuBar.jsx` | **Edit** — add Journal/Calibration under Analytics submenu |

---

### E-04: Notification Policy Engine
**Score: 5.50** — Impact: 5 | Effort: 5 | Confidence: 5

**Evidence:**
- Community benchmark: **#1 ranked pain point** (weighted score 11/24) across Reddit, Discord feedback boards, chatroom help docs
- Multiple years of the same request across Discord, Reddit, and forum surfaces
- Cross-surface bonus: appears across 3+ surface types

**Acceptance Criteria:**
1. Room/tag/role-level notification granularity — users can mute specific notification categories without muting all
2. Smart-mute presets (e.g., "Focus Mode" = only @mentions and alerts, "Silent" = nothing, "All" = default)
3. Urgency tiers: critical (always notify), important (unless focus mode), informational (never push)
4. Per-window notification preference override
5. Notification settings accessible from Settings → Notifications

**File Targets:**
| File | Action |
|---|---|
| `src/services/notificationEngine.js` | **New** — notification routing, urgency tiers, mute policy evaluation |
| `src/components/settings/NotificationSettings.jsx` | **New** — notification granularity controls |
| `src/services/settingsStore.js` | **Edit** — add notification policy schema |
| `src/components/SettingsPanel.jsx` | **Edit** — add Notifications tab |

---

### E-05: Alert Reliability Layer
**Score: 5.63** — Impact: 5 | Effort: 4 | Confidence: 5

**Evidence:**
- Community benchmark: #2 ranked pain point (weighted score 9/24) — alert latency, missed/delayed/duplicate signals
- Gap analysis: Missing alert TTL/staleness badges, structured alert envelope
- Interaction audit: alert-trigger step has condition evaluation but no reliability metadata

**Acceptance Criteria:**
1. Alert events carry unique event IDs for deduplication
2. Retry state and delivery status visible per alert (pending → delivered → acknowledged)
3. Stale-signal TTL badge: alerts older than configurable threshold show "stale" indicator
4. Latency timestamp on each alert showing time from condition-true to notification-dispatch
5. Delivery SLA telemetry: track and display average alert latency over rolling window

**File Targets:**
| File | Action |
|---|---|
| `src/services/alertService.js` | **Edit** — add event IDs, delivery tracking, TTL, retry state |
| `src/services/alertEngine.worker.js` | **Edit** — add latency measurement, dedup logic |
| `src/components/scanners/AlertTrigger.jsx` | **Edit** — display delivery status, stale badges, latency |

---

## Tier 2: Important Enhancements (Score 3.0–4.99)

### E-06: Enhanced Scanner Filters
**Score: 5.00** — Impact: 4 | Effort: 4 | Confidence: 5

**Evidence:**
- Platform benchmark: Trade-Ideas 500+ filters vs current limited filter set
- Gap analysis: Missing event-contract-specific filters (time-to-resolution, category, implied probability range)
- Chatrooms: P0 — premarket triage needs ranked candidates with catalyst, liquidity, event window

**Acceptance Criteria:**
1. Add event-contract filters: time-to-resolution, category, implied probability range
2. Saved filter presets (persist across sessions)
3. Filter count badge showing active filter count

**File Targets:**
| File | Action |
|---|---|
| `src/components/scanners/LiveScanner.jsx` | **Edit** — add new filter controls and preset support |
| `src/components/scanners/HistoricalScanner.jsx` | **Edit** — add matching filter controls |
| `src/services/settingsStore.js` | **Edit** — add scanner filter preset schema |

---

### E-07: Strategy/Setup Tagging System
**Score: 6.67** — Impact: 4 | Effort: 3 | Confidence: 5

**Evidence:**
- Communities: P1 — tags from idea to execution to review
- Chatrooms: Lane tags for structured workflow
- Academic: Strategy-tagged attribution for performance analysis

**Acceptance Criteria:**
1. User can create and manage tags (e.g., "momentum", "mean-reversion", "event-driven")
2. Tags assignable to orders at entry time and to trades retroactively
3. Journal and TradeLog filterable by tag
4. Tag-level P&L breakdown in analytics

**File Targets:**
| File | Action |
|---|---|
| `src/services/tagService.js` | **New** — tag CRUD, persistence, assignment |
| `src/components/trade/Montage.jsx` | **Edit** — add tag selector to order entry |
| `src/components/trade/TradeLog.jsx` | **Edit** — add tag column and filter |
| `src/components/analytics/Journal.jsx` | **Edit** — add tag-based filtering and grouping |

---

### E-08: Execution Quality Telemetry
**Score: 8.00** — Impact: 4 | Effort: 2 | Confidence: 4

**Evidence:**
- Academic: TCA (Transaction Cost Analysis), SEC 605/606 metrics
- Communities: P0 — execution quality telemetry
- Platform benchmark: Bloomberg TCA

**Acceptance Criteria:**
1. Post-trade execution report per fill: slippage vs mid-market, fill latency, venue
2. Rolling execution quality dashboard: average slippage, fill rate, latency distribution
3. Comparison against NBBO at time of submission

**File Targets:**
| File | Action |
|---|---|
| `src/services/executionAnalytics.js` | **New** — TCA computation, slippage calculation, fill stats |
| `src/components/analytics/ExecutionDashboard.jsx` | **New** — execution quality visualization |
| `src/services/omsEngine.js` | **Edit** — capture execution metadata (timestamps, prices) |

---

### E-09: Toast / Notification UI System
**Score: 5.00** — Impact: 4 | Effort: 5 | Confidence: 4

**Evidence:**
- Visual feedback gap analysis: Complete absence — no toast component, no notification CSS
- All components lack transient notification capability (order fills, errors, connection changes)
- Interaction audit: order-confirm step checks for fill notification but no UI mechanism exists

**Acceptance Criteria:**
1. Reusable toast component with slide-in animation and auto-dismiss (configurable timeout)
2. Variants: success (green), error (red), warning (yellow), info (blue)
3. Stack multiple toasts vertically
4. Toast triggered from any service via a publish/subscribe bus

**File Targets:**
| File | Action |
|---|---|
| `src/components/Toast.jsx` | **New** — toast container and individual toast component |
| `src/services/toastService.js` | **New** — pub/sub toast bus |
| `src/index.css` | **Edit** — add `.toast-container`, `.toast`, animation keyframes |
| `src/components/Shell.jsx` | **Edit** — mount Toast container |

---

### E-10: Global Focus-Visible & Keyboard Navigation
**Score: 4.00** — Impact: 4 | Effort: 5 | Confidence: 4

**Evidence:**
- Interaction gap analysis: **Critical accessibility gap** — no `:focus-visible` styles, no tab-order management, no arrow-key navigation indicators
- No skip-link or landmark navigation CSS
- Interaction audit: `nav-hotkey` step checks hotkey bindings but no visual focus indicators exist

**Acceptance Criteria:**
1. Global `:focus-visible` outline on all interactive elements using `--border-focus` token
2. `.focusable-row` class for table keyboard navigation with visible highlight
3. Skip-link for keyboard users to bypass menu to workspace content
4. Focus-within highlighting for grouped form controls

**File Targets:**
| File | Action |
|---|---|
| `src/index.css` | **Edit** — add `:focus-visible` rules, `.focusable-row`, skip-link styles |
| `src/components/Shell.jsx` | **Edit** — add skip-link element |

---

### E-11: Structured Callout Composer
**Score: 4.00** — Impact: 4 | Effort: 4 | Confidence: 4

**Evidence:**
- Chatrooms: P0 — enforced-schema callout with lifecycle (`armed → entered → scaled → closed`)
- Community benchmark: #3 pain point (noise-to-signal ratio, weighted score 8)
- Communities independently converge on structured format as the solution

**Acceptance Criteria:**
1. Callout composer with enforced fields: contract, direction, setup type, entry zone, stop, targets, size, confidence
2. Lifecycle state machine: `armed → entered → scaled → closed/invalidated`
3. Callout feed with filter by state, author, market

**File Targets:**
| File | Action |
|---|---|
| `src/components/social/CalloutComposer.jsx` | **New** — structured callout entry form |
| `src/services/calloutService.js` | **New** — callout persistence, lifecycle state machine |
| `src/components/social/CalloutFeed.jsx` | **New** — callout list with filters |

---

### E-12: Window Tab Bar CSS Fix
**Score: 4.00** — Impact: 4 | Effort: 5 | Confidence: 5

**Evidence:**
- Component gap analysis: **CRITICAL GAP** — Window.jsx renders `.window-tab-bar`, `.window-tab`, `.window-tab--active` etc. but **Window.css defines NONE of these classes**
- Tabs are completely unstyled — a broken feature

**Acceptance Criteria:**
1. `.window-tab-bar`, `.window-tab`, `.window-tab--active`, `.window-tab-label`, `.window-tab-detach` fully styled
2. Matches existing design token system (dark theme)
3. Active tab visually distinct from inactive

**File Targets:**
| File | Action |
|---|---|
| `src/components/Window.css` | **Edit** — add complete tab bar CSS |

---

### E-13: Loading Skeletons & Empty States
**Score: 3.00** — Impact: 3 | Effort: 5 | Confidence: 4

**Evidence:**
- Visual feedback gap analysis: No skeleton/shimmer animations anywhere; only 2 components have basic text placeholders
- Empty states exist but are minimal; missing in Positions, TradeLog, Accounts, NewsChat

**Acceptance Criteria:**
1. `.skeleton-line` and `.skeleton-block` utility classes with shimmer animation
2. `.empty-state` class with icon placeholder support
3. Applied to OrderBook, Positions, TradeLog as reference implementations

**File Targets:**
| File | Action |
|---|---|
| `src/index.css` | **Edit** — add skeleton and empty-state utility classes |
| `src/components/trade/OrderBook.jsx` | **Edit** — use skeleton during load |
| `src/components/trade/Positions.jsx` | **Edit** — add empty state |

---

### E-14: Tooltip System
**Score: 3.00** — Impact: 3 | Effort: 5 | Confidence: 4

**Evidence:**
- Formatting gap analysis: **Zero tooltip support** — no column header explanations, no abbreviation tooltips
- Column headers like "Avg Cost", "P&L", "TIF" have no explanations

**Acceptance Criteria:**
1. `.tooltip` / `.tooltip-text` CSS classes with positioned variants (top, bottom, left, right)
2. Arrow pointer styling
3. Column headers in data tables have title attributes for common abbreviations

**File Targets:**
| File | Action |
|---|---|
| `src/index.css` | **Edit** — add tooltip CSS classes |
| `src/components/trade/OrderBook.jsx` | **Edit** — add title attributes to column headers |
| `src/components/trade/Positions.jsx` | **Edit** — add title attributes |
| `src/components/trade/TradeLog.jsx` | **Edit** — add title attributes |

---

### E-15: Connection Status Indicator
**Score: 3.00** — Impact: 3 | Effort: 5 | Confidence: 4

**Evidence:**
- Visual feedback gap analysis: No connection indicator; EventLog logs events as text but no persistent visual
- Critical for trading — users must know WebSocket state

**Acceptance Criteria:**
1. Pulsing dot indicator: green (connected), yellow (reconnecting), red (disconnected)
2. Visible in Shell account bar or status area
3. Driven by WebSocket connection state

**File Targets:**
| File | Action |
|---|---|
| `src/components/ConnectionIndicator.jsx` | **New** — dot indicator component |
| `src/index.css` | **Edit** — add `.connection-indicator` with pulse animation |
| `src/components/Shell.jsx` | **Edit** — mount ConnectionIndicator |

---

## Tier 3: Nice-to-Have Enhancements (Score < 3.0)

### E-16: Tabular-Nums on Data Tables
**Score: 2.40** — Impact: 3 | Effort: 5 | Confidence: 4

Add `font-variant-numeric: tabular-nums` to all data table containers for proper numeric column alignment.

**File Targets:** `src/index.css` — add broad selector for data table fonts.

---

### E-17: P&L Display Utilities
**Score: 2.40** — Impact: 3 | Effort: 5 | Confidence: 4

Add `.pnl-positive`, `.pnl-negative`, `.pnl-zero` utility classes with consistent color, +/- prefix, and optional background tint.

**File Targets:** `src/index.css`

---

### E-18: Context Menu CSS Standardization
**Score: 2.00** — Impact: 2 | Effort: 5 | Confidence: 4

Generic `.context-menu` classes using existing design tokens, replacing per-component duplication.

**File Targets:** `src/index.css`, `src/components/Window.css`

---

### E-19: Sort Indicator CSS Unification
**Score: 2.00** — Impact: 2 | Effort: 5 | Confidence: 4

Generic `.th-sortable`, `.th-sorted-asc`, `.th-sorted-desc` with CSS `::after` arrows, replacing 3 component-specific implementations.

**File Targets:** `src/index.css`

---

### E-20: Keyboard Shortcut Discovery (kbd badges)
**Score: 1.80** — Impact: 3 | Effort: 5 | Confidence: 3

Add `.kbd` CSS class for keyboard key badges. Display hotkey bindings alongside menu items and button labels.

**File Targets:** `src/index.css`, `src/components/MenuBar.jsx`

---

### E-21: Natural-Frequency Probability Display
**Score: 1.60** — Impact: 2 | Effort: 5 | Confidence: 4

Show "X out of 100 similar cases" alongside percentages for key probability displays (Gigerenzer).

**File Targets:** `src/components/trade/PriceLadder.jsx`, `src/components/trade/Montage.jsx`

---

### E-22: Backtest Realism (Walk-Forward + Costs)
**Score: 7.50** — Impact: 3 | Effort: 2 | Confidence: 5

Add walk-forward validation and realistic cost/slippage defaults to HistoricalScanner.

**File Targets:** `src/components/scanners/HistoricalScanner.jsx`, `src/services/backtestEngine.js` (new)

---

### E-23: Cross-Channel Search
**Score: 2.80** — Impact: 4 | Effort: 4 | Confidence: 3.5

Community benchmark: #4 pain point (weighted score 7) — search/discoverability gaps across channels.

**File Targets:** TBD — requires architectural decision on search scope.

---

## Dependency Graph

```
E-01 Risk Guardrails ──────────────────────── (independent)
E-02 Decision Card ─────────────────────────┐
                                             ▼
E-03 Journal & Calibration ◄─── E-07 Strategy Tags
                                             │
                                             ▼
E-08 Execution Quality Telemetry ◄── E-03 (enriches journal data)

E-04 Notification Engine ──────────────────── (independent)
E-05 Alert Reliability ◄─── E-04 (notifications deliver alerts)

E-09 Toast System ─────────────────────────── (independent, enables E-04/E-05 UI)
E-10 Focus-Visible ────────────────────────── (independent)
E-12 Tab Bar CSS Fix ──────────────────────── (independent, quick win)
```

**Recommended Build Sequence:**
1. **Phase 1 (parallel):** E-01 + E-02 + E-09 + E-10 + E-12 — independent items, mix of high-impact features and quick CSS wins
2. **Phase 2:** E-03 (depends on E-02 journalStore) + E-04 + E-05
3. **Phase 3 (parallel):** E-06 + E-07 + E-08 — scanner/tagging/telemetry can be built concurrently
4. **Phase 4:** E-11 + remaining Tier 3 items

---

## Summary Statistics

| Metric | Value |
|---|---|
| Total enhancements identified | 23 |
| Tier 1 (Critical, score ≥ 5.0) | 5 |
| Tier 2 (Important, score 3.0–4.99) | 10 |
| Tier 3 (Nice-to-have, score < 3.0) | 8 |
| Existing strengths confirmed | 10 (Montage, PriceLadder, hotkeys, charts, window mgmt, color linking, OMS, alerts, positions, market clock) |
| Source streams synthesized | 4 (feature inventory, interaction audit, community benchmark, gap analysis + research) |
| Independent sources cross-referenced | 30+ (24 community sources, 4 research docs, 4 gap analyses, 2 audit services) |

### Cross-Cutting Theme

KalshiAlpha has strong **execution plumbing** — order entry, OMS, hotkeys, price ladder, charting are comparable to DAS Trader / Lightspeed. The three largest gap clusters are:

1. **Pre-trade discipline** (E-01, E-02, E-04) — No risk guardrails, no cost/edge visibility, no notification control
2. **Post-trade learning** (E-03, E-07, E-08) — No journaling, no calibration scoring, no strategy-tagged attribution
3. **UX foundations** (E-09, E-10, E-12, E-14, E-15) — Missing toast notifications, focus indicators, tab styling, tooltips, connection status
