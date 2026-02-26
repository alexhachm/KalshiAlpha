# Montage (Order Entry) — Component Spec

## Purpose
The Montage is the primary order entry window where traders place orders on Kalshi markets. It displays Level II market data (bid/ask with depth) and provides quick order placement controls.

## Layout

```
┌─────────────────────────────────────────┐
│ [≡] Montage - KXBTC-25FEB28       [⊡][×] │  ← header (right-click for settings)
├─────────────────────────────────────────┤
│ Market: [____________🔍]                 │  ← market search/selector
├──────────────────┬──────────────────────┤
│   BID            │         ASK          │
│ Size   Price     │  Price     Size      │
│  120    0.52     │   0.53      85       │
│   80    0.51     │   0.54     200       │
│   45    0.50     │   0.55     150       │
│   30    0.49     │   0.56      60       │
│   15    0.48     │   0.57      40       │
├──────────────────┴──────────────────────┤
│ Last: 0.53  Chg: +0.02  Vol: 12,450    │
├─────────────────────────────────────────┤
│ Shares: [___100___]  Type: [Limit ▾]    │
│ Price:  [___0.53__]  TIF:  [GTC   ▾]   │
│                                          │
│  [ BUY YES ]        [ BUY NO ]          │
│                                          │
│ Working Orders:                          │
│ BUY 100 YES @ 0.52  [Cancel]            │
└─────────────────────────────────────────┘
```

## Data Sources
- **Kalshi WebSocket:** `orderbook_delta` channel for real-time bid/ask updates
- **Kalshi REST:** `POST /trade-api/v2/portfolio/orders` for order placement
- **Mock data:** `subscribeToTicker()` from `src/services/mockData.js` for development

## Order Types
- **Market:** Execute at best available price
- **Limit:** Execute at specified price or better

## Order Sides
- **Buy Yes:** Long position (profit if event occurs)
- **Buy No:** Short position (profit if event does not occur)

## Props / State
```js
{
  ticker: string,           // Current market ticker
  orderSize: number,        // Default from settings
  orderType: 'market' | 'limit',
  limitPrice: number | null,
  timeInForce: 'gtc' | 'ioc',
  bidLevels: [{ price, size }],
  askLevels: [{ price, size }],
  lastPrice: number,
  change: number,
  volume: number,
  workingOrders: [{ id, side, size, price, status }]
}
```

## Right-Click Header Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Default Order Size | number | 100 | Pre-filled share quantity |
| Confirm Before Send | boolean | true | Show confirmation dialog before order |
| Sound Alerts | boolean | true | Play sound on fill |
| Depth Levels | number | 5 | Number of bid/ask levels to display |
| Flash Duration | number (ms) | 300 | Duration of price change flash |
| Color Scheme | select | 'default' | Component color theme |
| Font Size | select | 'medium' | Text size (small/medium/large) |
| Show Working Orders | boolean | true | Display working orders section |

## Events Emitted
- `colorLink.emit('market-change', { ticker })` — when market is changed in selector
- `order.emit('placed', { orderId, ticker, side, size, price })` — when order is placed
- `order.emit('cancelled', { orderId })` — when order is cancelled

## Events Consumed
- `colorLink.on('market-change', { ticker })` — switch to received market

## Open Source References
- Level II display patterns from `TRADING_TERMINAL_REFERENCES.md` §4, §5
- Order management patterns from §5 (OMS references)
