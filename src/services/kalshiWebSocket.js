// Kalshi WebSocket Client
// Handles connection, authentication, channel subscriptions, heartbeat, and auto-reconnect.

import { getWsUrl, generateAuthHeaders, isConfigured } from './kalshiApi';

// --- Connection state ---
const STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let ws = null;
let state = STATE.DISCONNECTED;
let reconnectAttempt = 0;
let reconnectTimer = null;
let heartbeatTimer = null;
let sequenceId = 0;

// --- Pending command acknowledgements ---
// Maps commandId -> { resolve, reject, timeout }
const pendingCommands = new Map();

// Max reconnect: 5 attempts, then stop
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;

// --- Subscriptions ---
// channel -> { tickers: Set, callbacks: Map<Function, Set<string>|null> }
// Each callback maps to its ticker scope (Set of tickers) or null for channel-global.
const subscriptions = {};

// Global listeners for connection state changes
const stateListeners = new Set();

// --- Event helpers ---

function setState(newState) {
  const oldState = state;
  state = newState;
  stateListeners.forEach((cb) => {
    try { cb(newState, oldState); } catch { /* ignore */ }
  });
}

function onStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

function getState() {
  return state;
}

// --- Connect ---

async function connect() {
  if (state === STATE.CONNECTED || state === STATE.CONNECTING) return;
  if (!isConfigured()) {
    console.warn('[KalshiWS] API not configured — skipping connect');
    return;
  }

  setState(STATE.CONNECTING);

  try {
    const wsUrl = getWsUrl();
    // Auth headers for WebSocket upgrade handshake
    // Browser WebSocket API does not support custom headers on the handshake.
    // Kalshi WS accepts auth via query params or a post-connect auth command.
    // We'll send an auth command immediately after connection.
    ws = new WebSocket(wsUrl);

    ws.onopen = handleOpen;
    ws.onmessage = handleMessage;
    ws.onclose = handleClose;
    ws.onerror = handleError;
  } catch (err) {
    console.error('[KalshiWS] Connection error:', err);
    setState(STATE.DISCONNECTED);
    scheduleReconnect();
  }
}

async function handleOpen() {
  console.log('[KalshiWS] Connected');
  reconnectAttempt = 0;

  // Send auth command
  // Kalshi WS accepts authentication via an initial message after connect
  try {
    const authHeaders = await generateAuthHeaders('GET', '/trade-api/ws/v2');
    sendCommand({
      id: nextId(),
      cmd: 'auth',
      params: {
        api_key: authHeaders['KALSHI-ACCESS-KEY'],
        timestamp: authHeaders['KALSHI-ACCESS-TIMESTAMP'],
        signature: authHeaders['KALSHI-ACCESS-SIGNATURE'],
      },
    }).catch(() => {});
    setState(STATE.CONNECTED);
    startHeartbeat();
    resubscribeAll();
  } catch (err) {
    console.error('[KalshiWS] Auth failed:', err);
    scheduleReconnect();
    return;
  }
}

function handleMessage(event) {
  let rawMsg;
  try {
    rawMsg = JSON.parse(event.data);
  } catch {
    // Might be a pong frame or non-JSON; ignore
    return;
  }

  // Handle server heartbeat ping
  if (rawMsg.type === 'heartbeat' || event.data === 'heartbeat') {
    sendRaw('heartbeat');
    return;
  }

  // Resolve or reject pending command promises on ack/error responses
  if (rawMsg.id !== undefined && (rawMsg.type === 'ack' || rawMsg.type === 'error')) {
    const pending = pendingCommands.get(rawMsg.id);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingCommands.delete(rawMsg.id);
      if (rawMsg.type === 'ack') {
        pending.resolve(rawMsg);
      } else {
        pending.reject(rawMsg);
      }
      return;
    }
  }

  const msg = normalizeMessageEnvelope(rawMsg);

  // Route message to appropriate channel subscribers
  const channel = msg.type || msg.channel || msg.cmd;
  if (!channel) return;

  routeMessage(channel, msg, rawMsg);
}

function handleClose(event) {
  console.log('[KalshiWS] Disconnected:', event.code, event.reason);
  cleanup();
  setState(STATE.DISCONNECTED);

  if (event.code !== 1000) {
    // Abnormal close — attempt reconnect
    scheduleReconnect();
  }
}

function handleError(err) {
  console.error('[KalshiWS] Error:', err);
}

// --- Disconnect ---

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempt = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
  cleanup();
  if (ws) {
    ws.close(1000, 'Client disconnect');
    ws = null;
  }
  setState(STATE.DISCONNECTED);
}

function clearPendingCommands() {
  pendingCommands.forEach(({ reject: rej, timeout }, id) => {
    clearTimeout(timeout);
    rej(new Error(`Command ${id} cancelled: WebSocket disconnected`));
  });
  pendingCommands.clear();
}

function cleanup() {
  stopHeartbeat();
  clearPendingCommands();
}

// --- Reconnect ---

function scheduleReconnect() {
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    console.warn('[KalshiWS] Max reconnect attempts reached');
    setState(STATE.DISCONNECTED);
    return;
  }

  const jitter = Math.random() * 0.3 + 0.85; // 0.85–1.15x
  const delay = Math.round(BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempt) * jitter);
  reconnectAttempt++;
  setState(STATE.RECONNECTING);

  console.log(`[KalshiWS] Reconnecting in ${delay}ms (attempt ${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS})`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

// --- Heartbeat ---

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send ping frame — the browser WebSocket API doesn't expose ping/pong
      // frames directly, so we send a text ping that Kalshi understands
      sendRaw(JSON.stringify({ id: nextId(), cmd: 'ping' }));
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// --- Message sending ---

function nextId() {
  return ++sequenceId;
}

function sendRaw(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  }
}

function sendCommand(cmd) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingCommands.has(cmd.id)) {
        pendingCommands.delete(cmd.id);
        console.warn('[KalshiWS] Command timed out:', cmd);
        reject(new Error(`Command ${cmd.id} (${cmd.cmd}) timed out`));
      }
    }, 10000);
    pendingCommands.set(cmd.id, { resolve, reject, timeout });
    sendRaw(JSON.stringify(cmd));
  });
}

// --- Channel subscriptions ---

/**
 * Subscribe to a WebSocket channel.
 * @param {string} channel - Channel name (e.g. 'orderbook_delta', 'ticker', 'trade',
 *   'market_lifecycle_v2', 'user_orders', 'user_fills', 'market_positions')
 * @param {Function} callback - Called with each message for this channel
 * @param {string[]} [tickers] - Market tickers to filter (for channels that support it)
 * @returns {Function} unsubscribe function
 */
function subscribe(channel, callback, tickers = []) {
  if (!subscriptions[channel]) {
    subscriptions[channel] = { tickers: new Set(), callbacks: new Map() };
  }

  const sub = subscriptions[channel];

  // Store callback with its ticker scope (null = channel-global, receives all messages)
  const scope = tickers.length > 0 ? new Set(tickers) : null;
  sub.callbacks.set(callback, scope);

  // Track new tickers to subscribe
  const newTickers = tickers.filter((t) => !sub.tickers.has(t));
  tickers.forEach((t) => sub.tickers.add(t));

  // Send subscribe command if connected and there are new tickers
  if (state === STATE.CONNECTED && (newTickers.length > 0 || tickers.length === 0)) {
    sendSubscribeCommand(channel, newTickers.length > 0 ? newTickers : undefined).catch(() => {});
  }

  return () => {
    sub.callbacks.delete(callback);

    // If no more callbacks, unsubscribe from the channel entirely
    if (sub.callbacks.size === 0) {
      if (state === STATE.CONNECTED) {
        sendUnsubscribeCommand(channel, Array.from(sub.tickers)).catch(() => {});
      }
      delete subscriptions[channel];
    }
  };
}

function sendSubscribeCommand(channel, tickers) {
  const params = { channels: [channel] };
  if (tickers && tickers.length > 0) {
    params.market_tickers = tickers;
  }
  return sendCommand({ id: nextId(), cmd: 'subscribe', params });
}

function sendUnsubscribeCommand(channel, tickers) {
  const params = { channels: [channel] };
  if (tickers && tickers.length > 0) {
    params.market_tickers = tickers;
  }
  return sendCommand({ id: nextId(), cmd: 'unsubscribe', params });
}

/** Re-subscribe to all channels after reconnect */
function resubscribeAll() {
  Object.entries(subscriptions).forEach(([channel, sub]) => {
    const tickers = Array.from(sub.tickers);
    sendSubscribeCommand(channel, tickers.length > 0 ? tickers : undefined).catch(() => {});
  });
}

/** Route an incoming message to the right callbacks */
function routeMessage(type, msg, rawMsg = msg) {
  // Map message types to channels
  // e.g., 'orderbook_snapshot' and 'orderbook_delta' both go to 'orderbook_delta' subscribers
  const channelMap = {
    orderbook_snapshot: 'orderbook_delta',
    orderbook_delta: 'orderbook_delta',
    ticker: 'ticker',
    trade: 'trade',
    market_lifecycle_v2: 'market_lifecycle_v2',
    fill: 'user_fills',
    user_fills: 'user_fills',
    order: 'user_orders',
    user_orders: 'user_orders',
    market_position: 'market_positions',
    market_positions: 'market_positions',
  };

  const candidateTypes = [
    type,
    msg?.type,
    msg?.channel,
    msg?.cmd,
    rawMsg?.type,
    rawMsg?.channel,
    rawMsg?.cmd,
  ].filter(Boolean);

  const channel = candidateTypes
    .map((candidate) => channelMap[candidate] || candidate)
    .find((candidate) => subscriptions[candidate]);

  if (!channel) return;

  const sub = subscriptions[channel];

  // Extract the message ticker for per-subscriber filtering
  const msgTicker = msg.market_ticker || msg.ticker || rawMsg?.market_ticker || rawMsg?.ticker;

  sub.callbacks.forEach((scope, cb) => {
    // Channel-global (unscoped) subscribers receive all messages.
    // Scoped subscribers only receive messages matching their ticker set.
    // If the message has no ticker field, deliver to all (can't filter).
    if (scope !== null && msgTicker && !scope.has(msgTicker)) {
      return;
    }
    try { cb(msg); } catch (err) {
      console.error(`[KalshiWS] Callback error for ${channel}:`, err);
    }
  });
}

/**
 * Flatten Kalshi data envelopes to keep business fields top-level.
 * Preserves routing metadata (type/sid/seq) for downstream consumers.
 */
function normalizeMessageEnvelope(rawMsg) {
  if (!rawMsg || typeof rawMsg !== 'object') return rawMsg;

  const payload = rawMsg.msg;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return rawMsg;
  }

  const envelopeType = rawMsg.type || rawMsg.channel || rawMsg.cmd;
  const payloadType = payload.type || payload.channel || payload.cmd;

  return {
    ...rawMsg,
    ...payload,
    type: payloadType || envelopeType,
    channel: payload.channel ?? rawMsg.channel,
    cmd: payload.cmd ?? rawMsg.cmd,
    sid: payload.sid ?? rawMsg.sid,
    seq: payload.seq ?? rawMsg.seq,
    msg: payload,
  };
}

// --- Convenience methods for common channels ---

/** Subscribe to orderbook deltas for a market */
function subscribeOrderbook(ticker, callback) {
  return subscribe('orderbook_delta', callback, [ticker]);
}

/** Subscribe to ticker updates for markets */
function subscribeTicker(tickers, callback) {
  const tickerList = Array.isArray(tickers) ? tickers : [tickers];
  return subscribe('ticker', callback, tickerList);
}

/** Subscribe to trade feed for markets */
function subscribeTrades(tickers, callback) {
  const tickerList = Array.isArray(tickers) ? tickers : [tickers];
  return subscribe('trade', callback, tickerList);
}

/** Subscribe to market lifecycle events (global, no ticker filter) */
function subscribeLifecycle(callback) {
  return subscribe('market_lifecycle_v2', callback);
}

/** Subscribe to user order updates (private channel) */
function subscribeUserOrders(callback) {
  return subscribe('user_orders', callback);
}

/** Subscribe to user fill events (private channel) */
function subscribeUserFills(callback) {
  return subscribe('user_fills', callback);
}

/** Subscribe to position changes (private channel) */
function subscribePositions(callback) {
  return subscribe('market_positions', callback);
}

export {
  connect,
  disconnect,
  getState,
  onStateChange,
  subscribe,
  subscribeOrderbook,
  subscribeTicker,
  subscribeTrades,
  subscribeLifecycle,
  subscribeUserOrders,
  subscribeUserFills,
  subscribePositions,
  STATE,
};
