# Accounts — Component Spec

## Purpose
Displays an overview of the user's trading account(s) with key financial metrics.

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [≡] Accounts                                              [⊡][×] │
├──────────┬────────┬──────────┬────────────┬───────────┬─────────┤
│ Account# │ Type   │ Realized │ Unrealized │ InitEquity│ Tickets │ Shares │
├──────────┼────────┼──────────┼────────────┼───────────┼─────────┤
│ 12345678 │ Paper  │  +$245   │   -$32     │  $10,000  │    15   │  1,200 │
│ 87654321 │ Live   │  +$1,020 │   +$88     │  $50,000  │    42   │  5,800 │
└──────────┴────────┴──────────┴────────────┴───────────┴─────────┘
```

## Columns
| Column | Source | Description |
|--------|--------|-------------|
| Account # | Kalshi REST `GET /trade-api/v2/portfolio/balance` | Account identifier |
| Type | Config | Paper or Live |
| Realized | Calculated from closed positions | Total realized P&L |
| Unrealized | Calculated from open positions × current price | Total unrealized P&L |
| Init Equity | Kalshi REST | Starting account balance |
| Tickets | Count of all orders | Total orders placed |
| Shares | Sum of all position sizes | Total shares traded |

## Color Coding
- Realized/Unrealized: **green** for positive, **red** for negative
- Type badge: **yellow** for Paper, **blue** for Live

## Data Sources
- **Kalshi REST:** `GET /trade-api/v2/portfolio/balance` for account balance
- **Kalshi REST:** `GET /trade-api/v2/portfolio/positions` for position data
- **Kalshi REST:** `GET /trade-api/v2/portfolio/fills` for trade history

## Right-Click Header Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Show/Hide Columns | multi-select | all shown | Toggle column visibility |
| Decimal Precision | number | 2 | Decimal places for dollar values |
| Refresh Interval | number (s) | 5 | How often to refresh data |
| Font Size | select | 'medium' | small/medium/large |

## Events
- No color link events (account view is not market-specific)
- Listens to `order.on('filled')` and `position.on('closed')` to update metrics
