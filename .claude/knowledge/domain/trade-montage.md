# Domain: trade-montage
<!-- Updated 2026-03-09T01:15:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- `src/components/trade/Montage.jsx` — Main montage component with Level II book, order entry, confirm dialog, search, flash detection
- `src/components/trade/MontageSettings.jsx` — Settings panel for montage
- `src/components/trade/Montage.css` — Styles

## Gotchas & Undocumented Behavior
- The main repo and worktrees have separate file copies. Edits must be made to the worktree file at `.worktrees/wt-N/src/...`, not the main repo copy
- `gh pr` commands don't work from inside worktree dirs — run from the main repo root
- The confirm dialog stores `onConfirm` callback in state. The useEffect depends on `confirmDialog` object which changes each time, so keyboard listener re-registers properly
- Linter may run on build and revert changes if they're in the main repo copy but the build runs from worktree

## Patterns That Work
- `useRef` + `requestAnimationFrame` for auto-focusing elements that mount conditionally
- Capturing `e.currentTarget` at click time into a ref for later focus restoration (currentTarget is nullified after event)
- Document-level keydown listener in useEffect with cleanup for modal keyboard handling

## Testing Strategy
- `npm run build` — Vite production build (tier2 validation = build-validator only)
- Manual: Click BUY → confirm dialog → test Enter/Escape/mouse

## Recent State
- Keyboard-first confirm dialog added: auto-focus, Enter/Escape, focus restore, ARIA attributes
- PR #174 on agent-3 branch
