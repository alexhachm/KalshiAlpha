# Domain: research-platforms
<!-- Updated 2026-03-08 by worker-1. Max ~800 tokens. -->

## Key Files
- `docs/research/req-77dde130/platforms.md` — Pro trading platform research (Trade-Ideas, Sierra Chart, DAS Trader, Lightspeed, Bloomberg, DayTrade Dash)

## Gotchas & Undocumented Behavior
- gh CLI doesn't work from worktree directories — must cd to main repo to create PRs
- mac10 complete-task may fail if request_id mapping is stale — status update via state-lock still works as fallback

## Patterns That Work
- Parallel web searches (one per platform) then targeted follow-ups for depth
- Feature tables with evidence column keep research grounded vs. marketing fluff
- Ranked feature lists with "why it matters for KalshiAlpha" column make research actionable

## Testing Strategy
- Docs-only tasks: npm run build passes + no secrets in diff is sufficient
- No runtime verification needed for markdown research docs

## Recent State
- PR #131 adds the platform research document
- Top-10 features ranked for KalshiAlpha: scanners, hotkeys, layouts, news, risk sizing, loss limits, category nav, P&L, screening, alerts
