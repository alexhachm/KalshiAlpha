# Gap Analysis: Missing Component-Level Styling

> Generated 2026-03-06 by worker-4 (Opus)
> Based on: ui-audit-shell.md, ui-audit-trade.md, ui-audit-scanners.md

---

## 1. Account Summary Bar

**Status:** MISSING — No persistent display of account balance, buying power, or daily P&L.

Shell.jsx renders only `<MenuBar>` + `<div class="shell-workspace">`. There is no account summary bar or status strip. Professional trading terminals typically show a persistent bar with:
- Account balance / buying power
- Daily P&L (realized + unrealized)
- Open positions count
- Connection status

**Resolution:** Add CSS classes for `shell-account-bar` — a compact horizontal bar between MenuBar and workspace.

---

## 2. Order Status Bar / Active Orders Indicator

**Status:** MISSING at shell/menu level — OrderBook internally tracks open orders with a tab badge, but there is no persistent, always-visible order count indicator.

**Resolution:** Add CSS for a `menu-status-badge` and `menu-status-pulse` animation to show active order counts in the MenuBar area.

---

## 3. Market Breadth Indicators in Scanners

**Status:** PARTIAL — LiveScanner has conviction bars (`.ls-conviction-bar-fill`) and HistoricalScanner has confidence bars (`.hs-confidence-bar-fill`). No market-wide breadth summary (advance/decline ratio, overall sentiment gauge).

**Resolution:** Low priority. Current scanner styling is comprehensive. A breadth indicator would require new JSX + data, not just CSS.

---

## 4. Watchlist with Streaming Quotes

**Status:** PARTIAL — MarketViewer serves as a single-ticker detail view (bid/ask prices, depth table). It does NOT support multi-ticker watchlist view. Missing:
- Multi-row ticker table with last, change, volume columns
- Flash animations on price updates (references global `.flash-up`/`.flash-down` but no MarketViewer-scoped flash keyframes)
- Streaming quote highlighting for best bid/ask changes

**Resolution:** Add flash animation keyframes and streaming-quote highlight CSS to MarketViewer.css.

---

## 5. News Feed Panel Styling

**Status:** COMPLETE — NewsChat (137 lines JSX, 164 lines CSS) provides a search-filtered news feed with proper tokenized styling. No major gaps.

---

## 6. Panel Tabs (Multi-Tool Windows)

**Status:** CRITICAL GAP — Window.jsx renders `.window-tab-bar`, `.window-tab`, `.window-tab--active`, `.window-tab-label`, `.window-tab-detach` classes for merged/tabbed windows, but **Window.css defines NONE of these classes**. Tabs are completely unstyled.

**Resolution:** Add complete tab bar CSS to Window.css matching the existing design token system.

---

## 7. Window Grouping/Linking Indicators

**Status:** FUNCTIONAL but subtle — The `.window-color-chip` (12×12px square) in the titlebar shows the link color. When unlinked, it's `#555` (hardcoded). The chip scales on hover (1.2×) and shows a dropdown picker. However:
- No glow or emphasis when actively linked
- Merge target highlight class `.window--merge-target` is referenced in JS but has no CSS

**Resolution:** Add CSS for `.window--merge-target` highlight and enhance linked color chip with subtle glow.

---

## Implementation Priority

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 1 | Window tab bar CSS | **Critical** — broken feature | Low |
| 2 | Account summary bar CSS | High — trading terminal essential | Low |
| 3 | Order status indicator CSS | High — trading terminal essential | Low |
| 4 | Window link-group enhancements | Medium — visual polish | Low |
| 5 | MenuBar status indicators | Medium — informational | Low |
| 6 | MarketViewer streaming enhancements | Medium — visual polish | Low |
