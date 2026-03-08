// OMS Service — bridges OMS engine to Kalshi API and WebSocket
// Handles order submission, WS event processing, localStorage persistence, and UI events.

// STUB: Order deduplication on sync — requires a persistent fill ID index
// SOURCE: syncWithExchange currently checks fills by trade_id on a per-order basis, but if an order
//   was created outside this session and fills arrived before the order was known, fills can be missed
// IMPLEMENT: Maintain a Set of processed fill IDs in localStorage, check globally during sync,
//   and reconcile any unmatched fills against new orders from the exchange

import * as kalshiApi from './kalshiApi';
import * as kalshiWs from './kalshiWebSocket';
import * as engine from './omsEngine';

const LS_KEY = 'kalshi_oms_state';

// --- Event emitter for UI ---

const uiListeners = {};

function on(event, callback) {
  if (!uiListeners[event]) uiListeners[event] = new Set();
  uiListeners[event].add(callback);
  return () => uiListeners[event].delete(callback);
}

function emit(event, data) {
  const cbs = uiListeners[event];
  if (!cbs) return;
  cbs.forEach((cb) => {
    try { cb(data); } catch { /* ignore */ }
  });
}

// --- Persistence ---

function saveState() {
  try {
    const state = engine.exportState();
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota exceeded or unavailable */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      engine.importState(state);
    }
  } catch { /* corrupt data — start fresh */ }
}

// Auto-save on engine state changes
engine.on('order:updated', saveState);
engine.on('position:updated', saveState);
engine.on('state:reset', saveState);

// Forward engine events to UI listeners
engine.on('order:created', (order) => emit('order:created', order));
engine.on('order:updated', (order) => emit('order:updated', order));
engine.on('order:filled', (order) => emit('order:filled', order));
engine.on('order:cancelled', (order) => emit('order:cancelled', order));
engine.on('order:rejected', (order) => emit('order:rejected', order));
engine.on('fill', (fill) => emit('fill', fill));
engine.on('position:updated', (pos) => emit('position:updated', pos));

// --- WebSocket subscriptions ---

let wsUnsubOrders = null;
let wsUnsubFills = null;

/**
 * Start listening to WebSocket channels for order and fill updates.
 * Should be called after WebSocket connection is established.
 */
function startWsListeners() {
  stopWsListeners();

  wsUnsubOrders = kalshiWs.subscribeUserOrders((msg) => {
    processWsOrderUpdate(msg);
  });

  wsUnsubFills = kalshiWs.subscribeUserFills((msg) => {
    processWsFillUpdate(msg);
  });
}

function stopWsListeners() {
  if (wsUnsubOrders) { wsUnsubOrders(); wsUnsubOrders = null; }
  if (wsUnsubFills) { wsUnsubFills(); wsUnsubFills = null; }
}

// Auto-start/stop WS listeners with connection state
kalshiWs.onStateChange((newState) => {
  if (newState === kalshiWs.STATE.CONNECTED) {
    startWsListeners();
  } else if (newState === kalshiWs.STATE.DISCONNECTED) {
    stopWsListeners();
  }
});

// --- WS message processing ---

/**
 * Process an order update from the WebSocket user_orders channel.
 * Maps Kalshi order statuses to engine FSM states.
 */
function processWsOrderUpdate(msg) {
  const orderId = msg.order_id || msg.id;
  const clientOrderId = msg.client_order_id;
  const lookupId = clientOrderId || orderId;
  if (!lookupId) return;

  const existing = engine.findOrder(lookupId);

  if (!existing && orderId) {
    // Order was placed outside this session (e.g., via Kalshi UI)
    // Create a tracking entry for it
    const order = engine.createOrder({
      clientOrderId: clientOrderId || orderId,
      ticker: msg.ticker || msg.market_ticker || '',
      side: msg.side || 'yes',
      action: msg.action || 'buy',
      type: msg.type || msg.order_type || 'limit',
      price: msg.yes_price || msg.price || null,
      count: parseFloat(msg.count_fp || msg.remaining_count_fp || '0'),
    });
    if (orderId) {
      engine.markSubmitted(order.clientOrderId, orderId);
    }
  }

  // Map Kalshi status to engine status
  const status = (msg.status || '').toLowerCase();
  const statusMap = {
    resting: engine.ORDER_STATUS.OPEN,
    active: engine.ORDER_STATUS.OPEN,
    executed: engine.ORDER_STATUS.FILLED,
    canceled: engine.ORDER_STATUS.CANCELLED,
    cancelled: engine.ORDER_STATUS.CANCELLED,
    pending: engine.ORDER_STATUS.SUBMITTED,
  };

  const targetStatus = statusMap[status];
  if (targetStatus) {
    engine.transitionOrder(lookupId, targetStatus, {
      exchangeOrderId: orderId,
    });
  }

  emit('ws:order', msg);
}

/**
 * Process a fill update from the WebSocket user_fills channel.
 */
function processWsFillUpdate(msg) {
  const orderId = msg.order_id || msg.id;
  const clientOrderId = msg.client_order_id;
  const lookupId = clientOrderId || orderId;
  if (!lookupId) return;

  const price = msg.yes_price || msg.price || msg.no_price || 0;
  const count = parseFloat(msg.count_fp || msg.count || '0');

  if (count > 0) {
    engine.processFill(lookupId, {
      fillId: msg.trade_id || msg.fill_id,
      price,
      count,
      timestamp: msg.ts ? new Date(msg.ts).getTime() : Date.now(),
    });
  }

  emit('ws:fill', msg);
}

// --- Order submission (API bridge) ---

/**
 * Submit an order to Kalshi via REST API.
 * Creates local order in PENDING, submits, transitions to SUBMITTED.
 *
 * @param {Object} params
 * @param {string} params.ticker
 * @param {string} params.side - 'yes' or 'no'
 * @param {string} params.action - 'buy' or 'sell'
 * @param {string} params.type - 'market', 'limit', or 'stop'
 * @param {number} [params.price] - Price in cents (required for limit/stop)
 * @param {number} params.count - Number of contracts
 * @returns {Object} { order, apiResponse }
 */
async function submitOrder(params) {
  // Create local order (PENDING)
  const order = engine.createOrder(params);

  try {
    // Build Kalshi API order payload
    const apiOrder = {
      ticker: params.ticker,
      side: params.side,
      action: params.action,
      type: params.type === 'stop' ? 'limit' : params.type,
      count_fp: String(params.count) + '.00',
      client_order_id: order.clientOrderId,
    };

    if (params.price != null) {
      apiOrder.yes_price = params.side === 'yes'
        ? params.price
        : 100 - params.price;
    }

    // Submit to exchange
    const response = await kalshiApi.createOrder(apiOrder);

    // Transition to SUBMITTED
    const exchangeId = response?.order?.order_id || response?.order_id;
    engine.markSubmitted(order.clientOrderId, exchangeId);

    // If exchange already reports a status, process it
    const respStatus = response?.order?.status;
    if (respStatus === 'resting') {
      engine.markOpen(order.clientOrderId);
    } else if (respStatus === 'executed') {
      // Immediate fill (market order)
      const fillPrice = response?.order?.yes_price || params.price || 0;
      const fillCount = parseFloat(response?.order?.count_fp || String(params.count));
      engine.processFill(order.clientOrderId, {
        price: fillPrice,
        count: fillCount,
      });
    }

    emit('order:submitted', { order: engine.getOrder(order.clientOrderId), apiResponse: response });
    return { order: engine.getOrder(order.clientOrderId), apiResponse: response };
  } catch (err) {
    // Submission failed — mark rejected
    engine.markRejected(order.clientOrderId, err.message);
    throw err;
  }
}

/**
 * Cancel an order via Kalshi API.
 * @param {string} orderId - clientOrderId or exchange orderId
 */
async function cancelOrder(orderId) {
  const order = engine.findOrder(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);

  // PENDING orders have no exchange ID yet — cancel locally without API call
  if (order.status === engine.ORDER_STATUS.PENDING) {
    engine.markCancelled(order.clientOrderId);
    emit('order:cancel_sent', order);
    return order;
  }

  const exchangeId = order.id || orderId;

  try {
    await kalshiApi.cancelOrder(exchangeId);
    engine.markCancelled(order.clientOrderId);
    emit('order:cancel_sent', order);
    return order;
  } catch (err) {
    // If the cancel itself fails, the order may have already been filled
    emit('order:cancel_failed', { order, error: err.message });
    throw err;
  }
}

/**
 * Amend an existing order's price or quantity.
 * @param {string} orderId
 * @param {Object} amendments - { price, count }
 */
async function amendOrder(orderId, amendments) {
  const order = engine.findOrder(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);

  const exchangeId = order.id || orderId;
  const apiAmendments = {};
  if (amendments.price != null) apiAmendments.price = amendments.price;
  if (amendments.count != null) apiAmendments.count_fp = String(amendments.count) + '.00';

  const response = await kalshiApi.amendOrder(exchangeId, apiAmendments);

  // Update engine state through proper API (not direct mutation)
  const updated = engine.amendOrder(orderId, amendments);
  if (!updated) {
    console.warn(`[OMS] Engine rejected amendment for order ${orderId}`);
  }

  const current = engine.findOrder(orderId);
  emit('order:amended', { order: current, apiResponse: response });
  return { order: current, apiResponse: response };
}

// --- Sync with exchange ---

/**
 * Sync local state with exchange via REST (pull current orders/positions/fills).
 * Useful after reconnect or on startup to reconcile state.
 */
async function syncWithExchange() {
  try {
    const [ordersRes, positionsRes, fillsRes] = await Promise.all([
      kalshiApi.getOrders(),
      kalshiApi.getPositions(),
      kalshiApi.getFills({ limit: 100 }),
    ]);

    // Process exchange orders
    if (ordersRes?.orders) {
      ordersRes.orders.forEach((apiOrder) => {
        processWsOrderUpdate({
          order_id: apiOrder.order_id,
          client_order_id: apiOrder.client_order_id,
          ticker: apiOrder.ticker,
          side: apiOrder.side,
          action: apiOrder.action,
          type: apiOrder.type,
          yes_price: apiOrder.yes_price,
          status: apiOrder.status,
          count_fp: apiOrder.count_fp,
          remaining_count_fp: apiOrder.remaining_count_fp,
        });
      });
    }

    // Process exchange fills
    if (fillsRes?.fills) {
      fillsRes.fills.forEach((apiFill) => {
        const lookupId = apiFill.client_order_id || apiFill.order_id;
        const existingOrder = engine.findOrder(lookupId);
        if (!existingOrder) return;

        // Check if we already have this fill
        const alreadyHave = existingOrder.fills.some(
          (f) => f.fillId === apiFill.trade_id
        );
        if (alreadyHave) return;

        engine.processFill(lookupId, {
          fillId: apiFill.trade_id,
          price: apiFill.yes_price || apiFill.price,
          count: parseFloat(apiFill.count_fp || apiFill.count || '0'),
          timestamp: apiFill.ts ? new Date(apiFill.ts).getTime() : Date.now(),
        });
      });
    }

    emit('sync:complete', { orders: ordersRes, positions: positionsRes, fills: fillsRes });
  } catch (err) {
    console.error('[OMS] Sync error:', err);
    emit('sync:error', err);
  }
}

// --- Convenience getters (delegate to engine) ---

function getAllOrders() { return engine.getAllOrders(); }
function getOpenOrders() { return engine.getOpenOrders(); }
function getOrdersByTicker(ticker) { return engine.getOrdersByTicker(ticker); }
function getPosition(ticker, side) { return engine.getPosition(ticker, side); }
function getAllPositions() { return engine.getAllPositions(); }
function getRecentFills(limit) { return engine.getRecentFills(limit); }
function getUnrealizedPnl(ticker, side, price) { return engine.getUnrealizedPnl(ticker, side, price); }
function getTotalPnl(ticker, side, price) { return engine.getTotalPnl(ticker, side, price); }

/**
 * Get a summary of all positions with P&L.
 * @param {Object} currentPrices - { "ticker:side": priceInCents }
 * @returns {Array} Position summaries
 */
function getPositionSummaries(currentPrices = {}) {
  return engine.getAllPositions().map((pos) => {
    const key = `${pos.ticker}:${pos.side}`;
    const currentPrice = currentPrices[key] || 0;
    return {
      ...pos,
      unrealized: engine.getUnrealizedPnl(pos.ticker, pos.side, currentPrice),
      total: engine.getTotalPnl(pos.ticker, pos.side, currentPrice),
    };
  });
}

// --- Initialize ---

/**
 * Initialize the OMS service.
 * Loads persisted state and starts WS listeners if connected.
 */
function initialize() {
  loadState();

  // If already connected, start listeners
  if (kalshiWs.getState() === kalshiWs.STATE.CONNECTED) {
    startWsListeners();
  }
}

/**
 * Reset OMS state (clear all orders and positions).
 */
function resetState() {
  engine.reset();
  try {
    localStorage.removeItem(LS_KEY);
  } catch { /* ignore */ }
  emit('state:reset', null);
}

// Initialize on import
initialize();

// Re-export engine constants for consumer convenience
const { ORDER_STATUS, ORDER_TYPES } = engine;

export {
  // Order actions
  submitOrder,
  cancelOrder,
  amendOrder,
  // Sync
  syncWithExchange,
  // Queries (delegated from engine)
  getAllOrders,
  getOpenOrders,
  getOrdersByTicker,
  getPosition,
  getAllPositions,
  getRecentFills,
  getUnrealizedPnl,
  getTotalPnl,
  getPositionSummaries,
  // State management
  initialize,
  resetState,
  // Events
  on,
  // Engine constants
  ORDER_STATUS,
  ORDER_TYPES,
};
