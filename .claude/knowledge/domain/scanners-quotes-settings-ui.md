# Domain: scanners-quotes-settings-ui
<!-- Updated 2026-03-09T00:25:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- `src/components/scanners/MarketClockSettings.jsx` — Clock settings dialog (draft/save pattern with local state)
- `src/components/quotes/ChartSettings.jsx` — Chart settings dialog (live-update pattern via onUpdate prop)
- `src/hooks/useDialogFocusTrap.js` — Shared dialog a11y hook (Escape close, focus trap, focus restore)
- `src/utils/dialogA11y.js` — Low-level focus trap utilities (getFocusableElements, trapFocus)
- `src/components/trade/AccountsSettings.jsx` — Reference implementation of the dialog pattern

## Gotchas & Undocumented Behavior
- Worktree files are at `.worktrees/wt-N/` — edits to main repo path don't affect the worktree
- MarketClockSettings uses inline `<style>` injection with a `data-*` attribute guard to prevent duplication
- ChartSettings has NO overlay wrapper — it's just the panel div, so dialogProps go directly on `.chart-settings-panel`
- MarketClockSettings has an overlay with `onClick={onClose}` — the panel needs `onClick={e => e.stopPropagation()}` to prevent close on panel click

## Patterns That Work
- `useDialogFocusTrap(true, onClose, { ariaLabel: '...' })` — always pass `true` for isOpen since these components only render when open
- Spread `{...dialogProps}` on the inner panel div, not the overlay
- The hook provides: role='dialog', aria-modal=true, tabIndex=-1, ref, and optional aria-label/aria-labelledby

## Testing Strategy
- Build with `npm run build` — catches import/syntax errors
- Dev server `npm run dev` — verify no runtime errors
- Manual: open each settings panel, press Escape (should close), Tab (should cycle within dialog)

## Recent State
- Both MarketClockSettings and ChartSettings now use useDialogFocusTrap
- PR #160 on agent-3 branch
