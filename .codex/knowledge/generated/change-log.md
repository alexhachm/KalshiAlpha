
## [18] Remove dead useKalshiConnection export from useKalshiData — 2026-03-23
- Domain: trading-ui
- Files: src/hooks/useKalshiData.js
- What changed: Deleted 25-line duplicate `useKalshiConnection` export (JSDoc + function). Canonical version in useKalshiConnection.js is untouched.
- PR: https://github.com/alexhachm/KalshiAlpha/pull/217

## [6] FIX: Add research CLI case blocks — 2026-03-23
- Domain: coordinator
- Files: coordinator/bin/mac10 (in setup-agents-codex10 repo)
- What changed: Verified all 8 research CLI case blocks already present from auto-save commit. PR #311 already open.
- PR: https://github.com/alexhachm/setup-agents-codex10/pull/311
