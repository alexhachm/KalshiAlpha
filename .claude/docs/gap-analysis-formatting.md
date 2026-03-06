# Gap Analysis: Data Formatting, Tooltips & UX Polish

> Generated 2026-03-06 by worker-2 (Opus). Research findings for formatting and UX utility gaps.

---

## 1. Number Formatting (tabular-nums)

**Current state:** `index.css` has a `.mono` utility class with `font-variant-numeric: tabular-nums`. However, individual component CSS files set `font-family: var(--font-mono)` on their root containers WITHOUT setting `font-variant-numeric: tabular-nums`. This means numeric columns in tables may not align properly.

**Affected components:** Positions (.positions), TradeLog (.tradelog), OrderBook (.order-book), EventLog (.event-log), Accounts (inline styles), LiveScanner (.live-scanner), HistoricalScanner (.historical-scanner), TimeSale (.time-sale), PriceLadder (.price-ladder), Montage (.montage).

**Gap:** No global rule ensures all mono-font data tables use tabular-nums. The `.mono` class exists but is not applied to table containers or numeric cells.

**Resolution:** Add `font-variant-numeric: tabular-nums` to a broad selector targeting all data table fonts, and create `.data-numeric` utility for explicit use.

---

## 2. P&L Display Formatting

**Current state:** Components use `.text-win`/`.text-loss` with component-scoped overrides. P&L values are formatted as `$X.XX` with color coding. No utility class provides:
- Automatic `+`/`-` prefix display
- Combined background + text color (like badge style)
- Consistent P&L formatting across Positions, TradeLog, Accounts, OrderBook

**Gap:** No `.pnl-positive`/`.pnl-negative` utility class with +/- prefix styling. P&L is color-coded but lacks visual emphasis like a subtle background tint.

**Resolution:** Add `.pnl-positive` and `.pnl-negative` utility classes with color, font-weight, and optional background tint. Add `.pnl-zero` for flat positions.

---

## 3. Spread Display

**Current state:** PriceLadder footer shows spread as plain text (`Spread: {value}`). No visual bar or highlighted gap. OrderBook and Montage don't show spread.

**Gap:** Numeric spread is shown but could benefit from color-coding (tight spread = green, wide = yellow/red). Low priority — text display is functional.

**Resolution:** No CSS-only solution needed. Existing text display is adequate.

---

## 4. Implied Probability

**Current state:** Kalshi prices are shown in cents (0–100) which inherently represent probability. No special formatting (e.g., `65%` display or probability bar visualization) exists.

**Gap:** Minor — the cents display (e.g., "65c") is standard for Kalshi. A probability-bar utility could enhance PriceLadder/Montage.

**Resolution:** Add `.probability-bar` utility class for potential use by components showing implied probability.

---

## 5. Timestamp Consistency

**Current state:** Inconsistent across components:
- OrderBook: `HH:MM:SS` (24h)
- EventLog: `HH:MM:SS.mmm` (24h with ms)
- TimeSale: `HH:MM:SS` or `HH:MM:SS.mmm` (configurable)
- TradeLog: `YYYY-MM-DD`
- NewsChat: `HH:MM`

**Gap:** Different granularity is reasonable per component purpose (trade log = date, time & sales = milliseconds). No CSS formatting issue — this is a JS formatting concern.

**Resolution:** No CSS changes needed. Timestamp formats are appropriate per context.

---

## 6. Tooltips

**Current state:** No tooltip CSS classes exist anywhere. No column headers have title attributes. No abbreviations are explained. No hover tooltip pattern available.

**Gap:** Critical UX gap. Column headers like "Avg Cost", "P&L", "TIF" have no explanations. No reusable tooltip system.

**Resolution:** Add `.tooltip` / `.tooltip-text` CSS classes to index.css with positioned variants (top, bottom, left, right) and arrow pointers.

---

## 7. Keyboard Shortcut Display

**Current state:** HotkeyManager.jsx handles shortcut execution but shortcuts are never shown in the UI. No `<kbd>` styling. Menu items and buttons don't display their hotkey bindings.

**Gap:** Users have no visual indication of available keyboard shortcuts. No kbd-style badge CSS exists.

**Resolution:** Add `.kbd` CSS class mimicking traditional keyboard key badges — small, bordered, slightly raised appearance.

---

## 8. Status Bar

**Current state:** Shell.css has `.shell-account-bar` (22px, top position between MenuBar and workspace) with account metrics and connection dot. No persistent BOTTOM status bar exists.

**Gap:** Professional trading terminals typically have a bottom status bar showing: connection state, latency, clock, market session status. The existing account bar is top-positioned. A dedicated bottom status bar is missing.

**Resolution:** Add `.shell-status-bar` CSS for a bottom-anchored persistent bar.

---

## Implementation Priority (by value)

1. **Tooltip CSS** (high — zero tooltip support currently)
2. **Tabular-nums on data tables** (high — affects all numeric alignment)
3. **P&L utility classes** (high — unifies P&L display pattern)
4. **Keyboard shortcut badges** (medium — enables hotkey discovery)
5. **Status bar CSS** (medium — enables bottom status bar)
6. **Probability bar utility** (low — enhancement only)
