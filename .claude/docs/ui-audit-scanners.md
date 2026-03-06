# UI Audit: Scanners, Alerts, Analytics, OMS, Services & Hooks

> Generated 2026-03-06 by worker-3 (Opus). Exhaustive audit of all scanner UI components, service files, and React hooks.

---

## Table of Contents

1. [LiveScanner](#livescanner)
2. [HistoricalScanner](#historicalscanner)
3. [AlertTrigger](#alerttrigger)
4. [MarketClock](#marketclock)
5. [MarketClockSettings](#marketclocksettings)
6. [Services](#services)
   - [alertService.js](#alertservicejs)
   - [alertEngine.worker.js](#alertengineworkerjs)
   - [analyticsService.js](#analyticsservicejs)
   - [analyticsCalc.js](#analyticscalcjs)
   - [omsEngine.js](#omsenginejs)
   - [omsService.js](#omsservicejs)
   - [dataFeed.js](#datafeedjs)
   - [hotkeyStore.js](#hotkeystorejs)
   - [hotkeyLanguage.js](#hotkeylanguagejs)
   - [settingsStore.js](#settingsstorejs)
   - [linkBus.js](#linkbusjs)
7. [Hooks](#hooks)
   - [useKalshiData.js](#usekalshidatajs)
   - [useGridCustomization.js](#usegridcustomizationjs)
   - [useHotkeyDispatch.js](#usehotkeydispatchjs)
8. [Cross-Cutting Patterns](#cross-cutting-patterns)
9. [Identified Pain Points](#identified-pain-points)

---

## LiveScanner

**File:** `src/components/scanners/LiveScanner.jsx` (279 lines)
**CSS:** `src/components/scanners/LiveScanner.css` (339 lines)

### Layout & Structure

- **Root:** `.live-scanner` — full-height flex column, `font-family: var(--font-mono)`, `font-size: var(--font-size-sm)`, `color: var(--text-primary)`.
- **Toolbar (`.ls-toolbar`):** Flex row, space-between, `padding: var(--spacing-xs) var(--spacing-sm)`, `border-bottom: 1px solid var(--border-color)`, `gap: var(--spacing-sm)`.
  - **Left side:** Filter select dropdown + alert count label.
  - **Right side:** Pause/resume button, clear button (Trash2 icon), settings toggle button (Settings icon).
- **Settings panel (`.ls-settings`):** Collapsible panel below toolbar. `background: var(--bg-tertiary)`, `border-bottom: 1px solid var(--border-color)`, `padding: var(--spacing-sm)`, column flex with `gap: var(--spacing-xs)`. Contains: max results (number input), min conviction (select), conviction bars toggle (checkbox), plus `GridSettingsPanel` component.
- **Table (`.ls-table-wrap`):** Flex-grows to fill remaining space, `overflow-y: auto`, `min-height: 0`. Table has `table-layout: fixed`, `border-collapse: collapse`.

### Colors & Typography

| Element | Color/Font | Token |
|---------|-----------|-------|
| Root font | Monospace | `var(--font-mono)` |
| Root size | Small | `var(--font-size-sm)` |
| Column headers | Muted, uppercase, 600 weight | `var(--text-muted)`, `var(--font-size-xs)`, `letter-spacing: 0.5px` |
| Sorted column header | Accent | `var(--accent-highlight)` |
| Time cell | Muted, xs | `var(--text-muted)`, `var(--font-size-xs)`, width 80px |
| Ticker cell | Bold, sm, accent link | `font-weight: 600`, `var(--accent-highlight)` on link |
| Strategy cell | Secondary, sm | `var(--text-secondary)`, `var(--font-size-sm)` |
| Type BULL | Buy accent | `var(--accent-buy)` |
| Type BEAR | Sell accent | `var(--accent-sell)` |
| Type NEUTRAL | Neutral accent | `var(--accent-neutral)` |
| Conviction bars inactive | Tertiary bg | `var(--bg-tertiary)`, `border: 1px solid var(--border-subtle)` |
| Conviction bars active (1-2) | Buy accent | `var(--accent-buy)` |
| Conviction bar active (3) | Info accent | `var(--accent-info)` |
| Empty state | Muted, sm, center | `var(--text-muted)`, `var(--font-size-sm)`, `padding: var(--spacing-xl)` |

### Borders & Spacing

- **Toolbar padding:** `var(--spacing-xs) var(--spacing-sm)`
- **Cell padding:** `var(--spacing-xs) var(--spacing-sm)`
- **Header border-bottom:** `1px solid var(--border-color)`
- **Row border-bottom:** `1px solid var(--border-subtle)`
- **Alternating rows:** `:nth-child(even)` gets `var(--bg-row-alt)`

### Hover & Focus States

- **Filter select hover/focus:** `border-color: var(--border-focus)`
- **Toolbar button hover:** `background: var(--bg-hover)`, `color: var(--text-primary)`, `border-color: var(--border-color)`
- **Active toolbar button:** `background: var(--accent-highlight)`, `color: var(--bg-primary)`, `border-color: var(--accent-highlight)`
- **Row hover:** `background: var(--bg-hover)`
- **Ticker link hover:** `filter: brightness(1.2)`, `text-decoration: underline`
- **Column header hover:** `color: var(--text-secondary)`
- **Drag-over column:** `border-left: 2px solid var(--accent-info)`

### Data Display Patterns

- **Time:** `alert.time` — string, displayed as-is (e.g., "14:35:22")
- **Ticker:** Rendered as `.scanner-ticker-link` span — accent-colored, clickable
- **Type:** Uppercased (`alert.type.toUpperCase()`), color-coded by bull/bear/neutral
- **Conviction:** Either visual bars (3-bar system, 12×8px each) or numeric display
- **Count display:** `{sorted.length} alerts` in muted text

### Interactive States

- **Filter select:** 4 options — All Types, Bull, Bear, Neutral
- **Pause/Resume toggle:** Unicode chars ▶/⏸, toggles `paused` state
- **Clear button:** Trash2 icon, resets alerts array
- **Settings toggle:** Settings gear icon, expands/collapses settings panel
- **Row click:** Emits ticker to linked windows via `emitLinkedMarket(windowId, ticker)`
- **Column sort:** Click header to sort; arrow indicator ▲/▼
- **Column drag-reorder:** Draggable headers via `useGridCustomization`

### Animations

- `.ls-row--updated`: `ls-flash-update` keyframe, 0.6s ease-out, from `var(--flash-win-bg)` to transparent
- `.ls-row--new`: `ls-flash-new` keyframe, 0.8s ease-out, from `rgba(212, 168, 83, 0.18)` to transparent
- `.ls-live-dot`: 6×6px circle, `var(--accent-win)`, uses global `glow-pulse` animation 1.5s infinite
- `.ls-live-dot--paused`: `var(--accent-neutral)`, no animation

### Data Flow

1. `subscribeToScanner()` from `mockData.js` (imported directly, not via dataFeed) pushes alerts
2. Alerts accumulated in ref + state, capped at `settings.maxResults`
3. Filtered by type and min conviction
4. Sorted by selected column
5. Row click emits to linkBus

### Settings Persistence

- `localStorage.getItem('live-scanner-settings-${windowId}')` — stores maxResults, sortColumn, sortAsc, filterType, minConviction, showConvictionBars
- Grid customization stored separately via `useGridCustomization('liveScanner-${windowId}')`

### Font Size System

- FONT_SIZE_MAP: `{ small: 11, medium: 12, large: 14 }` — applied via inline `style={{ fontSize: fontSizePx }}` on table wrapper
- Grid-level fontSize from `useGridCustomization`

---

## HistoricalScanner

**File:** `src/components/scanners/HistoricalScanner.jsx` (345 lines)
**CSS:** `src/components/scanners/HistoricalScanner.css` (392 lines)

### Layout & Structure

- **Root:** `.historical-scanner` — full-height flex column, same base font as LiveScanner.
- **Criteria bar (`.hs-criteria`):** Top section, `background: var(--bg-secondary)`, `border-bottom: 1px solid var(--border-color)`, `padding: var(--spacing-sm)`, flex column with `gap: var(--spacing-xs)`.
  - **Row 1:** From date input + To date input
  - **Row 2:** Pattern select dropdown + Scan button
- **Toolbar (`.hs-toolbar`):** Same pattern as LiveScanner — count + export button + settings toggle.
- **Settings panel (`.hs-settings`):** Same structure as LiveScanner — max results, default range days, confidence bars toggle, GridSettingsPanel.
- **Table:** Same structure as LiveScanner — sticky thead, scrollable tbody.

### Colors & Typography

| Element | Color/Font | Token |
|---------|-----------|-------|
| Criteria labels | Muted, xs, uppercase | `var(--text-muted)`, `var(--font-size-xs)`, `letter-spacing: 0.5px` |
| Date cells | Muted, xs, width 90px | `var(--text-muted)`, `var(--font-size-xs)` |
| Ticker cells | Bold, sm, accent link | Same as LiveScanner |
| Pattern cells | Secondary, sm | `var(--text-secondary)`, `var(--font-size-sm)` |
| Signal BULL | Buy accent | `var(--accent-buy)` |
| Signal BEAR | Sell accent | `var(--accent-sell)` |
| Signal NEUTRAL | Neutral accent | `var(--accent-neutral)` |
| ROI positive | Buy accent | `var(--accent-buy)` |
| ROI negative | Sell accent | `var(--accent-sell)` |
| ROI cell | Mono, sm, bold, right-aligned, 65px | `var(--font-mono)`, `var(--font-size-sm)`, `font-weight: 600` |
| Confidence bars (1-2) | Warning | `var(--accent-warning)` |
| Confidence bar (3) | Info | `var(--accent-info)` |
| Confidence bars (4-5) | Highlight | `var(--accent-highlight)` |

### Unique Elements

- **Scan button (`.hs-scan-btn`):** Prominent CTA — `background: var(--accent-highlight)`, `color: var(--bg-primary)`, `font-weight: 600`, hover `filter: brightness(1.15)`. Disabled state: `opacity: 0.6`. Scanning state: muted colors.
- **Date inputs (`.hs-date-input`):** Standard input pattern. Chrome calendar picker icon inverted via `filter: invert(0.7)`.
- **Pattern select:** 6 options — All Patterns, Volume Breakout, Price Reversal, Momentum Shift, Mean Reversion, Gap Fill.
- **Export button:** Download icon, exports to CSV.
- **Confidence bars:** 5-bar system (vs LiveScanner's 3), 10×7px each, color-graduated by level.

### Data Display Patterns

- **Date:** Formatted via `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` — e.g., "Mar 6, 2026"
- **ROI:** Prefixed with +/-, one decimal, percent sign — e.g., "+5.2%"
- **Confidence:** Either bars (5-level) or fraction "3/5"
- **Signal:** Uppercased

### Interactive States

- Scan button triggers async `useHistoricalScan` hook
- Row click emits ticker to linkBus (same as LiveScanner)
- Sort by clicking headers
- Column drag-reorder
- Three empty states: scanning, no matches, initial prompt

### Data Flow

1. User sets criteria (dates, pattern, max results)
2. Click Scan → `useHistoricalScan().scan()` → `dataFeed.getHistoricalScanResults()`
3. Results displayed in table, sortable
4. CSV export via client-side Blob/URL creation

---

## AlertTrigger

**File:** `src/components/scanners/AlertTrigger.jsx` (480 lines)
**CSS:** `src/components/scanners/AlertTrigger.css` (429 lines)

### Layout & Structure

- **Root:** `.alert-trigger` — full-height flex column. Font size controlled by class `.at--font-{small|medium|large}` using design tokens.
- **Header bar (`.at-header-bar`):** Title "Alert Trigger" (uppercase, bold) + rule count + settings gear button.
- **Panels (`.at-panels`):** Two equal-height panels stacked vertically, separated by `2px solid var(--border-color)`.
  - **Rules panel:** Panel header "Rules" + add-rule form + rules table.
  - **History panel:** Panel header "Alert History" + clear button + history table.
- **Settings overlay (`.at-settings-overlay`):** Modal dialog, `position: absolute`, `inset: 0`, `background: var(--bg-overlay)`, centered panel.

### Rules Panel Details

#### Add-Rule Form (`.at-add-form`)
- Flex row, `gap: var(--spacing-sm)`, `flex-wrap: wrap`
- Ticker input (100px), Type select (3 options), dynamic param inputs (60px each), Add button
- All inputs: `var(--bg-input)`, `var(--border-subtle)`, `var(--radius-sm)`, focus → `var(--border-focus)`
- Add button: `var(--accent-highlight)` bg, `var(--bg-primary)` text, bold, hover opacity 0.85

#### Rule Types
- `price_crosses`: 1 param (Price threshold)
- `pct_change`: 2 params (% threshold, Window in seconds)
- `volume_spike`: 2 params (Multiplier, Window in seconds)

#### Rules Table Columns
- Ticker (left), Type (center), Params (left), Enabled (center), Actions (center)
- Type displayed as badge: `color-mix(in srgb, var(--accent-highlight) 15%, transparent)` bg, `var(--accent-highlight)` text
- Toggle button: ON = `var(--accent-buy)` border+text, OFF = `var(--accent-sell)` border+text
- Delete button: × character, muted → `var(--accent-sell)` on hover

### History Panel Details

#### History Table Columns
- Time (left), Ticker (left), Type (center), Message (left), Price (right, numeric)
- Time formatted via `toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })`
- Price formatted to 2 decimal places

### Alert State Row Indicators

| State | Visual |
|-------|--------|
| `.at-row--triggered` | `border-left: 2px solid var(--accent-win)` |
| `.at-row--pending` | `border-left: 2px solid var(--accent-warning)` |
| `.at-row--expired` | `border-left: 2px solid var(--accent-neutral)`, `opacity: 0.65` |

### Status Badges (CSS-only, not yet used in JSX)

| Badge | Background | Text |
|-------|-----------|------|
| `--triggered` | `color-mix(in srgb, var(--accent-win) 15%, transparent)` | `var(--accent-win)` |
| `--pending` | `color-mix(in srgb, var(--accent-warning) 15%, transparent)` | `var(--accent-warning)` |
| `--expired` | `color-mix(in srgb, var(--accent-neutral) 15%, transparent)` | `var(--accent-neutral)` |

### Settings Overlay

- Panel: `var(--bg-secondary)`, `var(--border-color)`, `var(--radius-lg)`, `width: 320px`, `var(--shadow-lg)`
- Header: `var(--spacing-lg) var(--spacing-xl)` padding, `var(--font-size-lg)`, bold
- Close button: × character, `var(--text-muted)` → primary on hover
- Save button: `var(--accent-win)` bg, `var(--bg-primary)` text

### Flash Animation

- `.at-row-flash .at-td`: `at-flash` keyframe, 1.2s ease-out, from `color-mix(in srgb, var(--accent-warning) 35%, transparent)` to transparent
- Triggered when `settings.flashOnAlert` is true, cleared after 1200ms timeout

### Interactive Workflow

1. User enters ticker, selects rule type, fills params, clicks Add
2. Rule appears in rules table with ON toggle
3. Alert service evaluates rules against tick data in Web Worker
4. Triggered alerts appear in history panel with flash animation
5. Toggle rules on/off, delete individual rules
6. Clear entire history

### Data Flow

1. Component calls `alertService.initialize()` on mount
2. Subscribes to `alertService.onRulesChange()` and `alertService.onAlert()`
3. CRUD operations via `alertService.addRule/toggleRule/removeRule`
4. Cleanup via `alertService.destroy()` on unmount

---

## MarketClock

**File:** `src/components/scanners/MarketClock.jsx` (119 lines)
**CSS:** `src/components/scanners/MarketClock.css` (192 lines)

### Layout & Structure

- **Root:** `.market-clock` — full-height flex column, `position: relative`, `user-select: none`, `background: var(--bg-primary)`.
- **Display area (`.mc-display`):** Centered flex column, `gap: var(--spacing-xs)`, `padding: var(--spacing-xs) var(--spacing-sm)`.
  - Time display (`.mc-time`): Inline `fontSize` from settings (16-64px range), `font-weight: 600`, `var(--text-heading)`, `letter-spacing: 2px`
  - Milliseconds (`.mc-time-ms`): `var(--font-size-xs)`, `var(--text-secondary)`, `letter-spacing: 1px`
  - Date display (`.mc-date`): `var(--font-size-sm)`, `var(--text-secondary)`, `letter-spacing: 1px`
  - Timezone label (`.mc-tz`): `var(--font-size-xs)`, `var(--text-muted)`, uppercase, `letter-spacing: 1.5px`
- **Settings button:** Absolute positioned top-right, opacity 0 by default, appears on `.market-clock:hover`.

### Market Status Indicators (CSS-defined)

| Status | Color | Animation |
|--------|-------|-----------|
| `.mc-status--open` | `var(--accent-buy)` | Dot: `var(--accent-win)` + `var(--shadow-glow-win)` + `glow-pulse` 1.5s |
| `.mc-status--closed` | `var(--accent-sell)` | Dot: `var(--accent-sell)` + `var(--shadow-glow-loss)`, no animation |
| `.mc-status--pre/post` | `var(--accent-warning)` | Dot: `var(--accent-warning)` + `glow-pulse` 2s |

### Clock Tick Mechanism

- **With milliseconds:** `requestAnimationFrame` loop for smooth updates
- **Without milliseconds:** `setInterval` at 1000ms

### Time Formatting

- Manual formatting: `HH:MM:SS` with padded zeros
- Milliseconds mode adds `.XXX00` (3 digits from Date + 2 padding zeros)
- Date format: `YYYY-MM-DD`
- Timezone: 'local' or 'utc' — all getters conditional on timezone setting

### Settings Persistence

- `localStorage.getItem('market-clock-settings-${windowId}')` — stores timezone, showMilliseconds, showDate, fontSize

---

## MarketClockSettings

**File:** `src/components/scanners/MarketClockSettings.jsx` (218 lines)

### Component Pattern

- **Companion settings component** for MarketClock
- Receives `{ settings, onChange, onClose }` props
- Uses local state for edits, saves on "Save" click (not live)
- Overlay with backdrop click to close

### CSS Injection Pattern (Non-Standard)

- **WARNING:** Styles are injected via `document.createElement('style')` + `document.head.appendChild(style)` with a `[data-market-clock-settings-style]` guard to prevent duplicates.
- Uses **hardcoded pixel values** (not design tokens) for many properties:
  - `.mcs-panel`: `border-radius: 6px`, `width: 260px`, `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5)`
  - `.mcs-header`: `padding: 10px 12px`, `font-size: 13px`
  - `.mcs-close`: `font-size: 18px`, `padding: 0 4px`
  - `.mcs-body`: `padding: 10px 12px`, `gap: 10px`
  - `.mcs-row`: `font-size: 12px`
  - `.mcs-row select`: `width: 80px`, `border-radius: 3px`, `padding: 3px 6px`, `font-size: 12px`
  - `.mcs-btn`: `padding: 6px 0`, `border-radius: 4px`, `font-size: 12px`
  - `.mcs-btn-save`: `color: #fff` (hardcoded white, not `var(--bg-primary)`)
  - `.mcs-footer`: `gap: 8px`, `padding: 10px 12px`
  - `.mcs-row input[type="range"]`: `margin: 0 6px`
  - `.mcs-font-val`: `font-size: 10px`, `min-width: 28px`
- Design tokens used: `var(--bg-secondary)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-muted)`, `var(--text-secondary)`, `var(--bg-tertiary)`, `var(--font-mono)`, `var(--font-sans)`, `var(--accent-highlight)`

### Settings UI

| Setting | Input | Default |
|---------|-------|---------|
| Timezone | Select (Local/UTC) | 'local' |
| Milliseconds | Checkbox | false |
| Show Date | Checkbox | false |
| Font Size | Range slider (16-64) | 32 |

---

## Services

### alertService.js

**File:** `src/services/alertService.js` (323 lines)

#### Public API

| Function | Signature | Description |
|----------|-----------|-------------|
| `initialize()` | `() → void` | Load rules/history, start worker, sync ticker subscriptions |
| `destroy()` | `() → void` | Unsubscribe all tickers, terminate worker |
| `getRules()` | `() → Rule[]` | Get copy of all rules |
| `addRule()` | `({ type, ticker, params, label? }) → Rule` | Create rule, validate type, sync subs |
| `updateRule()` | `(id, updates) → Rule` | Update rule by id |
| `removeRule()` | `(id) → void` | Remove rule, notify worker |
| `toggleRule()` | `(id) → Rule` | Toggle enabled/disabled |
| `getHistory()` | `() → Alert[]` | Get copy of alert history |
| `clearHistory()` | `() → void` | Clear all history |
| `onAlert()` | `(callback) → unsubscribe` | Subscribe to new alerts |
| `onRulesChange()` | `(callback) → unsubscribe` | Subscribe to rule changes |

#### Data Flow

```
dataFeed.subscribeToTicker(ticker) → tick data
    ↓ postMessage
alertEngine.worker.js (evaluates rules against ticks)
    ↓ postMessage back
alertService.handleWorkerMessage → history + notify listeners
    ↓
AlertTrigger component (via onAlert/onRulesChange)
```

#### State Management

- Rules: `localStorage('kalshi_alert_rules')` — Array of `{ id, type, ticker, params, label, enabled, createdAt }`
- History: `localStorage('kalshi_alert_history')` — Array, capped at 200 entries
- Listeners: `Set<callback>` for alerts and rules changes
- Ticker subscriptions: `tickerUnsubs` map, synced to match enabled rules

#### Valid Rule Types
- `price_crosses` — { threshold }
- `pct_change` — { threshold, window }
- `volume_spike` — { multiplier, window }

---

### alertEngine.worker.js

**File:** `src/services/alertEngine.worker.js` (253 lines)

#### Architecture

- **Web Worker** running in separate thread
- Uses **Float64Array circular buffers** (capacity 256) for per-ticker price/volume history
- Evaluates rules on each tick, fires alerts with 30s cooldown per rule

#### Message Protocol (Inbound)

| Message Type | Payload | Action |
|-------------|---------|--------|
| `tick` | `{ ticker, price, volume }` | Push to buffers, evaluate rules |
| `set_rules` | `{ rules: [...] }` | Replace all rules |
| `add_rule` | `{ ...rule }` | Append single rule |
| `remove_rule` | `{ id }` | Remove rule + clear cooldown |
| `update_rule` | `{ id, ...updates }` | Update rule in-place |
| `clear_cooldown` | `{ id? }` | Clear cooldown for one or all rules |
| `ping` | — | Respond with `pong` + stats |

#### Message Protocol (Outbound)

| Message Type | Payload |
|-------------|---------|
| `alerts` | `{ alerts: Array<AlertResult> }` |
| `pong` | `{ timestamp, ruleCount }` |

#### Evaluators

- **price_crosses:** Compares current vs previous price against threshold. Supports `above`, `below`, `either` direction. Output includes price, threshold, direction.
- **pct_change:** Compares current vs reference price (lookback ticks). Output includes pctChange.
- **volume_spike:** Compares latest volume to rolling average (window ticks, excluding latest). Output includes volume, avgVolume, ratio.

#### Cooldown System
- Default: 30 seconds per rule after firing
- Prevents alert flooding on volatile tickers
- Can be cleared via `clear_cooldown` message

---

### analyticsService.js

**File:** `src/services/analyticsService.js` (318 lines)

#### Public API

| Function | Signature | Description |
|----------|-----------|-------------|
| `getTrades()` | `() → Promise<Trade[]>` | Fetch fills from API or mock, normalize, compute P&L |
| `getAnalyticsSnapshot()` | `(currentPrices?, openPositions?) → Promise<Snapshot>` | Full metrics snapshot |
| `clearCache()` | `() → void` | Clear localStorage cache |
| `isUsingMockData()` | `() → boolean` | Check if API is configured |
| `getMockTrades()` | `() → Trade[]` | Get seeded mock data (60 trades) |
| `normalizeFill()` | `(fill) → NormalizedTrade` | Normalize API fill format |
| `computePnLFromFills()` | `(fills) → Trade[]` | FIFO P&L matching |

#### Analytics Snapshot Shape

```js
{
  winRate,           // 0-1
  totalPnL,          // cents
  expectedValue,     // cents per trade
  kellyFraction,     // 0-1
  omegaRatio,        // ratio
  sharpeRatio,       // annualized
  maxDrawdown,       // { maxDrawdown, maxDrawdownPct, peakTimestamp, troughTimestamp }
  profitFactor,      // ratio
  categoryAttribution, // { [cat]: { pnl, count, winRate } }
  equityCurve,       // [{ timestamp, equity }]
  dailyPnL,          // [{ date, pnl, count }]
  markToMarket,      // { totalMtm, positions: [...] }
  tradeCount,
  timestamp,
}
```

#### Data Flow

```
kalshiApi.getFills() → cache in localStorage (5min TTL)
    ↓ normalize
normalizeFill() → { tradeId, ticker, category, side, action, priceCents, count, pnlCents, timestamp }
    ↓ P&L computation
computePnLFromFills() → FIFO buy/sell matching per ticker+side
    ↓
analyticsCalc.* functions → metrics
```

#### Mock Data
- 60 synthetic trades, seeded RNG (seed=42) for determinism
- 10 tickers across 5 categories
- Spread over 90 days, ~55% win rate
- Prices 15-85¢ range

#### Caching
- localStorage keys: `kalshi_analytics_fills`, `kalshi_analytics_settlements`, `kalshi_analytics_cache_ts`
- TTL: 5 minutes

---

### analyticsCalc.js

**File:** `src/services/analyticsCalc.js` (275 lines)

#### Pure Functions (No Side Effects)

| Function | Input | Output | Notes |
|----------|-------|--------|-------|
| `winRate(trades)` | `{ pnlCents }[]` | `number (0-1)` | Fraction of trades with pnlCents > 0 |
| `totalPnL(trades)` | `{ pnlCents }[]` | `number (cents)` | Sum of all pnlCents |
| `expectedValue(trades)` | `{ pnlCents }[]` | `number (cents)` | totalPnL / count |
| `kellyFraction(trades)` | `{ pnlCents }[]` | `number (0-1)` | Simplified Kelly: (bp-q)/b, clamped |
| `omegaRatio(trades, threshold?)` | `{ pnlCents }[]` | `number` | Gains above threshold / losses below |
| `sharpeRatio(trades, rfRate?)` | `{ pnlCents, timestamp }[]` | `number` | Annualized, min 2 trades |
| `maxDrawdown(trades)` | `{ pnlCents, timestamp }[]` | `{ maxDrawdown, maxDrawdownPct, peakTs, troughTs }` | From equity curve |
| `profitFactor(trades)` | `{ pnlCents }[]` | `number` | grossProfit / grossLoss |
| `categoryAttribution(trades)` | `{ pnlCents, category }[]` | `{ [cat]: { pnl, count, winRate } }` | Grouped by category |
| `equityCurve(trades)` | `{ pnlCents, timestamp }[]` | `[{ timestamp, equity }]` | Cumulative, sorted by time |
| `dailyPnL(trades)` | `{ pnlCents, timestamp }[]` | `[{ date, pnl, count }]` | Aggregated by YYYY-MM-DD |
| `markToMarket(positions, prices)` | positions + current prices | `{ totalMtm, positions }` | YES: (cur-avg)*count, NO: ((100-cur)-avg)*count |

#### Price Convention
- All prices in **cents** (1-99 for Kalshi binary contracts)
- P&L in cents throughout

---

### omsEngine.js

**File:** `src/services/omsEngine.js` (465 lines)

#### Order State Machine (FSM)

```
PENDING → SUBMITTED → OPEN → PARTIAL → FILLED (terminal)
                   ↘         ↘         ↘
                    → REJECTED  → CANCELLED (terminal)
```

| State | Description | Transitions To |
|-------|-------------|---------------|
| `pending` | Created locally | submitted, rejected, cancelled |
| `submitted` | Sent to exchange | open, filled, rejected, cancelled |
| `open` | Resting on book | partial, filled, cancelled |
| `partial` | Partially filled | filled, cancelled |
| `filled` | Fully filled | (terminal) |
| `cancelled` | Cancelled | (terminal) |
| `rejected` | Rejected | (terminal) |

#### Public API

| Function | Description |
|----------|-------------|
| `createOrder(params)` | Create order in PENDING state |
| `transitionOrder(id, status, extra?)` | FSM transition with validation |
| `markSubmitted/Open/Cancelled/Rejected()` | Convenience transitions |
| `processFill(orderId, fill)` | Process fill, update counts, transition status, update position |
| `updatePosition(ticker, side, action, price, count)` | Buy = add to position, Sell = reduce + realize P&L |
| `getUnrealizedPnl(ticker, side, currentPrice)` | (currentPrice - avgCost) * contracts |
| `getTotalPnl(ticker, side, currentPrice)` | realized + unrealized |
| `findOrder/getOrder/getAllOrders/getOpenOrders/getOrdersByTicker()` | Query orders |
| `getPosition/getAllPositions()` | Query positions |
| `getRecentFills(limit?)` | Most recent fills across all orders |
| `exportState/importState/reset()` | Serialization for persistence |
| `on(event, callback)` | Event subscription |

#### Events Emitted

- `order:created`, `order:updated`, `order:{status}`, `fill`, `position:updated`, `state:imported`, `state:reset`

#### Order Shape

```js
{
  id,                 // Exchange order ID (set on acknowledgement)
  clientOrderId,      // Client-generated UUID
  ticker, side, action, type, price, count,
  filledCount, remainingCount, avgFillPrice,
  status, fills: [],
  createdAt, updatedAt, submittedAt, filledAt, cancelledAt, rejectedAt, rejectReason
}
```

#### Position Shape

```js
{
  ticker, side, contracts, avgCost, realized, totalCost, updatedAt
}
```

#### Position Aggregation
- **Buy:** `totalCost += price * count`, `contracts += count`, `avgCost = totalCost / contracts`
- **Sell:** `realized += (price - avgCost) * min(count, contracts)`, `contracts -= closeCount`

---

### omsService.js

**File:** `src/services/omsService.js` (434 lines)

#### Architecture

```
omsService.js (API bridge + persistence + WS)
    ↓ delegates to
omsEngine.js (pure state machine)
    ↓ persists via
localStorage('kalshi_oms_state')
```

#### Public API

| Function | Description |
|----------|-------------|
| `submitOrder(params)` | Create local order → submit via API → transition states |
| `cancelOrder(orderId)` | Cancel via API → mark cancelled |
| `amendOrder(orderId, amendments)` | Amend price/count via API |
| `syncWithExchange()` | Pull orders/positions/fills from REST, reconcile |
| `getAllOrders/getOpenOrders/getOrdersByTicker()` | Delegated to engine |
| `getPosition/getAllPositions/getRecentFills()` | Delegated to engine |
| `getUnrealizedPnl/getTotalPnl()` | Delegated to engine |
| `getPositionSummaries(currentPrices)` | All positions with realized + unrealized P&L |
| `initialize()` | Load persisted state, start WS listeners |
| `resetState()` | Clear all state |
| `on(event, callback)` | UI event subscription |

#### WebSocket Integration

- Subscribes to `kalshiWs.subscribeUserOrders()` and `kalshiWs.subscribeUserFills()`
- Auto-starts on WS connect, auto-stops on disconnect
- Maps Kalshi statuses: `resting → open`, `active → open`, `executed → filled`, `canceled → cancelled`

#### Order Submission Flow

1. `createOrder()` in engine (PENDING)
2. Build API payload (ticker, side, action, type, count_fp, client_order_id, yes_price)
3. `kalshiApi.createOrder()` call
4. `markSubmitted()` with exchange ID
5. Process immediate status if returned (resting → markOpen, executed → processFill)
6. On failure: `markRejected()`

#### Persistence
- Auto-saves on every `order:updated`, `position:updated`, `state:reset` event
- Loads from `kalshi_oms_state` on initialize
- Initializes on import (module-level `initialize()` call)

---

### dataFeed.js

**File:** `src/services/dataFeed.js` (717 lines)

#### Architecture

- **Unified adapter** between Kalshi real data and mock data
- Falls back to mock when API not configured/connected
- Components import from dataFeed instead of mockData directly

#### Public API — Subscriptions

| Function | Mock Mode | Real Mode |
|----------|-----------|-----------|
| `subscribeToTicker(ticker, cb)` | Mock stream | WS orderbook + ticker channels |
| `subscribeToMarketRace(cb)` | Mock data | REST polling every 5s |
| `subscribeToScanner(cb)` | Mock data | WS lifecycle events |
| `subscribeToOHLCV(ticker, tf, cb)` | Mock if available | REST candles + WS trade stream |
| `subscribeToTimeSales(ticker, cb)` | Mock data | WS trade channel |
| `subscribeToPortfolio(cb)` | Empty/mock | REST polling 5s + WS triggers |

#### Public API — Queries

| Function | Description |
|----------|-------------|
| `getPortfolioBalance()` | REST balance fetch |
| `getOpenPositions()` | REST positions fetch |
| `getFillHistory()` | REST fills fetch |
| `getOpenOrders()` | REST orders fetch |
| `getHistoricalScanResults(params)` | REST settled markets |
| `searchMarkets(query, params)` | REST market search with client-side filter |
| `generateOHLCV(ticker, count, tf)` | Delegates to mock (always) |

#### Public API — Trading

| Function | Description |
|----------|-------------|
| `submitOrder/placeOrder(order)` | REST create order (connected only) |
| `cancelOrder/cancelExistingOrder(orderId)` | REST cancel order (connected only) |

#### Orderbook State Machine

```
WS orderbook_snapshot → clear YES/NO maps, populate from arrays
WS orderbook_delta → update/delete price level in correct side map
    ↓
buildSyntheticDom(ticker) → { bids: [YES bids sorted desc], asks: [derived from NO bids, sorted asc] }
```

- YES bids: direct from YES book
- YES asks: NO bids at price P → YES ask at (100-P)
- Per-ticker state: `{ yes: Map<price,qty>, no: Map<price,qty>, listeners: Set }`

#### Connection Management

- `initialize(opts)` — Configure API + connect WS
- `disconnectFeed()` — Disconnect WS
- `isConnected()` / `onConnectionChange()` — Connection state tracking
- Listens to `kalshiWs.onStateChange()` for auto-connect/disconnect

---

### hotkeyStore.js

**File:** `src/services/hotkeyStore.js` (336 lines)

#### Architecture

- localStorage-backed keybinding manager with **profile support**
- localStorage key: `kalshi_hotkeys`

#### Store Shape

```js
{
  activeProfile: 'Default',
  profiles: {
    'Default': {
      name: 'Default',
      bindings: [{ id, key, script, label, active, category }],
      createdAt: ISO
    }
  }
}
```

#### Default Bindings

| Key | Script | Label | Category |
|-----|--------|-------|----------|
| `Ctrl+B` | `Buy=Route:LIMIT Price+0.00 Share=1 TIF=DAY` | Quick Buy | trading |
| `Ctrl+S` | `Sell=Route:LIMIT Price+0.00 Share=Pos TIF=DAY` | Quick Sell | trading |
| `Escape` | `CXL` | Cancel All | trading |
| `F5` | `Focus=Montage` | Focus Montage | navigation |

#### Public API

| Function | Description |
|----------|-------------|
| `getBindings()` | Active bindings only |
| `getAllBindings()` | All bindings (including inactive) |
| `addBinding({ key, script, label, category })` | Add with conflict detection |
| `updateBinding(id, updates)` | Update with conflict check |
| `removeBinding(id)` | Remove by id |
| `findBindingByKey(keyCombo)` | Lookup active binding by normalized key |
| `normalizeKeyCombo(event)` | KeyboardEvent → canonical string (Ctrl+Alt+Shift+Meta order) |
| `getProfiles/saveProfile/loadProfile/deleteProfile()` | Profile CRUD |
| `exportProfile/importProfile()` | JSON serialization |
| `subscribe(callback)` | Change notifications |

#### Key Normalization

- Modifier order: Ctrl → Alt → Shift → Meta
- Single characters uppercased
- Space → "Space", arrow keys preserved
- Canonical form: "Ctrl+Shift+B" (always sorted)

---

### hotkeyLanguage.js

**File:** `src/services/hotkeyLanguage.js` (361 lines)

#### DAS Trader-Inspired Scripting Language

**Commands:**

| Command | Syntax | Description |
|---------|--------|-------------|
| `Buy` | `Buy=Route:<route> Price=<expr> Share=<expr> TIF=<tif> [Side=<side>]` | Place buy order |
| `Sell` | `Sell=Route:<route> Price=<expr> Share=<expr> TIF=<tif> [Side=<side>]` | Place sell order |
| `CXL` | `CXL` | Cancel all orders |
| `CXLBUY` | `CXLBUY` | Cancel all buy orders |
| `CXLSELL` | `CXLSELL` | Cancel all sell orders |
| `Focus` | `Focus=<target>` | Focus window |
| `SwitchTicker` | `SwitchTicker=<ticker>` | Change active ticker |

**Price Expressions:**
- Market keywords: `Bid`, `Ask`, `Last`, `Mid`
- Offset: `Ask+0.05`, `Bid-0.10`, `Price+0.02`
- Fixed numeric: `42`

**Share Expressions:**
- Fixed: `100`
- Position-based: `Pos`, `Pos*0.5`
- Buying power: `BP*0.1`
- Max position: `MaxPos`

**Valid Values:**
- Routes: LIMIT, MARKET
- TIF: DAY, GTC, IOC
- Sides: YES, NO
- Focus targets: Montage, Chart, Positions, TradeLog, EventLog, Accounts, TimeSale, WatchList, Scanner, PriceLadder

#### Parser Output

```js
{ action: 'BUY'|'SELL'|'CANCEL_ALL'|'CANCEL_BUY'|'CANCEL_SELL'|'FOCUS'|'SWITCH_TICKER',
  params: { route?, price?, shares?, tif?, side?, target?, ticker? },
  errors: string[] }
```

---

### settingsStore.js

**File:** `src/services/settingsStore.js` (131 lines)

#### Settings Schema

```js
{
  connection: { apiKey, paperMode, wsReconnectInterval, wsMaxRetries },
  appearance: { theme, accentColor, fontFamily, fontSize, windowOpacity },
  trading: { defaultOrderSize, confirmOrders, soundAlerts, autoCancelOnDisconnect },
  colorCoordination: { linkingEnabled },
  windows: { snapDistance, mergeBehavior, savedLayouts },
  notifications: { desktopNotifications, soundAlerts, notifyOnFill, notifyOnCancel, notifyOnConnection, notifyOnError }
}
```

#### Public API

| Function | Description |
|----------|-------------|
| `get()` | Load + return full settings |
| `update(section, key, value)` | Update single key in section |
| `updateSection(section, partial)` | Merge partial into section |
| `subscribe(fn)` | Change notifications |
| `reset()` | Reset to DEFAULTS |
| `save(settings)` | Full replace + persist |
| `DEFAULTS` | Exported default object |

#### Deep Merge
- On load, saved settings are deep-merged with DEFAULTS so new keys always exist
- Uses custom `deepMerge()` — recursively merges objects, overwrites primitives/arrays

---

### linkBus.js

**File:** `src/services/linkBus.js` (166 lines)

#### Color Link System

**8 Link Colors:** red, green, blue, yellow, purple, orange, cyan, white (with hex values)

#### State

- `windowGroups`: windowId → colorId mapping
- `subscribers`: colorId → Array of `{ callback, windowId }`
- `dragSubscribers`: colorId → Array of `{ windowId, callback }` (for group drag sync)
- `linkingEnabled`: global toggle

#### Public API

| Function | Description |
|----------|-------------|
| `setColorGroup(windowId, colorId)` | Assign window to color group |
| `removeFromGroup(windowId)` | Remove window from group |
| `getColorGroup(windowId)` | Get window's color |
| `getWindowsInGroup(colorId)` | List windows in group |
| `subscribeToLink(colorId, cb, windowId?)` | Subscribe to market changes in color group |
| `unsubscribeFromLink(colorId, cb)` | Unsubscribe |
| `emitLinkedMarket(windowId, ticker)` | Emit ticker change to all group members (except source) |
| `subscribeToDrag/unsubscribeDrag/emitDragDelta()` | Synchronized window dragging |
| `setLinkingEnabled/isLinkingEnabled()` | Global toggle |

#### Persistence
- `localStorage('kalshi_link_groups')` — windowGroups map
- `localStorage('kalshi_linking_enabled')` — boolean

#### Emit Flow
1. Source window calls `emitLinkedMarket(windowId, ticker)`
2. Lookup color group for window
3. Find all subscribers for that color
4. Call each subscriber's callback with `{ ticker, sourceWindowId, colorId, groupWindows }` (excluding source)

---

## Hooks

### useKalshiData.js

**File:** `src/hooks/useKalshiData.js` (297 lines)

**8 hooks total**, all follow the same pattern: subscribe on mount, unsubscribe on unmount, return reactive state.

| Hook | Returns | Data Source |
|------|---------|-------------|
| `useTickerData(ticker)` | `{ data, error }` | `dataFeed.subscribeToTicker` |
| `useMarketRace()` | `{ racers, error }` | `dataFeed.subscribeToMarketRace` |
| `useScannerAlerts(maxAlerts?)` | `{ alerts, clearAlerts, error }` | `dataFeed.subscribeToScanner` |
| `useOHLCV(ticker, timeframe)` | `{ candles, currentCandle, error }` | `dataFeed.subscribeToOHLCV` |
| `useKalshiConnection()` | `{ connected, initialize, disconnect }` | `dataFeed.onConnectionChange` |
| `usePortfolio(refreshInterval?)` | `{ balance, positions, orders, fills, refresh }` | REST polling + WS triggers |
| `useOrderEntry()` | `{ submitOrder, cancelOrder, lastResult, submitting, error }` | `dataFeed.placeOrder/cancelExistingOrder` |
| `useHistoricalScan()` | `{ results, scanning, error, scan }` | `dataFeed.getHistoricalScanResults` |

---

### useGridCustomization.js

**File:** `src/hooks/useGridCustomization.js` (260 lines)

#### Capabilities

- Column visibility toggle
- Column drag-reorder
- Column resize
- Font size (small/medium/large)
- Row height
- Base bg/text color
- Conditional formatting rules (per-column, with operators >, <, >=, <=, ==, !=)

#### Persistence
- localStorage key: `gridCustom_${toolId}`
- Debounced save (300ms)
- Merges saved state with default columns (preserves saved order + adds new columns)

#### State Shape

```js
{
  columns: [{ key, label, visible, width, align?, numeric? }],
  fontSize: 'small' | 'medium' | 'large',
  rowHeight: number (default 24),
  bgColor: string,
  textColor: string,
  colorRules: [{ id, column, operator, value, bgColor, textColor }]
}
```

#### Return Value

```js
{
  columns, toggleColumn, reorderColumns, resizeColumn, resetColumns,
  fontSize, setFontSize, rowHeight, setRowHeight,
  bgColor, setBgColor, textColor, setTextColor,
  colorRules, addColorRule, removeColorRule, updateColorRule,
  dragState, onDragStart, onDragOver, onDragEnd,
  visibleColumns, getRowStyle
}
```

---

### useHotkeyDispatch.js

**File:** `src/hooks/useHotkeyDispatch.js` (187 lines)

#### Architecture

- Global keydown listener on `document`
- Skips when focused on INPUT/TEXTAREA/contentEditable
- Normalizes key combo → looks up binding → parses script → executes action

#### Execution Pipeline

```
KeyboardEvent
  → normalizeKeyCombo(event) → "Ctrl+B"
  → findBindingByKey("Ctrl+B") → { script: "Buy=Route:LIMIT..." }
  → parseHotkeyScript(script) → { action: 'BUY', params: { route: 'LIMIT', ... } }
  → executeAction(parsed) → resolve price/shares → dataFeed.placeOrder()
```

#### Price Resolution

| Expression | Resolution |
|-----------|------------|
| Fixed | Direct value |
| Market (bid/ask/last/mid) | From `dataFeed.buildSyntheticDom(ticker)` |
| Offset (bid+0.05) | Base + offset |

#### Share Resolution

| Expression | Resolution |
|-----------|------------|
| Fixed | Direct value |
| Pos / Pos*N | From `dataFeed.getOpenPositions()` |
| BP*N | From `dataFeed.getPortfolioBalance()` |
| MaxPos | Hardcoded 100 (placeholder) |

#### Focus Target Mapping

| Language Target | Window Type |
|----------------|-------------|
| montage | montage |
| chart | chart |
| positions | positions |
| tradelog | trade-log |
| scanner | live-scanner |
| priceladder | price-ladder |

---

## Cross-Cutting Patterns

### Common UI Patterns

1. **Table pattern:** Sticky thead (`var(--bg-secondary)`), `var(--spacing-xs) var(--spacing-sm)` cell padding, alternating rows via `:nth-child(even)` with `var(--bg-row-alt)`, row hover → `var(--bg-hover)`, row border-bottom `var(--border-subtle)`, header border-bottom `var(--border-color)`.

2. **Button pattern:** `var(--bg-tertiary)` bg, `var(--border-subtle)` border, `var(--radius-sm)`, hover → `var(--bg-hover)` + `var(--text-primary)`. Active state → `var(--accent-highlight)` bg + `var(--bg-primary)` text.

3. **Input pattern:** `var(--bg-input)` bg, `var(--border-subtle)` border, `var(--radius-sm)`, `var(--font-mono)`, focus → `border-color: var(--border-focus)`, outline none.

4. **Settings panel pattern:** `var(--bg-tertiary)` bg, `border-bottom: 1px solid var(--border-color)`, flex column with `gap: var(--spacing-xs)`, rows with label + input justified between.

5. **Flash animation pattern:** `color-mix(in srgb, var(--accent-*) N%, transparent)` for state backgrounds, easing out to transparent.

6. **Overlay/modal pattern:** `position: absolute`, `inset: 0`, `background: var(--bg-overlay)`, centered panel with `var(--shadow-lg)`.

### State Management Patterns

1. **localStorage persistence:** All services use localStorage with try/catch for quota exceeded. Pattern: lazy-load into module-level variable, persist on mutation, notify listeners.

2. **Listener pattern:** `Set<callback>` with `subscribe() → unsubscribe` return value. Same pattern across hotkeyStore, settingsStore, alertService, omsEngine, linkBus.

3. **Service initialization:** Module-level `load()` or `initialize()` on import. Components call service functions directly (no React context needed for services).

4. **Data flow:** `dataFeed.js` → hooks → components. Services are singletons via module scope.

### Design Token Usage

All scanner CSS files are fully tokenized except:
- **MarketClockSettings.jsx**: Uses hardcoded px values and `#fff` — needs tokenization pass.
- **LiveScanner.jsx**: Imports from `mockData` directly instead of `dataFeed` — inconsistent with other components.

---

## Identified Pain Points

### UI/UX Issues

1. **MarketClockSettings hardcoded styles:** Inline `<style>` tag injection with hardcoded px values (`6px`, `260px`, `13px`, `12px`, `10px 12px`, etc.) and `color: #fff`. Should use design tokens and a proper CSS file.

2. **LiveScanner imports mockData directly** (`import { subscribeToScanner } from '../../services/mockData'`) instead of using `dataFeed`. This bypasses the real/mock adapter and means LiveScanner will never use real Kalshi data.

3. **Alert row state classes exist in CSS but are not applied in JSX:** `.at-row--triggered`, `.at-row--pending`, `.at-row--expired` and `.at-status-badge` variants are defined in AlertTrigger.css but the JSX never applies these classes — only `.at-row-flash` is used.

4. **Market status indicators exist in CSS but not rendered:** `.mc-status`, `.mc-status--open/closed/pre/post` and `.mc-status-dot` with glow animations are fully styled but the MarketClock JSX doesn't render any market status information.

5. **No loading states for HistoricalScanner:** The scan button shows "Scanning..." text but no spinner or progress indicator.

6. **No error states:** None of the scanner components display error messages from failed service calls.

7. **AlertTrigger settings overlay only contains GridSettingsPanel:** The `flashOnAlert` setting from DEFAULT_SETTINGS is never exposed in the UI — it's always true.

### Data Flow Issues

8. **MaxPos is hardcoded to 100** in useHotkeyDispatch.js — risk settings integration is missing.

9. **analyticsService fetches settlements but just re-returns fills** — the settlements endpoint proxy doesn't add value.

10. **omsService initializes on import** (module-level `initialize()`) — this runs even if OMS is never used, loading state from localStorage eagerly.

### Architecture Observations

11. **All services use module-level singletons** — no dependency injection, making testing harder.

12. **alertEngine.worker.js circular buffers have fixed capacity (256)** — sufficient for most use cases but not configurable.

13. **linkBus subscriber array (not Set)** — `subscribeToLink` pushes to array, `unsubscribeFromLink` filters. No duplicate prevention.

14. **useGridCustomization** is used by all 3 scanner table components — good reuse, consistent patterns.
