// Analytics Calculation Library — pure functions for portfolio analytics.
// All price inputs are in cents (1-99). All monetary values in cents unless noted.

/**
 * Win rate: fraction of trades that were profitable.
 * @param {Array} trades - Array of { pnlCents }
 * @returns {number} 0-1 ratio
 */
export function winRate(trades) {
  if (!trades || trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnlCents > 0).length;
  return wins / trades.length;
}

/**
 * Total P&L across all trades (in cents).
 * @param {Array} trades - Array of { pnlCents }
 * @returns {number} sum in cents
 */
export function totalPnL(trades) {
  if (!trades || trades.length === 0) return 0;
  return trades.reduce((sum, t) => sum + (t.pnlCents || 0), 0);
}

/**
 * Expected value per trade (in cents).
 * @param {Array} trades - Array of { pnlCents }
 * @returns {number} average pnl in cents
 */
export function expectedValue(trades) {
  if (!trades || trades.length === 0) return 0;
  return totalPnL(trades) / trades.length;
}

/**
 * Kelly fraction — optimal bet sizing.
 * Uses the simplified Kelly formula: f* = (bp - q) / b
 *   where b = average win / average loss, p = win probability, q = 1 - p.
 * @param {Array} trades - Array of { pnlCents }
 * @returns {number} fraction (0-1 clamped, 0 if not profitable)
 */
export function kellyFraction(trades) {
  if (!trades || trades.length === 0) return 0;

  const wins = trades.filter((t) => t.pnlCents > 0);
  const losses = trades.filter((t) => t.pnlCents < 0);

  if (wins.length === 0 || losses.length === 0) return 0;

  const avgWin = wins.reduce((s, t) => s + t.pnlCents, 0) / wins.length;
  const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnlCents, 0) / losses.length);

  if (avgLoss === 0) return 0;

  const b = avgWin / avgLoss; // win/loss ratio
  const p = wins.length / trades.length;
  const q = 1 - p;

  const kelly = (b * p - q) / b;
  return Math.max(0, Math.min(1, kelly));
}

/**
 * Omega ratio: ratio of gains above threshold to losses below threshold.
 * Higher is better; > 1 means profitable above the threshold.
 * @param {Array} trades - Array of { pnlCents }
 * @param {number} [threshold=0] - Threshold in cents
 * @returns {number} omega ratio (Infinity if no losses below threshold)
 */
export function omegaRatio(trades, threshold = 0) {
  if (!trades || trades.length === 0) return 0;

  let gains = 0;
  let losses = 0;

  for (const t of trades) {
    const excess = (t.pnlCents || 0) - threshold;
    if (excess > 0) gains += excess;
    else losses += Math.abs(excess);
  }

  if (losses === 0) return gains > 0 ? Infinity : 0;
  return gains / losses;
}

/**
 * Category attribution: P&L broken down by category.
 * @param {Array} trades - Array of { pnlCents, category }
 * @returns {Object} { [category]: { pnl, count, winRate } }
 */
export function categoryAttribution(trades) {
  if (!trades || trades.length === 0) return {};

  const groups = {};

  for (const t of trades) {
    const cat = t.category || 'uncategorized';
    if (!groups[cat]) groups[cat] = { pnl: 0, count: 0, wins: 0 };
    groups[cat].pnl += t.pnlCents || 0;
    groups[cat].count += 1;
    if (t.pnlCents > 0) groups[cat].wins += 1;
  }

  const result = {};
  for (const [cat, data] of Object.entries(groups)) {
    result[cat] = {
      pnl: data.pnl,
      count: data.count,
      winRate: data.count > 0 ? data.wins / data.count : 0,
    };
  }

  return result;
}

/**
 * Equity curve: cumulative P&L over time (sorted by timestamp).
 * @param {Array} trades - Array of { pnlCents, timestamp }
 * @returns {Array} [{ timestamp, equity }] — equity in cents
 */
export function equityCurve(trades) {
  if (!trades || trades.length === 0) return [];

  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  let cumulative = 0;
  return sorted.map((t) => {
    cumulative += t.pnlCents || 0;
    return { timestamp: t.timestamp, equity: cumulative };
  });
}

/**
 * Daily P&L: aggregate P&L by calendar day.
 * @param {Array} trades - Array of { pnlCents, timestamp }
 * @returns {Array} [{ date: 'YYYY-MM-DD', pnl, count }] sorted chronologically
 */
export function dailyPnL(trades) {
  if (!trades || trades.length === 0) return [];

  const byDay = {};

  for (const t of trades) {
    const date = new Date(t.timestamp).toISOString().split('T')[0];
    if (!byDay[date]) byDay[date] = { pnl: 0, count: 0 };
    byDay[date].pnl += t.pnlCents || 0;
    byDay[date].count += 1;
  }

  return Object.entries(byDay)
    .map(([date, data]) => ({ date, pnl: data.pnl, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Sharpe ratio: risk-adjusted return metric.
 * Uses per-trade returns (pnlCents / costCents) when cost is available,
 * otherwise falls back to pnlCents as the return series.
 * Annualized using sqrt(N) where N is the number of trades per year (estimated).
 * @param {Array} trades - Array of { pnlCents, timestamp }
 * @param {number} [riskFreeRate=0] - Annual risk-free rate (e.g., 0.05 for 5%)
 * @returns {number} annualized Sharpe ratio (0 if insufficient data)
 */
export function sharpeRatio(trades, riskFreeRate = 0) {
  if (!trades || trades.length < 2) return 0;

  const returns = trades.map((t) => t.pnlCents || 0);
  const n = returns.length;
  const mean = returns.reduce((s, r) => s + r, 0) / n;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Estimate trades per year from the data's time span
  const timestamps = trades.filter((t) => t.timestamp).map((t) => t.timestamp);
  let annualizationFactor = Math.sqrt(252); // default: ~daily trading
  if (timestamps.length >= 2) {
    const span = Math.max(...timestamps) - Math.min(...timestamps);
    const daysSpan = span / 86400000;
    if (daysSpan > 0) {
      const tradesPerDay = n / daysSpan;
      const tradesPerYear = tradesPerDay * 252;
      annualizationFactor = Math.sqrt(tradesPerYear);
    }
  }

  const rfPerTrade = riskFreeRate / (annualizationFactor ** 2 || 1);
  return ((mean - rfPerTrade) / stdDev) * annualizationFactor;
}

/**
 * Maximum drawdown: largest peak-to-trough decline in equity curve.
 * @param {Array} trades - Array of { pnlCents, timestamp }
 * @returns {Object} { maxDrawdown (cents, negative), maxDrawdownPct (0-1), peakTimestamp, troughTimestamp }
 */
export function maxDrawdown(trades) {
  if (!trades || trades.length === 0) return { maxDrawdown: 0, maxDrawdownPct: 0 };

  const curve = equityCurve(trades);
  let peak = 0;
  let peakTs = curve[0]?.timestamp;
  let worstDrawdown = 0;
  let worstPct = 0;
  let troughTs = peakTs;

  for (const point of curve) {
    if (point.equity > peak) {
      peak = point.equity;
      peakTs = point.timestamp;
    }
    const drawdown = point.equity - peak;
    if (drawdown < worstDrawdown) {
      worstDrawdown = drawdown;
      worstPct = peak > 0 ? Math.abs(drawdown) / peak : 0;
      troughTs = point.timestamp;
    }
  }

  return {
    maxDrawdown: worstDrawdown,
    maxDrawdownPct: worstPct,
    peakTimestamp: peakTs,
    troughTimestamp: troughTs,
  };
}

/**
 * Profit factor: gross profits / gross losses.
 * Values > 1 indicate profitable trading. Higher is better.
 * @param {Array} trades - Array of { pnlCents }
 * @returns {number} profit factor (Infinity if no losses, 0 if no profits)
 */
export function profitFactor(trades) {
  if (!trades || trades.length === 0) return 0;

  let grossProfit = 0;
  let grossLoss = 0;

  for (const t of trades) {
    const pnl = t.pnlCents || 0;
    if (pnl > 0) grossProfit += pnl;
    else grossLoss += Math.abs(pnl);
  }

  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

/**
 * Mark-to-market: value open positions at current prices.
 * @param {Array} positions - Array of { ticker, side, count, avgPriceCents }
 * @param {Object} currentPrices - { ticker: yesPriceCents }
 * @returns {Object} { totalMtm, positions: [{ ticker, side, mtm, count }] }
 */
export function markToMarket(positions, currentPrices) {
  if (!positions || positions.length === 0) return { totalMtm: 0, positions: [] };

  const results = positions.map((pos) => {
    const currentPrice = currentPrices[pos.ticker] || 0;
    // For YES positions: value = (currentPrice - avgPrice) * count
    // For NO positions: value = ((100 - currentPrice) - avgPrice) * count
    const effectivePrice = pos.side === 'yes' ? currentPrice : 100 - currentPrice;
    const mtm = (effectivePrice - pos.avgPriceCents) * pos.count;

    return {
      ticker: pos.ticker,
      side: pos.side,
      mtm,
      count: pos.count,
    };
  });

  const totalMtm = results.reduce((sum, r) => sum + r.mtm, 0);
  return { totalMtm, positions: results };
}
