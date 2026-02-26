# Domain: shell
<!-- Updated 2026-02-25T22:15:00Z by worker-5. Max ~800 tokens. -->

## Key Files
- `src/index.css` — Design tokens (CSS custom properties), WCAG AA color palette
- `src/components/Window.css` — Window chrome styling, drag handles, title bars
- `src/components/MenuBar.css` — Top menu bar styles
- `src/components/SettingsPanel.jsx/css` — 6-section sidebar settings panel with localStorage
- `src/components/WindowManager.jsx` — Window type registry, layout management, merge/tab/popout
- `src/components/Shell.jsx` — Main shell component, open-window event bus
- `src/components/PopoutWindow.jsx` — Portal-based popout windows
- `src/components/MarketViewer.css` — Market viewer styling using design tokens

## Gotchas & Undocumented Behavior
- During `git rebase`, --ours/--theirs naming is REVERSED: --ours = base branch, --theirs = your commits
- dist/ files frequently cause rebase conflicts — always `git rm -rf dist/`
- scanner files (LiveScanner, HistoricalScanner) are owned by agent-4 domain, not shell
- The LiveScanner commit was auto-skipped during rebase as "previously applied" (cherry-pick detection)

## Patterns That Work
- CSS design tokens use `--` prefix variables in `:root` for consistent theming
- WCAG AA compliance requires specific contrast ratios in token definitions
- WindowManager uses WINDOW_TYPES registry object for component lookup

## Testing Strategy
- `npm run build` is the primary verification — checks all imports resolve
- Verify WINDOW_TYPES in WindowManager.jsx includes all expected component types after merges

## Recent State
- PR #18 successfully rebased and merged into main
- Design tokens, SettingsPanel, WindowManager cleanup, PopoutWindow all in main
- Branch agent-5-clean is now behind main (main includes integration merge)
