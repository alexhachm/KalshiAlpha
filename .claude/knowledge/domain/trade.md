# Domain: trade
<!-- Updated 2026-02-26T22:12:00Z by worker-5. Max ~800 tokens. -->

## Key Files
- `src/components/trade/TradeLog.jsx` — All positions table (open+closed). Uses useGridCustomization for columns. Has filter bar, CSV export, flash-on-change, color link bus.
- `src/components/trade/Positions.jsx` — Open-only positions table. Same grid hook pattern. Flash-on-change, color link.
- `src/components/trade/Accounts.jsx` — Account overview table with totals row. Grid hook, decimal precision setting.
- `src/components/trade/EventLog.jsx` — System event log (div-based, not table). Grid hook for column visibility + appearance. Auto-scroll, level filter, periodic mock events.
- `src/components/trade/*Settings.jsx` — Each embeds `<GridSettingsPanel {...grid} />` for column/appearance controls, plus component-specific settings (sort, filter, refresh, etc.).
- `src/hooks/useGridCustomization.js` — Shared hook: column visibility/order/width, fontSize, rowHeight, bg/textColor, conditional formatting rules. Persists to `localStorage` under `gridCustom_${toolId}`.
- `src/components/GridSettingsPanel.jsx` — Reusable settings sub-panel for grid hook. Column drag list, appearance controls, conditional formatting rule builder.

## Gotchas & Undocumented Behavior
- Grid hook uses `gridCustom_` localStorage prefix, separate from each component's own `*-settings-` prefix for non-grid settings (sort, filter, etc.)
- EventLog is NOT a table — it uses div-based entry rendering. Grid hook controls column visibility via a Set lookup on visibleKeys.
- Accounts has no dedicated CSS file — styles are injected inline from AccountsSettings.jsx.
- TradeLog exportCsv uses grid.visibleColumns directly (no need to re-add visible:true).
- `text-win` and `text-loss` are global CSS classes from index.css for green/red P&L coloring.
- linkBus subscribeToLink requires colorId + callback + windowId; cleanup via unsubscribeFromLink.

## Patterns That Work
- `const grid = useGridCustomization(toolId, COLUMNS)` at component top
- `grid.visibleColumns` replaces old `COLUMNS.filter(c => settings.columns[c.key])`
- `<GridSettingsPanel {...grid} />` spread pattern for settings panels
- `style={{ height: grid.rowHeight, ...grid.getRowStyle(row) }}` on each `<tr>`
- Drag handlers on `<th>`: draggable, onDragStart/onDragOver/onDragEnd from grid
- Settings panels: local state copy, handleSave applies to parent, overlay click-to-close

## Testing Strategy
- `npm run build` is primary verification (no lint/test scripts)
- Dev server starts clean with no import resolution errors
- Open each component's settings panel to verify GridSettingsPanel renders

## Recent State
- All 4 trade components integrated with useGridCustomization (PR #30)
- Hook + GridSettingsPanel cherry-picked from commit b317cb7
- Montage, PriceLadder NOT yet integrated with grid hook (separate domain/task)
