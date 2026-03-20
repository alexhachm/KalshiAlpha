# Next-Cycle Backlog — req-519be397

**Generated:** 2026-03-19
**Derived from:** `prioritized-enhancements.md` (23-item plan) + unresolved issues from `final-report.md`
**Scoring:** Composite = (Impact × Confidence) / Effort — higher score = do first

---

## Backlog Overview

| Priority | Items | Rationale |
|---|---|---|
| Cycle 2 (immediate) | 5 | Highest composite scores, unblocked, self-contained |
| Cycle 3 | 5 | Depend on Cycle 2 completions or moderate scope |
| Cycle 4+ | 9 | Nice-to-have, architectural scope, or deferred |
| Out of scope | 1 | Trust/identity features outside trading terminal |

---

## Cycle 2 — Immediate (High Score, Unblocked)

### B-01 · Performance Journal & Calibration Scorecard
**Enhancement:** E-03 | **Score:** 8.33 | **Effort:** Medium (3) | **Impact:** 5 | **Confidence:** 5

**Why now:** Highest composite score in the plan. Evidence converges across academic research (Mellers/Brier), community sentiment (5/7 coverage areas), and pro platform benchmarks (DTD auto-journaling, Bloomberg TCA). Builds on `journalStore` stub created by Decision Card partial work.

**Acceptance criteria:**
1. Every completed trade auto-generates a journal entry: market, side, entry/exit price, realized P&L, confidence at entry, rationale at entry, hold duration
2. Journal window with filters: date range, market, P&L, confidence level
3. Calibration Scorecard tab: rolling 30-day Brier score, calibration chart (confidence bucket vs actual win rate), avg P&L by confidence level
4. Weekly Review prompt (dismissable) every 7 days: total trades, win rate, best/worst trade, avg confidence vs outcome
5. CSV export of journal data
6. `localStorage` persistence with IndexedDB migration path

**File targets:**
| File | Action |
|---|---|
| `src/components/analytics/Journal.jsx` | New |
| `src/components/analytics/CalibrationScorecard.jsx` | New |
| `src/services/journalStore.js` | New — auto-entry on trade close, query/filter API, CSV export |
| `src/services/calibrationCalc.js` | New — Brier score, confidence-bucket aggregation |
| `src/components/analytics/WeeklyReview.jsx` | New |
| `src/config/toolManifest.js` | Edit — add journal + calibration entries |
| `src/components/MenuBar.jsx` | Edit — add under Analytics submenu |

---

### B-02 · Execution Quality Telemetry
**Enhancement:** E-08 | **Score:** 8.00 | **Effort:** Low (2) | **Impact:** 4 | **Confidence:** 4

**Why now:** Second-highest composite score. Low effort (2) because the OMS already captures fill metadata — this is primarily a computation + display layer. SEC 605/606 methodology is well-defined.

**Acceptance criteria:**
1. Post-trade execution report per fill: slippage vs mid-market at submission time, fill latency, venue
2. Rolling execution quality dashboard: average slippage, fill rate, latency distribution histogram
3. Comparison against NBBO (best bid/offer) at time of submission

**File targets:**
| File | Action |
|---|---|
| `src/services/executionAnalytics.js` | New — TCA computation, slippage calc, fill stats |
| `src/components/analytics/ExecutionDashboard.jsx` | New — execution quality viz |
| `src/services/omsEngine.js` | Edit — capture execution metadata (submission timestamp, submission price) |

---

### B-03 · Risk Guardrails Engine
**Enhancement:** E-01 | **Score:** 6.25 | **Effort:** Medium-High (4) | **Impact:** 5 | **Confidence:** 5

**Why now:** #1 community pain point across 6/7 coverage areas (18 independent mentions). Interaction audit confirmed no risk gating in order-entry flow. Platform benchmark identifies Lightspeed SRM auto-flatten as reference. Academic evidence (Benartzi/Thaler, Barber/Odean) confirms uncontrolled trading degrades returns.

**Acceptance criteria:**
1. Daily max-loss limit (dollar): breach blocks new order submission with interruptive modal
2. Max position size (contracts per market): order entry rejects over-limit with clear error
3. Max open positions (all markets): new orders blocked at the limit
4. Streak-based cooldown: N consecutive losses → 5-minute trading pause with countdown
5. Kill-switch button in MenuBar: one-click cancels all open orders + flattens all positions (with confirmation)
6. All limits persist via `localStorage`, configurable in Settings → Trading
7. Risk state widget: daily P&L, consecutive losses, position count — compact always-visible display

**File targets:**
| File | Action |
|---|---|
| `src/services/riskEngine.js` | New — risk state machine: P&L accumulator, position counter, streak tracker, cooldown timer |
| `src/components/trade/RiskStatusBar.jsx` | New — compact widget |
| `src/components/SettingsPanel.jsx` | Edit — add Risk Management sub-tab |
| `src/services/omsService.js` | Edit — pre-submission hook calling `riskEngine.evaluate()` |
| `src/components/trade/KillSwitch.jsx` | New — kill-switch with cancel-all + flatten |
| `src/components/MenuBar.jsx` | Edit — add KillSwitch |
| `src/services/settingsStore.js` | Edit — risk settings schema |

---

### B-04 · Strategy/Setup Tagging System
**Enhancement:** E-07 | **Score:** 6.67 | **Effort:** Medium (3) | **Impact:** 4 | **Confidence:** 5

**Why now:** Score 6.67 — higher than E-01/E-02. Enables tag-level P&L attribution in Journal (B-01) and execution analytics (B-02). Chatrooms and communities both independently flag lane/tag workflows as P1.

**Acceptance criteria:**
1. User can create/manage tags (e.g., "momentum", "event-driven", "mean-reversion")
2. Tags assignable to orders at entry time and to trades retroactively
3. Journal and TradeLog filterable by tag
4. Tag-level P&L breakdown in analytics

**File targets:**
| File | Action |
|---|---|
| `src/services/tagService.js` | New — tag CRUD, persistence, assignment |
| `src/components/trade/Montage.jsx` | Edit — tag selector in order entry |
| `src/components/trade/TradeLog.jsx` | Edit — tag column + filter |
| `src/components/analytics/Journal.jsx` | Edit — tag-based filtering and grouping |

**Dependency:** Implement alongside B-01 (Journal) — shared `journalStore` enriched with tag data.

---

### B-05 · Toast / Notification UI System
**Enhancement:** E-09 | **Score:** 5.00 | **Effort:** Low (5) | **Impact:** 4 | **Confidence:** 4

**Why now:** Blocking dependency for E-04 (Notification Policy Engine) and the `fill-notification` gap found in the interaction audit. All order fill confirmations, error states, and connection changes currently have no transient UI feedback.

**Acceptance criteria:**
1. Reusable toast component: slide-in animation, auto-dismiss (configurable timeout)
2. Variants: success (green), error (red), warning (yellow), info (blue)
3. Stack multiple toasts vertically with overflow handling
4. Toast triggered from any service via pub/sub bus (`toastService.emit()`)

**File targets:**
| File | Action |
|---|---|
| `src/components/Toast.jsx` | New — toast container + individual toast |
| `src/services/toastService.js` | New — pub/sub bus |
| `src/index.css` | Edit — `.toast-container`, `.toast`, animation keyframes |
| `src/components/Shell.jsx` | Edit — mount toast container |

---

## Cycle 3 — After Cycle 2 Completions

### B-06 · Pre-Trade Decision Card (Full)
**Enhancement:** E-02 | **Score:** 6.25 | **Effort:** Medium-High (4) | **Impact:** 5 | **Confidence:** 5

**Status:** Cost preview partially shipped (Montage). Missing: confidence selector, rationale capture, `journalStore` linkage.

**Remaining acceptance criteria:**
1. Decision Card panel: spread cost + estimated slippage, edge estimate (entry vs mid-market), fee summary, total implementation cost
2. Confidence selector (1–5 scale) + Rationale text field (max 280 chars)
3. Confidence + rationale stored locally, linked to fill via `journalStore`
4. Card is dismissable ("Submit Anyway") — not a hard block
5. Toggleable via Settings → Trading

**Dependencies:** B-01 (journalStore for rationale persistence)

---

### B-07 · Notification Policy Engine
**Enhancement:** E-04 | **Score:** 5.50 | **Effort:** Low (5) | **Impact:** 5 | **Confidence:** 5

**Why cycle 3:** Depends on Toast system (B-05) for UI delivery. Community benchmark #1 pain point.

**Acceptance criteria:**
1. Room/tag/role-level notification granularity
2. Smart-mute presets: Focus Mode, Silent, All
3. Urgency tiers: critical (always), important (unless focus), informational (never push)
4. Per-window notification preference override
5. Settings → Notifications

**File targets:**
| File | Action |
|---|---|
| `src/services/notificationEngine.js` | New |
| `src/components/settings/NotificationSettings.jsx` | New |
| `src/services/settingsStore.js` | Edit — notification policy schema |
| `src/components/SettingsPanel.jsx` | Edit — Notifications tab |

---

### B-08 · Alert Reliability Layer (Full)
**Enhancement:** E-05 | **Score:** 5.63 | **Effort:** Medium-High (4) | **Impact:** 5 | **Confidence:** 5

**Status:** TTL/staleness and structured envelope shipped. Missing: event IDs for deduplication, retry state, delivery SLA telemetry.

**Remaining acceptance criteria:**
1. Unique event IDs on all alert events (idempotency key)
2. Retry state and delivery status per alert: pending → delivered → acknowledged
3. Latency timestamp: time from condition-true to notification-dispatch
4. Delivery SLA telemetry: average alert latency over rolling window, displayed in AlertTrigger

**File targets:**
| File | Action |
|---|---|
| `src/services/alertService.js` | Edit — add event IDs, delivery tracking |
| `src/services/alertEngine.worker.js` | Edit — add latency measurement, dedup |
| `src/components/scanners/AlertTrigger.jsx` | Edit — display delivery status, latency |

---

### B-09 · Window Tab Bar CSS Fix
**Enhancement:** E-12 | **Score:** 4.00 | **Effort:** Low (5) | **Impact:** 4 | **Confidence:** 5

**Why cycle 3:** Quick win. `Window.jsx` renders `.window-tab-bar`, `.window-tab`, `.window-tab--active` etc. but `Window.css` defines **none** of these classes. Tabs are completely unstyled — a broken feature.

**Acceptance criteria:**
1. `.window-tab-bar`, `.window-tab`, `.window-tab--active`, `.window-tab-label`, `.window-tab-detach` fully styled
2. Matches existing design token system (dark theme)
3. Active tab visually distinct from inactive

**File targets:** `src/components/Window.css` — add complete tab bar CSS.

---

### B-10 · Connection Status Indicator
**Enhancement:** E-15 | **Score:** 3.00 | **Effort:** Low (5) | **Impact:** 3 | **Confidence:** 4

**Acceptance criteria:**
1. Pulsing dot indicator: green (connected), yellow (reconnecting), red (disconnected)
2. Visible in Shell account bar or status area
3. Driven by WebSocket connection state from `kalshiWebSocket.js`

**File targets:**
| File | Action |
|---|---|
| `src/components/ConnectionIndicator.jsx` | New |
| `src/index.css` | Edit — `.connection-indicator` with pulse animation |
| `src/components/Shell.jsx` | Edit — mount indicator |

---

## Cycle 4+ — Deferred / Lower Priority

### B-11 · Backtest Realism (Walk-Forward + Costs)
**Enhancement:** E-22 | **Score:** 7.50 | **Effort:** Low (2) | **Impact:** 3 | **Confidence:** 5

Note: High score but intentionally deferred — interaction audit runner and scoring engine need stabilization first. Also requires realistic fee/slippage data for Kalshi markets.

**Scope:** Add walk-forward validation and realistic cost/slippage defaults to `HistoricalScanner`.
**File targets:** `src/components/scanners/HistoricalScanner.jsx`, `src/services/backtestEngine.js` (new)

---

### B-12 · Global Focus-Visible & Keyboard Navigation (Full)
**Enhancement:** E-10 | **Score:** 4.00 | **Effort:** Low (5) | **Impact:** 4 | **Confidence:** 4

**Status:** Skip-link added. Missing: global `:focus-visible` outline, `.focusable-row`, focus-within for grouped controls.

**File targets:** `src/index.css`, `src/components/Shell.jsx`

---

### B-13 · Tooltip System
**Enhancement:** E-14 | **Score:** 3.00 | **Effort:** Low (5) | **Impact:** 3 | **Confidence:** 4

Add `.tooltip`/`.tooltip-text` CSS classes with positioned variants and arrow pointers. Apply `title` attributes to data table column headers.

**File targets:** `src/index.css`, `src/components/trade/OrderBook.jsx`, `src/components/trade/Positions.jsx`, `src/components/trade/TradeLog.jsx`

---

### B-14 · Loading Skeletons & Empty States
**Enhancement:** E-13 | **Score:** 3.00 | **Effort:** Low (5) | **Impact:** 3 | **Confidence:** 4

Add `.skeleton-line` / `.skeleton-block` utility classes with shimmer animation. Apply to OrderBook, Positions, TradeLog.

**File targets:** `src/index.css`, `src/components/trade/OrderBook.jsx`, `src/components/trade/Positions.jsx`

---

### B-15 · Structured Callout Composer
**Enhancement:** E-11 | **Score:** 4.00 | **Effort:** Medium-High (4) | **Impact:** 4 | **Confidence:** 4

Enforced-schema callout with lifecycle (`armed → entered → scaled → closed`). Addresses noise-to-signal ratio (community #3 pain point).

**File targets:** `src/components/social/CalloutComposer.jsx`, `src/services/calloutService.js`, `src/components/social/CalloutFeed.jsx`

---

### B-16 · Cross-Channel Search
**Enhancement:** E-23 | **Score:** 2.80 | **Effort:** Medium (4) | **Impact:** 4 | **Confidence:** 3.5

Requires architectural decision on search scope (full-text, market-scoped, or alert-scoped). Deferred until callout composer (B-15) and news intelligence stabilize.

---

### B-17 · Tabular-Nums, P&L Utilities, Context Menu CSS, Sort Indicators, kbd Badges
**Enhancements:** E-16 through E-20 | **Score:** 1.80–2.40

Low-effort CSS utilities. Can be batch-shipped in a single PR.

**File targets:** `src/index.css`, `src/components/Window.css`

---

### B-18 · Natural-Frequency Probability Display
**Enhancement:** E-21 | **Score:** 1.60 | **Effort:** Low (5) | **Impact:** 2 | **Confidence:** 4

Show "X out of 100 similar cases" alongside percentages (Gigerenzer). Low priority — informational refinement.

**File targets:** `src/components/trade/PriceLadder.jsx`, `src/components/trade/Montage.jsx`

---

## Dependency Graph for Cycle 2–3

```
B-05 Toast System ──────────────────────────────── (independent, ship first)
     └──► B-07 Notification Policy Engine

B-01 Journal ──────────────────────────────────── (independent)
     └──► B-06 Decision Card (full, needs journalStore)
     └──► B-04 Strategy Tags (enriches journal)

B-02 Execution Telemetry ──────────────────────── (independent, low effort)

B-03 Risk Guardrails ──────────────────────────── (independent)

B-08 Alert Reliability ◄─────── B-07 Notification Engine

B-09 Tab Bar CSS ──────────────────────────────── (independent, quick win)
B-10 Connection Indicator ─────────────────────── (independent, quick win)
```

**Recommended cycle 2 build sequence:**
1. **Parallel:** B-02 + B-05 + B-09 + B-10 (low effort, unblocked)
2. **Parallel:** B-01 + B-03 + B-04 (medium effort, independent)

---

## Cycle 2 Targets Summary

| ID | Enhancement | Score | Files | Effort |
|---|---|---|---|---|
| B-01 | Performance Journal & Calibration Scorecard | 8.33 | 7 | Medium |
| B-02 | Execution Quality Telemetry | 8.00 | 3 | Low |
| B-03 | Risk Guardrails Engine | 6.25 | 7 | Medium |
| B-04 | Strategy/Setup Tagging System | 6.67 | 4 | Medium |
| B-05 | Toast / Notification UI System | 5.00 | 4 | Low |

**Expected cycle 2 output:** 25 new/modified files, ~2,500–3,500 net lines, closing the three dominant gap clusters (pre-trade discipline, post-trade learning, UX foundations).

---

## Audit Loop — Recommended Trigger Conditions

To maintain quality without over-auditing:

| Condition | Action |
|---|---|
| After every 5 merged PRs | Re-run `runScoringEngine()` — update composite scores for changed files |
| After every cycle completion | Full benchmark refresh — community sources + platform benchmark |
| When a Tier 1 item is closed | Re-score the dependent cluster to check if new Tier 1 items surface |
| Monthly | Full interaction audit runner pass — regression-check all 5 flows |
