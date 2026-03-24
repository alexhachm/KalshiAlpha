# Gaps and TODOs Found in Code

## STUBs (Documented in code)
1. **Layout persistence** (Shell.jsx:375-383) — Save/restore window arrangements to localStorage. Named layouts support.
2. **Token-bucket rate limiter** (kalshiApi.js:139-142) — Current code relies on 429 retry only. Need proactive rate limiting.
3. **WS command acknowledgement tracking** (kalshiWebSocket.js:4-7) — Map sent command IDs to pending promises, reject on timeout.
4. **Order deduplication on sync** (omsService.js:4-8) — Persistent fill ID index for cross-session reconciliation.

## Architecture Gaps
1. **No test suite** — No test files, no test runner configured in package.json
2. **No router** — Single-page app with no URL routing
3. **No error boundary** — No React error boundaries for graceful failure
4. **No service worker** — No offline support
5. **Backend not implemented** — All backend services (Supabase, Railway, Redis) described in PROJECT_ARCHITECTURE.md are not yet built
6. **Mock data only** — Scanner, chart, and most data feeds default to mock data without live Kalshi credentials
7. **Electron still in use** — PROJECT_ARCHITECTURE.md says "NOT Electron" but electron/ directory exists with main.js and preload.js

## Feature Gaps (vs. PROJECT_ARCHITECTURE.md Phases)
### Phase 1 (partially done)
- [x] Vite + React SPA scaffolded
- [x] Mock scanner, montage, market race components
- [ ] Wire up Kalshi API (RSA-PSS auth done, but real data usage limited)
- [ ] Replace mock data with real data (partially — dataFeed.js switches on connection)

### Phase 2 (partially done)
- [x] Real-time price ladder (DOM) — implemented
- [x] Scanner with configurable filters — implemented
- [x] Time & Sales feed — implemented
- [x] TradingView Lightweight Charts integration — implemented

### Phase 3 (not started)
- [ ] Move to Next.js
- [ ] Deploy scanner engine on Railway
- [ ] Supabase for auth + user data
- [ ] Redis pub/sub for market data fan-out
- [ ] Vercel deployment

### Phase 4 (not started)
- [ ] User accounts, saved scan configs, watchlists
- [ ] Alert system (partially done — local only)
- [ ] Tauri desktop wrapper
- [ ] Billing

## Code Quality Observations
- Well-structured service layer with clean separation of concerns
- Consistent patterns: localStorage persistence, pub/sub, event emitters
- Good mock ↔ live data abstraction in dataFeed.js
- Hotkey system is production-grade with profiles, DSL, and conflict detection
- Alert system uses Web Worker for non-blocking evaluation
- OMS engine has proper FSM with validated transitions
- Color link bus is a sophisticated feature uncommon in trading terminals
