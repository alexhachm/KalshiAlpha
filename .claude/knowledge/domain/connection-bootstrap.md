# Domain: connection-bootstrap
<!-- Updated 2026-03-08T23:15:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- **src/App.jsx** — Top-level component. Subscribes to settingsStore, debounces connection changes, calls applyConnectionSettings via useKalshiConnection hook.
- **src/hooks/useKalshiConnection.js** — React hook wrapping dataFeed connection lifecycle. Parses API key blobs (JSON or PEM), normalizes settings, deduplicates via signature ref. Exports: useKalshiConnection, loadSavedConnectionSettings, normalizeConnectionSettings, toInitializeOptions.
- **src/services/dataFeed.js** — Unified data feed adapter. Bridges Kalshi live API and mock data. Manages CONNECTION_STATUS enum (mock/connecting/connected/reconnecting/disconnected), credential validation, idempotent initialize(), and disconnectFeed().
- **src/components/SettingsPanel.jsx** — Settings UI. ConnectionSection shows runtime status label, API key input, paper mode toggle, WS URL, reconnect interval, max retries. Accepts connectionStatus prop from Shell.
- **src/components/Shell.jsx** — Receives connected/connectionStatus props from App, passes connectionStatus to SettingsPanel.

## Gotchas & Undocumented Behavior
- applyConnectionSettings in useKalshiConnection deduplicates using JSON.stringify of normalized settings — reordering object keys won't trigger reconnect.
- dataFeed.initialize() also deduplicates via getInitializeSignature() — double-protection against redundant reconnects.
- parseApiKeyBlob supports both JSON blobs (from secret managers) and raw PEM+keyId concatenation.
- The settingsStore subscription in App.jsx fires on ANY settings change, not just connection — the signature check prevents unnecessary reconnects.

## Patterns That Work
- Debounce + signature comparison for connection settings changes (200ms in App.jsx)
- Idempotent initialize with signature-based dedup at both hook and service layers

## Testing Strategy
- Build check: npm run build (Vite, ~23s)
- Manual: change connection settings in SettingsPanel, verify status label updates

## Recent State
- All bootstrap code is merged and live on main. PR #151 merged the original work.
- No outstanding issues in this domain.
