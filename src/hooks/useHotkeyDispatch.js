// Global hotkey dispatch hook — listens for key combos and executes bound scripts
// Integrates hotkeyStore (bindings) + hotkeyLanguage (parser) + dataFeed (execution)

import { useEffect, useRef } from 'react'
import { normalizeKeyCombo, findBindingByKey, findTemplateByName, subscribe, isConfigActive } from '../services/hotkeyStore'
import { parseHotkeyScript } from '../services/hotkeyLanguage'
import * as dataFeed from '../services/dataFeed'
import { emitLinkedMarket } from '../services/linkBus'

// Live ticker registry — components call registerWindowTicker so trading hotkeys
// always resolve the current in-component ticker, not stale Shell metadata.
const tickerRegistry = new Map()

function registerWindowTicker(windowId, ticker) {
  if (windowId == null) return
  const key = String(windowId)
  if (ticker) {
    tickerRegistry.set(key, ticker)
  } else {
    tickerRegistry.delete(key)
  }
}

function unregisterWindowTicker(windowId) {
  if (windowId == null) return
  tickerRegistry.delete(String(windowId))
}

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

/**
 * Resolve the active ticker for trading hotkeys.
 * Checks live component registry first (handles in-window ticker changes),
 * then falls back to Shell window metadata.
 * Returns null and logs a warning if no ticker can be resolved.
 */
function resolveActiveTicker(getFocusedWindow) {
  const focused = getFocusedWindow()
  if (!focused) {
    console.warn('[HotkeyDispatch] No focused window — cannot resolve ticker')
    return null
  }

  // Tabbed windows: check active tab's ID in the live registry
  const tabId = focused.tabs?.[focused.activeTabIndex]?.id
  if (tabId) {
    const reg = tickerRegistry.get(String(tabId))
    if (reg) return reg
  }

  // Non-tabbed windows: check window ID in registry
  const reg = tickerRegistry.get(String(focused.id))
  if (reg) return reg

  // Fallback: Shell window state (initial ticker from OPEN_WINDOW / UPDATE_WINDOW_TICKER)
  if (focused.ticker) return focused.ticker

  console.warn(
    '[HotkeyDispatch] Window %s has no ticker in registry or Shell metadata',
    focused.id
  )
  return null
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

/**
 * Infer the SELL side from open positions when Side is omitted.
 * Returns 'YES' or 'NO' if exactly one side is open,
 * 'AMBIGUOUS' if both sides are open, or null if no position exists.
 */
async function resolveSellSide(ticker) {
  const positions = await dataFeed.getOpenPositions()
  const tickerPositions = positions.filter(
    (p) => p.ticker === ticker && (p.position > 0 || p.contracts > 0)
  )

  if (tickerPositions.length === 0) return null

  if (tickerPositions.length === 1) {
    return tickerPositions[0].side?.toUpperCase() || null
  }

  // Multiple entries — check which sides actually have quantity
  const yesPos = tickerPositions.find((p) => p.side === 'yes')
  const noPos = tickerPositions.find((p) => p.side === 'no')
  const yesQty = yesPos?.position || yesPos?.contracts || 0
  const noQty = noPos?.position || noPos?.contracts || 0

  if (yesQty > 0 && noQty > 0) return 'AMBIGUOUS'
  if (yesQty > 0) return 'YES'
  if (noQty > 0) return 'NO'
  return null
}

async function resolveShares(sharesParam, ticker, side) {
  if (!sharesParam) return null
  if (sharesParam.type === 'fixed') return sharesParam.value

  if (sharesParam.type === 'position' || sharesParam.type === 'position_fraction') {
    const positions = await dataFeed.getOpenPositions()
    const pos = positions.find(
      (p) => p.ticker === ticker && (!side || p.side === side)
    )
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
    async function executeAction(parsed) {
      const { action, params } = parsed

      if (action === 'BUY' || action === 'SELL') {
        const ticker = resolveActiveTicker(() => getFocusedWindowRef.current())
        if (!ticker) {
          console.warn('[HotkeyDispatch] %s skipped — no active ticker', action)
          return
        }

        let side
        if (params.side) {
          side = params.side.toLowerCase()
        } else if (action === 'BUY') {
          side = 'yes'
        } else {
          // SELL with no explicit side: infer from open position
          const inferred = await resolveSellSide(ticker)
          if (inferred === 'AMBIGUOUS') {
            console.warn(
              '[HotkeyDispatch] SELL skipped — both YES and NO positions open for %s; specify Side=YES or Side=NO',
              ticker
            )
            return
          }
          if (!inferred) {
            console.warn('[HotkeyDispatch] SELL skipped — no open position for %s', ticker)
            return
          }
          side = inferred.toLowerCase()
        }

        const price = resolvePrice(params.price, ticker)
        const size = await resolveShares(params.shares, ticker, side)
        if (size == null || size <= 0) return
        try {
          const normalizedOrder = dataFeed.normalizeCreateOrderPayload({
            ticker,
            action: action.toLowerCase(),
            type: (params.route || 'LIMIT').toLowerCase(),
            side,
            price,
            size,
            timeInForce: params.tif,
          })
          await dataFeed.placeOrder(normalizedOrder)
        } catch (err) {
          console.error('[HotkeyDispatch] Order failed:', err)
        }
        return
      }

      if (action === 'CANCEL_ALL') {
        const ticker = resolveActiveTicker(() => getFocusedWindowRef.current())
        if (!ticker) {
          console.warn('[HotkeyDispatch] %s skipped — no active ticker', action)
          return
        }
        try {
          const orders = await dataFeed.getOpenOrders()
          const orderIds = orders
            .filter((o) => o.ticker === ticker)
            .map((o) => o.order_id)
            .filter(Boolean)
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
        const ticker = resolveActiveTicker(() => getFocusedWindowRef.current())
        if (!ticker) {
          console.warn('[HotkeyDispatch] %s skipped — no active ticker', action)
          return
        }
        const targetAction = action === 'CANCEL_BUY' ? 'buy' : 'sell'
        try {
          const orders = await dataFeed.getOpenOrders()
          const orderIds = orders
            .filter((o) => o.ticker === ticker)
            .filter((o) => String(o.action || '').toLowerCase() === targetAction)
            .map((o) => o.order_id)
            .filter(Boolean)
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
        return
      }

      if (action === 'LOAD_TEMPLATE') {
        const template = findTemplateByName(params.name)
        if (!template) {
          console.warn('[HotkeyDispatch] Template "%s" not found', params.name)
          return
        }
        // Emit custom event for trading windows to apply the template
        window.dispatchEvent(
          new CustomEvent('load-order-template', { detail: template })
        )
      }
    }

    function handleKeyDown(event) {
      // Config guard: skip all trading dispatches while HotkeyManager UI is active
      if (isConfigActive()) return

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

export { useHotkeyDispatch, registerWindowTicker, unregisterWindowTicker }
