# Price Ladder (DOM) — Component Spec

## Purpose
The Price Ladder (Depth of Market) shows a vertical ladder of price levels with bid/ask volume at each level. Traders can click directly on price levels to place orders.

## Layout

```
┌────────────────────────────────────────┐
│ [≡] Price Ladder - KXBTC-25FEB28 [⊡][×] │
├────────────────────────────────────────┤
│  Bids    Price    Asks    Orders       │
│          0.58      40                  │
│          0.57     150                  │
│          0.56      85                  │
│          0.55     200                  │
│   ──── SPREAD: 0.02 ────              │
│  120     0.53                          │  ← last traded (highlighted)
│   80     0.52              BUY 100     │  ← working order shown
│   45     0.51                          │
│   30     0.50                          │
│   15     0.49                          │
├────────────────────────────────────────┤
│ Last: 0.53  Size: [__100__]            │
│ Total Bid: 290  Total Ask: 475        │
└────────────────────────────────────────┘
```

## Key Features
- **Click-to-trade:** Click on any bid/ask cell to place a limit order at that price
- **Center on last:** Auto-centers the ladder on the last traded price
- **Volume bars:** Horizontal bars showing relative volume at each level
- **Working orders:** Shows user's working orders inline at their price level
- **Pull-up/pull-down:** Drag to scroll through price levels

## Data Sources
- **Kalshi WebSocket:** `orderbook_delta` for real-time depth updates
- **Price levels:** Generated from orderbook snapshot + deltas

## Props / State
```js
{
  ticker: string,
  levels: [{ price, bidSize, askSize }],
  lastPrice: number,
  centerPrice: number,
  visibleLevels: number,       // from settings
  defaultOrderSize: number,    // from settings
  workingOrders: [{ price, side, size }],
  totalBidVolume: number,
  totalAskVolume: number
}
```

## Right-Click Header Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Visible Levels | number | 20 | Number of price levels shown |
| Center on Trade | boolean | true | Auto-center on last trade |
| Flash Duration | number (ms) | 200 | Flash on price change |
| Color Scheme | select | 'default' | Component color theme |
| Font Size | select | 'medium' | small/medium/large |
| Show Volume Bars | boolean | true | Horizontal volume visualization |
| Show Working Orders | boolean | true | Inline working order display |
| Click Action | select | 'limit' | What clicking a level does (limit order / select price) |
| Default Size | number | 100 | Order size for click-to-trade |

## Events Emitted
- `colorLink.emit('market-change', { ticker })` — when market changes
- `order.emit('placed', { orderId, ticker, side, size, price })`

## Events Consumed
- `colorLink.on('market-change', { ticker })` — switch to received market

## Open Source References
- DOM/Price Ladder patterns from `TRADING_TERMINAL_REFERENCES.md` §4
- Sierra Chart and NinjaTrader DOM layouts
