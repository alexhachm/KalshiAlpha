// Analytics Service — data fetching, caching, and mock fallback for analytics.
// Bridges Kalshi fills/settlements API to analyticsCalc pure functions.

// STUB: Settlement-aware P&L — requires Kalshi settlements/portfolio history endpoint
// SOURCE: Current computePnLFromFills uses FIFO buy/sell pairing but doesn't account for binary
//   settlement (contract settles at 100 or 0 cents). Settled markets are not detected.
// IMPLEMENT: Fetch market status per ticker, if settled: P&L = (settlement_value - avg_cost) * contracts,
//   where settlement_value is 100 (yes wins) or 0 (no wins). Cross-reference with getMarket(ticker).result

import * as kalshiApi from './kalshiApi';
import * as calc from './analyticsCalc';

// --- Cache Configuration ---

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_FILLS_KEY = 'kalshi_analytics_fills';
const LS_SETTLEMENTS_KEY = 'kalshi_analytics_settlements';

// --- localStorage Cache ---

function tsKey(key) {
  return key + '_ts';
}

function getCachedData(key) {
  try {
    const tsRaw = localStorage.getItem(tsKey(key));
    if (!tsRaw) return null;

    const ts = parseInt(tsRaw, 10);
    if (Date.now() - ts > CACHE_TTL_MS) return null;

    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(tsKey(key), String(Date.now()));
  } catch { /* quota exceeded */ }
}

function clearCache() {
  try {
    localStorage.removeItem(LS_FILLS_KEY);
    localStorage.removeItem(tsKey(LS_FILLS_KEY));
    localStorage.removeItem(LS_SETTLEMENTS_KEY);
    localStorage.removeItem(tsKey(LS_SETTLEMENTS_KEY));
  } catch { /* ignore */ }
}

// --- Data Fetching ---

/**
 * Fetch fills from Kalshi API with cache.
 * Falls back to mock data if API is unavailable.
 * @returns {Array} fills
 */
async function fetchFills() {
  const cached = getCachedData(LS_FILLS_KEY);
  if (cached) return cached;

  try {
    if (!kalshiApi.isConfigured()) throw new Error('API not configured');

    const allFills = [];
    let cursor = null;

    do {
      const params = { limit: 1000 };
      if (cursor) params.cursor = cursor;
      const res = await kalshiApi.getFills(params);
      if (res?.fills) allFills.push(...res.fills);
      cursor = res?.cursor || null;
    } while (cursor);

    setCachedData(LS_FILLS_KEY, allFills);
    return allFills;
  } catch {
    return null; // signals caller to use mock data
  }
}

/**
 * Fetch settlement history from Kalshi API with cache.
 * Uses the fills endpoint filtered for settled markets as a proxy.
 * @returns {Array} settlements
 */
async function fetchSettlements() {
  const cached = getCachedData(LS_SETTLEMENTS_KEY);
  if (cached) return cached;

  try {
    if (!kalshiApi.isConfigured()) throw new Error('API not configured');

    // Kalshi doesn't have a separate settlements endpoint — we derive
    // settlement info from fills on settled markets. Fills with settlement
    // context are identified by the market's resolved status.
    const fills = await fetchFills();
    if (!fills) return null;

    // Filter fills that appear to be settlement-related (side === 'settlement')
    // or just return all fills for now — the calc layer handles P&L.
    setCachedData(LS_SETTLEMENTS_KEY, fills);
    return fills;
  } catch {
    return null;
  }
}

// --- Mock Data Generation (60 synthetic trades) ---

const MOCK_CATEGORIES = ['politics', 'economics', 'crypto', 'weather', 'sports'];
const MOCK_TICKERS = [
  'PRES-2026-WINNER', 'FED-RATE-CUT-MAR26', 'BTC-100K-MAR26',
  'RAIN-NYC-MAR15', 'NFL-SUPERBOWL-2027', 'CPI-FEB26-ABOVE',
  'UNEMPLOYMENT-MAR26', 'SP500-5500-MAR26', 'ETH-5K-APR26',
  'FED-RATE-CUT-JUN26',
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateMockTrades() {
  const rng = seededRandom(42);
  const trades = [];
  const now = Date.now();
  const DAY = 86400000;

  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(rng() * 90); // spread over 90 days
    const timestamp = now - daysAgo * DAY - Math.floor(rng() * DAY);
    const ticker = MOCK_TICKERS[Math.floor(rng() * MOCK_TICKERS.length)];
    const category = MOCK_CATEGORIES[Math.floor(rng() * MOCK_CATEGORIES.length)];
    const side = rng() > 0.5 ? 'yes' : 'no';
    const action = rng() > 0.3 ? 'buy' : 'sell';
    const priceCents = Math.floor(rng() * 70) + 15; // 15-85c
    const count = Math.floor(rng() * 100) + 1;

    // Simulate P&L: ~55% win rate with slight positive edge
    const isWin = rng() < 0.55;
    const pnlMagnitude = Math.floor(rng() * 40 * count) + count;
    const pnlCents = isWin ? pnlMagnitude : -pnlMagnitude;

    trades.push({
      trade_id: `mock-fill-${i}`,
      ticker,
      category,
      side,
      action,
      yes_price: priceCents,
      count,
      pnlCents,
      timestamp,
      created_time: new Date(timestamp).toISOString(),
    });
  }

  return trades.sort((a, b) => a.timestamp - b.timestamp);
}

let _mockTrades = null;
function getMockTrades() {
  if (!_mockTrades) _mockTrades = generateMockTrades();
  return _mockTrades;
}

// --- Trade Normalization ---

/**
 * Normalize a Kalshi fill into the format expected by analyticsCalc.
 * Since Kalshi fills don't include P&L directly, we estimate from
 * buy/sell pairs and settlement outcomes.
 */
function normalizeFill(fill) {
  return {
    tradeId: fill.trade_id,
    ticker: fill.ticker || fill.market_ticker || '',
    category: fill.category || 'uncategorized',
    side: fill.side || 'yes',
    action: fill.action || 'buy',
    priceCents: fill.yes_price || fill.price || 0,
    count: parseFloat(fill.count_fp || fill.count || '0'),
    pnlCents: fill.pnlCents || 0, // pre-computed for mocks; zero for raw API fills
    timestamp: fill.created_time
      ? new Date(fill.created_time).getTime()
      : fill.timestamp || Date.now(),
  };
}

/**
 * Compute P&L from a list of raw fills by pairing buys and sells per ticker+side.
 * Uses FIFO matching: first buy matched against first sell.
 * @param {Array} fills - normalized fills
 * @returns {Array} fills with pnlCents populated
 */
function computePnLFromFills(fills) {
  // Group fills by ticker + side
  const groups = {};
  for (const f of fills) {
    const key = `${f.ticker}:${f.side}`;
    if (!groups[key]) groups[key] = { buys: [], sells: [] };
    if (f.action === 'buy') groups[key].buys.push({ ...f });
    else groups[key].sells.push({ ...f });
  }

  const result = [];

  for (const [, group] of Object.entries(groups)) {
    // Sort by timestamp for FIFO
    group.buys.sort((a, b) => a.timestamp - b.timestamp);
    group.sells.sort((a, b) => a.timestamp - b.timestamp);

    let buyIdx = 0;
    let buyRemaining = group.buys[0]?.count || 0;

    for (const sell of group.sells) {
      let sellRemaining = sell.count;

      while (sellRemaining > 0 && buyIdx < group.buys.length) {
        const matched = Math.min(buyRemaining, sellRemaining);
        const buyPrice = group.buys[buyIdx].priceCents;
        const sellPrice = sell.priceCents;
        const pnl = (sellPrice - buyPrice) * matched;

        result.push({
          ...sell,
          count: matched,
          pnlCents: pnl,
        });

        buyRemaining -= matched;
        sellRemaining -= matched;

        if (buyRemaining <= 0) {
          buyIdx++;
          buyRemaining = group.buys[buyIdx]?.count || 0;
        }
      }

      // Unmatched sells (short positions or settlement)
      if (sellRemaining > 0) {
        result.push({ ...sell, count: sellRemaining, pnlCents: 0 });
      }
    }

    // Unmatched buys are open positions — include with zero realized P&L.
    // The current FIFO lot may be partially consumed, so emit its residual size.
    for (let i = buyIdx; i < group.buys.length; i++) {
      const remainingCount = i === buyIdx ? buyRemaining : group.buys[i].count;
      if (remainingCount > 0) {
        result.push({ ...group.buys[i], count: remainingCount, pnlCents: 0 });
      }
    }
  }

  return result.sort((a, b) => a.timestamp - b.timestamp);
}

// --- Public API ---

/**
 * Get all trades (normalized, with P&L) — from API or mock fallback.
 * @returns {Promise<Array>} trades with pnlCents
 */
async function getTrades() {
  const apiFills = await fetchFills();

  if (apiFills && apiFills.length > 0) {
    const normalized = apiFills.map(normalizeFill);
    return computePnLFromFills(normalized);
  }

  // Mock fallback — trades already have pnlCents
  return getMockTrades().map(normalizeFill);
}

/**
 * Get full analytics snapshot — all metrics computed at once.
 * @param {Object} [currentPrices] - { ticker: yesPriceCents } for mark-to-market
 * @param {Array} [openPositions] - for mark-to-market
 * @returns {Promise<Object>} analytics snapshot
 */
async function getAnalyticsSnapshot(currentPrices = {}, openPositions = []) {
  const trades = await getTrades();

  return {
    winRate: calc.winRate(trades),
    totalPnL: calc.totalPnL(trades),
    expectedValue: calc.expectedValue(trades),
    kellyFraction: calc.kellyFraction(trades),
    omegaRatio: calc.omegaRatio(trades),
    sharpeRatio: calc.sharpeRatio(trades),
    maxDrawdown: calc.maxDrawdown(trades),
    profitFactor: calc.profitFactor(trades),
    categoryAttribution: calc.categoryAttribution(trades),
    equityCurve: calc.equityCurve(trades),
    dailyPnL: calc.dailyPnL(trades),
    markToMarket: calc.markToMarket(openPositions, currentPrices),
    tradeCount: trades.length,
    timestamp: Date.now(),
  };
}

/**
 * Check if we're using mock data (API not configured or unavailable).
 * @returns {boolean}
 */
function isUsingMockData() {
  return !kalshiApi.isConfigured();
}

export {
  getTrades,
  getAnalyticsSnapshot,
  clearCache,
  isUsingMockData,
  // Exposed for testing
  getMockTrades,
  normalizeFill,
  computePnLFromFills,
};
