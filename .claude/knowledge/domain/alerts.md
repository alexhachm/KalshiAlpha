# Domain: alerts
<!-- Updated 2026-03-08T23:50:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `src/components/scanners/AlertTrigger.jsx` — React component for alert rule management UI (add/toggle/delete rules, view history)
- `src/components/scanners/AlertTrigger.css` — Styles for the alert trigger component
- `src/services/alertService.js` — Alert service orchestration layer (rules CRUD, localStorage persistence, Web Worker bridge)
- `src/services/alertEngine.worker.js` — Web Worker that evaluates alert rules against tick data

## Gotchas & Undocumented Behavior
- The alert service uses a Web Worker (`alertEngine.worker.js`) for evaluation — changes to rule param contracts must be synchronized between AlertTrigger.jsx (UI), alertService.js (validation), and the worker (evaluation)
- Worker auto-recovers on error with a 2s delay and force-resubscribes tickers
- `_rules` and `_history` are lazy-loaded singletons — null until first access
- localStorage keys: `kalshi_alert_rules`, `kalshi_alert_history`
- `pct_change` params were renamed: `threshold→pctThreshold`, `window→lookback` — the formatParams function has backward compat (`params.pctThreshold ?? params.threshold`)
- `price_crosses` now has a `direction` param (above/below/either)

## Patterns That Work
- Cherry-pick diverged commits rather than rebasing when branch has merged main commits that remote doesn't
- `RULE_PARAM_DEFAULTS` object for centralized defaults, `getRuleInputDefaults()` for form state initialization
- `validateRuleParams()` with structured error array for clear validation messages
- `parseNumberOrDefault(value, fallback)` pattern for robust numeric input handling

## Testing Strategy
- `npm run build` is the primary verification (Vite build, catches import/syntax errors)
- Manual verification: create rules of each type, verify params render correctly
- Check that validation rejects invalid params with clear error messages

## Recent State
- Alert rule param contracts fully integrated (PR #156)
- Direction dropdown added for price_crosses rules
- Renamed pct_change params with backward compatibility in formatParams
- Build passes cleanly
