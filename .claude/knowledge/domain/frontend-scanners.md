# Domain: frontend/scanners
<!-- Updated 2026-03-07T11:15:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/components/scanners/LiveScanner.jsx/css` — Real-time alert scanner with subscription-based data, conviction bars, flash animation
- `src/components/scanners/HistoricalScanner.jsx/css` — Date-range scan with confidence bars, CSV export
- `src/components/scanners/AlertTrigger.jsx/css` — Rule-based alerts with add/toggle/delete, flash on trigger
- `src/components/scanners/MarketClock.jsx/css` — Clock with market status, rAF for ms mode
- `src/components/SettingsPanel.jsx/css` — App settings with tabbed sidebar, sections for connection/appearance/trading/linking/notifications
- `src/components/GridSettingsPanel.jsx/css` — Reusable sub-panel for column visibility, row height, conditional formatting
- `src/components/HotkeyManager.jsx/css` — Two-column: bindings list + script editor, profile management
- `src/components/MarketViewer.jsx/css` — Ticker selector + search + streaming quotes + depth table

## Gotchas & Undocumented Behavior
- `gh pr create` fails from worktree directories — must `cd` to main repo dir first
- LiveScanner flash uses `newRowIds` Set with 800ms timer — clearing adds to next Set, don't re-trigger
- AlertTrigger uses `alertService` singleton — `initialize()` on mount, `destroy()` on unmount
- MarketClock uses rAF when showMilliseconds=true, setInterval otherwise
- The `Read` tool in worktrees requires explicit re-read before each Write/Edit even if previously read

## Patterns That Work
- All scanner tables: 22px row height, 10px uppercase headers, `font-variant-numeric: tabular-nums`
- Pill badges: `border-radius: 9px`, `padding: 0 var(--spacing-sm)`, `line-height: 16px`, background with `color-mix(in srgb, COLOR 18%, transparent)`
- Flash animations: use `--accent-highlight` at 25% opacity fading to transparent
- All inputs: `border-radius: 2px`, `background: var(--bg-input)`, focus: `border-color: var(--border-focus)`
- Section headers: 10px uppercase, `letter-spacing: 0.06em`, `color: var(--accent-highlight)`

## Testing Strategy
- `npm run build` must pass (vite build)
- Visual check: row heights, pill badges, flash animations, input focus states
- Cross-component: settings panel inputs should match scanner inputs in styling

## Recent State
- All 8 CSS files + 1 JSX file updated with Bloomberg-style compact UI
- PR #82 created from agent-1 branch
