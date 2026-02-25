
// Simulation configuration
const UPDATE_INTERVAL_MS = 200; // 5 updates per second
const SCANNER_INTERVAL_MS = 2000; // New signal every 2 seconds

// Mock Tickers
const TICKERS = [
    "FED-DEC23", "CPI-NOV", "GDP-Q4", "NVDA-EARN", "BTC-100K-EOY",
    "TSLA-DELIV", "SPX-4600-DEC", "UNEMP-RATE", "GOOG-ANTITRUST"
];

const STRATEGIES = [
    { name: "Continuation", type: "bull" },
    { name: "Alpha Predator", type: "bull" },
    { name: "Bon Shorty", type: "bear" },
    { name: "Mean Reversion", type: "neutral" },
    { name: "Volume Breakout", type: "bull" }
];

// Helper to generate a random price between 1 and 99
const randomPrice = () => Math.floor(Math.random() * 98) + 1;

// Helper to generate order book depth
const generateDepth = (midPrice) => {
    const depth = [];
    // Generate 5 levels of bids
    let currentBid = midPrice;
    for (let i = 0; i < 5; i++) {
        if (currentBid <= 0) break;
        depth.push({
            price: currentBid,
            size: Math.floor(Math.random() * 1000) + 100,
            orders: Math.floor(Math.random() * 10) + 1
        });
        currentBid -= Math.floor(Math.random() * 3);
    }
    return depth;
};

// --- API ---

// Simulates a Level II Data Stream
export const subscribeToTicker = (ticker, callback) => {
    const interval = setInterval(() => {
        // Random walk for mid price
        const yesPrice = randomPrice();
        const noPrice = 100 - yesPrice; // Reciprocal

        const data = {
            ticker,
            timestamp: Date.now(),
            yes: {
                price: yesPrice,
                bids: generateDepth(yesPrice)
            },
            no: {
                price: noPrice,
                bids: generateDepth(noPrice)
            },
            lastTrade: {
                price: yesPrice,
                side: Math.random() > 0.5 ? 'YES' : 'NO',
                size: Math.floor(Math.random() * 500)
            }
        };
        callback(data);
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
};

// Simulates "Market Race" data (ranking by % change)
export const subscribeToMarketRace = (callback) => {
    // Initialize random starting deltas
    let racers = TICKERS.map(t => ({
        ticker: t,
        delta: (Math.random() * 10) - 5, // -5% to +5%
        volatility: Math.random()
    }));

    const interval = setInterval(() => {
        // Update deltas
        racers = racers.map(r => ({
            ...r,
            delta: r.delta + (Math.random() - 0.5), // Random walk delta
        })).sort((a, b) => b.delta - a.delta); // Sort by highest gainer

        callback(racers);
    }, 500);

    return () => clearInterval(interval);
};

// Generate historical OHLCV candle data for charting
export const generateOHLCV = (ticker, count = 200, timeframeMinutes = 5) => {
    const candles = [];
    const now = Math.floor(Date.now() / 1000);
    const interval = timeframeMinutes * 60;
    let price = randomPrice();

    for (let i = count - 1; i >= 0; i--) {
        const time = now - i * interval;
        const open = price;
        const change = (Math.random() - 0.48) * 4; // Slight upward bias
        const high = Math.min(99, Math.max(1, open + Math.abs(change) + Math.random() * 2));
        const low = Math.max(1, Math.min(99, open - Math.abs(change) - Math.random() * 2));
        const close = Math.min(99, Math.max(1, open + change));
        const volume = Math.floor(Math.random() * 2000) + 100;

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
};

// Subscribe to streaming OHLCV updates for a chart
export const subscribeToOHLCV = (ticker, timeframeMinutes, callback) => {
    const interval = setInterval(() => {
        const price = randomPrice();
        const change = (Math.random() - 0.5) * 3;
        const open = price;
        const close = Math.min(99, Math.max(1, price + change));
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;

        callback({
            time: Math.floor(Date.now() / 1000),
            open: Math.round(open * 100) / 100,
            high: Math.round(Math.min(99, high) * 100) / 100,
            low: Math.round(Math.max(1, low) * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: Math.floor(Math.random() * 500) + 50,
        });
    }, UPDATE_INTERVAL_MS * 5); // Update candle every second

    return () => clearInterval(interval);
};

// Simulates "Holly" Scanner Alerts
export const subscribeToScanner = (callback) => {
    const interval = setInterval(() => {
        const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
        const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];

        const alert = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            ticker,
            strategy: strategy.name,
            type: strategy.type,
            conviction: Math.floor(Math.random() * 3) + 1, // 1-3 bars
            description: `${strategy.name} triggered on ${ticker} at $${randomPrice()}`
        };

        callback(alert);
    }, SCANNER_INTERVAL_MS);

    return () => clearInterval(interval);
};

// --- Historical Scanner ---

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
  const availablePatterns = pattern === 'all'
    ? HISTORICAL_PATTERNS
    : HISTORICAL_PATTERNS.filter((p) => p.key === pattern);

  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor(Math.random() * rangeDays);
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);

    const pat = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    const signal = pat.signals[Math.floor(Math.random() * pat.signals.length)];

    results.push({
      id: `hs-${i}-${Date.now()}`,
      date: date.toISOString().split('T')[0],
      ticker: TICKERS[Math.floor(Math.random() * TICKERS.length)],
      pattern: pat.name,
      signal,
      roi: parseFloat(((Math.random() - 0.3) * 20).toFixed(2)),
      confidence: Math.floor(Math.random() * 5) + 1,
    });
  }

  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const subscribeToTimeSales = (ticker, callback) => {
  let running = true;
  let lastPrice = randomPrice();

  const scheduleNext = () => {
    if (!running) return;
    const delay = Math.floor(Math.random() * 400) + 100;
    setTimeout(() => {
      if (!running) return;
      const change = (Math.random() - 0.5) * 4;
      lastPrice = Math.min(99, Math.max(1, Math.round(lastPrice + change)));
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
        ticker,
      });
      scheduleNext();
    }, delay);
  };

  scheduleNext();
  return () => { running = false; };
};
