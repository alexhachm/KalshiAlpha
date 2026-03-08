// React hooks for Kalshi data subscriptions.
// Provides clean subscribe/unsubscribe lifecycle tied to component mount/unmount.

import { useState, useEffect, useCallback, useRef } from 'react';
import * as dataFeed from '../services/dataFeed';

/**
 * Subscribe to real-time ticker data for a market.
 * Returns the latest tick data, auto-subscribes/unsubscribes on mount/unmount.
 *
 * @param {string|null} ticker - Market ticker to subscribe to, or null to skip
 * @returns {{ data: Object|null, error: string|null }}
 */
export function useTickerData(ticker) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) {
      setData(null);
      return;
    }

    setError(null);

    try {
      const unsub = dataFeed.subscribeToTicker(ticker, (tickData) => {
        setData(tickData);
      });
      return unsub;
    } catch (err) {
      setError(err.message);
    }
  }, [ticker]);

  return { data, error };
}

/**
 * Subscribe to market race / top movers data.
 * @returns {{ racers: Array, error: string|null }}
 */
export function useMarketRace() {
  const [racers, setRacers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsub = dataFeed.subscribeToMarketRace((data) => {
        setRacers(data);
      });
      return unsub;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { racers, error };
}

/**
 * Subscribe to scanner alerts.
 * Accumulates alerts in an array (newest first).
 *
 * @param {number} maxAlerts - Maximum number of alerts to keep (default 100)
 * @returns {{ alerts: Array, clearAlerts: Function, error: string|null }}
 */
export function useScannerAlerts(maxAlerts = 100) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsub = dataFeed.subscribeToScanner((alert) => {
        setAlerts((prev) => [alert, ...prev].slice(0, maxAlerts));
      });
      return unsub;
    } catch (err) {
      setError(err.message);
    }
  }, [maxAlerts]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { alerts, clearAlerts, error };
}

/**
 * Subscribe to OHLCV candle data for charting.
 *
 * @param {string|null} ticker
 * @param {string} timeframe - '1m', '5m', '15m', '30m', '1h', '4h', '1D'
 * @returns {{ candles: Array, currentCandle: Object|null, error: string|null }}
 */
export function useOHLCV(ticker, timeframe = '1h') {
  const [candles, setCandles] = useState([]);
  const [currentCandle, setCurrentCandle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) {
      setCandles([]);
      setCurrentCandle(null);
      return;
    }

    setError(null);

    try {
      const unsub = dataFeed.subscribeToOHLCV(ticker, timeframe, (msg) => {
        if (msg.type === 'history') {
          setCandles(msg.candles || []);
        } else if (msg.type === 'update') {
          setCurrentCandle(msg.candle);
        }
      });
      return unsub;
    } catch (err) {
      setError(err.message);
    }
  }, [ticker, timeframe]);

  return { candles, currentCandle, error };
}

/**
 * Get connection status and control.
 * @returns {{ connected: boolean, initialize: Function, disconnect: Function }}
 */
export function useKalshiConnection() {
  const [connected, setConnected] = useState(dataFeed.isConnected());

  useEffect(() => {
    const unsub = dataFeed.onConnectionChange((isConn) => {
      setConnected(isConn);
    });
    return unsub;
  }, []);

  const initialize = useCallback(async (opts) => {
    await dataFeed.initialize(opts);
  }, []);

  const disconnect = useCallback(() => {
    dataFeed.disconnectFeed();
  }, []);

  return { connected, initialize, disconnect };
}

/**
 * Portfolio data: balance, positions, orders.
 * Fetches on mount and periodically refreshes.
 *
 * @param {number} refreshInterval - Refresh interval in ms (default 5000)
 * @returns {{ balance: Object|null, positions: Array, orders: Array, fills: Array, refresh: Function }}
 */
export function usePortfolio(refreshInterval = 5000) {
  const [balance, setBalance] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fills, setFills] = useState([]);
  const timerRef = useRef(null);
  const debounceRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [bal, pos, ord, fil] = await Promise.all([
        dataFeed.getPortfolioBalance(),
        dataFeed.getOpenPositions(),
        dataFeed.getOpenOrders(),
        dataFeed.getFillHistory(),
      ]);
      setBalance(bal);
      setPositions(pos);
      setOrders(ord);
      setFills(fil);
    } catch (err) {
      console.error('[usePortfolio] refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      timerRef.current = setInterval(refresh, refreshInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refresh, refreshInterval]);

  // Also listen for real-time position updates — debounced to prevent refresh storms
  useEffect(() => {
    const debouncedRefresh = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(refresh, 300);
    };

    const unsubFills = dataFeed.subscribeToUserFills(debouncedRefresh);
    const unsubPositions = dataFeed.subscribeToPositionChanges(debouncedRefresh);
    return () => {
      clearTimeout(debounceRef.current);
      unsubFills();
      unsubPositions();
    };
  }, [refresh]);

  return { balance, positions, orders, fills, refresh };
}

/**
 * Place an order via the data feed.
 * Returns a submit function and status tracking.
 *
 * @returns {{ submitOrder: Function, lastResult: Object|null, submitting: boolean, error: string|null }}
 */
export function useOrderEntry() {
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const submitOrder = useCallback(async (order) => {
    setSubmitting(true);
    setError(null);
    try {
      const normalizedOrder = dataFeed.normalizeCreateOrderPayload(order);
      const result = await dataFeed.placeOrder(normalizedOrder);
      setLastResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId) => {
    try {
      return await dataFeed.cancelExistingOrder(orderId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { submitOrder, cancelOrder, lastResult, submitting, error };
}

/**
 * Run a historical scan query.
 * Returns results, scanning state, and a scan trigger function.
 *
 * @returns {{ results: Array, scanning: boolean, error: string|null, scan: Function }}
 */
export function useHistoricalScan() {
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const scan = useCallback(async (params) => {
    setScanning(true);
    setError(null);
    try {
      const data = await dataFeed.getHistoricalScanResults(params);
      setResults(data);
      return data;
    } catch (err) {
      setError(err.message);
      setResults([]);
      return [];
    } finally {
      setScanning(false);
    }
  }, []);

  return { results, scanning, error, scan };
}

/**
 * Search markets.
 * @param {string} query - Search term
 * @returns {{ results: Array, loading: boolean, search: Function }}
 */
export function useMarketSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query, params = {}) => {
    setLoading(true);
    try {
      const markets = await dataFeed.searchMarkets(query, params);
      setResults(markets);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}
