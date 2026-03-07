# Domain: services/state
<!-- Updated 2026-03-07T20:25:00Z by worker-6. Max ~800 tokens. -->

## Key Files
- `src/services/changeTrackingService.js` — Change log CRUD, filtering (domain/status/date), subscriber pattern, localStorage key `kalshi-changes`
- `src/services/auditStateService.js` — Function audit tracking with 4-dimension ratings, progress aggregation, improvement linking, localStorage key `kalshi-audit-state`

## Gotchas & Undocumented Behavior
- Worktree git setup: `gh pr create` fails from worktree dir — must `cd` to main repo dir and use `--head branch`
- Build produces 525KB+ chunk warning but passes fine
- `crypto.randomUUID()` may not exist in all envs — fallback counter used

## Patterns That Work
- Follow settingsStore.js/alertService.js patterns: plain JS modules, `Set()` for listeners, named exports, lazy-load from localStorage
- localStorage keys use `kalshi-` prefix (some use underscore `kalshi_`, newer use hyphen `kalshi-`)
- Singleton via module-level state, `load()` called on import

## Testing Strategy
- `npm run build` must pass
- `npm run dev` must start without errors
- Services are importable by both UI components and research loop

## Recent State
- Both services created fresh, not yet consumed by any UI components
- APIs match task spec: addChange, getChanges, getChangeById, updateChangeStatus, subscribeToChanges, registerFunction, rateFunction, getAuditProgress, getFunctionsByRating, getUnreviewedFunctions, markImproved
