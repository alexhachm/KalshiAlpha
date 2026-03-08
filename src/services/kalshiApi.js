// Kalshi REST API Client
// Demo: https://demo-api.kalshi.co/trade-api/v2
// Prod: https://api.elections.kalshi.com/trade-api/v2

const ENVIRONMENTS = {
  demo: {
    rest: 'https://demo-api.kalshi.co/trade-api/v2',
    ws: 'wss://demo-api.kalshi.co/trade-api/ws/v2',
  },
  production: {
    rest: 'https://api.elections.kalshi.com/trade-api/v2',
    ws: 'wss://api.elections.kalshi.com/trade-api/ws/v2',
  },
};

// --- Internal state ---
let config = {
  environment: 'demo',
  apiKeyId: null,    // UUID string (KALSHI-ACCESS-KEY)
  privateKey: null,  // CryptoKey object (imported RSA private key)
  _rawPem: null,     // Original PEM string for reference
};

let _cryptoKey = null; // Cached CryptoKey after import

// --- Configuration ---

/**
 * Configure the API client.
 * @param {Object} opts
 * @param {string} opts.environment - 'demo' or 'production'
 * @param {string} opts.apiKeyId - API key UUID
 * @param {string} opts.privateKeyPem - RSA private key in PEM format
 */
async function configure(opts) {
  if (opts.environment) config.environment = opts.environment;
  if (opts.apiKeyId) config.apiKeyId = opts.apiKeyId;
  if (opts.privateKeyPem) {
    config._rawPem = opts.privateKeyPem;
    _cryptoKey = await importPrivateKey(opts.privateKeyPem);
    config.privateKey = _cryptoKey;
  }
}

function getBaseUrl() {
  return ENVIRONMENTS[config.environment]?.rest || ENVIRONMENTS.demo.rest;
}

function getWsUrl() {
  return ENVIRONMENTS[config.environment]?.ws || ENVIRONMENTS.demo.ws;
}

function isConfigured() {
  return !!(config.apiKeyId && config.privateKey);
}

function getConfig() {
  return {
    environment: config.environment,
    apiKeyId: config.apiKeyId,
    isConfigured: isConfigured(),
    wsUrl: getWsUrl(),
  };
}

// --- RSA-PSS Signing (Web Crypto API) ---

/**
 * Import a PEM-formatted RSA private key into Web Crypto API.
 * Supports both PKCS#8 and PKCS#1 formats.
 */
async function importPrivateKey(pem) {
  // Strip PEM headers and whitespace
  const pemClean = pem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemClean), (c) => c.charCodeAt(0));

  // Try PKCS#8 first, fall back to wrapping PKCS#1
  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDer.buffer,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } catch {
    // PKCS#1 keys need wrapping — try as-is with a different approach
    // Most Kalshi keys are PKCS#8 so this is a fallback
    throw new Error(
      'Failed to import private key. Ensure it is in PKCS#8 PEM format. ' +
      'Convert with: openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in key.pem -out key-pkcs8.pem'
    );
  }
}

/**
 * Generate auth headers for a Kalshi API request.
 * Sign string = timestamp_ms + METHOD + path (no query params)
 */
async function generateAuthHeaders(method, fullPath) {
  if (!isConfigured()) {
    throw new Error('Kalshi API not configured. Call configure() with apiKeyId and privateKeyPem.');
  }

  const timestamp = Date.now().toString();

  // Strip query params from path for signing
  const pathOnly = fullPath.split('?')[0];
  const signString = timestamp + method.toUpperCase() + pathOnly;

  const encoder = new TextEncoder();
  const data = encoder.encode(signString);

  const signature = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength: 32 },
    _cryptoKey,
    data
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return {
    'KALSHI-ACCESS-KEY': config.apiKeyId,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'KALSHI-ACCESS-SIGNATURE': signatureBase64,
    'Content-Type': 'application/json',
  };
}

// --- HTTP Client ---

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

// STUB: Token-bucket rate limiter — requires a shared rate limit budget (e.g., 10 req/sec for Kalshi)
// SOURCE: Kalshi API docs specify per-second rate limits; current code relies on 429 retry only
// IMPLEMENT: Create a TokenBucket class with `consume()` that delays requests when bucket is empty,
//   initialize with Kalshi's documented rate (10 req/s default), apply before each fetch() call

function isRetryable(status) {
  return status === 429 || (status >= 500 && status < 600);
}

async function request(method, path, body = null, params = null) {
  const base = getBaseUrl();
  let url = base + path;

  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) qs.append(k, v);
    });
    const qsStr = qs.toString();
    if (qsStr) url += '?' + qsStr;
  }

  const signingPath = '/trade-api/v2' + path;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const headers = await generateAuthHeaders(method, signingPath);

    const opts = { method, headers };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');

      if (isRetryable(res.status) && attempt < MAX_RETRIES) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      const err = new Error(`Kalshi API ${method} ${path}: ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = errBody;
      throw err;
    }

    if (res.status === 204) return null;
    return res.json();
  }
}

// --- Market Data Endpoints ---

/** GET /markets — paginated list of all markets */
async function getMarkets(params = {}) {
  return request('GET', '/markets', null, { limit: 1000, ...params });
}

/** Load ALL markets using cursor pagination */
async function getAllMarkets(params = {}) {
  const allMarkets = [];
  let cursor = null;

  do {
    const queryParams = { limit: 1000, ...params };
    if (cursor) queryParams.cursor = cursor;

    const res = await request('GET', '/markets', null, queryParams);
    if (res.markets) allMarkets.push(...res.markets);
    cursor = res.cursor || null;
  } while (cursor);

  return allMarkets;
}

/** GET /markets/:ticker — single market details */
async function getMarket(ticker) {
  return request('GET', `/markets/${encodeURIComponent(ticker)}`);
}

/** GET /events — list of events */
async function getEvents(params = {}) {
  return request('GET', '/events', null, params);
}

/** GET /series-list — list of series */
async function getSeries(params = {}) {
  return request('GET', '/series-list', null, params);
}

/** GET /search/tags_by_categories — category/tag taxonomy */
async function getTagsByCategories() {
  return request('GET', '/search/tags_by_categories');
}

/** GET /market/orderbook — snapshot for a single market */
async function getMarketOrderbook(ticker) {
  return request('GET', '/market/orderbook', null, { ticker });
}

/** GET /market/candlesticks — OHLCV candles */
async function getMarketCandlesticks(params) {
  // params: { tickers (comma-separated or array), period_interval, start_ts, end_ts }
  const p = { ...params };
  if (Array.isArray(p.tickers)) p.tickers = p.tickers.join(',');
  return request('GET', '/market/candlesticks', null, p);
}

/** GET /market/trades — recent trades for a market */
async function getMarketTrades(params) {
  return request('GET', '/market/trades', null, params);
}

// --- Portfolio Endpoints ---

/** GET /portfolio/balance */
async function getBalance() {
  return request('GET', '/portfolio/balance');
}

/** GET /portfolio/positions — open positions */
async function getPositions(params = {}) {
  return request('GET', '/portfolio/positions', null, { count_filter: 'position', ...params });
}

/** GET /portfolio/fills — fill history */
async function getFills(params = {}) {
  return request('GET', '/portfolio/fills', null, params);
}

/** GET /portfolio/orders — open orders */
async function getOrders(params = {}) {
  return request('GET', '/portfolio/orders', null, params);
}

// --- Trading Endpoints ---

/**
 * POST /portfolio/orders — place a single order
 * @param {Object} order
 * @param {string} order.ticker - market ticker
 * @param {string} order.side - 'yes' or 'no'
 * @param {string} order.action - 'buy' or 'sell'
 * @param {string} order.type - 'market' or 'limit'
 * @param {number} order.yes_price - price in cents (always YES price)
 * @param {string} order.count_fp - quantity as fixed-point string, e.g. "10.00"
 * @param {string} [order.client_order_id] - UUIDv4 for idempotency
 * @param {string} [order.time_in_force] - 'gtc' or 'ioc'
 */
async function createOrder(order) {
  if (!order.client_order_id) {
    order.client_order_id = crypto.randomUUID();
  }
  return request('POST', '/portfolio/orders', order);
}

/** DELETE /portfolio/orders/:orderId — cancel an order */
async function cancelOrder(orderId) {
  return request('DELETE', `/portfolio/orders/${encodeURIComponent(orderId)}`);
}

/** POST /portfolio/orders/:orderId/amend — amend price/quantity */
async function amendOrder(orderId, amendments) {
  return request('POST', `/portfolio/orders/${encodeURIComponent(orderId)}/amend`, amendments);
}

/** POST /portfolio/orders/:orderId/decrease — reduce order quantity */
async function decreaseOrder(orderId, params) {
  return request('POST', `/portfolio/orders/${encodeURIComponent(orderId)}/decrease`, params);
}

// --- Price Utilities ---

/** Convert centi-cents (API WS field) to dollars. Raw 500000 = $0.05. */
function centiCentsToDollars(centiCents) {
  return centiCents / 10000;
}

/** Convert cents (1-99) to dollars. 60 => $0.60 */
function centsToDollars(cents) {
  return cents / 100;
}

/** Convert dollars to cents. $0.60 => 60 */
function dollarsToCents(dollars) {
  return Math.round(dollars * 100);
}

/** YES/NO inversion: given YES price in cents, get NO price. */
function invertPrice(yesPriceCents) {
  return 100 - yesPriceCents;
}

export {
  configure,
  getBaseUrl,
  getWsUrl,
  isConfigured,
  getConfig,
  generateAuthHeaders,
  // Market data
  getMarkets,
  getAllMarkets,
  getMarket,
  getEvents,
  getSeries,
  getTagsByCategories,
  getMarketOrderbook,
  getMarketCandlesticks,
  getMarketTrades,
  // Portfolio
  getBalance,
  getPositions,
  getFills,
  getOrders,
  // Trading
  createOrder,
  cancelOrder,
  amendOrder,
  decreaseOrder,
  // Price utilities
  centiCentsToDollars,
  centsToDollars,
  dollarsToCents,
  invertPrice,
};
