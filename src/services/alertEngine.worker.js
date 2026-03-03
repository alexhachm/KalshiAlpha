// Alert Engine Web Worker
// Evaluates alert rules against incoming tick data using Float64Array circular buffers.
// Supports 3 alert types: price_crosses, pct_change, volume_spike.
// Communicates with alertService.js via postMessage.

// --- Circular Buffer (Float64Array) ---

function createBuffer(capacity) {
  return {
    data: new Float64Array(capacity),
    head: 0,
    count: 0,
    capacity,
  };
}

function bufferPush(buf, value) {
  buf.data[buf.head] = value;
  buf.head = (buf.head + 1) % buf.capacity;
  if (buf.count < buf.capacity) buf.count++;
}

function bufferGet(buf, indexFromEnd) {
  if (indexFromEnd >= buf.count) return NaN;
  const idx = (buf.head - 1 - indexFromEnd + buf.capacity) % buf.capacity;
  return buf.data[idx];
}

function bufferLatest(buf) {
  return bufferGet(buf, 0);
}

function bufferPrevious(buf) {
  return bufferGet(buf, 1);
}

// --- Per-ticker state ---

const BUFFER_CAPACITY = 256;
const tickerState = {}; // ticker -> { prices, volumes }

function getTickerState(ticker) {
  if (!tickerState[ticker]) {
    tickerState[ticker] = {
      prices: createBuffer(BUFFER_CAPACITY),
      volumes: createBuffer(BUFFER_CAPACITY),
    };
  }
  return tickerState[ticker];
}

// --- Alert rules ---

let rules = []; // { id, type, ticker, params, enabled }

// --- Evaluators ---

/**
 * price_crosses: fires when price crosses a threshold.
 * params: { threshold, direction: 'above' | 'below' | 'either' }
 */
function evalPriceCrosses(rule, state) {
  const current = bufferLatest(state.prices);
  const prev = bufferPrevious(state.prices);
  if (isNaN(current) || isNaN(prev)) return null;

  const { threshold, direction } = rule.params;

  const crossedAbove = prev <= threshold && current > threshold;
  const crossedBelow = prev >= threshold && current < threshold;

  if (
    (direction === 'above' && crossedAbove) ||
    (direction === 'below' && crossedBelow) ||
    (direction === 'either' && (crossedAbove || crossedBelow))
  ) {
    return {
      ruleId: rule.id,
      type: 'price_crosses',
      ticker: rule.ticker,
      message: `${rule.ticker} crossed ${crossedAbove ? 'above' : 'below'} ${threshold}¢`,
      price: current,
      threshold,
      direction: crossedAbove ? 'above' : 'below',
      timestamp: Date.now(),
    };
  }
  return null;
}

/**
 * pct_change: fires when price changes by more than X% over the lookback window.
 * params: { pctThreshold, lookback (number of ticks) }
 */
function evalPctChange(rule, state) {
  const lookback = rule.params.lookback || 10;
  const current = bufferLatest(state.prices);
  const reference = bufferGet(state.prices, Math.min(lookback, state.prices.count - 1));
  if (isNaN(current) || isNaN(reference) || reference === 0) return null;

  const pctChange = ((current - reference) / reference) * 100;
  const absChange = Math.abs(pctChange);

  if (absChange >= rule.params.pctThreshold) {
    return {
      ruleId: rule.id,
      type: 'pct_change',
      ticker: rule.ticker,
      message: `${rule.ticker} moved ${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}% over ${lookback} ticks`,
      price: current,
      pctChange,
      timestamp: Date.now(),
    };
  }
  return null;
}

/**
 * volume_spike: fires when latest volume exceeds rolling average by a multiplier.
 * params: { multiplier, window (number of ticks for average) }
 */
function evalVolumeSpike(rule, state) {
  const window = rule.params.window || 20;
  if (state.volumes.count < window) return null;

  const latestVol = bufferLatest(state.volumes);
  if (latestVol === 0) return null;

  // Compute rolling average (excluding latest)
  let sum = 0;
  for (let i = 1; i < window; i++) {
    const v = bufferGet(state.volumes, i);
    if (isNaN(v)) return null;
    sum += v;
  }
  const avg = sum / (window - 1);
  if (avg === 0) return null;

  const ratio = latestVol / avg;
  if (ratio >= rule.params.multiplier) {
    return {
      ruleId: rule.id,
      type: 'volume_spike',
      ticker: rule.ticker,
      message: `${rule.ticker} volume spike: ${latestVol.toFixed(0)} (${ratio.toFixed(1)}x avg)`,
      volume: latestVol,
      avgVolume: avg,
      ratio,
      timestamp: Date.now(),
    };
  }
  return null;
}

const EVALUATORS = {
  price_crosses: evalPriceCrosses,
  pct_change: evalPctChange,
  volume_spike: evalVolumeSpike,
};

// --- Cooldown tracking ---
// Prevents the same rule from firing repeatedly on every tick.
// Each rule gets a cooldown period (default 30s) after firing.

const cooldowns = {}; // ruleId -> last fired timestamp
const DEFAULT_COOLDOWN_MS = 30000;

function isOnCooldown(ruleId) {
  const last = cooldowns[ruleId];
  if (!last) return false;
  return Date.now() - last < DEFAULT_COOLDOWN_MS;
}

// --- Tick processing ---

function processTick(ticker, price, volume) {
  const state = getTickerState(ticker);
  bufferPush(state.prices, price);
  bufferPush(state.volumes, volume);

  const alerts = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.ticker !== ticker && rule.ticker !== '*') continue;
    if (isOnCooldown(rule.id)) continue;

    const evaluator = EVALUATORS[rule.type];
    if (!evaluator) continue;

    const result = evaluator(rule, state);
    if (result) {
      cooldowns[rule.id] = Date.now();
      alerts.push(result);
    }
  }

  if (alerts.length > 0) {
    self.postMessage({ type: 'alerts', alerts });
  }
}

// --- Message handler ---

self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'tick':
      // payload: { ticker, price, volume }
      processTick(payload.ticker, payload.price, payload.volume || 0);
      break;

    case 'set_rules':
      // payload: { rules: [...] }
      rules = payload.rules || [];
      break;

    case 'add_rule':
      // payload: single rule object
      rules.push(payload);
      break;

    case 'remove_rule':
      // payload: { id }
      rules = rules.filter((r) => r.id !== payload.id);
      delete cooldowns[payload.id];
      break;

    case 'update_rule':
      // payload: { id, ...updates }
      for (let i = 0; i < rules.length; i++) {
        if (rules[i].id === payload.id) {
          rules[i] = { ...rules[i], ...payload };
          break;
        }
      }
      break;

    case 'clear_cooldown':
      // payload: { id } or empty to clear all
      if (payload && payload.id) {
        delete cooldowns[payload.id];
      } else {
        for (const key in cooldowns) delete cooldowns[key];
      }
      break;

    case 'ping':
      self.postMessage({ type: 'pong', timestamp: Date.now(), ruleCount: rules.length });
      break;
  }
};
