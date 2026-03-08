// Alert Service — orchestration layer
// Bridges dataFeed tick data to alertEngine Web Worker.
// Manages alert rules and history with localStorage persistence.
// Follows same patterns as hotkeyStore.js (localStorage + listener set).

import * as dataFeed from './dataFeed';

// --- Constants ---

const LS_RULES_KEY = 'kalshi_alert_rules';
const LS_HISTORY_KEY = 'kalshi_alert_history';
const MAX_HISTORY = 200;
const VALID_RULE_TYPES = ['price_crosses', 'pct_change', 'volume_spike'];
const VALID_PRICE_DIRECTIONS = ['above', 'below', 'either'];

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validateRuleParams(type, params) {
  const errors = [];

  switch (type) {
    case 'price_crosses':
      if (!isFiniteNumber(params.threshold)) {
        errors.push('threshold must be a finite number');
      }
      if (!VALID_PRICE_DIRECTIONS.includes(params.direction)) {
        errors.push(`direction must be one of: ${VALID_PRICE_DIRECTIONS.join(', ')}`);
      }
      break;
    case 'pct_change':
      if (!isFiniteNumber(params.pctThreshold) || params.pctThreshold < 0) {
        errors.push('pctThreshold must be a non-negative number');
      }
      if (!isPositiveInteger(params.lookback)) {
        errors.push('lookback must be a positive integer');
      }
      break;
    case 'volume_spike':
      if (!isFiniteNumber(params.multiplier) || params.multiplier <= 0) {
        errors.push('multiplier must be a positive number');
      }
      if (!isPositiveInteger(params.window)) {
        errors.push('window must be a positive integer');
      }
      break;
    default:
      break;
  }

  if (errors.length) {
    throw new Error(`Invalid params for "${type}": ${errors.join('; ')}`);
  }
}

// --- Worker lifecycle ---

let worker = null;
let workerReady = false;

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(
    new URL('./alertEngine.worker.js', import.meta.url),
    { type: 'module' }
  );
  worker.onmessage = handleWorkerMessage;
  worker.onerror = (err) => {
    console.error('[AlertService] Worker error:', err);
    // Auto-recover: terminate crashed worker so next ensureWorker() restarts it
    worker = null;
    workerReady = false;
    // Attempt restart after 2s
    setTimeout(() => {
      if (!worker && _loadRules().some((r) => r.enabled)) {
        ensureWorker();
        // Existing ticker subscriptions capture the old worker; force a rebind.
        syncTickerSubscriptions({ forceResubscribe: true });
      }
    }, 2000);
  };
  // Sync rules to worker
  worker.postMessage({ type: 'set_rules', payload: { rules: getRules() } });
  workerReady = true;
  return worker;
}

function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
    workerReady = false;
  }
}

// --- State ---

let _rules = null; // lazy-loaded from localStorage
let _history = null; // lazy-loaded from localStorage
const _alertListeners = new Set(); // notified on new alerts
const _rulesListeners = new Set(); // notified on rule changes

// --- Persistence (mirrors hotkeyStore pattern) ---

function _loadRules() {
  if (_rules) return _rules;
  try {
    const raw = localStorage.getItem(LS_RULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        _rules = parsed;
        return _rules;
      }
    }
  } catch { /* ignore corrupt data */ }
  _rules = [];
  return _rules;
}

function _persistRules() {
  try {
    localStorage.setItem(LS_RULES_KEY, JSON.stringify(_rules));
  } catch { /* quota exceeded */ }
  _notifyRulesListeners();
  // Sync to worker
  if (workerReady && worker) {
    worker.postMessage({ type: 'set_rules', payload: { rules: _rules } });
  }
}

function _loadHistory() {
  if (_history) return _history;
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        _history = parsed;
        return _history;
      }
    }
  } catch { /* ignore */ }
  _history = [];
  return _history;
}

function _persistHistory() {
  try {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(_history));
  } catch { /* quota exceeded */ }
}

function _notifyAlertListeners(alert) {
  _alertListeners.forEach((cb) => {
    try { cb(alert); } catch { /* ignore */ }
  });
}

function _notifyRulesListeners() {
  const rules = getRules();
  _rulesListeners.forEach((cb) => {
    try { cb(rules); } catch { /* ignore */ }
  });
}

// --- Worker message handling ---

function handleWorkerMessage(e) {
  const { type, alerts } = e.data;
  if (type === 'alerts' && Array.isArray(alerts)) {
    const history = _loadHistory();
    for (const alert of alerts) {
      const entry = { ...alert, id: crypto.randomUUID() };
      history.unshift(entry);
      _notifyAlertListeners(entry);
    }
    // Trim history
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    _persistHistory();
  }
}

// --- Ticker subscriptions ---
// We subscribe to dataFeed tickers and forward price/volume to the worker.

const tickerUnsubs = {}; // ticker -> unsubscribe fn

function subscribeTickerToWorker(ticker, { forceResubscribe = false } = {}) {
  if (tickerUnsubs[ticker]) {
    if (!forceResubscribe) return; // already subscribed
    tickerUnsubs[ticker]();
    delete tickerUnsubs[ticker];
  }

  ensureWorker();
  const unsub = dataFeed.subscribeToTicker(ticker, (data) => {
    const price = data.yes?.price ?? 0;
    // Volume: approximate from lastTrade size
    const volume = data.lastTrade?.size ?? 0;
    const currentWorker = worker;
    if (!workerReady || !currentWorker) return;
    currentWorker.postMessage({
      type: 'tick',
      payload: { ticker, price, volume },
    });
  });
  tickerUnsubs[ticker] = unsub;
}

function unsubscribeTickerFromWorker(ticker) {
  if (tickerUnsubs[ticker]) {
    tickerUnsubs[ticker]();
    delete tickerUnsubs[ticker];
  }
}

/** Sync ticker subscriptions to match current rules */
function syncTickerSubscriptions({ forceResubscribe = false } = {}) {
  const rules = _loadRules();
  const neededTickers = new Set();

  for (const rule of rules) {
    if (rule.enabled && rule.ticker && rule.ticker !== '*') {
      neededTickers.add(rule.ticker);
    }
  }

  // Subscribe to new tickers
  for (const ticker of neededTickers) {
    subscribeTickerToWorker(ticker, { forceResubscribe });
  }

  // Unsubscribe from tickers no longer needed
  for (const ticker of Object.keys(tickerUnsubs)) {
    if (!neededTickers.has(ticker)) {
      unsubscribeTickerFromWorker(ticker);
    }
  }
}

// --- Public API: Rules CRUD ---

function getRules() {
  return [..._loadRules()];
}

/**
 * Add a new alert rule.
 * @param {Object} rule - { type, ticker, params, label? }
 *   type: 'price_crosses' | 'pct_change' | 'volume_spike'
 *   ticker: market ticker string
 *   params: type-specific params (see alertEngine.worker.js)
 *   label: optional human-readable label
 * @returns {Object} the created rule
 */
function addRule({ type, ticker, params, label }) {
  if (!VALID_RULE_TYPES.includes(type)) {
    throw new Error(`Invalid alert type: "${type}". Must be one of: ${VALID_RULE_TYPES.join(', ')}`);
  }
  if (typeof ticker !== 'string' || !ticker.trim()) throw new Error('ticker is required');
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('params object is required');
  }
  validateRuleParams(type, params);

  const rules = _loadRules();
  const rule = {
    id: crypto.randomUUID(),
    type,
    ticker,
    params,
    label: label || `${type} on ${ticker}`,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  rules.push(rule);
  _persistRules();
  syncTickerSubscriptions();
  return { ...rule };
}

function updateRule(id, updates) {
  const rules = _loadRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Rule "${id}" not found`);

  // Don't allow changing id
  const { id: _ignored, ...safeUpdates } = updates;
  rules[idx] = { ...rules[idx], ...safeUpdates };
  _persistRules();
  syncTickerSubscriptions();
  return { ...rules[idx] };
}

function removeRule(id) {
  const rules = _loadRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return;

  rules.splice(idx, 1);
  _persistRules();

  // Tell worker
  if (workerReady && worker) {
    worker.postMessage({ type: 'remove_rule', payload: { id } });
  }
  syncTickerSubscriptions();
}

function toggleRule(id) {
  const rules = _loadRules();
  const rule = rules.find((r) => r.id === id);
  if (!rule) throw new Error(`Rule "${id}" not found`);
  rule.enabled = !rule.enabled;
  _persistRules();
  syncTickerSubscriptions();
  return { ...rule };
}

// --- Public API: History ---

function getHistory() {
  return [..._loadHistory()];
}

function clearHistory() {
  _history = [];
  _persistHistory();
}

// --- Public API: Subscriptions ---

/** Subscribe to new alert events (fired in real time) */
function onAlert(callback) {
  _alertListeners.add(callback);
  return () => _alertListeners.delete(callback);
}

/** Subscribe to rule changes */
function onRulesChange(callback) {
  _rulesListeners.add(callback);
  return () => _rulesListeners.delete(callback);
}

// --- Public API: Lifecycle ---

/** Initialize the alert service. Call once at app startup. */
function initialize() {
  _loadRules();
  _loadHistory();
  ensureWorker();
  syncTickerSubscriptions();
}

/** Shut down the alert service. Cleans up worker and subscriptions. */
function destroy() {
  // Unsubscribe all tickers
  for (const ticker of Object.keys(tickerUnsubs)) {
    unsubscribeTickerFromWorker(ticker);
  }
  terminateWorker();
}

// --- Exports ---

export {
  initialize,
  destroy,
  // Rules
  getRules,
  addRule,
  updateRule,
  removeRule,
  toggleRule,
  // History
  getHistory,
  clearHistory,
  // Subscriptions
  onAlert,
  onRulesChange,
};
