// OMS Engine — Order Management System state machine
// Pure state: order lifecycle FSM, position aggregation, P&L calculation.
// No API calls — omsService.js bridges to Kalshi endpoints.

// --- Order States (FSM) ---
const ORDER_STATUS = {
  PENDING: 'pending',       // Created locally, not yet sent to exchange
  SUBMITTED: 'submitted',   // Sent to exchange, awaiting acknowledgement
  OPEN: 'open',             // Acknowledged by exchange, resting on book
  PARTIAL: 'partial',       // Partially filled
  FILLED: 'filled',         // Fully filled (terminal)
  CANCELLED: 'cancelled',   // Cancelled by user or system (terminal)
  REJECTED: 'rejected',     // Rejected by exchange (terminal)
};

// Valid state transitions
const TRANSITIONS = {
  [ORDER_STATUS.PENDING]:   [ORDER_STATUS.SUBMITTED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SUBMITTED]: [ORDER_STATUS.OPEN, ORDER_STATUS.FILLED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.OPEN]:      [ORDER_STATUS.PARTIAL, ORDER_STATUS.FILLED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PARTIAL]:   [ORDER_STATUS.FILLED, ORDER_STATUS.CANCELLED],
  // Terminal states — no transitions out
  [ORDER_STATUS.FILLED]:    [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REJECTED]:  [],
};

const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
};

const TERMINAL_STATES = new Set([
  ORDER_STATUS.FILLED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
]);

// --- Internal state ---

// orderId -> order object
const orders = new Map();

// ticker -> position object
const positions = new Map();

// Event listeners: eventName -> Set<callback>
const listeners = {};

// --- Event emitter ---

function on(event, callback) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(callback);
  return () => listeners[event].delete(callback);
}

function emit(event, data) {
  const cbs = listeners[event];
  if (!cbs) return;
  cbs.forEach((cb) => {
    try { cb(data); } catch { /* ignore */ }
  });
}

// --- Order creation ---

/**
 * Create a new order in PENDING state.
 * @param {Object} params
 * @param {string} params.ticker - Market ticker
 * @param {string} params.side - 'yes' or 'no'
 * @param {string} params.action - 'buy' or 'sell'
 * @param {string} params.type - 'market', 'limit', or 'stop'
 * @param {number} [params.price] - Price in cents (required for limit/stop)
 * @param {number} params.count - Number of contracts
 * @param {string} [params.clientOrderId] - Client-generated UUID
 * @returns {Object} The created order
 */
function createOrder(params) {
  const clientOrderId = params.clientOrderId || crypto.randomUUID();
  const now = Date.now();

  const order = {
    id: null,                      // Set when exchange acknowledges
    clientOrderId,
    ticker: params.ticker,
    side: params.side,             // 'yes' or 'no'
    action: params.action,         // 'buy' or 'sell'
    type: params.type || ORDER_TYPES.MARKET,
    price: params.price || null,   // Cents (1-99)
    count: params.count,           // Contracts requested
    filledCount: 0,                // Contracts filled so far
    remainingCount: params.count,  // Contracts remaining
    avgFillPrice: 0,               // Volume-weighted average fill price
    status: ORDER_STATUS.PENDING,
    fills: [],                     // Array of fill objects
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    filledAt: null,
    cancelledAt: null,
    rejectedAt: null,
    rejectReason: null,
  };

  orders.set(clientOrderId, order);
  emit('order:created', order);
  emit('order:updated', order);
  return order;
}

// --- State transitions ---

/**
 * Transition an order to a new status.
 * Validates the transition against the FSM.
 * @param {string} orderId - clientOrderId or exchange orderId
 * @param {string} newStatus - Target status
 * @param {Object} [extra] - Additional fields to merge (e.g., rejectReason)
 * @returns {Object|null} Updated order, or null if transition invalid
 */
function transitionOrder(orderId, newStatus, extra = {}) {
  const order = findOrder(orderId);
  if (!order) return null;

  const allowed = TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    console.warn(
      `[OMS] Invalid transition: ${order.status} → ${newStatus} for order ${orderId}`
    );
    return null;
  }

  order.status = newStatus;
  order.updatedAt = Date.now();

  // Set timestamp fields
  if (newStatus === ORDER_STATUS.SUBMITTED) order.submittedAt = order.updatedAt;
  if (newStatus === ORDER_STATUS.FILLED) order.filledAt = order.updatedAt;
  if (newStatus === ORDER_STATUS.CANCELLED) order.cancelledAt = order.updatedAt;
  if (newStatus === ORDER_STATUS.REJECTED) {
    order.rejectedAt = order.updatedAt;
    if (extra.reason) order.rejectReason = extra.reason;
  }

  // Merge exchange id if provided
  if (extra.exchangeOrderId && !order.id) {
    order.id = extra.exchangeOrderId;
    // Also index by exchange id
    orders.set(order.id, order);
  }

  Object.assign(order, extra);

  emit('order:updated', order);
  emit(`order:${newStatus}`, order);
  return order;
}

/**
 * Mark an order as submitted (sent to exchange).
 */
function markSubmitted(clientOrderId, exchangeOrderId) {
  return transitionOrder(clientOrderId, ORDER_STATUS.SUBMITTED, {
    exchangeOrderId,
  });
}

/**
 * Mark an order as open (acknowledged by exchange, resting on book).
 */
function markOpen(orderId) {
  return transitionOrder(orderId, ORDER_STATUS.OPEN);
}

/**
 * Mark an order as cancelled.
 */
function markCancelled(orderId) {
  return transitionOrder(orderId, ORDER_STATUS.CANCELLED);
}

/**
 * Mark an order as rejected.
 */
function markRejected(orderId, reason) {
  return transitionOrder(orderId, ORDER_STATUS.REJECTED, { reason });
}

// --- Fill processing ---

/**
 * Process a fill for an order.
 * Updates fill count, average price, remaining count.
 * Transitions to PARTIAL or FILLED as appropriate.
 * Updates position aggregation.
 *
 * @param {string} orderId
 * @param {Object} fill
 * @param {number} fill.price - Fill price in cents
 * @param {number} fill.count - Number of contracts filled
 * @param {string} [fill.fillId] - Exchange fill ID
 * @param {number} [fill.timestamp] - Fill timestamp
 */
function processFill(orderId, fill) {
  const order = findOrder(orderId);
  if (!order) return null;

  const fillObj = {
    fillId: fill.fillId || crypto.randomUUID(),
    orderId: order.clientOrderId,
    ticker: order.ticker,
    side: order.side,
    action: order.action,
    price: fill.price,
    count: fill.count,
    timestamp: fill.timestamp || Date.now(),
  };

  order.fills.push(fillObj);

  // Update fill counts
  const prevFilled = order.filledCount;
  order.filledCount += fill.count;
  order.remainingCount = Math.max(0, order.count - order.filledCount);

  // Recalculate volume-weighted average fill price
  if (order.filledCount > 0) {
    order.avgFillPrice =
      (prevFilled * order.avgFillPrice + fill.count * fill.price) /
      order.filledCount;
  }

  order.updatedAt = Date.now();

  // Transition status
  if (order.remainingCount <= 0) {
    transitionOrder(order.clientOrderId, ORDER_STATUS.FILLED);
  } else if (order.status === ORDER_STATUS.OPEN || order.status === ORDER_STATUS.SUBMITTED) {
    transitionOrder(order.clientOrderId, ORDER_STATUS.PARTIAL);
  }

  // Update position
  updatePosition(order.ticker, order.side, order.action, fill.price, fill.count);

  emit('fill', fillObj);
  return fillObj;
}

// --- Position aggregation ---

/**
 * Update position for a ticker based on a fill.
 * Buys increase position, sells decrease/flip position.
 *
 * @param {string} ticker
 * @param {string} side - 'yes' or 'no'
 * @param {string} action - 'buy' or 'sell'
 * @param {number} price - Fill price in cents
 * @param {number} count - Number of contracts
 */
function updatePosition(ticker, side, action, price, count) {
  const key = `${ticker}:${side}`;
  let pos = positions.get(key);

  if (!pos) {
    pos = {
      ticker,
      side,
      contracts: 0,
      avgCost: 0,          // Average cost in cents
      realized: 0,         // Realized P&L in cents
      totalCost: 0,        // Running total cost for avg calc
      updatedAt: Date.now(),
    };
    positions.set(key, pos);
  }

  if (action === 'buy') {
    // Opening or adding to position
    pos.totalCost += price * count;
    pos.contracts += count;
    pos.avgCost = pos.contracts > 0 ? pos.totalCost / pos.contracts : 0;
  } else {
    // Closing or reducing position (sell)
    if (pos.contracts > 0) {
      const closeCount = Math.min(count, pos.contracts);
      // Realized P&L = (sell price - avg cost) * contracts closed
      pos.realized += (price - pos.avgCost) * closeCount;
      pos.contracts -= closeCount;
      pos.totalCost = pos.contracts * pos.avgCost;
    }
  }

  pos.updatedAt = Date.now();

  // Clean up empty positions
  if (pos.contracts === 0) {
    pos.avgCost = 0;
    pos.totalCost = 0;
  }

  emit('position:updated', pos);
}

/**
 * Calculate unrealized P&L for a position given current market price.
 * @param {string} ticker
 * @param {string} side - 'yes' or 'no'
 * @param {number} currentPrice - Current market price in cents
 * @returns {number} Unrealized P&L in cents
 */
function getUnrealizedPnl(ticker, side, currentPrice) {
  const pos = positions.get(`${ticker}:${side}`);
  if (!pos || pos.contracts === 0) return 0;
  return (currentPrice - pos.avgCost) * pos.contracts;
}

/**
 * Get total P&L (realized + unrealized) for a position.
 */
function getTotalPnl(ticker, side, currentPrice) {
  const pos = positions.get(`${ticker}:${side}`);
  if (!pos) return 0;
  return pos.realized + getUnrealizedPnl(ticker, side, currentPrice);
}

// --- Queries ---

function findOrder(orderId) {
  return orders.get(orderId) || null;
}

function getOrder(orderId) {
  return findOrder(orderId);
}

function getAllOrders() {
  // Deduplicate — some orders are indexed by both clientOrderId and exchangeId
  const seen = new Set();
  const result = [];
  orders.forEach((order) => {
    if (!seen.has(order.clientOrderId)) {
      seen.add(order.clientOrderId);
      result.push(order);
    }
  });
  return result;
}

function getOpenOrders() {
  return getAllOrders().filter(
    (o) => !TERMINAL_STATES.has(o.status)
  );
}

function getOrdersByTicker(ticker) {
  return getAllOrders().filter((o) => o.ticker === ticker);
}

function getPosition(ticker, side) {
  return positions.get(`${ticker}:${side}`) || null;
}

function getAllPositions() {
  const result = [];
  positions.forEach((pos) => {
    if (pos.contracts > 0) result.push(pos);
  });
  return result;
}

function getRecentFills(limit = 50) {
  const allFills = [];
  orders.forEach((order) => {
    order.fills.forEach((f) => allFills.push(f));
  });
  allFills.sort((a, b) => b.timestamp - a.timestamp);
  return allFills.slice(0, limit);
}

function isTerminal(status) {
  return TERMINAL_STATES.has(status);
}

// --- State management (for persistence layer) ---

/**
 * Export full state for serialization (used by omsService for localStorage).
 */
function exportState() {
  const orderList = getAllOrders();
  const positionList = [];
  positions.forEach((pos) => positionList.push({ ...pos }));
  return { orders: orderList, positions: positionList };
}

/**
 * Import state from serialized data (used by omsService on startup).
 */
function importState(state) {
  orders.clear();
  positions.clear();

  if (state.orders) {
    state.orders.forEach((o) => {
      orders.set(o.clientOrderId, o);
      if (o.id) orders.set(o.id, o);
    });
  }

  if (state.positions) {
    state.positions.forEach((p) => {
      positions.set(`${p.ticker}:${p.side}`, p);
    });
  }

  emit('state:imported', state);
}

/**
 * Clear all orders and positions.
 */
function reset() {
  orders.clear();
  positions.clear();
  emit('state:reset', null);
}

export {
  // Constants
  ORDER_STATUS,
  ORDER_TYPES,
  TERMINAL_STATES,
  // Order lifecycle
  createOrder,
  transitionOrder,
  markSubmitted,
  markOpen,
  markCancelled,
  markRejected,
  processFill,
  // Position
  updatePosition,
  getUnrealizedPnl,
  getTotalPnl,
  // Queries
  findOrder,
  getOrder,
  getAllOrders,
  getOpenOrders,
  getOrdersByTicker,
  getPosition,
  getAllPositions,
  getRecentFills,
  isTerminal,
  // State management
  exportState,
  importState,
  reset,
  // Events
  on,
};
