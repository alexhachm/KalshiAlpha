# Domain: frontend/tokens
<!-- Updated 2026-03-07T11:00:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/index.css` — All design tokens (:root CSS custom properties) and global utility classes

## Gotchas & Undocumented Behavior
- Derived tokens (--flash-win-bg, --shadow-glow-win, connection-dot box-shadows) use hardcoded rgba() values that must be manually updated when accent colors change
- The branch may have ongoing rebase state from other agents — always check `git status` before committing
- `gh` CLI doesn't work from worktree directories — must `cd` to main repo root first
- `dist/` directory should NOT be committed — it's build output

## Patterns That Work
- Edit tokens in :root block, then update all derived values (flash, glow, connection indicators) to match
- Run `npm run build` as self-verify before spawning validation subagents
- Use `git add <specific-file>` not `git add -A` to avoid committing state files

## Testing Strategy
- `npm run build` — primary validation (Vite build)
- `npm run dev` — runtime smoke test (check for module/syntax errors in output)
- Visual verification of color palette across panels (manual)

## Recent State
- All design tokens updated to new palette: GitHub-dark backgrounds, amber/gold accents, steel-blue buy, wider text contrast
- Global utility classes added: .data-table, .section-header, .row-flash, .status-dot, .btn variants, form controls
- Spacing tightened ~20%, chrome heights reduced (titlebar 20px, menu bar 24px)
