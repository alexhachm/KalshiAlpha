# Domain: trade-settings-ui
<!-- Updated 2026-03-09T01:10:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- `src/hooks/useDialogFocusTrap.js` — Shared dialog a11y hook (Escape close, focus trap, focus restore)
- `src/utils/dialogA11y.js` — Low-level focus trap utilities (getFocusableElements, trapFocus)
- `src/components/trade/AccountsSettings.jsx` — Reference implementation (first to use the hook)
- `src/components/trade/MontageSettings.jsx` — Montage dialog (no GridSettingsPanel)
- `src/components/trade/PositionsSettings.jsx` — Positions dialog (has GridSettingsPanel + sort options)
- `src/components/trade/EventLogSettings.jsx` — Event log dialog (has GridSettingsPanel)
- `src/components/trade/OrderBookSettings.jsx` — Order book dialog (has GridSettingsPanel)
- `src/components/trade/PriceLadderSettings.jsx` — Price ladder dialog (has GridSettingsPanel)
- `src/components/trade/TradeLogSettings.jsx` — Trade log dialog (has GridSettingsPanel + filter/sort)

## Gotchas & Undocumented Behavior
- All settings use inline `<style>` injection with `data-*` attribute guards to prevent duplication
- All have overlay with `onClick={onClose}` and panel with `onClick={e => e.stopPropagation()}`
- `dialogProps` must be spread on the inner panel div, NOT the overlay
- `onClick` must come AFTER `{...dialogProps}` spread to avoid being overwritten
- These components only render when open, so always pass `true` for the `isOpen` parameter
- Worktree: `gh pr create` fails due to git dir issues — use `gh api repos/.../pulls` directly

## Patterns That Work
- `useDialogFocusTrap(true, onClose, { ariaLabel: 'XXX Settings' })` — consistent across all 7 dialogs
- The hook provides: role='dialog', aria-modal=true, tabIndex=-1, ref, and aria-label
- All dialogs follow draft/save pattern: local state → handleSave → onChange(local) + onClose()

## Testing Strategy
- Build with `npm run build` — catches import/syntax errors
- Dev server `npm run dev` — verify no runtime errors
- Manual: open each settings panel, press Escape (should close), Tab (should cycle within dialog)

## Recent State
- All 7 trade settings dialogs now use useDialogFocusTrap (task 64 completed)
- PR #174 on agent-3 branch
