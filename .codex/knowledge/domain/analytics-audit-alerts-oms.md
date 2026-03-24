# Analytics, Audit, Alerts & OMS Services

Deep documentation for the four service layers: analytics calculations, audit state tracking, alert system, and order management system.

---

## 1. Analytics Calculation Library (`src/services/analyticsCalc.js`)

**Purpose:** Pure functions for portfolio analytics. All price inputs in cents (1-99), monetary values in cents.

### Exported Functions

| Function | Signature | Returns | Notes |
|----------|-----------|---------|-------|
| `winRate(trades)` | `[{pnlCents}]` → `number` | 0-1 ratio | Fraction of profitable trades |
| `totalPnL(trades)` | `[{pnlCents}]` → `number` | Sum in cents | Sums all pnlCents |
| `expectedValue(trades)` | `[{pnlCents}]` → `number` | Avg pnl/trade | totalPnL / count |
| `kellyFraction(trades)` | `[{pnlCents}]` → `number` | 0-1 clamped | Simplified Kelly: `f* = (bp - q) / b` |
| `omegaRatio(trades, threshold=0)` | `[{pnlCents}]` → `number` | Ratio or Infinity | Gains above threshold / losses below |
| `categoryAttribution(trades)` | `[{pnlCents, category}]` → `Object` | `{[cat]: {pnl, count, winRate}}` | Groups by category field |
| `equityCurve(trades)` | `[{pnlCents, timestamp}]` → `Array` | `[{timestamp, equity}]` | Cumulative P&L sorted by time |
| `dailyPnL(trades)` | `[{pnlCents, timestamp}]` → `Array` | `[{date, pnl, count}]` | Aggregated by calendar day |
| `sharpeRatio(trades, riskFreeRate=0)` | `[{pnlCents, timestamp}]` → `number` | Annualized Sharpe | **BUG:** rfPerTrade formula wrong when riskFreeRate!=0 (see Bugs section) |
| `maxDrawdown(trades)` | `[{pnlCents, timestamp}]` → `Object` | `{maxDrawdown, maxDrawdownPct, peakTimestamp, troughTimestamp}` | Peak-to-trough decline |
| `profitFactor(trades)` | `[{pnlCents}]` → `number` | Gross profit / gross loss | Infinity if no losses |
| `markToMarket(positions, currentPrices)` | `[{ticker, side, count, avgPriceCents}], {ticker: yesPriceCents}` → `Object` | `{totalMtm, positions: [...]}` | YES: (current - avg) * count; NO: ((100 - current) - avg) * count |

### Known Bug

**sharpeRatio line 187:** `rfPerTrade = riskFreeRate / (annualizationFactor ** 2 / n || 1)` computes to `riskFreeRate * n / tradesPerYear` instead of `riskFreeRate / tradesPerYear`. The risk-free adjustment scales with sample size, which is mathematically incorrect. Effect: Sharpe ratio with non-zero riskFreeRate is wrong by factor of n. Benign when default `riskFreeRate=0` is used.

---

## 2. Analytics Service (`src/services/analyticsService.js`)

**Purpose:** Data fetching, caching, and mock fallback. Bridges Kalshi fills API to analyticsCalc pure functions.

### Architecture

```
Kalshi Fills API  ──→  fetchFills() ──→ localStorage cache (5min TTL)
                                    ↓
                             normalizeFill()
                                    ↓
                         computePnLFromFills()  (FIFO buy/sell pairing)
                                    ↓
                         analyticsCalc.* functions
                                    ↓
                         getAnalyticsSnapshot()  ──→ UI
```

### Key Components

- **Cache:** localStorage with `kalshi_analytics_fills` / `kalshi_analytics_settlements` keys, 5-minute TTL
- **Mock Data:** Seeded RNG (seed=42) generates 60 synthetic trades across 10 tickers, 5 categories, 90-day spread, ~55% win rate
- **FIFO P&L:** `computePnLFromFills()` groups fills by `ticker:side`, matches buys with sells in FIFO order, unmatched buys treated as open positions with 0 realized P&L
- **Normalization:** `normalizeFill()` maps Kalshi API fill fields to internal format (`trade_id → tradeId`, `yes_price → priceCents`, `created_time → timestamp`)

### STUB

**Settlement-aware P&L** — current FIFO pairing doesn't account for binary settlement. Settled markets (contract resolves at 100 or 0 cents) are not detected. Would need `getMarket(ticker).result` to determine settlement value.

### Exports

`getTrades`, `getAnalyticsSnapshot`, `clearCache`, `isUsingMockData`, `getMockTrades`, `normalizeFill`, `computePnLFromFills`

---

## 3. Audit State Service (`src/services/auditStateService.js`)

**Purpose:** Tracks codebase audit progress for continuous improvement. NOT a runtime trading feature — it's a meta-service for development tooling.

### Scoring Rubric

4 dimensions, weights sum to 1.0:
- **completeness** (0.30): Does the function fully implement its behavior? (1=stub, 5=fully implemented)
- **accuracy** (0.25): Is the logic correct? (1=known bugs, 5=verified correct)
- **performance** (0.20): Efficient for expected usage? (1=O(n²) on hot path, 5=optimal)
- **uxQuality** (0.25): User-facing quality? (1=no feedback, 5=polished)

### Data Model

- **Functions Map:** `"filePath::functionName"` → `{filePath, functionName, metadata, ratings, improved, changeId}`
- **Improvements Array:** `[{id, filePath, functionName, dimension, suggestion, priority, source, status, createdAt, resolvedAt}]`
- **Persistence:** localStorage keys `kalshi-audit-state` (Map serialized as entries array) and `kalshi-audit-improvements`

### Key Functions

- `registerFunction(filePath, functionName, metadata)` — add or update function entry
- `rateFunction(filePath, functionName, ratings)` — score on 4 dimensions
- `computeWeightedScore(ratings)` — weighted average (0-5)
- `getAuditProgress()` → `{total, reviewed, improved, pending}`
- `getFunctionsByRating(maxRating)` — functions scoring below threshold, sorted worst-first
- `addImprovement({filePath, functionName, dimension, suggestion, priority, source})` — create improvement record
- `exportForPrioritization()` — full dump sorted worst-first with linked improvements

---

## 4. Alert Service (`src/services/alertService.js`)

**Purpose:** Orchestration layer for real-time price/volume alerts. Bridges dataFeed tick data to alertEngine Web Worker.

### Architecture

```
dataFeed.subscribeToTicker() ──→ alertService ──→ [Web Worker: alertEngine]
                                      ↑                      ↓
                                 Rule CRUD              postMessage('alerts')
                                      ↑                      ↓
                                 localStorage          handleWorkerMessage()
                                                            ↓
                                                   dispatchNotification()
                                                   (sound + desktop notif)
```

### Alert Rule Types

| Type | Params | Trigger |
|------|--------|---------|
| `price_crosses` | `{threshold, direction: 'above'\|'below'\|'either'}` | Price crosses threshold |
| `pct_change` | `{pctThreshold, lookback}` | Price changes >X% over lookback ticks |
| `volume_spike` | `{multiplier, window}` | Volume exceeds rolling avg by multiplier |

### Rule Lifecycle

- **Creation:** `addRule({type, ticker, params, label, ttlMinutes, thesis, invalidation})` — validates type/params, assigns UUID, sets TTL expiry
- **TTL:** Default 60 minutes. `expiresAt` ISO timestamp. `purgeExpiredRules()` for cleanup.
- **Thesis/Invalidation:** Each rule can store trade thesis and invalidation conditions (unique feature)
- **Toggle:** `toggleRule(id)` flips enabled flag
- **History:** Max 200 entries, LIFO. Each entry enriched with `thesis` and `invalidation` from source rule.

### Worker Lifecycle

- Auto-spawns on first `ensureWorker()` call
- Auto-recovers on crash: terminates, waits 2s, restarts if any enabled rules exist, rebinds ticker subscriptions
- Receives full rule set on spawn via `set_rules` message
- Processes ticks, evaluates rules, returns alerts via postMessage

### Notification Dispatch

- **Sound:** Web Audio API — 880Hz sine wave, 0.3s duration, exponential volume ramp. Controlled by `settingsStore.getNotifications().soundAlerts`.
- **Desktop:** Browser Notification API. Controlled by `settingsStore.getNotifications().desktopNotifications`. Permission must be explicitly requested.

### Ticker Subscriptions

`syncTickerSubscriptions()` — reads enabled rules, subscribes to needed tickers via `dataFeed.subscribeToTicker()`, unsubscribes from unused tickers. Called after every rule change.

---

## 5. Alert Engine Worker (`src/services/alertEngine.worker.js`)

**Purpose:** Evaluates alert rules against tick data in a Web Worker (off main thread).

### Data Structures

- **Circular Buffer:** `Float64Array(256)` with head/count tracking. One price buffer + one volume buffer per ticker.
- **Cooldown Map:** `ruleId → lastFiredTimestamp`. Default 30s cooldown prevents rapid re-firing.

### Evaluators

- **price_crosses:** Compares `bufferLatest` vs `bufferPrevious` against threshold. Detects crossing direction.
- **pct_change:** Compares latest price vs price at `lookback` ticks ago. Fires when `|pctChange| >= pctThreshold`.
- **volume_spike:** Computes rolling average over `window` ticks (excluding latest), fires when `latestVol / avg >= multiplier`.

### Message Protocol

| Incoming | Payload | Action |
|----------|---------|--------|
| `tick` | `{ticker, price, volume}` | Push to buffers, evaluate rules |
| `set_rules` | `{rules: [...]}` | Replace entire rules array |
| `add_rule` | `{...rule}` | Push single rule |
| `remove_rule` | `{id}` | Filter out rule, clear cooldown |
| `update_rule` | `{id, ...updates}` | Merge updates into matching rule |
| `clear_cooldown` | `{id}` or `{}` | Clear one or all cooldowns |
| `ping` | — | Respond with `{type:'pong', timestamp, ruleCount}` |

| Outgoing | Payload |
|----------|---------|
| `alerts` | `{type:'alerts', alerts: [...]}` |

---

## 6. OMS Engine (`src/services/omsEngine.js`)

**Purpose:** Pure state machine for order management. No API calls — omsService bridges to Kalshi.

### Order FSM

```
PENDING ──→ SUBMITTED ──→ OPEN ──→ PARTIAL ──→ FILLED (terminal)
  │              │           │         │
  │              │           │         └──→ CANCELLED (terminal)
  │              │           └──→ CANCELLED
  │              │           └──→ FILLED
  │              └──→ FILLED
  │              └──→ REJECTED (terminal)
  │              └──→ CANCELLED
  └──→ REJECTED
  └──→ CANCELLED
```

### Order Object Shape

```javascript
{
  id,                // Exchange order ID (set on acknowledgement)
  clientOrderId,     // Client-generated UUID
  ticker, side, action, type, price, count,
  filledCount, remainingCount, avgFillPrice,
  status,
  fills: [{fillId, orderId, ticker, side, action, price, count, timestamp}],
  createdAt, updatedAt, submittedAt, filledAt, cancelledAt, rejectedAt,
  rejectReason,
}
```

### Position Aggregation

- Keyed by `"ticker:side"`. Fields: `contracts, avgCost, realized, totalCost, updatedAt`
- **Buy:** Adds to position, recalculates avgCost as totalCost/contracts
- **Sell:** Reduces position. Realized P&L: `(price - avgCost) * count` for YES, `(avgCost - price) * count` for NO
- **Note:** avgCost stores the YES-equivalent price even for NO positions (matches fill price format from WS)
- **Unrealized P&L:** YES: `(currentPrice - avgCost) * contracts`, NO: `(avgCost - currentPrice) * contracts`

### Dual-Indexing

Orders are indexed by both `clientOrderId` and exchange `id` (when available). `getAllOrders()` deduplicates via `seen` Set.

### State Import/Export

`exportState()` → `{orders: [], positions: []}` for localStorage serialization.
`importState(state)` — clears and rebuilds from serialized data.

---

## 7. OMS Service (`src/services/omsService.js`)

**Purpose:** Bridges OMS engine to Kalshi API and WebSocket. Handles order submission, WS events, persistence, sync.

### Architecture

```
UI ──→ submitOrder()/cancelOrder()/amendOrder()
              ↓
        omsEngine.createOrder() (PENDING)
              ↓
        kalshiApi.createOrder() (REST)
              ↓
        omsEngine.markSubmitted() (SUBMITTED)
              ↓
        WS user_orders/user_fills channels
              ↓
        processWsOrderUpdate() / processWsFillUpdate()
              ↓
        omsEngine state transitions + position updates
              ↓
        Auto-save to localStorage
```

### Key Features

- **Auto-persistence:** Engine events (`order:updated`, `position:updated`, `state:reset`) trigger `saveState()` automatically
- **WS Auto-connect:** Subscribes to `user_orders` and `user_fills` channels when WS connected, stops when disconnected
- **Exchange Sync:** `syncWithExchange()` pulls current orders, positions, fills via REST. Called 500ms after WS reconnect. Deduplicates fills by `trade_id`.
- **Price Inversion:** NO-side orders: `yes_price = 100 - params.price` sent to API. Fill prices from WS are YES prices.
- **Immediate Fill Handling:** If exchange responds with `status: 'executed'`, transitions to FILLED without calling `processFill` (avoids double-counting when WS fill arrives).

### STUB

**Order deduplication on sync** — if an order was created outside this session and fills arrived before the order was known, fills can be missed. Needs persistent fill ID index.

### Kalshi Status Mapping

| Kalshi Status | Engine Status |
|---------------|---------------|
| `resting` | OPEN |
| `active` | OPEN |
| `executed` | FILLED |
| `canceled`/`cancelled` | CANCELLED |
| `pending` | SUBMITTED |

### Exports

`submitOrder`, `cancelOrder`, `amendOrder`, `syncWithExchange`, `getAllOrders`, `getOpenOrders`, `getOrdersByTicker`, `getPosition`, `getAllPositions`, `getRecentFills`, `getUnrealizedPnl`, `getTotalPnl`, `getPositionSummaries`, `initialize`, `resetState`, `on`, `ORDER_STATUS`, `ORDER_TYPES`

---

## Cross-Cutting Patterns

1. **localStorage persistence** — all services use localStorage with lazy loading (null sentinel), try/catch for quota, and manual JSON serialization
2. **Listener pattern** — Set-based listeners with unsubscribe-by-return-value (same as hotkeyStore)
3. **Event forwarding** — omsService wraps engine events and adds UI-specific events
4. **Mock fallback** — analyticsService falls back to seeded deterministic mock data when API unavailable
5. **Worker offloading** — alertEngine runs evaluations off main thread; auto-recovers on crash

## Dependencies

- `analyticsCalc.js` — no imports (pure)
- `analyticsService.js` → `kalshiApi`, `analyticsCalc`
- `auditStateService.js` — no imports (pure + localStorage)
- `alertService.js` → `dataFeed`, `settingsStore`
- `alertEngine.worker.js` — no imports (standalone worker)
- `omsEngine.js` — no imports (pure + events)
- `omsService.js` → `kalshiApi`, `kalshiWebSocket`, `omsEngine`
