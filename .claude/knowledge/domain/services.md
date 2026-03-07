# Domain: services
<!-- Updated 2026-03-07T20:26:00Z by worker-2. Max ~800 tokens. -->

## Key Files
- `kalshiApi.js` — REST client with RSA-PSS auth, retry logic (429/5xx), price utilities
- `kalshiWebSocket.js` — WS client with auth, subscriptions, heartbeat, reconnect with jitter
- `dataFeed.js` — Unified data adapter bridging real Kalshi data and mock data
- `omsEngine.js` — Pure state: order FSM, position aggregation, P&L calculation
- `omsService.js` — Bridges OMS engine to API/WS, localStorage persistence
- `alertService.js` — Alert rules CRUD with Web Worker for evaluation, crash recovery
- `analyticsService.js` — Trade data fetching, P&L computation (FIFO), mock fallback
- `settingsStore.js` — localStorage-backed settings with deep merge defaults
- `auditStateService.js` — Function-level audit tracking, change log, export reports

## Gotchas & Undocumented Behavior
- `omsService.js` calls `initialize()` on import — side effect at module load
- `dataFeed.js` registers a WS state listener at module level (line 35-37)
- `kalshiApi.request()` re-signs headers on each retry attempt (timestamp freshness)
- `settingsStore.js` has no semicolons (different code style from other services)
- Build artifacts in dist/ should NOT be committed

## Patterns That Work
- All services use listener Set pattern for subscriptions (add/delete/forEach)
- localStorage persistence with try/catch for quota exceeded
- Mock data fallback when API not configured (dataFeed checks `connected`)
- Export individual named functions, no default exports

## Testing Strategy
- `npm run build` validates all imports/exports compile
- `npm run dev` validates runtime module resolution
- No test runner configured — manual verification only

## Recent State
- Added retry logic to kalshiApi.request() (3 retries, exponential backoff)
- Added jitter to WS reconnect, error backoff to polling, debounced portfolio refresh
- Added position overflow guard, worker crash recovery, section validation
- auditStateService.js is new — exports recordServicesAuditPass() for audit trail
