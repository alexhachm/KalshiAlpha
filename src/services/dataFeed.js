// Data Feed Adapter
// Bridges Kalshi real data and mock data behind a unified interface.
// Components import from here instead of mockData directly.
// Falls back to mock data when Kalshi API is not configured/connected.

import * as kalshiApi from './kalshiApi';
import * as kalshiWs from './kalshiWebSocket';
import * as mockData from './mockData';

// --- Connection state ---

let connected = false;
const connectionListeners = new Set();

function isConnected() {
  return connected;
}

function onConnectionChange(callback) {
  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}

function setConnected(val) {
  const old = connected;
  connected = val;
  if (old !== val) {
    connectionListeners.forEach((cb) => {
      try { cb(val); } catch { /* ignore */ }
    });
  }
}

// Listen to WS state changes
kalshiWs.onStateChange((newState) => {
  setConnected(newState === kalshiWs.STATE.CONNECTED);
});

// --- Initialize / connect ---

/**
 * Initialize the data feed with Kalshi credentials.
 * If credentials are not provided, stays in mock mode.
 */
async function initialize(opts = {}) {
  if (opts.apiKeyId && opts.privateKeyPem) {
    try {
      await kalshiApi.configure({
        environment: opts.environment || 'demo',
        apiKeyId: opts.apiKeyId,
        privateKeyPem: opts.privateKeyPem,
      });
      await kalshiWs.connect();
    } catch (err) {
      console.error('[DataFeed] Failed to connect to Kalshi:', err);
      // Fall back to mock data silently
    }
  }
}

function disconnectFeed() {
  kalshiWs.disconnect();
  setConnected(false);
}

// --- Orderbook State Machine ---
// Per the spec: maintain YES_book and NO_book hash maps per ticker.
// On snapshot: populate from scratch.
// On delta: update price level, delete if quantity == 0.
// Merge into synthetic DOM for UI.

const orderbookState = {}; // ticker -> { yes: Map<price, qty>, no: Map<price, qty>, listeners: Set }

function getOrderbookStore(ticker) {
  if (!orderbookState[ticker]) {
    orderbookState[ticker] = {
      yes: new Map(),  // price (cents) -> quantity
      no: new Map(),   // price (cents) -> quantity
      listeners: new Set(),
    };
  }
  return orderbookState[ticker];
}

function processOrderbookSnapshot(ticker, msg) {
  const store = getOrderbookStore(ticker);
  store.yes.clear();
  store.no.clear();

  if (msg.yes) {
    msg.yes.forEach(([price, qty]) => {
      if (qty > 0) store.yes.set(price, qty);
    });
  }
  if (msg.no) {
    msg.no.forEach(([price, qty]) => {
      if (qty > 0) store.no.set(price, qty);
    });
  }

  notifyOrderbookListeners(ticker);
}

function processOrderbookDelta(ticker, msg) {
  const store = getOrderbookStore(ticker);

  const side = msg.side === 'yes' ? store.yes : store.no;
  const price = msg.price;
  const qty = msg.quantity || msg.delta;

  if (qty === 0) {
    side.delete(price);
  } else {
    side.set(price, qty);
  }

  notifyOrderbookListeners(ticker);
}

/**
 * Merge YES and NO books into a synthetic DOM.
 * YES bids appear directly. NO bids at price P become YES asks at (100-P).
 */
function buildSyntheticDom(ticker) {
  const store = getOrderbookStore(ticker);
  if (!store) return { bids: [], asks: [] };

  const bids = []; // YES side: resting YES bids
  const asks = []; // YES side: derived from resting NO bids

  // YES bids are direct
  store.yes.forEach((qty, price) => {
    bids.push({ price, size: qty });
  });

  // NO bids at P → YES asks at (100 - P)
  store.no.forEach((qty, price) => {
    asks.push({ price: 100 - price, size: qty });
  });

  // Sort: bids descending, asks ascending
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  return { bids, asks };
}

function notifyOrderbookListeners(ticker) {
  const store = orderbookState[ticker];
  if (!store) return;

  const dom = buildSyntheticDom(ticker);
  store.listeners.forEach((cb) => {
    try { cb(dom); } catch { /* ignore */ }
  });
}

// --- Unified Subscription API ---
// Same function signatures as mockData.js so components can switch seamlessly.

/**
 * Subscribe to ticker data (Level II equivalent).
 * When connected to Kalshi: real orderbook data.
 * When disconnected: mock data stream.
 *
 * @param {string} ticker
 * @param {Function} callback - receives { ticker, timestamp, yes: { price, bids }, no: { price, bids }, lastTrade }
 * @returns {Function} unsubscribe
 */
function subscribeToTicker(ticker, callback) {
  if (!connected) {
    return mockData.subscribeToTicker(ticker, callback);
  }

  // Real mode: subscribe to WS orderbook + ticker channels
  const store = getOrderbookStore(ticker);
  let lastTickerData = null;

  // Combine orderbook DOM with ticker price data for the full picture
  const wrappedCallback = () => {
    const dom = buildSyntheticDom(ticker);
    const bestBid = dom.bids[0];
    const bestAsk = dom.asks[0];

    const yesPrice = bestBid ? bestBid.price : 50;
    const noPrice = bestAsk ? 100 - bestAsk.price : 50;

    callback({
      ticker,
      timestamp: Date.now(),
      yes: {
        price: yesPrice,
        bids: dom.bids.slice(0, 5).map((b) => ({
          price: b.price,
          size: b.size,
          orders: 1,
        })),
      },
      no: {
        price: noPrice,
        bids: dom.asks.slice(0, 5).map((a) => ({
          price: 100 - a.price,
          size: a.size,
          orders: 1,
        })),
      },
      lastTrade: lastTickerData || {
        price: yesPrice,
        side: 'YES',
        size: 0,
      },
    });
  };

  store.listeners.add(wrappedCallback);

  // Handle orderbook messages
  const unsubOb = kalshiWs.subscribeOrderbook(ticker, (msg) => {
    if (msg.type === 'orderbook_snapshot') {
      processOrderbookSnapshot(ticker, msg);
    } else if (msg.type === 'orderbook_delta') {
      processOrderbookDelta(ticker, msg);
    }
  });

  // Handle ticker price updates
  const unsubTicker = kalshiWs.subscribeTicker(ticker, (msg) => {
    if (msg.market_ticker === ticker || msg.ticker === ticker) {
      lastTickerData = {
        price: msg.yes_bid || msg.last_price || 50,
        side: msg.last_trade_side || 'YES',
        size: parseFloat(msg.last_trade_size_fp || '0'),
      };
    }
  });

  return () => {
    store.listeners.delete(wrappedCallback);
    unsubOb();
    unsubTicker();
    // Clean up empty stores
    if (store.listeners.size === 0) {
      delete orderbookState[ticker];
    }
  };
}

/**
 * Subscribe to market race data (top movers).
 * When connected: builds from ticker channel across all subscribed markets.
 * When disconnected: mock data.
 */
function subscribeToMarketRace(callback) {
  if (!connected) {
    return mockData.subscribeToMarketRace(callback);
  }

  // For real data: we poll the markets endpoint periodically
  // and compute deltas from cached prices
  const marketCache = {};
  let running = true;

  async function pollMarkets() {
    if (!running) return;
    try {
      const res = await kalshiApi.getMarkets({ limit: 100, status: 'open' });
      if (res && res.markets) {
        const racers = res.markets
          .filter((m) => m.volume > 0)
          .map((m) => {
            const prev = marketCache[m.ticker];
            const currentPrice = m.last_price || m.yes_bid || 50;
            const delta = prev
              ? ((currentPrice - prev) / prev) * 100
              : 0;
            marketCache[m.ticker] = currentPrice;
            return {
              ticker: m.ticker,
              delta,
              volatility: Math.abs(delta),
            };
          })
          .sort((a, b) => b.delta - a.delta)
          .slice(0, 20);

        callback(racers);
      }
    } catch (err) {
      console.error('[DataFeed] Market race poll error:', err);
    }

    if (running) {
      setTimeout(pollMarkets, 5000);
    }
  }

  pollMarkets();

  return () => {
    running = false;
  };
}

/**
 * Subscribe to scanner alerts.
 * When connected: uses market lifecycle + ticker channels.
 * When disconnected: mock scanner data.
 */
function subscribeToScanner(callback) {
  if (!connected) {
    return mockData.subscribeToScanner(callback);
  }

  // Real scanner: subscribe to lifecycle events for new market alerts
  // and ticker channel for volume/price spikes
  const unsub = kalshiWs.subscribeLifecycle((msg) => {
    if (msg.event_type === 'activated' || msg.event_type === 'created') {
      callback({
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        ticker: msg.market_ticker || msg.ticker || 'UNKNOWN',
        strategy: 'New Market',
        type: 'neutral',
        conviction: 2,
        description: `${msg.event_type}: ${msg.market_ticker || msg.ticker}`,
      });
    }
  });

  return unsub;
}

/**
 * Generate historical OHLCV candle data.
 * When connected: returns empty array (use subscribeToOHLCV for real data).
 * When disconnected: delegates to mock data.
 */
function generateOHLCV(ticker, count = 200, timeframeMinutes = 5) {
  return mockData.generateOHLCV(ticker, count, timeframeMinutes);
}

/**
 * Subscribe to OHLCV candle data for charting.
 * When connected: fetches candles from REST, updates from WS trades.
 * When disconnected: uses mock data if available.
 */
function subscribeToOHLCV(ticker, timeframe, callback) {
  // Check if mockData has this function
  if (!connected && typeof mockData.subscribeToOHLCV === 'function') {
    return mockData.subscribeToOHLCV(ticker, timeframe, callback);
  }

  if (!connected) {
    // No mock OHLCV — return empty unsubscribe
    return () => {};
  }

  // Real mode: fetch historical candles, then build current candle from trades
  let running = true;
  let currentCandle = null;

  const timeframeToInterval = {
    '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '1D': 1440,
  };

  async function loadCandles() {
    try {
      const interval = timeframeToInterval[timeframe] || 60;
      const res = await kalshiApi.getMarketCandlesticks({
        tickers: ticker,
        period_interval: interval,
      });
      if (res && res.candles && running) {
        const candles = res.candles.map((c) => ({
          time: c.end_period_ts || c.ts,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || 0,
        }));
        callback({ type: 'history', candles });
      }
    } catch (err) {
      console.error('[DataFeed] Candle load error:', err);
    }
  }

  // Update current candle from trade stream
  const unsubTrade = kalshiWs.subscribeTrades(ticker, (msg) => {
    if (!running) return;
    const price = msg.yes_price || msg.price;
    if (!price) return;

    if (!currentCandle) {
      currentCandle = {
        time: Math.floor(Date.now() / 1000),
        open: price,
        high: price,
        low: price,
        close: price,
        volume: parseFloat(msg.count_fp || msg.count || '1'),
      };
    } else {
      currentCandle.high = Math.max(currentCandle.high, price);
      currentCandle.low = Math.min(currentCandle.low, price);
      currentCandle.close = price;
      currentCandle.volume += parseFloat(msg.count_fp || msg.count || '1');
    }

    callback({ type: 'update', candle: { ...currentCandle } });
  });

  loadCandles();

  return () => {
    running = false;
    unsubTrade();
  };
}

/**
 * Get historical scan results.
 * When connected: fetches from Kalshi REST.
 * When disconnected: uses mock data.
 */
async function getHistoricalScanResults(params = {}) {
  if (!connected && typeof mockData.getHistoricalScanResults === 'function') {
    return mockData.getHistoricalScanResults(params);
  }

  if (!connected) {
    return [];
  }

  try {
    const markets = await kalshiApi.getMarkets({
      limit: 100,
      status: 'settled',
      ...params,
    });
    return (markets.markets || []).map((m) => ({
      date: m.close_time || m.settled_time || '',
      ticker: m.ticker,
      pattern: 'Historical',
      signal: m.result === 'yes' ? 'bullish' : 'bearish',
      roi: m.last_price ? ((m.result === 'yes' ? 100 : 0) - m.last_price) : 0,
      confidence: 3,
    }));
  } catch (err) {
    console.error('[DataFeed] Historical scan error:', err);
    return [];
  }
}

// --- Portfolio data (new, only available with real connection) ---

async function getPortfolioBalance() {
  if (!connected) return null;
  try {
    const res = await kalshiApi.getBalance();
    return {
      balance: kalshiApi.centsToDollars(res.balance),
      portfolioValue: kalshiApi.centsToDollars(res.portfolio_value),
    };
  } catch (err) {
    console.error('[DataFeed] Balance fetch error:', err);
    return null;
  }
}

async function getOpenPositions() {
  if (!connected) return [];
  try {
    const res = await kalshiApi.getPositions();
    return res.market_positions || [];
  } catch (err) {
    console.error('[DataFeed] Positions fetch error:', err);
    return [];
  }
}

async function getFillHistory() {
  if (!connected) return [];
  try {
    const res = await kalshiApi.getFills();
    return res.fills || [];
  } catch (err) {
    console.error('[DataFeed] Fills fetch error:', err);
    return [];
  }
}

async function getOpenOrders() {
  if (!connected) return [];
  try {
    const res = await kalshiApi.getOrders();
    return res.orders || [];
  } catch (err) {
    console.error('[DataFeed] Orders fetch error:', err);
    return [];
  }
}

// --- Order execution ---

async function placeOrder(order) {
  if (!connected) {
    throw new Error('Not connected to Kalshi API');
  }
  return kalshiApi.createOrder(order);
}

async function cancelExistingOrder(orderId) {
  if (!connected) {
    throw new Error('Not connected to Kalshi API');
  }
  return kalshiApi.cancelOrder(orderId);
}

// --- Mock market selection ---

function setActiveMockMarket(ticker) {
  mockData.setActiveMockMarket(ticker);
}

function getAvailableMockMarkets() {
  return mockData.getAvailableMockMarkets();
}

function getActiveMockMarket() {
  return mockData.getActiveMockMarket();
}

// --- Market search ---

async function searchMarkets(query = '', params = {}) {
  if (!connected) {
    // In mock mode, search mock markets
    const mockMarkets = mockData.getAvailableMockMarkets();
    if (!query) return mockMarkets;
    const q = query.toLowerCase();
    return mockMarkets.filter((m) =>
      m.ticker.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q))
    );
  }
  try {
    const res = await kalshiApi.getMarkets({
      ...params,
      // Kalshi doesn't have a direct search param, use status + event_ticker filtering
    });
    const markets = res.markets || [];
    if (!query) return markets;

    const q = query.toLowerCase();
    return markets.filter((m) =>
      m.ticker.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.subtitle && m.subtitle.toLowerCase().includes(q))
    );
  } catch (err) {
    console.error('[DataFeed] Market search error:', err);
    return [];
  }
}

// --- Time & Sales subscription ---

/**
 * Subscribe to real-time time & sales (trade tape) for a market.
 * When connected: uses WS trade channel.
 * When disconnected: uses mock data.
 *
 * @param {string} ticker
 * @param {Function} callback - receives { id, timestamp, price, size, side, ticker }
 * @returns {Function} unsubscribe
 */
function subscribeToTimeSales(ticker, callback) {
  if (!connected) {
    return mockData.subscribeToTimeSales(ticker, callback);
  }

  return kalshiWs.subscribeTrades(ticker, (msg) => {
    callback({
      id: msg.trade_id || Date.now() + Math.random(),
      timestamp: msg.ts ? new Date(msg.ts).getTime() : Date.now(),
      price: msg.yes_price || msg.price || 0,
      size: parseFloat(msg.count_fp || msg.count || '1'),
      side: msg.taker_side === 'yes' ? 'BUY' : 'SELL',
      ticker: msg.market_ticker || ticker,
    });
  });
}

// --- Portfolio subscription (unified) ---

/**
 * Subscribe to portfolio data (positions, orders, fills, balance).
 * Combines REST polling with WS real-time updates.
 * When disconnected: uses mock portfolio data.
 *
 * @param {Function} callback - receives { balance, positions, orders, fills }
 * @returns {Function} unsubscribe
 */
function subscribeToPortfolio(callback) {
  if (!connected) {
    if (typeof mockData.subscribeToPortfolio === 'function') {
      return mockData.subscribeToPortfolio(callback);
    }
    // No mock portfolio — deliver empty data once
    setTimeout(() => callback({ balance: null, positions: [], orders: [], fills: [] }), 0);
    return () => {};
  }

  let running = true;

  async function fetchAll() {
    if (!running) return;
    const [bal, pos, ord, fil] = await Promise.all([
      getPortfolioBalance(),
      getOpenPositions(),
      getOpenOrders(),
      getFillHistory(),
    ]);
    if (running) {
      callback({ balance: bal, positions: pos, orders: ord, fills: fil });
    }
  }

  // Initial fetch
  fetchAll();

  // Poll every 5 seconds
  const pollTimer = setInterval(fetchAll, 5000);

  // Also listen for real-time WS updates to trigger immediate refresh
  const unsubFills = kalshiWs.subscribeUserFills(() => fetchAll());
  const unsubOrders = kalshiWs.subscribeUserOrders(() => fetchAll());
  const unsubPositions = kalshiWs.subscribePositions(() => fetchAll());

  return () => {
    running = false;
    clearInterval(pollTimer);
    unsubFills();
    unsubOrders();
    unsubPositions();
  };
}

// --- Order execution (aliased names) ---

async function submitOrder(order) {
  return placeOrder(order);
}

async function cancelOrder(orderId) {
  return cancelExistingOrder(orderId);
}

// --- Subscribe to user events (orders, fills, positions) ---

function subscribeToUserOrders(callback) {
  if (!connected) return () => {};
  return kalshiWs.subscribeUserOrders(callback);
}

function subscribeToUserFills(callback) {
  if (!connected) return () => {};
  return kalshiWs.subscribeUserFills(callback);
}

function subscribeToPositionChanges(callback) {
  if (!connected) return () => {};
  return kalshiWs.subscribePositions(callback);
}

export {
  // Connection
  initialize,
  // OHLCV generation (for initial chart data)
  generateOHLCV,
  disconnectFeed,
  isConnected,
  onConnectionChange,
  // Same interface as mockData (drop-in replacement)
  subscribeToTicker,
  subscribeToMarketRace,
  subscribeToScanner,
  generateOHLCV,
  subscribeToOHLCV,
  subscribeToTimeSales,
  getHistoricalScanResults,
  // Portfolio (unified subscription + individual getters)
  subscribeToPortfolio,
  getPortfolioBalance,
  getOpenPositions,
  getFillHistory,
  getOpenOrders,
  // Trading
  submitOrder,
  cancelOrder,
  placeOrder,
  cancelExistingOrder,
  // Mock market selection
  setActiveMockMarket,
  getAvailableMockMarkets,
  getActiveMockMarket,
  // Market search
  searchMarkets,
  // User event streams
  subscribeToUserOrders,
  subscribeToUserFills,
  subscribeToPositionChanges,
  // Orderbook
  buildSyntheticDom,
};
