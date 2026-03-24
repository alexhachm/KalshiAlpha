# Trading Features

## Order Management System (OMS)
Architecture: `omsEngine.js` (pure state machine) ← `omsService.js` (API bridge) ← `dataFeed.js` (unified interface)

### OMS Engine (omsEngine.js)
- **FSM States**: PENDING → SUBMITTED → OPEN → PARTIAL → FILLED/CANCELLED/REJECTED
- **Position Tracking**: Per ticker:side, tracks contracts, avgCost, realized P&L
- **Fill Processing**: Deduplication by fillId, VWAP fill price calculation
- **P&L**: Unrealized = (currentPrice - avgCost) × contracts; NO side inverted
- **Export/Import**: Full state serialization for localStorage persistence

### OMS Service (omsService.js)
- Bridges engine to Kalshi API and WebSocket
- Auto-starts/stops WS listeners on connection state changes
- Syncs with exchange on reconnect (orders, positions, fills)
- Emits UI events: order:created, order:filled, fill, position:updated, etc.
- Persistence: Auto-saves to localStorage on every state change

### Montage (trade/Montage.jsx)
- Order entry panel with ticker search (combobox)
- Side selection (YES/NO), action (BUY/SELL)
- Order type: LIMIT (with price input) or MARKET
- Quantity from settings or templates
- Confirmation dialog (configurable)
- Color link bus integration

### Price Ladder (trade/PriceLadder.jsx)
- DOM-style display with bid/ask levels
- Click-to-trade on price levels
- Real-time orderbook data via dataFeed subscription

### Positions (trade/Positions.jsx)
- Shows open positions with P&L
- Double-click to open Montage with ticker context

### Order Book (trade/OrderBook.jsx)
- Full depth display (all bid/ask levels)
- Color link bus integration

### Trade Log (trade/TradeLog.jsx)
- Fill history display
- Color link bus integration

## Data Feed Layer (dataFeed.js)
- Unified interface: mock data ↔ live Kalshi data
- `withReconnect()` wrapper: auto-transitions subscriptions on connect/disconnect
- Orderbook state machine: snapshot + delta processing → synthetic DOM
- Scanner signal engine: price move detection, volume analysis, strategy labeling
- Conviction scoring: score 1-5 based on move magnitude, volume, spread tightness
- Strategy types: Momentum Breakout, Bid-Lift Continuation, Upside Drift, Wide-Spread Chop, etc.

## Kalshi API Client (kalshiApi.js)
- RSA-PSS signing via Web Crypto API
- Demo + Production environments
- Retry with exponential backoff (429, 5xx)
- Endpoints: markets, events, series, orderbook, candlesticks, trades, balance, positions, fills, orders
- Order operations: create, cancel, amend, decrease
- Price utilities: centi-cents, cents ↔ dollars, YES/NO inversion

## Kalshi WebSocket (kalshiWebSocket.js)
- Channels: orderbook_delta, ticker, trade, market_lifecycle_v2, user_orders, user_fills, market_positions
- Auth via post-connect command (browser WS can't set custom headers)
- Auto-reconnect: 5 attempts with exponential backoff + jitter
- Heartbeat: 30s interval
- Per-ticker subscriber filtering
- Message envelope normalization

## Alert System
### Alert Service (alertService.js)
- Rule types: price_crosses, pct_change, volume_spike
- Web Worker for evaluation (alertEngine.worker.js)
- TTL-based expiration with thesis/invalidation fields
- Desktop notifications + sound alerts (configurable)
- History: capped at 200 entries with staleness detection

### Alert Trigger UI (scanners/AlertTrigger.jsx)
- CRUD for alert rules
- History display with stale/fresh indicators
