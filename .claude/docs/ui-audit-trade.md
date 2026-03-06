# UI Audit: Trade & Quotes Components

> Generated 2026-03-06 by worker-2 (Opus). Source-of-truth for pixel-level specs.

---

## Table of Contents

1. [Design Tokens (from index.css :root)](#1-design-tokens)
2. [OrderBook](#2-orderbook)
3. [Montage](#3-montage)
4. [PriceLadder](#4-priceladder)
5. [Positions](#5-positions)
6. [TradeLog](#6-tradelog)
7. [EventLog](#7-eventlog)
8. [NewsChat](#8-newschat)
9. [Accounts](#9-accounts)
10. [Chart](#10-chart)
11. [ChartSettings](#11-chartsettings)
12. [TimeSale](#12-timesale)
13. [Settings Companions (all)](#13-settings-companions)
14. [Cross-Component Patterns](#14-cross-component-patterns)

---

## 1. Design Tokens

All components reference CSS custom properties from `src/index.css`.

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#060910` | Base background |
| `--bg-secondary` | `#0d1119` | Panel/header backgrounds |
| `--bg-tertiary` | `#151c28` | Button bg, input bg, badges |
| `--bg-hover` | `#1c2538` | Row/item hover |
| `--bg-input` | `#080c12` | Input fields |
| `--bg-row-alt` | `#0a0f17` | Even row stripe |
| `--text-primary` | `#cdd1da` | Default text |
| `--text-heading` | `#e8ecf4` | Headings, bold labels |
| `--text-secondary` | `#7c8698` | Secondary content |
| `--text-muted` | `#4e5869` | Muted/dim text |
| `--accent-win` / `--accent-buy` | `#3ecf8e` | Positive P&L, buy side, long |
| `--accent-loss` / `--accent-sell` | `#e05c5c` | Negative P&L, sell side, short |
| `--accent-highlight` | `#d4a853` | Active tabs, links, focus rings |
| `--accent-warning` | `#e5952e` | Warnings, pending status |
| `--accent-info` | `#5490d4` | Info level, open status badge |
| `--accent-neutral` | `#656e80` | Closed/neutral badges |
| `--border-color` | `#1a2233` | Primary borders |
| `--border-subtle` | `#111827` | Row separators |
| `--border-focus` | `#d4a853` | Focus ring (= accent-highlight) |

### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif` |
| `--font-mono` | `'JetBrains Mono', 'SF Mono', Consolas, monospace` |
| `--font-size-xs` | `9.5px` |
| `--font-size-sm` | `10.5px` |
| `--font-size-md` | `11.5px` |
| `--font-size-lg` | `12.5px` |
| `--font-size-xl` | `14px` |

### Spacing

| Token | Value |
|-------|-------|
| `--spacing-xs` | `2px` |
| `--spacing-sm` | `4px` |
| `--spacing-md` | `6px` |
| `--spacing-lg` | `10px` |
| `--spacing-xl` | `14px` |

### Radii

| Token | Value |
|-------|-------|
| `--radius-sm` | `2px` |
| `--radius-md` | `3px` |
| `--radius-lg` | `5px` |

### Transitions

| Token | Value |
|-------|-------|
| `--transition-fast` | `80ms ease` |
| `--transition-normal` | `150ms ease` |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.45), 0 0 1px rgba(0,10,30,0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,5,20,0.3)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,5,20,0.4)` |

---

## 2. OrderBook

**Files:** `src/components/trade/OrderBook.jsx` (507 lines), `OrderBook.css` (275 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Tab bar:** `flex; justify-content: space-between; height: 28px; border-bottom: 1px solid var(--border-color); padding: 0 var(--spacing-sm)`
- **Panel:** `flex: 1; overflow: auto; min-height: 0`
- **Table:** `width: 100%; border-collapse: collapse; table-layout: fixed`

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-sm)` (10.5px)
- **Font-size modifiers:** `.ob--font-small` → `var(--font-size-xs)`, `.ob--font-medium` → `var(--font-size-sm)`, `.ob--font-large` → `var(--font-size-md)`
- **Tab text:** `var(--font-size-xs)` (9.5px), `font-weight: 600`
- **Table header (th):** `var(--font-size-xs)`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.5px`
- **Status badge:** `var(--font-size-xs)`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.3px`

### Colors
- **Tab inactive:** `var(--text-muted)` (#4e5869)
- **Tab hover:** `var(--text-primary)` (#cdd1da)
- **Tab active:** `var(--accent-highlight)` (#d4a853), border-bottom: same
- **Tab badge:** bg `var(--accent-highlight)`, text `var(--bg-primary)`
- **Table header bg:** `var(--bg-secondary)` (#0d1119), text `var(--text-muted)`
- **Even rows:** `var(--bg-row-alt)` (#0a0f17)
- **Row hover:** `var(--bg-hover)` (#1c2538)
- **Side YES:** `var(--accent-buy)` (#3ecf8e), `font-weight: 600`
- **Side NO:** `var(--accent-sell)` (#e05c5c), `font-weight: 600`
- **Status badges:**
  - pending: bg `color-mix(var(--accent-warning) 20%, transparent)`, text `var(--accent-warning)`
  - submitted: bg `color-mix(var(--accent-info) 20%, transparent)`, text `var(--accent-info)`
  - open: bg `color-mix(var(--accent-win) 20%, transparent)`, text `var(--accent-win)`
  - partial: bg `color-mix(var(--accent-warning) 20%, transparent)`, text `var(--accent-warning)`
  - filled: bg `color-mix(var(--text-muted) 15%, transparent)`, text `var(--text-muted)`
  - cancelled: bg `color-mix(var(--text-muted) 10%, transparent)`, text `var(--text-muted)`, `opacity: 0.7`
  - rejected: bg `color-mix(var(--accent-sell) 20%, transparent)`, text `var(--accent-sell)`
- **P&L:** `.text-win` → `var(--accent-win)`, `.text-loss` → `var(--accent-sell)`
- **Time column:** `var(--text-muted)`, `var(--font-size-xs)`

### Padding / Spacing
- **th:** `var(--spacing-sm) var(--spacing-sm)` (4px 4px)
- **td:** `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- **Tab bar actions gap:** `var(--spacing-xs)` (2px)
- **Tab badge:** `padding: 1px var(--spacing-sm)` (1px 4px)
- **Status badge:** `padding: 1px var(--spacing-md)` (1px 6px)

### Borders
- **Tab bar bottom:** `1px solid var(--border-color)`
- **th bottom:** `1px solid var(--border-color)`
- **Tab active:** `border-bottom: 2px solid var(--accent-highlight)`
- **Tab badge radius:** `8px`
- **Status badge radius:** `8px`
- **Settings btn radius:** `var(--radius-sm)` (2px)

### Row Dimensions
- **Row height:** `20px` (CSS), overridable by `grid.rowHeight`
- **Columns:** Ticker (left), Side (center), Type (center), Price (right), Qty (right), Filled (right), Status (center), Actions (center)

### Data Display
- **Prices:** `formatCents(cents)` → `(cents / 100).toFixed(2)` (e.g., "0.65")
- **P&L:** `formatPnl(cents)` → `+$X.XX` or `-$X.XX`
- **Time:** `HH:MM:SS` 24-hour format
- **Side:** `.toUpperCase()` → "YES" / "NO"
- **Quantity:** raw integer

### Interactive Elements
- **Tabs:** 3 tabs (Open Orders, Fills, Positions) with click toggle
- **Tab badge:** Shows open order count when > 0
- **Cancel button:** `border: 1px solid var(--accent-sell)`, `color: var(--accent-sell)`, hover fills bg with `var(--accent-sell)` text `var(--bg-primary)`; disabled → `opacity: 0.5`
- **Settings gear:** Unicode &#9881;, `font-size: var(--font-size-lg)`, hover shows border
- **Column drag:** Draggable headers with `.drag-over` highlight `border-left: 2px solid var(--accent-highlight)`
- **LinkBus:** Receives ticker context via color group subscription; filters all data by linked ticker

### Hover/Active/Focus States
- **Tab hover:** text → `var(--text-primary)`
- **Row hover:** bg → `var(--bg-hover)`
- **Cancel btn hover:** bg fills `var(--accent-sell)`, text → `var(--bg-primary)`
- **Settings btn hover:** text → `var(--text-primary)`, border appears

### Flash Animation
- `.ob-row-flash`: `animation: ob-flash 0.6s ease-out`
- `@keyframes ob-flash`: 0% → `color-mix(var(--accent-highlight) 30%, transparent)`, 100% → transparent

### Workflow
1. Data from `omsService` (getOpenOrders, getRecentFills, getPositionSummaries)
2. Auto-refresh on configurable interval (default 2s)
3. Real-time updates via omsService event subscriptions (order:created, order:updated, fill, etc.)
4. Fill flash: 600ms highlight on new fills
5. LinkBus filtering for cross-window ticker context

---

## 3. Montage

**Files:** `src/components/trade/Montage.jsx` (457 lines), `Montage.css` (401 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%; gap: var(--spacing-xs)`
- **Ticker bar:** `flex; align-items: center; gap: var(--spacing-xs)`
- **Book:** `flex; gap: var(--spacing-xs)` — two sides (bid/ask), each `flex: 1; flex-direction: column`
- **Order entry:** `flex-direction: column; gap: var(--spacing-xs); border-top: 1px solid var(--border-color)`

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-md)` (11.5px)
- **Font-size modifiers:** small → `var(--font-size-sm)`, medium → `var(--font-size-md)`, large → `var(--font-size-lg)`
- **Book header:** `var(--font-size-xs)`, `text-transform: uppercase`, `letter-spacing: 1px`
- **Labels:** `var(--font-size-xs)`, `text-transform: uppercase`, `letter-spacing: 0.5px`, `var(--text-muted)`
- **Info strip:** `var(--font-size-sm)`, `var(--text-secondary)`
- **Buttons:** `var(--font-size-md)`, `font-weight: 700`

### Colors
- **Current ticker badge:** bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, border `var(--border-color)`, `font-weight: 600`
- **Search input:** bg `var(--bg-tertiary)`, border `var(--border-color)`, focus border `var(--border-focus)`
- **Search results dropdown:** bg `var(--bg-secondary)`, border `var(--border-color)`
- **Search ticker:** `var(--accent-highlight)`, `font-weight: 600`
- **Search title:** `var(--text-muted)`
- **Bid price:** `var(--accent-buy)` (#3ecf8e), `font-weight: 600`
- **Ask price:** `var(--accent-sell)` (#e05c5c), `font-weight: 600`
- **Book size text:** `var(--text-secondary)`
- **Book header text:** `var(--text-heading)`
- **Info strip bg:** `var(--bg-tertiary)`
- **BUY YES button:** bg `var(--accent-buy)`, text `var(--text-heading)`
- **BUY NO button:** bg `var(--accent-sell)`, text `var(--text-heading)`
- **Cancel button:** bg `var(--bg-tertiary)`, text `var(--text-secondary)`, `border: 1px solid var(--border-color)`
- **Error bar:** text `var(--accent-sell)`, bg `color-mix(var(--accent-sell) 8%, transparent)`
- **Working orders cancel:** border `var(--border-color)`, text `var(--text-muted)`, hover → text/border `var(--accent-sell)`
- **P&L scoping:** `.montage .text-win` → `var(--accent-buy)`, `.montage .text-loss` → `var(--accent-sell)`

### Padding / Spacing
- **Ticker badge:** `var(--spacing-sm) var(--spacing-md)` (4px 6px)
- **Search input:** `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- **Search items:** `var(--spacing-sm) var(--spacing-md)` (4px 6px)
- **Book header/row:** `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- **Info strip:** `var(--spacing-xs) var(--spacing-sm)`
- **Order row gap:** `var(--spacing-sm)` (4px)
- **Buttons padding:** `var(--spacing-sm)` (4px)

### Borders
- **Ticker badge radius:** `var(--radius-md)` (3px)
- **Search input radius:** `var(--radius-sm)` (2px)
- **Search dropdown radius (bottom):** `var(--radius-md)` on bottom corners
- **Settings btn radius:** `var(--radius-sm)`
- **Input/select radius:** `var(--radius-sm)`
- **Button radius:** `var(--radius-sm)`
- **Info strip radius:** `var(--radius-sm)`

### Data Display
- **Prices:** shown as `{price}c` (integer cents, e.g., "65c")
- **Last price:** `Last: <strong>{data.yes.price}c</strong>`
- **Volume:** `Vol: <strong>{data.lastTrade.size}</strong>`
- **Last trade side:** colored by YES (text-win) / NO (text-loss)
- **Bid/Ask levels:** configurable depth (default 5 levels)
- **Ask derivation:** Ask price for YES = 100 - NO bid price

### Interactive Elements
- **Search bar:** Debounced (300ms), dropdown on 2+ chars
- **Price click:** Sets limit price and switches to limit order type
- **Buy YES / Buy NO buttons:** hover `opacity: 0.85`, active `transform: scale(0.97)`
- **Confirm dialog:** Modal overlay with `rgba(var(--bg-primary) 60%, transparent)`, dialog bg `var(--bg-secondary)`, `border-radius: var(--radius-md)`, `padding: var(--spacing-lg)`, `box-shadow: 0 8px 24px`
- **Working orders:** List below order entry, each with cancel button; cancel on hover turns `var(--accent-sell)`
- **Settings gear:** `font-size: var(--font-size-lg)`, bg `var(--bg-tertiary)`, border `var(--border-color)`

### Flash Animation
- **Bid flash:** `.flash-up` / `.flash-down` classes on top level bid/ask rows
- **Duration:** Configurable, default 300ms
- **No CSS keyframes defined** — flash classes are set/removed via JS timer

### Workflow
1. Data from `useTickerData(ticker)` hook → `useOrderEntry()` for submissions
2. Search via `useMarketSearch()` hook
3. LinkBus subscription for cross-window ticker sync
4. Order flow: select side → fill size/type/price/TIF → click BUY YES/NO → optional confirm → submit via API (fallback to local mock)

---

## 4. PriceLadder

**Files:** `src/components/trade/PriceLadder.jsx` (429 lines), `PriceLadder.css` (310 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%; user-select: none`
- **Ticker bar:** `flex; align-items: center; gap: var(--spacing-sm)`
- **Header row:** `flex; font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 1px`
- **Ladder scroll:** `flex: 1; overflow-y: auto; min-height: 0`
- **Footer:** `flex-direction: column; gap: var(--spacing-xs); border-top: 1px solid var(--border-color); padding: var(--spacing-sm) var(--spacing-md)`

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-lg)` (12.5px) — larger than other components for readability
- **Font-size modifiers:** small → `var(--font-size-md)`, medium → `var(--font-size-lg)`, large → `var(--font-size-xl)`
- **Cell text:** `var(--font-size-md)` (11.5px) via `.pl-cell-text`
- **Price column:** `font-weight: 600`
- **Working order tags:** `var(--font-size-xs)`, `font-weight: 600`, `line-height: 16px`
- **Footer:** `var(--font-size-md)`, `var(--text-secondary)`

### Colors
- **Ticker select:** bg `var(--bg-tertiary)`, text `var(--text-primary)`, border `var(--border-color)`, focus `var(--border-focus)`
- **Settings/recenter buttons:** bg `var(--bg-tertiary)`, text `var(--text-muted)`, border `var(--border-color)`, hover text `var(--text-primary)`
- **Column headers:** `var(--text-muted)`, border-bottom `var(--border-color)`
- **Price column:** `var(--text-secondary)`, bid prices → `var(--accent-win)`, ask prices → `var(--accent-loss)`
- **Bid cell hover:** `color-mix(var(--accent-win) 8%, transparent)`
- **Ask cell hover:** `color-mix(var(--accent-loss) 8%, transparent)`
- **Volume column:** `var(--text-muted)`
- **Volume bars (bid):** `var(--accent-win)`, `opacity: 0.12`
- **Volume bars (ask):** `var(--accent-loss)`, `opacity: 0.12`
- **Last price row:** bg `color-mix(var(--accent-highlight) 6%, transparent)`, border-top/bottom `1px solid var(--accent-highlight)`
- **Order tags (bid):** bg `color-mix(var(--accent-win) 15%, transparent)`, text `var(--accent-win)`
- **Order tags (ask):** bg `color-mix(var(--accent-loss) 15%, transparent)`, text `var(--accent-loss)`
- **Footer totals:** bid `var(--accent-win)`, ask `var(--accent-loss)`

### Row Dimensions
- **Row height:** `18px` (CSS), overridable by `grid.rowHeight`
- **Row border:** `1px solid var(--border-subtle)`
- **Price col width:** `42px`
- **Volume col width:** `48px`
- **Orders col width:** `56px`
- **Bid/Ask cols:** `flex: 1`

### Column Layout
| Column | Key | Width | Align |
|--------|-----|-------|-------|
| Bid | bidSize | flex: 1 | right |
| Price | price | 42px | center |
| Ask | askSize | flex: 1 | left |
| Vol | volume | 48px | center |
| Orders | (non-grid) | 56px | center |

### Data Display
- **Prices:** Integer 1-99 (full ladder from 99 down to 1)
- **Bid/Ask sizes:** Raw integers, empty if 0
- **Volume:** `bidSize + askSize`, empty if 0
- **Last price:** `{lastPrice}c`
- **Spread:** `bestAsk - bestBid`
- **Order tags:** `B{size}` or `S{size}`

### Interactive Elements
- **Ticker select:** `<select>` dropdown with hardcoded tickers
- **Recenter button:** Unicode &#8982;, scrolls to last trade price
- **Click-to-trade:** Click bid cell → limit buy YES at that price; click ask cell → limit buy NO at that price (configurable)
- **Order tag cancel:** Click → cancel; hover → `opacity: 0.6; text-decoration: line-through`
- **Size input:** `width: 55px`, in footer bar

### Scrollbar Styling
- Width: `6px`
- Track: `var(--bg-primary)`
- Thumb: `var(--border-color)`, hover → `var(--text-muted)`, radius `var(--radius-md)`

### Flash Animation
- `.pl-flash-up`: `animation: pl-flash-green 0.3s ease-out` → from `color-mix(var(--accent-win) 20%, transparent)` to transparent
- `.pl-flash-down`: `animation: pl-flash-red 0.3s ease-out` → from `color-mix(var(--accent-loss) 20%, transparent)` to transparent

---

## 5. Positions

**Files:** `src/components/trade/Positions.jsx` (315 lines), `Positions.css` (189 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Header bar:** `flex; justify-content: space-between; padding: var(--spacing-xs) var(--spacing-sm); border-bottom: 1px solid var(--border-color)`
- **Table wrap:** `flex: 1; overflow: auto`
- **Table:** `width: 100%; border-collapse: collapse; table-layout: auto`

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-md)` (11.5px)
- **Font-size modifiers:** small → sm, medium → md, large → lg
- **Title:** `var(--font-size-sm)`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.5px`, `var(--text-heading)`
- **Count:** `var(--font-size-xs)`, `var(--text-muted)`
- **Table header:** `var(--font-size-xs)`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.5px`, `var(--text-heading)`
- **Sort arrow:** `font-size: 8px`, `var(--accent-highlight)`
- **Type badge:** `var(--font-size-xs)`, `font-weight: 700`, `letter-spacing: 0.5px`, `text-transform: uppercase`

### Colors
- **Header bar title:** `var(--text-heading)`
- **Table header bg:** `var(--bg-tertiary)` (note: different from OrderBook which uses `var(--bg-secondary)`)
- **Even row td:** `var(--bg-row-alt)`
- **Row hover td:** `var(--bg-hover)`
- **Selected row:** `color-mix(var(--accent-highlight) 10%, transparent)`
- **Market name (long):** `var(--accent-buy)`, `font-weight: 600`
- **Market name (short):** `var(--accent-sell)`, `font-weight: 600`
- **Type badge (long):** bg `color-mix(var(--accent-buy) 15%, transparent)`, text `var(--accent-buy)`
- **Type badge (short):** bg `color-mix(var(--accent-sell) 15%, transparent)`, text `var(--accent-sell)`
- **Unrealized P&L:** `.text-win` → `var(--accent-buy)`, `.text-loss` → `var(--accent-sell)`
- **Settings btn:** bg `var(--bg-tertiary)`, border `var(--border-color)`, text `var(--text-muted)`, hover text `var(--text-primary)`

### Padding / Spacing
- **th:** `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- **td:** `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- **td border-bottom:** `1px solid var(--border-subtle)`
- **Type badge:** `padding: 1px var(--spacing-xs)` (1px 2px), `border-radius: var(--radius-sm)` (2px)

### Columns
| Column | Key | Align |
|--------|-----|-------|
| Market | market | left |
| Account | account | left |
| Shares | shares | right |
| Avg Cost | avgCost | right (numeric) |
| Realized | realized | right (numeric) |
| Unrealized | unrealized | right (numeric) |
| Type | type | center |

### Data Display
- **Shares:** Raw integer
- **Avg Cost:** `$` + `.toFixed(2)` (e.g., "$0.45")
- **Realized/Unrealized P&L:** `$` + `.toFixed(2)`, colored by sign
- **Type:** "Long" / "Short" in uppercase badge
- **Account:** String (e.g., "KA-100482")

### Interactive Elements
- **Row click:** Selects row, emits ticker to LinkBus
- **Column sort:** Click header to toggle sort direction
- **Column drag:** Reorder via drag-and-drop

### Flash Animation
- `pos-flash 0.6s ease-out` → from `color-mix(var(--accent-warning) 25%, transparent)` to transparent

---

## 6. TradeLog

**Files:** `src/components/trade/TradeLog.jsx` (402 lines), `TradeLog.css` (231 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Header bar:** same pattern as Positions
- **Filter bar:** `flex; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-sm); border-bottom: 1px solid var(--border-color)`
- **Table:** same as Positions

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-md)`
- **Title:** `var(--font-size-sm)`, `font-weight: 700`, uppercase
- **Filter buttons:** `var(--font-size-xs)`, `font-weight: 600`, uppercase, `letter-spacing: 0.5px`
- **CSV button:** `var(--font-size-xs)`, `font-weight: 600`
- **Date column (last td):** `var(--text-muted)`, `var(--font-size-xs)`

### Colors
- **Filter active:** bg `var(--accent-highlight)`, text `var(--bg-primary)`, border `var(--accent-highlight)`
- **Filter inactive:** bg `var(--bg-tertiary)`, text `var(--text-muted)`, border `var(--border-color)`, hover text `var(--text-secondary)`
- **Badges:**
  - Long: bg `color-mix(var(--accent-buy) 15%, transparent)`, text `var(--accent-buy)`
  - Short: bg `color-mix(var(--accent-sell) 15%, transparent)`, text `var(--accent-sell)`
  - Open: bg `color-mix(var(--accent-info) 15%, transparent)`, text `var(--accent-info)`
  - Closed: bg `color-mix(var(--accent-neutral) 15%, transparent)`, text `var(--accent-neutral)`
- **P&L scoping:** `.tradelog .text-win` → `var(--accent-buy)`, `.tradelog .text-loss` → `var(--accent-sell)`

### Columns
| Column | Key | Align |
|--------|-----|-------|
| Market | market | left |
| Account | account | left |
| Shares | shares | right |
| Avg Cost | avgCost | right (numeric) |
| Realized | realized | right (numeric) |
| Unrealized | unrealized | right (numeric) |
| Type | type | center |
| Status | status | center |
| Date | date | left |

### Data Display
- **Unrealized:** `$X.XX` if open, em-dash `—` if closed
- **Realized:** `$X.XX` if closed, em-dash `—` if open
- **Date:** `YYYY-MM-DD` format
- **CSV Export:** Downloads as `tradelog_YYYY-MM-DD.csv`

### Interactive Elements
- **Filter buttons:** All / Open / Closed with counts
- **CSV export button:** `⬇ CSV`
- **Date range filter:** All Time / Today / 7d / 30d (in settings)
- **Row click → LinkBus emit**

---

## 7. EventLog

**Files:** `src/components/trade/EventLog.jsx` (293 lines), `EventLog.css` (163 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Toolbar:** `flex; justify-content: space-between; padding: var(--spacing-xs) var(--spacing-sm); border-bottom`
- **Entries:** `flex: 1; overflow-y: auto; padding: var(--spacing-xs) 0`
- **Entry row:** `flex; align-items: baseline; gap: var(--spacing-sm); padding: 1px var(--spacing-sm); line-height: 1.6`

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-sm)` (10.5px)
- **Font-size modifiers:** small → xs, medium → sm, large → md
- **Level select:** `var(--font-size-sm)`
- **Entry count:** `var(--font-size-xs)`, `var(--text-muted)`
- **Time:** `var(--font-size-xs)`, `var(--text-muted)`
- **Level label:** `var(--font-size-xs)`, `font-weight: 700`, `min-width: 38px`, `text-align: center`
- **Source:** `var(--font-size-xs)`, `var(--accent-highlight)`
- **Tool buttons:** `var(--font-size-lg)`

### Colors
- **Level INFO:** `var(--accent-info)` (#5490d4)
- **Level WARN:** `var(--accent-warning)` (#e5952e)
- **Level ERROR:** `var(--accent-sell)` (#e05c5c)
- **Error entry bg:** `color-mix(var(--accent-sell) 6%, transparent)`
- **Warn entry bg:** `color-mix(var(--accent-warning) 4%, transparent)`
- **Error message text:** `var(--accent-sell)`
- **Warn message text:** `var(--accent-warning)`
- **Normal message text:** `var(--text-primary)`
- **Even entry bg:** `var(--bg-row-alt)`
- **Entry hover:** `var(--bg-hover)`

### Data Display
- **Time format:** `HH:MM:SS.mmm` (24-hour with milliseconds)
- **Level:** Uppercase (INFO, WARN, ERROR)
- **Source:** Bracketed `[SOURCE]` — SYSTEM, API, DATA, WS, AUTH
- **Auto-scroll:** Scrolls to bottom on new entries; scroll away pauses; double-click resumes
- **Export:** Plain text file `event-log-YYYY-MM-DD.txt`

### Interactive Elements
- **Level filter select:** All Levels, Info+, Warn+, Error Only
- **Clear button:** Unicode &#8999;
- **Export button:** Unicode &#8615;
- **Settings gear**
- **Freescroll:** Scroll detection pauses/resumes auto-scroll

---

## 8. NewsChat

**Files:** `src/components/trade/NewsChat.jsx` (137 lines), `NewsChat.css` (164 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Search bar:** `flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom`
- **Feed:** `flex: 1; overflow-y: auto; padding-top: var(--spacing-sm)`
- **Item:** `flex; align-items: baseline; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-xs); border-bottom: 1px solid var(--border-subtle); line-height: 1.4`

### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-lg)` (12.5px) — largest default among components
- **Filter badge:** `var(--font-size-md)`, `font-weight: 600`
- **Search input:** `var(--font-size-md)`
- **Item:** `var(--font-size-md)`
- **Time:** `var(--font-size-sm)`, `min-width: 40px`
- **Ticker badge:** `var(--font-size-sm)`, `font-weight: 600`

### Colors
- **Filter badge:** bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, border `var(--border-color)`, hover border/text `var(--accent-loss)`
- **Ticker badge:** bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, radius `var(--radius-sm)`, `padding: 0 var(--spacing-sm)`
- **Headline text:** `var(--text-secondary)`
- **Time text:** `var(--text-muted)`
- **Search same as Montage pattern**

### Data Display
- **Time:** `HH:MM` (locale time string, 2-digit hour + minute)
- **Headlines:** Simulated news strings, auto-refresh every 30s
- **Ticker filter:** Click badge to remove, search to change

### Interactive Elements
- **Search bar:** Same debounced pattern as Montage (300ms)
- **Filter badge:** Click to clear filter; hover turns red
- **Item hover:** bg `var(--bg-hover)`
- **No settings panel** — NewsChat has no settings companion

---

## 9. Accounts

**Files:** `src/components/trade/Accounts.jsx` (251 lines), no dedicated CSS file

### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Header bar:** `flex; justify-content: space-between`
- **Table:** Same pattern as Positions/TradeLog
- **Totals row:** Bottom row with `<strong>` wrapped values

### Typography
- **Root font:** `var(--font-mono)` (set via class `acct--font-{size}`)
- **Title:** "Account Overview", same style pattern

### Colors
- **Type badge classes:** `.acct-type-paper`, `.acct-type-live` (referenced in JSX but no CSS defined — **gap noted**)
- **P&L coloring:** `.text-win` / `.text-loss` classes (but no scoped override like other components)
- **All numeric columns with $ prefix get win/loss coloring**

### Columns
| Column | Key | Align |
|--------|-----|-------|
| Account # | account | left |
| Type | type | center |
| Realized P&L | realizedPnl | right (numeric) |
| Unrealized P&L | unrealizedPnl | right (numeric) |
| Init Equity | initEquity | right (numeric) |
| Tickets | tickets | right |
| Shares | shares | right |

### Data Display
- **Currency values:** `$` + `toFixed(decimalPrecision)` (configurable, default 2)
- **Totals row:** Sum of all accounts per column, bolded
- **Account IDs:** "KA-100482", "KA-100483"

### Gaps / Issues
- **No Accounts.css file exists** — all `acct-*` classes (`acct-header-bar`, `acct-table`, `acct-th`, `acct-td`, `acct-row`, `acct-totals-row`, `acct-title`, `acct-settings-btn`, `acct-sort-arrow`, `acct-type-paper`, `acct-type-live`, `acct-align-*`) are referenced in JSX but have no CSS definitions
- Component likely inherits parent styles or is unstyled beyond what AccountsSettings inline styles provide

---

## 10. Chart

**Files:** `src/components/quotes/Chart.jsx` (485 lines), `Chart.css` (274 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%; background: var(--bg-primary); overflow: hidden`
- **Toolbar:** `flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-lg); background: var(--bg-secondary); min-height: 30px`
- **OHLC bar:** `flex; gap: var(--spacing-lg); padding: var(--spacing-xs) var(--spacing-lg); font-size: var(--font-size-sm)`
- **Canvas container:** `flex: 1; min-height: 0`
- **Overlay legend:** `flex-wrap: wrap; gap: var(--spacing-lg); padding: var(--spacing-xs) var(--spacing-lg)`

### Typography
- **Ticker select:** `var(--font-mono)`, `var(--font-size-md)`
- **Timeframe buttons:** `var(--font-mono)`, `var(--font-size-sm)`
- **Chart type buttons:** `var(--font-size-sm)`
- **OHLC bar:** `var(--font-mono)`, `var(--font-size-sm)`, text `var(--text-secondary)`
- **OHLC values:** `var(--text-primary)`, `font-weight: 500`
- **Overlay legend:** `var(--font-mono)`, `var(--font-size-sm)`, `var(--text-secondary)`
- **Chart internal font:** `'Roboto Mono', 'SF Mono', Consolas, monospace`, `fontSize: 11` (hardcoded in lightweight-charts config)

### Colors (Chart canvas — hardcoded hex, NOT tokens)
- **Chart background:** `#121212` (hardcoded, not `var(--bg-primary)`)
- **Chart text:** `#a0a0a0` (hardcoded)
- **Grid lines:** `#1e1e1e` (hardcoded)
- **Crosshair:** `#555` (hardcoded), label bg `#2a2a2a`
- **Scale borders:** `#333` (hardcoded)
- **Default candle up:** `#00c853` (hardcoded, differs from `--accent-win` #3ecf8e)
- **Default candle down:** `#ff1744` (hardcoded, differs from `--accent-loss` #e05c5c)
- **Line chart color:** `#00d2ff` (hardcoded)
- **Area chart top:** `rgba(0, 210, 255, 0.4)` (hardcoded)
- **Volume up:** `rgba(0, 200, 83, 0.3)` (hardcoded)
- **Volume down:** `rgba(255, 23, 68, 0.3)` (hardcoded)
- **Overlay line colors:** `['#00d2ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#a855f7', '#ff8c42', '#4ecdc4', '#f472b6']`

### CSS Colors (toolbar/chrome — uses tokens)
- **Timeframe active:** text `var(--accent-highlight)`, border `var(--accent-highlight)`, bg `color-mix(var(--accent-highlight) 10%, transparent)`
- **Chart type active:** Same pattern
- **Settings button:** text `var(--text-secondary)`, hover `var(--text-primary)`
- **Settings panel:** bg `var(--bg-secondary)`, border `var(--border-color)`, radius `var(--radius-lg)`, shadow `var(--shadow-lg)`, `width: 200px`, positioned `top: 36px; right: 8px`

### Settings Panel (inline)
- **Setting row:** `flex; justify-content: space-between; padding: var(--spacing-sm) 0; font-size: var(--font-size-md)`
- **Color inputs:** `width: 24px; height: 20px`
- **Checkbox:** `accent-color: var(--accent-highlight)`
- **Select:** bg `var(--bg-tertiary)`, border `var(--border-color)`, radius `var(--radius-md)`, font-size `var(--font-size-sm)`

### Data Display
- **OHLC display:** `O {open} H {high} L {low} C {close}` with change and percent
- **Overlay mode:** Shows percent change from first bar: `+X.XX%` or `-X.XX%`
- **Legend swatches:** `12px × 3px` colored rectangles
- **Timeframes:** 1m, 5m, 15m, 1h, 4h, 1D

### Interactive Elements
- **Ticker select dropdown**
- **Timeframe buttons:** 6 options
- **Chart type buttons:** Candle, Line, Area, Overlay toggle
- **Settings toggle**
- **Chart interaction:** Pan, zoom, crosshair (normal/magnet)

---

## 11. ChartSettings

**File:** `src/components/quotes/ChartSettings.jsx` (95 lines)

A compact settings panel rendered absolutely positioned over the chart. No dedicated CSS — uses classes from `Chart.css`.

### Controls
| Setting | Input Type | Default |
|---------|-----------|---------|
| Grid Lines | checkbox | true |
| Volume | checkbox (disabled in overlay) | true |
| Crosshair | select (Normal/Magnet) | normal |
| Up Color | color picker | #00c853 |
| Down Color | color picker | #ff1744 |
| Overlay Mode | checkbox | false |
| Compare Markets | ticker checkboxes (in overlay) | [] |

---

## 12. TimeSale

**Files:** `src/components/quotes/TimeSale.jsx` (333 lines), `TimeSale.css` (239 lines)

### Layout
- **Container:** `flex-direction: column; height: 100%; background: var(--bg-primary); overflow: hidden`
- **Toolbar:** `flex; align-items: center; gap: var(--spacing-xs); padding: 1px var(--spacing-xs); background: var(--bg-secondary)`
- **Header:** `flex; padding: 1px var(--spacing-xs); background: var(--bg-secondary); font-weight: 600`
- **List:** `flex: 1; overflow-y: auto; overflow-x: hidden; font-family: var(--font-mono)`
- **Row:** `flex; padding: 0 var(--spacing-xs); border-bottom: 1px solid var(--border-subtle); line-height: 1.2`

### Typography
- **Ticker select:** `var(--font-mono)`, `var(--font-size-md)`
- **Trade count:** `var(--font-mono)`, `var(--font-size-sm)`, `var(--text-muted)`
- **Header:** `var(--font-mono)`, `var(--font-size-sm)`, `font-weight: 600`, `var(--text-muted)`
- **Font-size:** Controlled by `FONT_SIZE_MAP` → small: 10px, medium: 11px, large: 13px (applied via inline `style.fontSize`)
- **Buttons:** `var(--font-size-lg)`

### Colors
- **Buy row:** `var(--accent-win)` (#3ecf8e)
- **Sell row:** `var(--accent-loss)` (#e05c5c)
- **Large trade row:** `font-weight: 600`
- **Row hover:** `var(--bg-tertiary)`
- **Toolbar buttons:** text `var(--text-secondary)`, hover text `var(--text-primary)`, hover bg `var(--bg-tertiary)`
- **Active button:** `var(--accent-highlight)`

### Column Widths (flex-based)
| Column | Key | Flex | Align |
|--------|-----|------|-------|
| Price | price | `0 1 40px` | right |
| Qty | size | `0 1 32px` | right |
| Time | time | `1` | left (fills remaining) |
| Exchange | side | `0 1 30px` | right |

### Data Display
- **Price:** `formatPrice(price, useTwo)` → `"X.XX¢"` or `"X¢"`
- **Size:** `formatSize(size, abbreviate)` → raw or `"X.Xk"` for >= 1000
- **Time:** `HH:MM:SS` or `HH:MM:SS.mmm` (configurable)
- **Side:** "BUY" / "SELL"

### Settings Panel (inline in JSX)
- Positioned: `top: 36px; right: 8px; width: 200px`
- bg `var(--bg-secondary)`, border `var(--border-color)`, radius `var(--radius-lg)`, shadow `var(--shadow-lg)`
- Number inputs: `width: 55px`
- Includes `<GridSettingsPanel>` for column customization

### Interactive Elements
- **Ticker select dropdown**
- **Clear button:** Unicode ✕
- **Settings toggle**
- **Freescroll:** Same pattern as EventLog
- **Column drag:** Via grid customization

### Data Source
- **NOTE:** TimeSale imports from `../../services/mockData` directly (NOT via hooks) — `subscribeToTimeSales`

---

## 13. Settings Companions

All settings panels follow a consistent inline-style pattern using `document.createElement('style')`.

### Common Pattern
```
Overlay: position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 20
Panel: bg var(--bg-secondary); border 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.5)
Header: padding 10px 12px; font-size 13px; font-weight 700
Body: padding 10px 12px; gap 8-10px
Row: font-size 12px; color var(--text-secondary)
Labels: font-family var(--font-sans)
Inputs (number/select): bg var(--bg-tertiary); border 1px solid var(--border-color); border-radius 3px; padding 3px 6px; font-family var(--font-mono); font-size 12px; focus border var(--accent-highlight)
Checkboxes: accent-color var(--accent-highlight); width/height 16px
Save button: bg var(--accent-win); color #000
Cancel button: bg var(--bg-tertiary); color var(--text-secondary); border 1px solid var(--border-color)
Button: padding 6px 8px; border-radius 3px; font-size 12px; font-weight 700
```

### Per-Component Settings

| Component | Panel Width | Unique Settings |
|-----------|-----------|-----------------|
| OrderBookSettings | 320px | Refresh interval, max fills, flash on fill, show cancelled; includes GridSettingsPanel |
| MontageSettings | 280px | Default order size, confirm before send, sound alerts, depth levels, flash duration, font size, show working orders; **no GridSettingsPanel** |
| PriceLadderSettings | 280px | Visible levels, center on trade, flash duration, show volume bars, show working orders, click action, default size; includes GridSettingsPanel |
| PositionsSettings | 320px | Sort by, sort direction, refresh interval, flash on change; includes GridSettingsPanel |
| TradeLogSettings | 320px | Filter (all/open/closed), date range, sort by, sort direction, refresh interval, flash on change; includes GridSettingsPanel |
| EventLogSettings | 320px | Log level filter, max lines, auto-scroll; includes GridSettingsPanel |
| AccountsSettings | 320px | Decimal precision, refresh interval; includes GridSettingsPanel |

### Style Injection
All use the same pattern:
```js
const style = document.createElement('style')
style.textContent = `...`
if (!document.querySelector('[data-{component}-settings-style]')) {
  style.setAttribute('data-{component}-settings-style', '')
  document.head.appendChild(style)
}
```

**Issue:** These are hardcoded px values, not design tokens. E.g., `padding: 10px 12px` instead of `var(--spacing-lg) var(--spacing-lg)`, `font-size: 13px` instead of `var(--font-size-lg)`, `border-radius: 6px` instead of `var(--radius-lg)`.

---

## 14. Cross-Component Patterns

### Shared Grid Customization (`useGridCustomization` hook)
All table-based components use this hook for:
- Column visibility toggling
- Column reorder via drag-and-drop
- Font size control (small/medium/large)
- Row height
- Background/text color overrides
- Conditional formatting rules (via `getRowStyle`)

### LinkBus Integration
Components subscribe to color groups via `linkBus`:
- **Publishers:** Montage, PriceLadder, Chart, TimeSale, Positions, TradeLog (emit on ticker change/row click)
- **Subscribers:** All components with ticker context
- Pattern: `subscribeToLink(colorId, handler, windowId)` / `unsubscribeFromLink(colorId, handler)`

### localStorage Persistence
All components save settings to localStorage with component-specific key prefixes:
- `order-book-settings-{windowId}`
- `kalshi_montage_settings`
- `price-ladder-settings-{windowId}`
- `positions-settings-{windowId}`
- `trade-log-settings-{windowId}`
- `event-log-settings-{windowId}`
- `accounts-settings-{windowId}`
- `chart_settings_{windowId}`
- `timesale_settings_{windowId}`

### P&L Color Scoping
Components scope P&L colors to avoid conflicts:
- `.positions .text-win` → `var(--accent-buy)`
- `.tradelog .text-win` → `var(--accent-buy)`
- `.montage .text-win` → `var(--accent-buy)`
- OrderBook uses un-scoped `.text-win` → `var(--accent-win)` (note: uses `--accent-win` not `--accent-buy` — same value but different semantic token)

### Data Sources
| Component | Data Source |
|-----------|------------|
| OrderBook | `omsService` (getOpenOrders, getRecentFills, getPositionSummaries) |
| Montage | `useTickerData`, `useOrderEntry`, `useMarketSearch` hooks |
| PriceLadder | `useTickerData` hook |
| Positions | `generateMockPositions()` (local mock) |
| TradeLog | `generateMockTradelog()` (local mock) |
| EventLog | `getStartupEntries()` + simulated periodic events (local mock) |
| NewsChat | `generateNewsItems()` + `useMarketSearch` hook |
| Accounts | `generateMockAccounts()` (local mock) |
| Chart | `generateOHLCV` + `subscribeToOHLCV` from `dataFeed` service |
| TimeSale | `subscribeToTimeSales` from `mockData` (NOT dataFeed) |

### Known Issues / Gaps
1. **Accounts.jsx has no CSS file** — all `acct-*` classes are undefined; `.acct-type-paper`, `.acct-type-live` referenced but never styled
2. **TimeSale imports from mockData** — unlike other components that use hooks/dataFeed, will never use real data
3. **Chart canvas uses hardcoded hex colors** — `#121212`, `#00c853`, `#ff1744` do not use design tokens and differ from `--accent-win`/`--accent-loss`
4. **Settings panels use hardcoded px** — `10px 12px` padding, `13px` font-size, `6px` radius, `3px` sub-radius instead of design tokens
5. **PriceLadder JSX calls `setData(null)`** in link handler but `data` comes from `useTickerData` hook (not local state) — this would error at runtime
6. **MontageSettings lacks GridSettingsPanel** — only trade settings panel without it
7. **OrderBook uses `var(--bg-secondary)` for thead** while Positions/TradeLog/Accounts use `var(--bg-tertiary)` — inconsistency
8. **Flash keyframes not defined for Montage** — bid/ask flash uses JS class toggle with `flash-up`/`flash-down` but no corresponding CSS keyframes in Montage.css
