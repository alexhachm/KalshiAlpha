// Global hotkey dispatch hook — listens for key combos and executes bound scripts
// Integrates hotkeyStore (bindings) + hotkeyLanguage (parser) + dataFeed (execution)

import { useEffect, useRef } from 'react'
import { normalizeKeyCombo, findBindingByKey, subscribe } from '../services/hotkeyStore'
import { parseHotkeyScript } from '../services/hotkeyLanguage'
import * as dataFeed from '../services/dataFeed'
import { emitLinkedMarket } from '../services/linkBus'

// Map focus-target names (from hotkeyLanguage) to window type strings (from Shell)
const FOCUS_TYPE_MAP = {
  montage: 'montage',
  chart: 'chart',
  positions: 'positions',
  tradelog: 'trade-log',
  eventlog: 'event-log',
  accounts: 'accounts',
  timesale: 'time-sale',
  watchlist: 'market-viewer',
  scanner: 'live-scanner',
  priceladder: 'price-ladder',
}

function resolvePrice(priceParam, ticker) {
  if (!priceParam) return null
  if (priceParam.type === 'fixed') return priceParam.value

  const dom = dataFeed.buildSyntheticDom(ticker)
  const bestBid = dom.bids[0]?.price ?? 50
  const bestAsk = dom.asks[0]?.price ?? 50
  const mid = Math.round((bestBid + bestAsk) / 2)

  const bases = { bid: bestBid, ask: bestAsk, mid, last: bestBid, price: bestBid }

  if (priceParam.type === 'market') {
    return bases[priceParam.base] ?? bestBid
  }
  if (priceParam.type === 'offset') {
    const base = bases[priceParam.base] ?? bestBid
    return base + priceParam.offset
  }
  return null
}

async function resolveShares(sharesParam, ticker) {
  if (!sharesParam) return null
  if (sharesParam.type === 'fixed') return sharesParam.value

  if (sharesParam.type === 'position' || sharesParam.type === 'position_fraction') {
    const positions = await dataFeed.getOpenPositions()
    const pos = positions.find((p) => p.ticker === ticker)
    const size = pos?.position || 0
    return sharesParam.type === 'position'
      ? size
      : Math.floor(size * sharesParam.multiplier)
  }

  if (sharesParam.type === 'buying_power') {
    const balance = await dataFeed.getPortfolioBalance()
    if (!balance) return 0
    return Math.floor(balance.balance * sharesParam.factor)
  }

  if (sharesParam.type === 'max_position') {
    return 100 // placeholder — risk settings not yet implemented
  }

  return null
}

function useHotkeyDispatch({ focusWindow, getFocusedWindow, windows }) {
  const windowsRef = useRef(windows)
  windowsRef.current = windows

  const getFocusedWindowRef = useRef(getFocusedWindow)
  getFocusedWindowRef.current = getFocusedWindow

  useEffect(() => {
    function getActiveTicker() {
      const focused = getFocusedWindowRef.current()
      return focused?.ticker || null
    }

    function getOrderTicker(order) {
      return order?.ticker || order?.market_ticker || null
    }

    function getOrderId(order) {
      return order?.order_id || order?.orderId || order?.id || order?.client_order_id || null
    }

    async function executeAction(parsed) {
      const { action, params } = parsed

      if (action === 'BUY' || action === 'SELL') {
        const ticker = getActiveTicker()
        if (!ticker) return

        const price = resolvePrice(params.price, ticker)
        const quantity = await resolveShares(params.shares, ticker)
        if (quantity == null || quantity <= 0) return

        const side = (params.side || (action === 'BUY' ? 'YES' : 'NO')).toLowerCase()
        try {
          await dataFeed.placeOrder({
            ticker,
            action: action.toLowerCase(),
            type: (params.route || 'LIMIT').toLowerCase(),
            side,
            yes_price: price != null
              ? (side === 'yes' ? price : 100 - price)
              : undefined,
            count_fp: parseFloat(quantity).toFixed(2),
          })
        } catch (err) {
          console.error('[HotkeyDispatch] Order failed:', err)
        }
        return
      }

      if (action === 'CANCEL_ALL') {
        const ticker = getActiveTicker()
        if (!ticker) return

        try {
          const orders = await dataFeed.getOpenOrders()
          const orderIds = orders
            .filter((o) => getOrderTicker(o) === ticker)
            .map((o) => getOrderId(o))
            .filter(Boolean)
          if (orderIds.length === 0) return

          const result = await dataFeed.cancelOrdersSequential(orderIds)
          if (result.failed.length > 0) {
            console.warn('[HotkeyDispatch] Some cancels failed:', result.failed)
          }
        } catch (err) {
          console.error('[HotkeyDispatch] Cancel all failed:', err)
        }
        return
      }

      if (action === 'CANCEL_BUY' || action === 'CANCEL_SELL') {
        const ticker = getActiveTicker()
        if (!ticker) return

        const desiredAction = action === 'CANCEL_BUY' ? 'buy' : 'sell'
        try {
          const orders = await dataFeed.getOpenOrders()
          const orderIds = orders
            .filter((o) => getOrderTicker(o) === ticker)
            .filter((o) => String(o.action || '').toLowerCase() === desiredAction)
            .map((o) => getOrderId(o))
            .filter(Boolean)
          if (orderIds.length === 0) return

          const result = await dataFeed.cancelOrdersSequential(orderIds)
          if (result.failed.length > 0) {
            console.warn('[HotkeyDispatch] Some cancels failed:', result.failed)
          }
        } catch (err) {
          console.error('[HotkeyDispatch] Cancel by side failed:', err)
        }
        return
      }

      if (action === 'FOCUS') {
        const target = params.target
        if (!target) return
        const windowType = FOCUS_TYPE_MAP[target] || target
        const match = Object.values(windowsRef.current).find((w) => w.type === windowType)
        if (match) focusWindow(match.id)
        return
      }

      if (action === 'SWITCH_TICKER') {
        const ticker = params.ticker
        if (!ticker) return
        const focused = getFocusedWindowRef.current()
        if (focused) {
          emitLinkedMarket(String(focused.id), ticker)
        }
      }
    }

    function handleKeyDown(event) {
      // Input guard: skip when typing in form elements
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (document.activeElement?.isContentEditable) return

      const combo = normalizeKeyCombo(event)
      if (!combo) return

      const binding = findBindingByKey(combo)
      if (!binding || !binding.active) return

      event.preventDefault()

      const parsed = parseHotkeyScript(binding.script)
      if (parsed.errors.length > 0 || !parsed.action) {
        console.warn('[HotkeyDispatch] Script errors:', parsed.errors)
        return
      }

      executeAction(parsed)
    }

    document.addEventListener('keydown', handleKeyDown)
    const unsubStore = subscribe(() => {
      // Bindings changed — lookup happens on each keydown, no cache to invalidate
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      unsubStore()
    }
  }, [focusWindow])
}

export { useHotkeyDispatch }
