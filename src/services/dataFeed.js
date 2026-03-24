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
const connectionStatusListeners = new Set();

const CONNECTION_STATUS = {
  MOCK: 'mock',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
};

let connectionStatus = CONNECTION_STATUS.MOCK;
let hasLiveCredentials = false;
let lastInitializeSignature = '';

function isConnected() {
  return connected;
}

function getConnectionStatus() {
  return connectionStatus;
}

function onConnectionChange(callback) {
  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}

function onConnectionStatusChange(callback) {
  connectionStatusListeners.add(callback);
  return () => connectionStatusListeners.delete(callback);
}

function setConnected(val) {
  const old = connected;
  connected = val;
  if (old !== val) {
    connectionListeners.forEach((cb) => {
      try { cb(val); } catch { /* ignore */ }
    })
  }
}

function setConnectionStatus(nextStatus) {
  const oldStatus = connectionStatus;
  connectionStatus = nextStatus;
  if (oldStatus !== nextStatus) {
    connectionStatusListeners.forEach((cb) => {
      try { cb(nextStatus); } catch { /* ignore */ }
    })
  }
}

function toConnectionStatus(wsState) {
  switch (wsState) {
    case kalshiWs.STATE.CONNECTING:
      return CONNECTION_STATUS.CONNECTING;
    case kalshiWs.STATE.CONNECTED:
      return CONNECTION_STATUS.CONNECTED;
    case kalshiWs.STATE.RECONNECTING:
      return CONNECTION_STATUS.RECONNECTING;
    default:
      return hasLiveCredentials ? CONNECTION_STATUS.DISCONNECTED : CONNECTION_STATUS.MOCK;
  }
}

function hasCredentials(opts = {}) {
  const apiKeyId = typeof opts.apiKeyId === 'string' ? opts.apiKeyId.trim() : '';
  const privateKeyPem = typeof opts.privateKeyPem === 'string' ? opts.privateKeyPem.trim() : '';
  return Boolean(apiKeyId && privateKeyPem);
}

function getInitializeSignature(opts = {}) {
  return JSON.stringify({
    apiKeyId: typeof opts.apiKeyId === 'string' ? opts.apiKeyId.trim() : '',
    privateKeyPem: typeof opts.privateKeyPem === 'string' ? opts.privateKeyPem.trim() : '',
    environment: opts.environment || 'demo',
    wsUrl: typeof opts.wsUrl === 'string' ? opts.wsUrl.trim() : '',
    wsReconnectInterval: Number(opts.wsReconnectInterval) || 0,
    wsMaxRetries: Number(opts.wsMaxRetries) || 0,
  });
}

// Listen to WS state changes
kalshiWs.onStateChange((newState) => {
  setConnected(newState === kalshiWs.STATE.CONNECTED);
  setConnectionStatus(toConnectionStatus(newState));
});

// --- Reconnect wrapper ---
// Wraps subscribe functions so that when connection state changes,
// stale (mock or real) subscriptions are torn down and re-created.

function withReconnect(subscribeFn) {
  return function (...args) {
    let currentUnsub = subscribeFn(...args);
    let wasMock = !connected;

    const removeListener = onConnectionChange((isNowConnected) => {
      const shouldBeMock = !isNowConnected;
      if (wasMock !== shouldBeMock) {
        currentUnsub();
        currentUnsub = subscribeFn(...args);
        wasMock = shouldBeMock;
      }
    });

    return () => {
      currentUnsub();
      removeListener();
    };
  };
}

// --- Initialize / connect ---

/**
 * Initialize the data feed with Kalshi credentials.
 * If credentials are not provided, stays in mock mode.
 */
async function initialize(opts = {}) {
  if (!hasCredentials(opts)) {
    hasLiveCredentials = false;
    lastInitializeSignature = '';
    kalshiWs.disconnect();
    setConnected(false);
    setConnectionStatus(CONNECTION_STATUS.MOCK);
    return;
  }

  const nextSignature = getInitializeSignature(opts);
  const wsState = kalshiWs.getState();
  const alreadyConnectingOrConnected =
    wsState === kalshiWs.STATE.CONNECTED ||
    wsState === kalshiWs.STATE.CONNECTING ||
    wsState === kalshiWs.STATE.RECONNECTING;

  if (alreadyConnectingOrConnected && nextSignature === lastInitializeSignature) {
    return;
  }

  hasLiveCredentials = true;
  lastInitializeSignature = nextSignature;
  setConnectionStatus(CONNECTION_STATUS.CONNECTING);

  try {
    kalshiWs.disconnect();
    setConnected(false);
    await kalshiApi.configure({
      environment: opts.environment || 'demo',
      apiKeyId: opts.apiKeyId,
      privateKeyPem: opts.privateKeyPem,
    });
    await kalshiWs.connect();
  } catch (err) {
    console.error('[DataFeed] Failed to connect to Kalshi:', err);
    setConnected(false);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
  }
}

function disconnectFeed() {
  hasLiveCredentials = false;
  lastInitializeSignature = '';
  kalshiWs.disconnect();
  setConnected(false);
  setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
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
  const qty = msg.quantity ?? msg.delta;

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
      wrappedCallback();
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
  let consecutiveErrors = 0;

  async function pollMarkets() {
    if (!running) return;
    try {
      const res = await kalshiApi.getMarkets({ limit: 100, status: 'open' });
      if (!running) return;
      consecutiveErrors = 0;
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
      consecutiveErrors++;
      console.error('[DataFeed] Market race poll error:', err);
    }

    if (running) {
      // Back off on consecutive errors: 5s, 10s, 20s, cap at 30s
      const delay = Math.min(5000 * Math.pow(2, consecutiveErrors), 30000);
      setTimeout(pollMarkets, delay);
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
const SCANNER_POLL_INTERVAL_MS = 5000;
const SCANNER_SIGNAL_COOLDOWN_MS = 20000;
const SCANNER_BASELINE_MARKETS = 8;
const SCANNER_MAX_ALERTS_PER_POLL = 3;
let scannerAlertSequence = 0;

function nextScannerAlertId() {
  scannerAlertSequence = (scannerAlertSequence + 1) % 1000;
  return Date.now() * 1000 + scannerAlertSequence;
}

function toFiniteNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx];
}

function formatSignedNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return '0';
  const formatted = value.toFixed(decimals);
  return value >= 0 ? `+${formatted}` : formatted;
}

function getScannerPriceSnapshot(market) {
  const yesBid = toFiniteNumber(market.yes_bid);
  const yesAsk = toFiniteNumber(market.yes_ask);
  const lastPrice = toFiniteNumber(market.last_price);
  const volume = toFiniteNumber(market.volume);

  const price = yesBid != null && yesAsk != null
    ? (yesBid + yesAsk) / 2
    : (yesBid ?? yesAsk ?? lastPrice);

  if (price == null) return null;

  return {
    ticker: market.ticker || market.market_ticker || null,
    price,
    volume,
    spread: yesBid != null && yesAsk != null ? Math.max(0, yesAsk - yesBid) : null,
  };
}

function buildScannerSignalCandidate(candidate, thresholds, convictionEnabled) {
  const absMove = Math.abs(candidate.priceMove);
  const volumeDelta = candidate.volumeDelta;
  const volumeBoost = volumeDelta != null && volumeDelta > thresholds.volume;
  const tightSpread = candidate.spread != null && candidate.spread <= 2;

  let type = 'neutral';
  if (candidate.priceMove >= thresholds.move) type = 'bull';
  if (candidate.priceMove <= -thresholds.move) type = 'bear';

  let strategy = 'Range Hold';
  if (type === 'bull') {
    if (absMove >= thresholds.strongMove && volumeBoost) strategy = 'Momentum Breakout';
    else if (tightSpread && volumeBoost) strategy = 'Bid-Lift Continuation';
    else strategy = 'Upside Drift';
  } else if (type === 'bear') {
    if (absMove >= thresholds.strongMove && volumeBoost) strategy = 'Momentum Breakdown';
    else if (tightSpread && volumeBoost) strategy = 'Offer-Pressure Continuation';
    else strategy = 'Downside Drift';
  } else if (candidate.spread != null && candidate.spread >= 5 && absMove < thresholds.move * 0.7) {
    strategy = 'Wide-Spread Chop';
  } else if (volumeBoost && absMove < thresholds.move * 0.9) {
    strategy = 'High-Volume Rotation';
  } else if (absMove >= thresholds.move * 0.75 && absMove < thresholds.strongMove) {
    strategy = 'Mean Reversion Watch';
  }

  let score = 1;
  if (absMove >= thresholds.move) score += 1;
  if (absMove >= thresholds.strongMove) score += 1;
  if (volumeBoost) score += 1;
  if (tightSpread) score += 1;
  if (type === 'neutral' && absMove < thresholds.move * 0.65) score += 1;

  const conviction = convictionEnabled
    ? (score >= 4 ? 3 : score >= 2 ? 2 : 1)
    : 1;

  const volumeSummary = volumeDelta == null
    ? 'vol n/a'
    : `vol ${formatSignedNumber(volumeDelta, 0)}`;
  const spreadSummary = candidate.spread == null
    ? 'spr n/a'
    : `spr ${candidate.spread.toFixed(1)}c`;

  return {
    ticker: candidate.ticker,
    strategy,
    type,
    conviction,
    score,
    absMove,
    description: `YES ${candidate.price.toFixed(1)}c (${formatSignedNumber(candidate.priceMove)}c, ${volumeSummary}, ${spreadSummary})`,
  };
}

function buildConnectedScannerSignals(candidates, convictionEnabled) {
  if (!candidates.length) return [];

  const absMoves = candidates.map((c) => Math.abs(c.priceMove)).filter((v) => Number.isFinite(v) && v > 0);
  if (!absMoves.length) return [];

  const positiveVolumeDeltas = candidates
    .map((c) => c.volumeDelta)
    .filter((v) => Number.isFinite(v) && v > 0);

  const thresholds = {
    move: Math.max(0.6, percentile(absMoves, 0.7)),
    strongMove: Math.max(1.0, percentile(absMoves, 0.9)),
    volume: positiveVolumeDeltas.length ? Math.max(10, percentile(positiveVolumeDeltas, 0.75)) : Number.POSITIVE_INFINITY,
  };

  const scored = candidates
    .map((candidate) => buildScannerSignalCandidate(candidate, thresholds, convictionEnabled))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.absMove !== a.absMove) return b.absMove - a.absMove;
      return String(a.ticker).localeCompare(String(b.ticker));
    });

  const bulls = scored.filter((s) => s.type === 'bull');
  const bears = scored.filter((s) => s.type === 'bear');
  const neutrals = scored.filter((s) => s.type === 'neutral');
  const used = new Set();
  const picked = [];

  if (bulls[0]) {
    picked.push(bulls[0]);
    used.add(bulls[0].ticker);
  }
  if (bears[0] && !used.has(bears[0].ticker)) {
    picked.push(bears[0]);
    used.add(bears[0].ticker);
  }

  for (const signal of scored) {
    if (picked.length >= SCANNER_MAX_ALERTS_PER_POLL) break;
    if (used.has(signal.ticker)) continue;
    picked.push(signal);
    used.add(signal.ticker);
  }

  if (picked.length === 0 && neutrals[0]) picked.push(neutrals[0]);
  return picked.slice(0, SCANNER_MAX_ALERTS_PER_POLL);
}

function subscribeToScanner(callback) {
  if (!connected) {
    return mockData.subscribeToScanner(callback);
  }

  const marketSnapshots = new Map(); // ticker -> { price, volume, spread, ts }
  const lastSignalByTicker = new Map(); // ticker -> { type, ts }
  let running = true;
  let pollTimer = null;
  let consecutiveErrors = 0;
  let lastCapabilityNoticeAt = 0;
  let currentCapabilities = {
    directionalSignals: false,
    convictionRanking: false,
    strategyLabels: true,
    reason: 'Building baseline from connected feed.',
  };

  function emitAlert(alert) {
    callback({
      ...alert,
      capabilities: currentCapabilities,
    });
  }

  function maybeEmitCapabilityNotice(reason, tickerHint = null) {
    const now = Date.now();
    if (now - lastCapabilityNoticeAt < SCANNER_SIGNAL_COOLDOWN_MS) return;
    lastCapabilityNoticeAt = now;

    emitAlert({
      id: nextScannerAlertId(),
      time: new Date(now).toLocaleTimeString(),
      ticker: tickerHint || 'CONNECTED-FEED',
      strategy: 'Baseline Building',
      type: 'neutral',
      conviction: 1,
      description: reason,
    });
  }

  // Lifecycle is still useful for status changes and new listings.
  const unsubLifecycle = kalshiWs.subscribeLifecycle((msg) => {
    const eventType = String(msg.event_type || msg.type || '').toLowerCase();
    const ticker = msg.market_ticker || msg.ticker || 'UNKNOWN';

    const lifecycleMap = {
      created: 'Market Listed',
      activated: 'Market Activated',
      reopened: 'Market Reopened',
      suspended: 'Market Suspended',
      halted: 'Market Halted',
      closed: 'Market Closed',
      settled: 'Market Settled',
    };
    const strategy = lifecycleMap[eventType];
    if (!strategy) return;

    const type = eventType === 'suspended' || eventType === 'halted' ? 'bear' : 'neutral';
    const conviction = type === 'bear' ? 2 : 1;

    emitAlert({
      id: nextScannerAlertId(),
      time: new Date().toLocaleTimeString(),
      ticker,
      strategy,
      type,
      conviction,
      description: `${strategy}: ${ticker}`,
    });
  });

  async function pollScannerSignals() {
    if (!running) return;

    try {
      const res = await kalshiApi.getMarkets({ limit: 200, status: 'open' });
      if (!running) return;
      consecutiveErrors = 0;

      const markets = Array.isArray(res?.markets) ? res.markets : [];
      const now = Date.now();
      const candidates = [];
      let firstTicker = null;

      for (const market of markets) {
        const snapshot = getScannerPriceSnapshot(market);
        if (!snapshot || !snapshot.ticker) continue;

        if (!firstTicker) firstTicker = snapshot.ticker;
        const prev = marketSnapshots.get(snapshot.ticker);
        marketSnapshots.set(snapshot.ticker, { ...snapshot, ts: now });

        if (!prev) continue;
        const priceMove = snapshot.price - prev.price;
        if (!Number.isFinite(priceMove)) continue;

        const volumeDelta = snapshot.volume != null && prev.volume != null
          ? snapshot.volume - prev.volume
          : null;

        candidates.push({
          ticker: snapshot.ticker,
          price: snapshot.price,
          spread: snapshot.spread,
          priceMove,
          volumeDelta,
        });
      }

      const directionalSignals = candidates.length >= SCANNER_BASELINE_MARKETS;
      const volumeComparable = candidates.filter((c) => c.volumeDelta != null).length;
      const convictionRanking = directionalSignals && volumeComparable >= Math.max(4, Math.floor(SCANNER_BASELINE_MARKETS / 2));
      const limitationReason = !directionalSignals
        ? `Connected mode warming up (${candidates.length}/${SCANNER_BASELINE_MARKETS} comparable markets).`
        : !convictionRanking
          ? `Directional signals are active, but conviction ranking is limited (${volumeComparable} markets with volume deltas).`
          : '';

      currentCapabilities = {
        directionalSignals,
        convictionRanking,
        strategyLabels: true,
        reason: limitationReason,
      };

      if (!directionalSignals) {
        maybeEmitCapabilityNotice(limitationReason, firstTicker);
        return;
      }

      const signals = buildConnectedScannerSignals(candidates, convictionRanking);
      if (!signals.length) return;

      for (const signal of signals) {
        const prior = lastSignalByTicker.get(signal.ticker);
        if (prior && prior.type === signal.type && now - prior.ts < SCANNER_SIGNAL_COOLDOWN_MS) {
          continue;
        }
        lastSignalByTicker.set(signal.ticker, { type: signal.type, ts: now });

        emitAlert({
          id: nextScannerAlertId(),
          time: new Date(now).toLocaleTimeString(),
          ticker: signal.ticker,
          strategy: signal.strategy,
          type: signal.type,
          conviction: signal.conviction,
          description: signal.description,
        });
      }
    } catch (err) {
      consecutiveErrors++;
      currentCapabilities = {
        directionalSignals: false,
        convictionRanking: false,
        strategyLabels: false,
        reason: 'Connected scanner degraded: market feed unavailable.',
      };
      maybeEmitCapabilityNotice(currentCapabilities.reason);
      console.error('[DataFeed] Scanner poll error:', err);
    } finally {
      if (!running) return;
      const delay = Math.min(SCANNER_POLL_INTERVAL_MS * Math.pow(2, consecutiveErrors), 30000);
      pollTimer = setTimeout(pollScannerSignals, delay);
    }
  }

  pollScannerSignals();

  return () => {
    running = false;
    if (pollTimer) clearTimeout(pollTimer);
    unsubLifecycle();
  };
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
      const interval = typeof timeframe === 'number' ? timeframe : (timeframeToInterval[timeframe] || 60);
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
    const settledMarkets = [...(markets.markets || [])].sort((a, b) => {
      const aDate = new Date(a.close_time || a.settled_time || 0).getTime();
      const bDate = new Date(b.close_time || b.settled_time || 0).getTime();
      if (aDate !== bDate) return bDate - aDate;
      return String(a.ticker || '').localeCompare(String(b.ticker || ''));
    });

    const seenIds = new Map();

    return settledMarkets.map((m) => {
      const result = String(m.result || '').toLowerCase();
      const signal = result === 'yes' ? 'bull' : result === 'no' ? 'bear' : 'neutral';
      const date = m.close_time || m.settled_time || '';
      const baseId = `hs-${m.ticker || 'unknown'}-${date || 'na'}-${result || 'unknown'}`;
      const priorCount = seenIds.get(baseId) || 0;
      seenIds.set(baseId, priorCount + 1);
      const id = priorCount === 0 ? baseId : `${baseId}-${priorCount}`;

      return {
        id,
        date,
        ticker: m.ticker,
        pattern: 'Historical',
        signal,
        roi: m.last_price ? ((result === 'yes' ? 100 : 0) - m.last_price) : 0,
        confidence: 3,
      };
    });
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

const VALID_ORDER_SIDES = new Set(['yes', 'no']);
const VALID_ORDER_ACTIONS = new Set(['buy', 'sell']);
const VALID_ORDER_TYPES = new Set(['market', 'limit']);
const VALID_ORDER_TIFS = new Set(['gtc', 'ioc']);

function normalizeOrderEnum(value, validValues, fieldName, fallback = null) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  if (!normalized) {
    if (fallback !== null) return fallback;
    throw new Error(`Order ${fieldName} is required`);
  }
  if (!validValues.has(normalized)) {
    throw new Error(`Invalid order ${fieldName}: ${value}`);
  }
  return normalized;
}

function normalizeOrderCount(rawCount) {
  const count = Number.parseFloat(rawCount);
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error('Order size must be greater than zero');
  }
  return count.toFixed(2);
}

function normalizeOrderYesPrice(rawYesPrice, side, type, isAlreadyYesPrice = false) {
  if (rawYesPrice == null || rawYesPrice === '') {
    if (type === 'limit') {
      throw new Error('Limit orders require a price');
    }
    return undefined;
  }

  const parsedPrice = Number.parseFloat(rawYesPrice);
  if (!Number.isFinite(parsedPrice)) {
    throw new Error(`Invalid order price: ${rawYesPrice}`);
  }

  const mappedPrice = isAlreadyYesPrice
    ? parsedPrice
    : (side === 'no' ? 100 - parsedPrice : parsedPrice);
  const yesPrice = Math.round(mappedPrice);

  if (yesPrice <= 0 || yesPrice >= 100) {
    throw new Error(`Order yes_price must be between 1 and 99 cents. Received: ${yesPrice}`);
  }
  return yesPrice;
}

function normalizeCreateOrderPayload(order = {}) {
  const ticker = typeof order.ticker === 'string' ? order.ticker.trim() : '';
  if (!ticker) throw new Error('Order ticker is required');

  const side = normalizeOrderEnum(order.side, VALID_ORDER_SIDES, 'side');
  const action = normalizeOrderEnum(order.action, VALID_ORDER_ACTIONS, 'action', 'buy');
  const type = normalizeOrderEnum(order.type || order.route, VALID_ORDER_TYPES, 'type', 'limit');
  const rawCount = order.count_fp ?? order.size ?? order.quantity ?? order.count;
  const count_fp = normalizeOrderCount(rawCount);

  // `yes_price` is always YES cents for Kalshi payloads. If callers provide NO-side price,
  // we convert via 100 - price using side context.
  const hasExplicitYesPrice = order.yes_price != null && order.yes_price !== '';
  const rawPrice = hasExplicitYesPrice ? order.yes_price : order.price;
  const yes_price = normalizeOrderYesPrice(rawPrice, side, type, hasExplicitYesPrice);

  const payload = {
    ticker,
    side,
    action,
    type,
    count_fp,
  };

  if (yes_price != null) payload.yes_price = yes_price;

  const rawTif = order.time_in_force ?? order.timeInForce ?? order.tif;
  if (rawTif != null && rawTif !== '') {
    payload.time_in_force = normalizeOrderEnum(rawTif, VALID_ORDER_TIFS, 'time_in_force');
  }

  const clientOrderId = order.client_order_id ?? order.clientOrderId;
  if (clientOrderId) payload.client_order_id = String(clientOrderId);

  return payload;
}

async function placeOrder(order) {
  if (!connected) {
    throw new Error('Not connected to Kalshi API');
  }
  const normalizedOrder = normalizeCreateOrderPayload(order);
  return kalshiApi.createOrder(normalizedOrder);
}

async function cancelExistingOrder(orderId) {
  if (!connected) {
    throw new Error('Not connected to Kalshi API');
  }
  return kalshiApi.cancelOrder(orderId);
}

const CANCEL_DELAY_MS = 100;

/**
 * Cancel multiple orders sequentially with a delay between each to avoid rate limits.
 * Returns { succeeded: string[], failed: { orderId: string, error: Error }[] }
 */
async function cancelOrdersSequential(orderIds) {
  const succeeded = [];
  const failed = [];
  for (let i = 0; i < orderIds.length; i++) {
    try {
      await cancelExistingOrder(orderIds[i]);
      succeeded.push(orderIds[i]);
    } catch (err) {
      failed.push({ orderId: orderIds[i], error: err });
    }
    if (i < orderIds.length - 1) {
      await new Promise((r) => setTimeout(r, CANCEL_DELAY_MS));
    }
  }
  return { succeeded, failed };
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
  let debounceTimer = null;

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

  // Debounced fetch — coalesces rapid WS events into a single REST call
  function debouncedFetch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchAll, 300);
  }

  // Initial fetch
  fetchAll();

  // Poll every 5 seconds
  const pollTimer = setInterval(fetchAll, 5000);

  // WS updates trigger debounced refresh (avoids rapid-fire REST calls)
  const unsubFills = kalshiWs.subscribeUserFills(debouncedFetch);
  const unsubOrders = kalshiWs.subscribeUserOrders(debouncedFetch);
  const unsubPositions = kalshiWs.subscribePositions(debouncedFetch);

  return () => {
    running = false;
    if (debounceTimer) clearTimeout(debounceTimer);
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

// Apply reconnect wrappers — subscriptions auto-transition between mock and real data
const _subscribeToTicker = withReconnect(subscribeToTicker);
const _subscribeToMarketRace = withReconnect(subscribeToMarketRace);
const _subscribeToScanner = withReconnect(subscribeToScanner);
const _subscribeToOHLCV = withReconnect(subscribeToOHLCV);
const _subscribeToTimeSales = withReconnect(subscribeToTimeSales);
const _subscribeToPortfolio = withReconnect(subscribeToPortfolio);
const _subscribeToUserOrders = withReconnect(subscribeToUserOrders);
const _subscribeToUserFills = withReconnect(subscribeToUserFills);
const _subscribeToPositionChanges = withReconnect(subscribeToPositionChanges);

export {
  // Connection
  initialize,
  // OHLCV generation (for initial chart data)
  generateOHLCV,
  disconnectFeed,
  isConnected,
  onConnectionChange,
  getConnectionStatus,
  onConnectionStatusChange,
  CONNECTION_STATUS,
  // Same interface as mockData (drop-in replacement)
  _subscribeToTicker as subscribeToTicker,
  _subscribeToMarketRace as subscribeToMarketRace,
  _subscribeToScanner as subscribeToScanner,
  _subscribeToOHLCV as subscribeToOHLCV,
  _subscribeToTimeSales as subscribeToTimeSales,
  getHistoricalScanResults,
  // Portfolio (unified subscription + individual getters)
  _subscribeToPortfolio as subscribeToPortfolio,
  getPortfolioBalance,
  getOpenPositions,
  getFillHistory,
  getOpenOrders,
  // Trading
  submitOrder,
  cancelOrder,
  cancelOrdersSequential,
  normalizeCreateOrderPayload,
  placeOrder,
  cancelExistingOrder,
  // Mock market selection
  setActiveMockMarket,
  getAvailableMockMarkets,
  getActiveMockMarket,
  // Market search
  searchMarkets,
  // User event streams
  _subscribeToUserOrders as subscribeToUserOrders,
  _subscribeToUserFills as subscribeToUserFills,
  _subscribeToPositionChanges as subscribeToPositionChanges,
  // Orderbook
  buildSyntheticDom,
};
