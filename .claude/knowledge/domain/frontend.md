# Domain: frontend
<!-- Updated 2026-03-06T23:55:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- src/index.css — All design tokens (:root vars). Core palette, typography, spacing, radii, shadows, glows.
- src/components/scanners/LiveScanner.jsx + .css — Real-time scanner grid. Dense table with conviction bars, ticker links, new-row flash animation, live-dot indicator.
- src/components/scanners/HistoricalScanner.jsx + .css — Historical scanner. Date filters, pattern select, confidence bars, CSV export.
- src/components/scanners/AlertTrigger.jsx + .css — Alert config UI. Panels with rules table + history, add-form, settings overlay. Now uses state indicator classes.
- src/components/scanners/MarketClock.jsx + .css — Compact clock widget. Status indicators (open/closed), settings panel.
- src/components/scanners/MarketClockSettings.jsx — Clock settings companion. WARNING: uses inline style injection + hardcoded px values.
- src/services/dataFeed.js — Unified data adapter (real/mock). Central hub for all data subscriptions.
- src/services/alertService.js + alertEngine.worker.js — Alert system with Web Worker evaluation.
- src/hooks/useGridCustomization.js — Shared grid customization hook (columns, drag, conditional formatting).
- src/hooks/useKalshiData.js — 8 React hooks wrapping dataFeed subscriptions.

## Gotchas & Undocumented Behavior
- LiveScanner imports from mockData directly, NOT via dataFeed — will never use real data.
- MarketClockSettings uses document.createElement('style') pattern with hardcoded px — needs tokenization.
- omsService calls initialize() at module level — eager load even when unused.
- glow-pulse keyframe is defined globally in index.css — don't redefine in component CSS.
- color-mix() works in all modern browsers but not older — acceptable for this app.

## Patterns That Work
- Table: sticky thead with var(--bg-secondary), var(--spacing-xs) var(--spacing-sm) padding, :nth-child(even) with var(--bg-row-alt).
- Button: var(--bg-tertiary), var(--border-subtle), var(--radius-sm), hover var(--bg-hover), active var(--bg-active), focus-visible outline.
- Flash: color-mix(in srgb, var(--accent-*) N%, transparent) for state backgrounds.
- font-variant-numeric: tabular-nums on all numeric-heavy components.
- State indicators: at-row--pending/expired/triggered with left-border coloring.

## Testing Strategy
- npm run build is primary validation (Vite build). Visual inspection needed for design token changes.

## Recent State
- All scanner CSS now uses font-variant-numeric: tabular-nums.
- LiveScanner has working new-row flash animation and live-dot streaming indicator.
- AlertTrigger rules/history rows now use state indicator CSS classes (pending/expired/triggered).
- MarketClock renders market open/closed status with glow-dot animation.
- All interactive buttons have hover/active/focus-visible states.
- MarketClockSettings still has hardcoded inline styles (not in scope for task 28).
