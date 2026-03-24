# Hooks Layer

All custom React hooks live in `src/hooks/`. They bridge services (dataFeed, stores, linkBus) to React component lifecycle.

## File Inventory (6 files)

### useKalshiData.js (306 lines)
Primary data-subscription hooks. All wrap `dataFeed.*` with `useState`/`useEffect` lifecycle.

| Hook | Purpose | Returns |
|------|---------|---------|
| `useTickerData(ticker)` | Real-time tick data for a market | `{ data, error }` |
| `useMarketRace()` | Top movers / market race data | `{ racers, error }` |
| `useScannerAlerts(maxAlerts=100)` | Accumulates scanner alerts newest-first, capped at maxAlerts | `{ alerts, clearAlerts, error }` |
| `useOHLCV(ticker, timeframe='1h')` | OHLCV candle data for charting. Handles 'history' and 'update' message types | `{ candles, currentCandle, error }` |
| `useKalshiConnection()` | **DEAD CODE** — simpler duplicate of useKalshiConnection.js; never imported anywhere | `{ connected, initialize, disconnect }` |
| `usePortfolio(refreshInterval=5000)` | Balance, positions, orders, fills. Polls on interval + debounced real-time updates via subscribeToUserFills/subscribeToPositionChanges | `{ balance, positions, orders, fills, refresh }` |
| `useOrderEntry()` | Submit/cancel orders via dataFeed. Normalizes payload before submission | `{ submitOrder, cancelOrder, lastResult, submitting, error }` |
| `useHistoricalScan()` | Run historical scan queries | `{ results, scanning, error, scan }` |
| `useMarketSearch()` | Search markets | `{ results, loading, search }` |

### useKalshiConnection.js (159 lines)
Full-featured connection management hook. Used by `App.jsx`.

- Tracks both `connected` (boolean) and `status` (string: 'connected', 'mock', etc.)
- `applyConnectionSettings(settings)` — normalizes settings, deduplicates via JSON signature, calls dataFeed.initialize
- `initializeFromSavedSettings()` — loads from settingsStore and applies
- `loadSavedConnectionSettings()` — reads from settingsStore, normalizes with defaults
- Helper functions (exported): `normalizeConnectionSettings`, `toInitializeOptions`, `loadSavedConnectionSettings`
- `parseApiKeyBlob(apiKey)` — parses JSON blobs or PEM+keyId from pasted strings
- `extractCredentials(settings)` — tries apiKeyId/privateKeyPem first, falls back to parseApiKeyBlob

### useGridCustomization.js (261 lines)
Grid column visibility, ordering, resizing, appearance, and conditional formatting.
Persists to `localStorage` under key `gridCustom_${toolId}`.

- `useGridCustomization(toolId, defaultColumns)` — main hook
- Column ops: toggleColumn, reorderColumns, resizeColumn, resetColumns
- Appearance: fontSize, rowHeight, bgColor, textColor
- Conditional formatting: colorRules with operators (>, <, >=, <=, ==, !=)
- Drag-and-drop column reordering with dragState tracking
- `getRowStyle(rowData)` — applies base colors + conditional rules (last matching rule wins)
- Debounced save (300ms) to localStorage on every state change
- Merges saved state with defaults on load (preserves saved order, adds new columns)

### useCombobox.js (131 lines)
Accessible combobox behavior for ticker search dropdowns.

- ArrowUp/ArrowDown cycling (wraps around)
- Enter to select, Escape to close+blur
- Outside-click dismissal via mousedown listener
- Full ARIA: getInputProps, getListboxProps, getOptionProps helpers
- Params: `{ id, items, onSelect, minChars=2 }`

### useDialogFocusTrap.js (77 lines)
Dialog accessibility: Escape-to-close, focus trap, initial focus on open, focus restoration on close.

- Uses `trapFocus` and `getFocusableElements` from `../utils/dialogA11y`
- Returns `{ dialogRef, dialogProps }` with ARIA role=dialog, aria-modal, tabIndex=-1
- Options: ariaLabel, ariaLabelledBy, initialFocus ('first' | 'container')
- Note: `options` is not in useEffect deps — if initialFocus changes after mount, it won't re-apply (benign in practice)

### useHotkeyDispatch.js (332 lines)
Global hotkey dispatch — listens for key combos, parses scripts, executes trading actions.

**Architecture:**
- Integrates hotkeyStore (bindings) + hotkeyLanguage (parser) + dataFeed (execution) + linkBus (ticker switching)
- Attaches global `keydown` listener on `document`
- Guards: skips when HotkeyManager config UI is active, when typing in INPUT/TEXTAREA/contentEditable

**Ticker Resolution:**
- `tickerRegistry` (module-level Map) — components register their current ticker via `registerWindowTicker(windowId, ticker)`
- `resolveActiveTicker(getFocusedWindow)` — checks tabbed window active tab → non-tabbed window ID → Shell metadata fallback
- Exported: `registerWindowTicker`, `unregisterWindowTicker`

**Supported Actions:**
| Action | Behavior |
|--------|----------|
| BUY | Resolves ticker, side (default 'yes'), price (from DOM), shares; places order |
| SELL | Same as BUY but infers side from open positions if not specified |
| CANCEL_ALL | Cancels all orders for active ticker |
| CANCEL_BUY / CANCEL_SELL | Cancels orders filtered by action type |
| FOCUS | Focuses a window by type (uses FOCUS_TYPE_MAP) |
| SWITCH_TICKER | Emits linked market change via linkBus |
| LOAD_TEMPLATE | Dispatches 'load-order-template' CustomEvent |

**Price Resolution:** Fixed, market (bid/ask/mid/last), or offset from base
**Shares Resolution:** Fixed, position-based, position_fraction, buying_power, max_position (placeholder=100)

## Issues Found
1. **Dead code**: `useKalshiConnection` in useKalshiData.js:130-149 is never imported — duplicate of the full-featured version in useKalshiConnection.js
2. **Missing useEffect dep**: useDialogFocusTrap.js line 63 — `options` not in deps array. Benign since options rarely change after mount.
3. **Hardcoded max_position=100**: useHotkeyDispatch.js line 149 — `resolveShares` returns 100 for max_position type with "placeholder" comment. Risk settings not implemented.

## Dependencies Graph
```
useKalshiData.js       → dataFeed
useKalshiConnection.js → dataFeed, settingsStore
useGridCustomization.js → localStorage (no service deps)
useCombobox.js         → (no deps, pure behavior)
useDialogFocusTrap.js  → utils/dialogA11y
useHotkeyDispatch.js   → hotkeyStore, hotkeyLanguage, dataFeed, linkBus
```
