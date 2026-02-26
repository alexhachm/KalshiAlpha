
// Mock data for KalshiAlpha Trading Terminal
// Provides 2 realistic Kalshi prediction markets with full data streams.

// --- Seeded PRNG for deterministic candle generation ---
function createRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function clamp(v, lo = 1, hi = 99) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// --- Market Definitions ---

const MARKETS = {
  'PRES-2026-WINNER': {
    ticker: 'PRES-2026-WINNER',
    title: 'Will the Republican candidate win the 2026 Presidential Election?',
    subtitle: 'Resolves YES if the Republican party candidate wins the general election.',
    category: 'politics',
    event_ticker: 'PRES-2026',
    status: 'open',
    expiry: '2026-11-03T00:00:00Z',
    // Price behavior
    startPrice: 45,
    basePrice: 62,
    volatility: 1.5,
    trendBias: 0.02,
    volumeBase: 300,
    spreadCents: 1,
  },
  'FED-RATE-CUT-MAR26': {
    ticker: 'FED-RATE-CUT-MAR26',
    title: 'Will the Fed cut rates at the March 2026 meeting?',
    subtitle: 'Resolves YES if the FOMC announces a rate cut on March 19, 2026.',
    category: 'economics',
    event_ticker: 'FED-RATE-MAR26',
    status: 'open',
    expiry: '2026-03-19T00:00:00Z',
    startPrice: 42,
    basePrice: 45,
    volatility: 3.0,
    trendBias: 0.0,
    volumeBase: 500,
    spreadCents: 2,
  },
};

const MOCK_TICKERS = Object.keys(MARKETS);
let activeMockMarket = MOCK_TICKERS[0];

// --- Market Selection API ---

export function setActiveMockMarket(ticker) {
  if (MARKETS[ticker]) {
    activeMockMarket = ticker;
  }
}

export function getActiveMockMarket() {
  return activeMockMarket;
}

export function getAvailableMockMarkets() {
  return MOCK_TICKERS.map((t) => ({
    ticker: MARKETS[t].ticker,
    title: MARKETS[t].title,
    subtitle: MARKETS[t].subtitle,
    category: MARKETS[t].category,
    event_ticker: MARKETS[t].event_ticker,
    status: MARKETS[t].status,
    expiry: MARKETS[t].expiry,
  }));
}

function resolveMarket(ticker) {
  return MARKETS[ticker] ? ticker : activeMockMarket;
}

// --- OHLCV Generation ---

function generateMarketOHLCV(market, count, timeframeMinutes) {
  const rng = createRng(hashStr(market.ticker + ':' + timeframeMinutes));
  const candles = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = timeframeMinutes * 60;
  let price = market.startPrice;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * interval;
    const open = price;

    // Mean reversion toward basePrice + trend bias
    const meanRevert = (market.basePrice - price) * 0.008;
    const change = (rng() - 0.48 + market.trendBias + meanRevert) * market.volatility;

    const close = clamp(open + change);
    const swing = Math.abs(change) + rng() * market.volatility * 0.8;
    const high = clamp(Math.max(open, close) + rng() * swing);
    const low = clamp(Math.min(open, close) - rng() * swing);

    // Volume correlates with volatility
    const volMult = 1 + Math.abs(change) / market.volatility;
    const volume = Math.floor(rng() * market.volumeBase * volMult + market.volumeBase * 0.3);

    candles.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    price = close;
  }
  return candles;
}

// Cache OHLCV within a session for consistency
const ohlcvCache = {};

function getOHLCV(ticker, count, tfMin) {
  const key = `${ticker}-${count}-${tfMin}`;
  if (!ohlcvCache[key]) {
    const market = MARKETS[ticker];
    if (!market) return [];
    ohlcvCache[key] = generateMarketOHLCV(market, count, tfMin);
  }
  return ohlcvCache[key];
}

// --- Live Price Tracking ---

const livePrices = {};

function getLivePrice(ticker) {
  if (livePrices[ticker] == null) {
    livePrices[ticker] = MARKETS[ticker] ? MARKETS[ticker].basePrice : 50;
  }
  return livePrices[ticker];
}

function stepLivePrice(ticker) {
  const market = MARKETS[ticker];
  if (!market) return 50;
  const current = getLivePrice(ticker);
  const meanRevert = (market.basePrice - current) * 0.02;
  const change = (Math.random() - 0.48 + market.trendBias + meanRevert) * market.volatility * 0.5;
  const next = clamp(current + change);
  livePrices[ticker] = next;
  return next;
}

// --- Order Book Generation ---

function generateOrderBook(midPrice, market) {
  const spread = market.spreadCents;
  const bestBid = clamp(midPrice - Math.floor(spread / 2));
  const bestAsk = clamp(midPrice + Math.ceil(spread / 2));

  const bids = [];
  const asks = [];

  let bp = bestBid;
  for (let i = 0; i < 12 && bp > 0; i++) {
    const baseSize = Math.max(10, Math.floor(400 / (1 + i * 0.5)));
    const size = baseSize + Math.floor(Math.random() * baseSize * 0.5);
    bids.push({ price: bp, size, orders: Math.floor(Math.random() * 8) + 1 });
    bp -= 1;
  }

  let ap = bestAsk;
  for (let i = 0; i < 12 && ap < 100; i++) {
    const baseSize = Math.max(10, Math.floor(400 / (1 + i * 0.5)));
    const size = baseSize + Math.floor(Math.random() * baseSize * 0.5);
    asks.push({ price: ap, size, orders: Math.floor(Math.random() * 8) + 1 });
    ap += 1;
  }

  return { bids, asks };
}

// --- Simulation Intervals ---

const UPDATE_INTERVAL_MS = 200;
const SCANNER_INTERVAL_MS = 2000;

// =====================
//  Subscription API
// =====================

// Ticker (Level II data stream)
export const subscribeToTicker = (ticker, callback) => {
  const resolved = resolveMarket(ticker);
  const market = MARKETS[resolved];

  const interval = setInterval(() => {
    const yesPrice = stepLivePrice(resolved);
    const noPrice = 100 - yesPrice;
    const book = generateOrderBook(yesPrice, market);

    callback({
      ticker: resolved,
      timestamp: Date.now(),
      yes: {
        price: yesPrice,
        bids: book.bids.slice(0, 5),
      },
      no: {
        price: noPrice,
        bids: book.asks.slice(0, 5).map((a) => ({
          price: 100 - a.price,
          size: a.size,
          orders: a.orders,
        })),
      },
      lastTrade: {
        price: yesPrice,
        side: Math.random() > 0.5 ? 'YES' : 'NO',
        size: Math.floor(Math.random() * 200) + 1,
      },
    });
  }, UPDATE_INTERVAL_MS);

  return () => clearInterval(interval);
};

// Market Race (top movers)
export const subscribeToMarketRace = (callback) => {
  const racerState = MOCK_TICKERS.map((t) => ({
    ticker: t,
    delta: (Math.random() * 6) - 3,
    volatility: MARKETS[t].volatility / 3,
  }));

  const interval = setInterval(() => {
    racerState.forEach((r) => {
      r.delta += (Math.random() - 0.5) * MARKETS[r.ticker].volatility * 0.5;
    });
    racerState.sort((a, b) => b.delta - a.delta);
    callback([...racerState]);
  }, 500);

  return () => clearInterval(interval);
};

// Generate OHLCV (one-shot, returns array)
export const generateOHLCV = (ticker, count = 200, timeframeMinutes = 5) => {
  return getOHLCV(resolveMarket(ticker), count, timeframeMinutes);
};

// Subscribe to OHLCV streaming (history + live updates)
export const subscribeToOHLCV = (ticker, timeframeMinutes, callback) => {
  let running = true;
  const resolved = resolveMarket(ticker);
  const market = MARKETS[resolved];

  const tfMin =
    typeof timeframeMinutes === 'string'
      ? { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '1D': 1440 }[timeframeMinutes] || 60
      : timeframeMinutes || 5;

  const historicalCandles = getOHLCV(resolved, 200, tfMin);

  // Deliver history asynchronously
  setTimeout(() => {
    if (running) callback({ type: 'history', candles: historicalCandles });
  }, 0);

  let lastClose =
    historicalCandles.length > 0
      ? historicalCandles[historicalCandles.length - 1].close
      : market.basePrice;

  const interval = setInterval(() => {
    if (!running) return;
    const meanRevert = (market.basePrice - lastClose) * 0.01;
    const change = (Math.random() - 0.48 + market.trendBias + meanRevert) * market.volatility;
    const open = lastClose;
    const close = clamp(open + change);
    const high = Math.round(clamp(Math.max(open, close) + Math.random() * market.volatility) * 100) / 100;
    const low = Math.round(clamp(Math.min(open, close) - Math.random() * market.volatility) * 100) / 100;
    lastClose = close;

    callback({
      type: 'update',
      candle: {
        time: Math.floor(Date.now() / 1000),
        open: Math.round(open * 100) / 100,
        high,
        low,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * market.volumeBase) + 50,
      },
    });
  }, UPDATE_INTERVAL_MS * 5);

  return () => {
    running = false;
    clearInterval(interval);
  };
};

// Scanner Alerts
const STRATEGIES = [
  { name: 'Volume Spike', type: 'bull' },
  { name: 'Price Breakout', type: 'bull' },
  { name: 'Momentum Shift', type: 'bear' },
  { name: 'Mean Reversion', type: 'neutral' },
  { name: 'Unusual Activity', type: 'bull' },
];

export const subscribeToScanner = (callback) => {
  const interval = setInterval(() => {
    const ticker = MOCK_TICKERS[Math.floor(Math.random() * MOCK_TICKERS.length)];
    const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
    const price = getLivePrice(ticker);

    callback({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      ticker,
      strategy: strategy.name,
      type: strategy.type,
      conviction: Math.floor(Math.random() * 3) + 1,
      description: `${strategy.name} triggered on ${ticker} at ${price}c`,
    });
  }, SCANNER_INTERVAL_MS);

  return () => clearInterval(interval);
};

// Historical Scanner
const HISTORICAL_PATTERNS = [
  { name: 'Volume Breakout', key: 'volume-breakout', signals: ['bull', 'bull', 'neutral'] },
  { name: 'Price Reversal', key: 'price-reversal', signals: ['bear', 'bull', 'bear'] },
  { name: 'Momentum Shift', key: 'momentum-shift', signals: ['bull', 'bear', 'neutral'] },
  { name: 'Mean Reversion', key: 'mean-reversion', signals: ['neutral', 'bull', 'bear'] },
  { name: 'Gap Fill', key: 'gap-fill', signals: ['bull', 'bear', 'neutral'] },
];

export const getHistoricalScanResults = ({ startDate, endDate, pattern, maxResults = 100 }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const rangeDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const count = Math.min(maxResults, Math.max(5, Math.floor(rangeDays * 1.5)));

  const results = [];
  const available =
    pattern === 'all' ? HISTORICAL_PATTERNS : HISTORICAL_PATTERNS.filter((p) => p.key === pattern);

  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor(Math.random() * rangeDays);
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    const pat = available[Math.floor(Math.random() * available.length)];
    const signal = pat.signals[Math.floor(Math.random() * pat.signals.length)];

    results.push({
      id: `hs-${i}-${Date.now()}`,
      date: date.toISOString().split('T')[0],
      ticker: MOCK_TICKERS[Math.floor(Math.random() * MOCK_TICKERS.length)],
      pattern: pat.name,
      signal,
      roi: parseFloat(((Math.random() - 0.3) * 20).toFixed(2)),
      confidence: Math.floor(Math.random() * 5) + 1,
    });
  }

  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Portfolio subscription
export const subscribeToPortfolio = (callback) => {
  const mockBalance = {
    balance: 1000000, // $10,000 in cents
    portfolioValue: 441000,
  };

  const mockPositions = [
    {
      ticker: 'PRES-2026-WINNER',
      market_ticker: 'PRES-2026-WINNER',
      position: 'yes',
      total_traded: 50,
      resting_orders_count: 2,
      market_exposure: 2750,
      fees_paid: 25,
    },
    {
      ticker: 'FED-RATE-CUT-MAR26',
      market_ticker: 'FED-RATE-CUT-MAR26',
      position: 'no',
      total_traded: 30,
      resting_orders_count: 1,
      market_exposure: 1440,
      fees_paid: 15,
    },
  ];

  const mockOrders = [
    {
      order_id: `ord-pres-${Date.now()}`,
      ticker: 'PRES-2026-WINNER',
      side: 'yes',
      action: 'buy',
      type: 'limit',
      yes_price: 60,
      remaining_count: 25,
      status: 'resting',
      created_time: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      order_id: `ord-fed-${Date.now()}`,
      ticker: 'FED-RATE-CUT-MAR26',
      side: 'yes',
      action: 'sell',
      type: 'limit',
      yes_price: 50,
      remaining_count: 15,
      status: 'resting',
      created_time: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const mockFills = [
    {
      trade_id: `fill-pres-1-${Date.now()}`,
      ticker: 'PRES-2026-WINNER',
      side: 'yes',
      action: 'buy',
      yes_price: 55,
      count: 50,
      created_time: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      trade_id: `fill-pres-2-${Date.now()}`,
      ticker: 'PRES-2026-WINNER',
      side: 'yes',
      action: 'sell',
      yes_price: 58,
      count: 20,
      created_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      trade_id: `fill-fed-1-${Date.now()}`,
      ticker: 'FED-RATE-CUT-MAR26',
      side: 'yes',
      action: 'sell',
      yes_price: 48,
      count: 30,
      created_time: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      trade_id: `fill-fed-2-${Date.now()}`,
      ticker: 'FED-RATE-CUT-MAR26',
      side: 'yes',
      action: 'buy',
      yes_price: 44,
      count: 10,
      created_time: new Date(Date.now() - 43200000).toISOString(),
    },
  ];

  setTimeout(() => {
    callback({
      balance: mockBalance,
      positions: mockPositions,
      orders: mockOrders,
      fills: mockFills,
    });
  }, 0);

  const interval = setInterval(() => {
    mockBalance.balance += Math.floor((Math.random() - 0.5) * 200);
    mockBalance.portfolioValue += Math.floor((Math.random() - 0.5) * 100);
    callback({
      balance: { ...mockBalance },
      positions: [...mockPositions],
      orders: [...mockOrders],
      fills: [...mockFills],
    });
  }, 5000);

  return () => clearInterval(interval);
};

// Time & Sales subscription
export const subscribeToTimeSales = (ticker, callback) => {
  let running = true;
  const resolved = resolveMarket(ticker);
  const market = MARKETS[resolved];
  let lastPrice = getLivePrice(resolved);

  const scheduleNext = () => {
    if (!running) return;
    const delay = Math.floor(Math.random() * 400) + 100;
    setTimeout(() => {
      if (!running) return;
      const meanRevert = (market.basePrice - lastPrice) * 0.01;
      const change = (Math.random() - 0.5 + meanRevert) * market.volatility * 0.3;
      lastPrice = clamp(lastPrice + change);

      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const sizeRoll = Math.random();
      let size;
      if (sizeRoll < 0.6) size = Math.floor(Math.random() * 50) + 1;
      else if (sizeRoll < 0.9) size = Math.floor(Math.random() * 200) + 50;
      else size = Math.floor(Math.random() * 1000) + 200;

      callback({
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        price: lastPrice,
        size,
        side,
        ticker: resolved,
      });
      scheduleNext();
    }, delay);
  };

  scheduleNext();
  return () => { running = false; };
};
