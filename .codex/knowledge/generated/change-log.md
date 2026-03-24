
## [19] Fix WebSocket auth failure silently ignored in handleOpen() — 2026-03-24
- Domain: trading-ui
- Files: src/services/kalshiWebSocket.js
- What changed: Moved setState(CONNECTED)/startHeartbeat/resubscribeAll inside try block; catch block now calls scheduleReconnect() and returns instead of falling through to connected state on auth error.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/218

## [6] FIX: Add research CLI case blocks — 2026-03-23
- Domain: coordinator
- Files: coordinator/bin/mac10 (in setup-agents-codex10 repo)
- What changed: Verified all 8 research CLI case blocks already present from auto-save commit. PR #311 already open.
- PR: https://github.com/alexhachm/setup-agents-codex10/pull/311
