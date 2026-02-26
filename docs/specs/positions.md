# Positions (Open Only) — Component Spec

## Purpose
Displays only currently open positions. Provides at-a-glance view of active exposure.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [≡] Positions                                                    [⊡][×] │
├───────────────────┬──────────┬────────┬──────────┬──────────┬──────────┤
│ Market            │ Account  │ Shares │ Avg Cost │ Realized │ Unrealized│ Type │
├───────────────────┼──────────┼────────┼──────────┼──────────┼──────────┤
│ KXBTC-25FEB28     │ 12345678 │   200  │  $0.52   │   $0     │  +$6.00  │ Long │  ← green
│ KXETH-25MAR15     │ 12345678 │   150  │  $0.71   │   $0     │  -$3.50  │ Short│  ← red
│ KXSPY-25FEB28     │ 12345678 │    50  │  $0.45   │   $0     │  +$2.50  │ Long │  ← green
└───────────────────┴──────────┴────────┴──────────┴──────────┴──────────┘
```

## Columns
| Column | Description |
|--------|-------------|
| Market | Market name/ticker. **Green text** for Long, **Red text** for Short |
| Account | Account number |
| Shares | Number of contracts held |
| Avg Cost | Average entry price |
| Realized | Realized P&L (always $0 for open positions) |
| Unrealized | Mark-to-market unrealized P&L |
| Type | "Long" or "Short" — also indicated by market name color |

## Color Coding
- **Market name:** Green font = Long position, Red font = Short position
- **Unrealized column:** Green for positive P&L, Red for negative P&L
- **Type badge:** Green background for Long, Red background for Short

## Data Sources
- **Kalshi REST:** `GET /trade-api/v2/portfolio/positions` filtered to `settlement_status: open`
- **Kalshi WebSocket:** Real-time price updates for unrealized P&L calculation

## Interactions
- **Click on row:** Selects market and broadcasts via color link
- **Double-click:** Opens Montage for that market
- **Right-click row:** Close position, flatten, reverse

## Right-Click Header Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Sort By | select | 'unrealized' | Sort column |
| Sort Direction | select | 'desc' | Ascending or descending |
| Column Visibility | multi-select | all shown | Show/hide columns |
| Auto-Refresh | number (s) | 2 | Refresh interval |
| Font Size | select | 'medium' | small/medium/large |
| Flash on Change | boolean | true | Flash row when P&L changes |

## Events Emitted
- `colorLink.emit('market-change', { ticker })` — when clicking a position row

## Events Consumed
- `position.on('opened')` / `position.on('closed')` — add/remove rows
- `price.on('update', { ticker, price })` — recalculate unrealized P&L
