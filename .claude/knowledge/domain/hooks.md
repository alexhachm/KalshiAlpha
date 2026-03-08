# Domain: hooks
<!-- Updated 2026-03-08T01:44:00Z by worker-4. Max ~800 tokens. -->

## Key Files
- `src/hooks/useHotkeyDispatch.js` — Global hotkey dispatch hook. Listens for key combos, parses hotkey scripts, executes actions (BUY, SELL, CANCEL_ALL, CANCEL_BUY, CANCEL_SELL, FOCUS, SWITCH_TICKER). Integrates hotkeyStore, hotkeyLanguage, dataFeed.

## Gotchas & Undocumented Behavior
- `getActiveTicker()` is defined inside the useEffect but must be explicitly called for each action that needs ticker context. BUY/SELL call it, cancel actions now also call it.
- Kalshi API order fields: `ticker` (market ticker), `side` ('yes'/'no'), `order_id` (for cancellation), `yes_price` (not `price`), `count_fp` (string, not `quantity`).
- BUY maps to side='yes', SELL maps to side='no'. CANCEL_BUY cancels 'yes' side, CANCEL_SELL cancels 'no' side.
- `placeOrder` uses `count_fp: parseFloat(quantity).toFixed(2)` and `yes_price` with NO-side conversion (`100 - price`).

## Patterns That Work
- All cancel actions should follow the same pattern as BUY/SELL: get active ticker first, return early if none, then filter orders by ticker.
- Use `dataFeed.getOpenOrders()` → filter → `dataFeed.cancelOrder(o.order_id)` for cancellations.

## Testing Strategy
- Build validation (`npm run build`) — no test suite configured.
- Manual testing: focus a window with specific ticker, verify hotkeys only affect that ticker's orders.

## Recent State
- Cancel hotkeys (CANCEL_ALL, CANCEL_BUY, CANCEL_SELL) now properly filter by active ticker (PR #125).
- BUY/SELL field names were recently fixed to match Kalshi API (PR #122 — `yes_price`, `count_fp`).
