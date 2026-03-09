# Tool Interaction-Quality Index

> Generated from `src/config/toolManifest.js` (18 tools).
> Last updated: 2026-03-09.

## Scoring Criteria

Each tool is scored on two axes (1–5 scale each), then combined into a composite rank.

### Feature Completeness (FC) — _What the tool can do_

| Score | Meaning |
|-------|---------|
| 5 | Real data hooks, settings panel, grid customization, keyboard shortcuts, link-bus integration, error/loading states — all present |
| 4 | Most features present; one or two minor gaps (e.g. no grid customization or no dedicated keyboard shortcuts) |
| 3 | Core functionality works; missing settings panel, grid customization, or link-bus integration |
| 2 | Basic rendering with limited interactivity; largely mock data or hardcoded display |
| 1 | Placeholder or stub — no real functionality |

**Checklist items** (each contributes ~0.8 toward the score):
1. Real data hooks (not mock-only)
2. Settings panel / configuration UI
3. Grid customization (column reorder, visibility, formatting)
4. Keyboard shortcuts / hotkey integration
5. Link-bus (color group) integration
6. Error handling and loading states

### UI Interaction Quality (IQ) — _How polished the interaction feels_

| Score | Meaning |
|-------|---------|
| 5 | ARIA attributes, responsive/resizable layout, hover tooltips, filter/sort controls, rich visual feedback — all present |
| 4 | Strong interaction design; one or two gaps (e.g. missing ARIA or context menus) |
| 3 | Functional UI with basic controls; limited feedback or accessibility |
| 2 | Minimal interaction — static display with few controls |
| 1 | No meaningful interaction affordances |

**Checklist items** (each contributes ~1.0 toward the score):
1. ARIA / accessibility attributes
2. Responsive / resizable layout
3. Hover tooltips or context menus
4. Filter, sort, or search controls
5. Visual feedback (flash animations, loading spinners, status indicators)

### Composite Rank

`Composite = (FC + IQ) / 2`, rounded to one decimal. Tools are ranked highest-to-lowest.

---

## Per-Tool Rankings

| Rank | Tool (type) | Label | Category | FC | IQ | Composite | Rationale |
|------|-------------|-------|----------|----|----|-----------|-----------|
| 1 | `montage` | Montage | Trade | 4.5 | 4.0 | **4.3** | Real hooks (useTickerData, useOrderEntry, useMarketSearch), full settings panel, link-bus subscriber, price flash animations, market search combobox. Missing ARIA. |
| 2 | `price-ladder` | Price Ladder | Trade | 4.5 | 4.0 | **4.3** | Real hooks, grid customization, link-bus, settings panel, flash animations on price changes, volume depth bars. Missing ARIA. |
| 3 | `chart` | Chart | Quotes | 4.5 | 4.5 | **4.5** | Canvas-based OHLCV charting with real-time updates, full settings (type, timeframe, colors, crosshair), link-bus, overlay mode, crosshair data display. No grid (N/A). |
| 4 | `positions` | Positions | Trade | 4.5 | 4.0 | **4.3** | Real OMS data (getPositionSummaries), event subscriptions, grid customization, link-bus, settings panel, PnL color coding, flash on change. Missing ARIA. |
| 5 | `order-book` | Order Book | Trade | 4.5 | 4.0 | **4.3** | Real OMS integration (getAllOrders, getRecentFills), tabbed UI (Orders/Fills/Positions), grid customization per tab, link-bus filtering, flash on fill. No hotkey integration. |
| 6 | `hotkey-config` | Hotkey Config | Setup | 4.5 | 4.5 | **4.5** | Full keybinding editor with Ctrl+S save, key capture/validation, profile support, binding search, command reference panel. Entire component is a settings UI. |
| 7 | `live-scanner` | Live | Scanners | 4.5 | 4.5 | **4.5** | Real-time alert stream via subscribeToScanner, grid customization, conviction bars, type filter, pause/resume, flash on new alert. Missing hotkey integration. |
| 8 | `alert-trigger` | Alert & Trigger | Scanners | 4.5 | 4.0 | **4.3** | Real alertService with rule/alert subscriptions, dual-grid customization (rules + history), form validation, flash on alert. No link-bus (not applicable). |
| 9 | `trade-log` | Trade Log | Trade | 4.5 | 4.0 | **4.3** | Grid customization, link-bus, settings panel, CSV export, date range filter, status badges, PnL color coding. Uses mock data generation. |
| 10 | `time-sale` | Time/Sale | Quotes | 4.0 | 4.0 | **4.0** | Real-time trade stream (subscribeToTimeSales), inline settings, column reorder, link-bus, large-trade highlighting, auto-scroll with recenter. |
| 11 | `historical-scanner` | Historical | Scanners | 4.0 | 4.0 | **4.0** | Async scan with useHistoricalScan, grid customization, date range picker, pattern selector, confidence bars, CSV export. No hotkey integration. |
| 12 | `event-log` | Event Log | Trade | 4.0 | 3.5 | **3.8** | Simulated event stream, settings panel (log level, max lines, auto-scroll), column visibility, level color coding, export. No link-bus or hotkeys. |
| 13 | `changes` | Changes | Trade | 4.0 | 4.0 | **4.0** | Real changeTrackingService with subscriptions, card-based layout with diff viewer, status/domain/sort filters, search. No settings panel or link-bus. |
| 14 | `accounts` | Accounts | Trade | 3.5 | 3.5 | **3.5** | Grid customization, settings panel (decimal precision, refresh), PnL color coding, sortable columns, totals row. No link-bus or hotkey integration. |
| 15 | `market-viewer` | Market Viewer | Quotes | 3.5 | 3.5 | **3.5** | Real hooks (useTickerData, useMarketSearch), link-bus, hotkey integration, price flash, depth table. No settings panel or grid customization. |
| 16 | `market-clock` | Market Clock | Scanners | 3.5 | 3.5 | **3.5** | Real-time display via requestAnimationFrame, settings panel (timezone, ms precision, font), DST-aware market session status. Minimal interaction (display-only by nature). |
| 17 | `news-chat` | News/Chat | Quotes | 3.0 | 3.0 | **3.0** | Mock news feed with market search filter, link-bus subscriber, ticker badges, timestamps. No settings panel, grid, or hotkey support. |
| 18 | `login` | Login | Login | 1.0 | 1.0 | **1.0** | Placeholder component — renders "(Coming Soon)" text. No functionality implemented. |

---

## Distribution by Category

| Category | Tools | Avg FC | Avg IQ | Avg Composite |
|----------|-------|--------|--------|---------------|
| Trade | Montage, Price Ladder, Accounts, Positions, Trade Log, Event Log, Order Book, Changes | 4.2 | 3.9 | 4.0 |
| Quotes | Chart, Time/Sale, Market Viewer, News/Chat | 3.8 | 3.8 | 3.8 |
| Scanners | Live, Historical, Alert & Trigger, Market Clock | 4.1 | 4.0 | 4.1 |
| Setup | Hotkey Config | 4.5 | 4.5 | 4.5 |
| Login | Login | 1.0 | 1.0 | 1.0 |

## Cross-Cutting Gaps

| Gap | Affected Tools | Notes |
|-----|---------------|-------|
| ARIA / accessibility | All 18 | No tool has meaningful ARIA attributes or keyboard-only navigation |
| Context menus | All 18 | No tool implements right-click context menus |
| Settings panel missing | Login, Changes, Market Viewer, News/Chat | 4 tools have no configuration UI |
| Grid customization missing | Login, Montage, Chart, Market Viewer, News/Chat, Market Clock | 6 tools (some by design, e.g. Chart uses canvas) |
| Hotkey integration missing | Accounts, Trade Log, Event Log, Order Book, Changes, News/Chat, Live, Historical, Market Clock | 9 tools lack hotkey focus-target or shortcut registration |

---

## Methodology

1. **Source of truth:** `src/config/toolManifest.js` — all 18 `type` entries enumerated.
2. **Component mapping:** `src/components/WindowManager.jsx` `COMPONENTS` registry maps each type to its React component.
3. **Assessment:** Each component file was read and scored against the FC and IQ checklists above.
4. **Terminology:** Tool names (`type`, `label`, `category`) match the canonical manifest exactly.
