// Alert Service — orchestration layer
// Bridges dataFeed tick data to alertEngine Web Worker.
// Manages alert rules and history with localStorage persistence.
// Follows same patterns as hotkeyStore.js (localStorage + listener set).

import * as dataFeed from './dataFeed';
import * as settingsStore from './settingsStore';

// --- Constants ---

const LS_RULES_KEY = 'kalshi_alert_rules';
const LS_HISTORY_KEY = 'kalshi_alert_history';
const MAX_HISTORY = 200;
const DEFAULT_TTL_MINUTES = 60;
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

// --- Notification dispatch (settings-driven) ---

let _alertAudioCtx = null;

function _getAudioContext() {
  if (!_alertAudioCtx) {
    try {
      _alertAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      // Web Audio not available
    }
  }
  return _alertAudioCtx;
}

function _playAlertSound() {
  const ctx = _getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore audio errors
  }
}

function _showDesktopNotification(alert) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    const title = `Alert: ${alert.ticker || 'Unknown'}`
    const body = alert.message || alert.label || `${(alert.type || '').replace('_', ' ')} triggered`;
    new Notification(title, { body, tag: alert.id });
  } catch {
    // notification construction failed
  }
}

function dispatchNotification(alert) {
  const notifSettings = settingsStore.getNotifications();

  if (notifSettings.soundAlerts) {
    _playAlertSound();
  }

  if (notifSettings.desktopNotifications) {
    _showDesktopNotification(alert);
  }
}

function requestDesktopPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

function getDesktopPermissionStatus() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// --- Worker message handling ---

function handleWorkerMessage(e) {
  const { type, alerts } = e.data;
  if (type === 'alerts' && Array.isArray(alerts)) {
    const history = _loadHistory();
    const rules = _loadRules();
    for (const alert of alerts) {
      // Skip alerts from expired rules
      const sourceRule = rules.find((r) => r.id === alert.ruleId);
      if (sourceRule && isRuleExpired(sourceRule)) continue;

      const entry = {
        ...alert,
        id: crypto.randomUUID(),
        firedAt: new Date().toISOString(),
        thesis: sourceRule?.thesis || '',
        invalidation: sourceRule?.invalidation || '',
      };
      history.unshift(entry);
      dispatchNotification(entry);
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
 * @param {Object} rule - { type, ticker, params, label?, ttlMinutes?, thesis?, invalidation? }
 *   type: 'price_crosses' | 'pct_change' | 'volume_spike'
 *   ticker: market ticker string
 *   params: type-specific params (see alertEngine.worker.js)
 *   label: optional human-readable label
 *   ttlMinutes: optional time-to-live in minutes (default 60); 0 = no expiry
 *   thesis: optional trade thesis / rationale for setting this alert
 *   invalidation: optional condition that would invalidate the alert thesis
 * @returns {Object} the created rule
 */
function addRule({ type, ticker, params, label, ttlMinutes, thesis, invalidation }) {
  if (!VALID_RULE_TYPES.includes(type)) {
    throw new Error(`Invalid alert type: "${type}". Must be one of: ${VALID_RULE_TYPES.join(', ')}`);
  }
  if (typeof ticker !== 'string' || !ticker.trim()) throw new Error('ticker is required');
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('params object is required');
  }
  validateRuleParams(type, params);

  const ttl = ttlMinutes != null ? Number(ttlMinutes) : DEFAULT_TTL_MINUTES;

  const rules = _loadRules();
  const rule = {
    id: crypto.randomUUID(),
    type,
    ticker,
    params,
    label: label || `${type} on ${ticker}`,
    enabled: true,
    ttlMinutes: ttl,
    thesis: thesis || '',
    invalidation: invalidation || '',
    createdAt: new Date().toISOString(),
    expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 60000).toISOString() : null,
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

// --- Public API: Staleness & TTL ---

/** Check if a rule has expired based on its TTL */
function isRuleExpired(rule) {
  if (!rule.expiresAt) return false;
  return new Date(rule.expiresAt).getTime() < Date.now();
}

/** Get all rules, each annotated with an `expired` boolean */
function getRulesWithStatus() {
  return _loadRules().map((rule) => ({
    ...rule,
    expired: isRuleExpired(rule),
  }));
}

/** Get only active (non-expired, enabled) rules */
function getActiveRules() {
  return _loadRules().filter((r) => r.enabled && !isRuleExpired(r));
}

/** Get expired rules that haven't been cleaned up */
function getExpiredRules() {
  return _loadRules().filter((r) => isRuleExpired(r));
}

/**
 * Remove all expired rules.
 * @returns {number} count of removed rules
 */
function purgeExpiredRules() {
  const rules = _loadRules();
  const before = rules.length;
  const kept = rules.filter((r) => !isRuleExpired(r));
  if (kept.length < before) {
    _rules = kept;
    _persistRules();
    syncTickerSubscriptions();
  }
  return before - kept.length;
}

/** Check if a history entry is stale (older than `minutes`; default 30) */
function isAlertStale(entry, minutes = 30) {
  if (!entry.firedAt) return false;
  const age = Date.now() - new Date(entry.firedAt).getTime();
  return age > minutes * 60000;
}

/** Get alert history with staleness annotation */
function getHistoryWithStaleness(staleMinutes = 30) {
  return _loadHistory().map((entry) => ({
    ...entry,
    stale: isAlertStale(entry, staleMinutes),
  }));
}

/** Get only fresh (non-stale) alerts from history */
function getFreshAlerts(staleMinutes = 30) {
  return _loadHistory().filter((entry) => !isAlertStale(entry, staleMinutes));
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
  // Rules — status & TTL
  getRulesWithStatus,
  getActiveRules,
  getExpiredRules,
  purgeExpiredRules,
  isRuleExpired,
  // History
  getHistory,
  clearHistory,
  // History — staleness
  getHistoryWithStaleness,
  getFreshAlerts,
  isAlertStale,
  // Subscriptions
  onAlert,
  onRulesChange,
  // Notifications
  requestDesktopPermission,
  getDesktopPermissionStatus,
};
