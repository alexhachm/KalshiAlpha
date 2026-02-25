# Domain: trade
<!-- Updated 2026-02-25T07:30:00Z by worker-7. Max ~800 tokens. -->

## Key Files
- `src/components/trade/Accounts.jsx` — Account overview table (7 cols, mock data, sortable, totals row)
- `src/components/trade/AccountsSettings.jsx` — Settings panel for Accounts (column visibility, precision, refresh, font)
- `src/components/trade/Accounts.css` — Styles for Accounts component
- `src/components/trade/Positions.jsx` — Open positions table (7 cols, Long/Short coloring, flash, linkBus)
- `src/components/trade/PositionsSettings.jsx` — Settings panel for Positions (columns, sort, refresh, font, flash)
- `src/components/trade/Positions.css` — Styles for Positions component
- `src/components/trade/TradeLog.jsx` — All positions (open+closed) table with filter/sort/CSV export
- `src/components/trade/TradeLogSettings.jsx` — Settings: columns, filter, date range, sort, font, flash
- `src/components/trade/TradeLog.css` — Styles for TradeLog
- `src/components/trade/Montage.jsx` — Order entry with Level II book display
- `src/components/trade/MontageSettings.jsx` — Montage settings panel
- `src/components/trade/PriceLadder.jsx` — DOM/price ladder with click-to-trade
- `src/components/trade/PriceLadderSettings.jsx` — PriceLadder settings
- `src/components/trade/EventLog.jsx` — System event log
- `src/components/trade/EventLogSettings.jsx` — EventLog settings
- `src/components/WindowManager.jsx` — Component registry, maps type strings to components

## Gotchas & Undocumented Behavior
- CSS class prefix convention: component-specific (acct-, pos-, tl-, montage-) to avoid collisions
- Settings inline styles use `document.createElement(style)` with data-attribute guard to avoid duplication
- `text-win` and `text-loss` are global CSS classes from index.css for green/red P&L coloring
- linkBus subscribeToLink requires colorId + callback + windowId; cleanup via unsubscribeFromLink
- WindowManager passes `windowId`, `title`, and `type` as props to all components

## Patterns That Work
- Follow Accounts.jsx pattern exactly: LS_KEY_PREFIX, loadSettings/saveSettings, DEFAULT_SETTINGS, COLUMNS array, generateMock* functions
- Settings panels: local state copy, handleSave applies to parent, overlay click-to-close with stopPropagation
- Use React.memo for exported components
- All numeric P&L formatting: `val.toFixed(2)` with `$` prefix
- Sort state can live in settings (persisted) or in component state (ephemeral) — Positions uses persisted

## Testing Strategy
- `npm run build` must pass — catches import/syntax errors
- Manual: open component from Trade menu, verify columns/sorting/settings
- Check localStorage keys match pattern: `{component}-settings-{windowId}`

## Recent State
- ALL trade components now built and registered in WindowManager on main
- Accounts, Positions, TradeLog, Montage, PriceLadder, EventLog — all complete
- No remaining trade Placeholder entries in WindowManager
