import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTickerData, useOrderEntry } from '../../hooks/useKalshiData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import { registerWindowTicker, unregisterWindowTicker } from '../../hooks/useHotkeyDispatch'
import { getTemplates, subscribe as subscribeHotkeys } from '../../services/hotkeyStore'
import PriceLadderSettings from './PriceLadderSettings'
import './PriceLadder.css'
import { TICKERS } from '../../constants/tickers'

const QUICK_SIZES = [1, 5, 10, 25, 50, 100]

const COLUMNS = [
  { key: 'bidSize', label: 'Bid', numeric: true },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'askSize', label: 'Ask', numeric: true },
  { key: 'volume', label: 'Vol', numeric: true },
]

function loadSettings(windowId) {
  try {
    const raw = localStorage.getItem(`price-ladder-settings-${windowId}`)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveSettings(windowId, settings) {
  try {
    localStorage.setItem(`price-ladder-settings-${windowId}`, JSON.stringify(settings))
  } catch { /* ignore */ }
}

const DEFAULT_SETTINGS = {
  visibleLevels: 20,
  centerOnTrade: true,
  flashDuration: 200,
  fontSize: 'medium',
  showVolumeBars: true,
  showWorkingOrders: true,
  clickAction: 'limit',
  defaultSize: 100,
}

// Build a full price ladder from 1-99 with bid/ask sizes at each level
function buildLadder(data) {
  if (!data || !data.yes || !data.no) return []

  const bidMap = {}
  const askMap = {}

  // YES bids = our bids
  if (Array.isArray(data.yes.bids)) {
    for (const level of data.yes.bids) {
      bidMap[level.price] = (bidMap[level.price] || 0) + level.size
    }
  }

  // NO bids → asks (ask price for YES = 100 - NO bid price)
  if (Array.isArray(data.no.bids)) {
    for (const level of data.no.bids) {
      const askPrice = 100 - level.price
      askMap[askPrice] = (askMap[askPrice] || 0) + level.size
    }
  }

  const levels = []
  for (let price = 99; price >= 1; price--) {
    levels.push({
      price,
      bidSize: bidMap[price] || 0,
      askSize: askMap[price] || 0,
    })
  }
  return levels
}

function PriceLadder({ windowId }) {
  const grid = useGridCustomization('priceLadder-' + windowId, COLUMNS)

  const [ticker, setTicker] = useState(TICKERS[0])
  const { data } = useTickerData(ticker)
  const { submitOrder, cancelOrder: cancelApiOrder } = useOrderEntry()
  const [settings, setSettings] = useState(() => loadSettings(windowId) || DEFAULT_SETTINGS)

  // Report current ticker to hotkey dispatch registry
  useEffect(() => {
    registerWindowTicker(windowId, ticker)
    return () => unregisterWindowTicker(windowId)
  }, [windowId, ticker])
  const [showSettings, setShowSettings] = useState(false)
  const [orderSize, setOrderSize] = useState(settings.defaultSize)
  const [workingOrders, setWorkingOrders] = useState([])
  const [flashPrices, setFlashPrices] = useState({})
  const [templates, setTemplates] = useState(() => getTemplates())

  // Subscribe to hotkey store changes (template CRUD)
  useEffect(() => {
    return subscribeHotkeys(() => setTemplates(getTemplates()))
  }, [])

  // Listen for LoadTemplate hotkey action
  useEffect(() => {
    const handler = (e) => {
      const t = e.detail
      if (!t) return
      setOrderSize(t.size || 1)
    }
    window.addEventListener('load-order-template', handler)
    return () => window.removeEventListener('load-order-template', handler)
  }, [])

  const ladderRef = useRef(null)
  const lastPriceRef = useRef(null)
  const hasCenteredRef = useRef(false)
  const flashTimersRef = useRef({})
  const orderIdRef = useRef(1)

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Reset centering when ticker changes
  useEffect(() => {
    hasCenteredRef.current = false
  }, [ticker])

  // Flash detection on last trade price change
  useEffect(() => {
    if (!data || !data.lastTrade) return
    const newPrice = data.lastTrade.price
    const prevPrice = lastPriceRef.current
    lastPriceRef.current = newPrice

    if (prevPrice !== null && newPrice !== prevPrice) {
      const dir = newPrice > prevPrice ? 'up' : 'down'
      setFlashPrices((fp) => ({ ...fp, [newPrice]: dir }))
      clearTimeout(flashTimersRef.current[newPrice])
      flashTimersRef.current[newPrice] = setTimeout(() => {
        setFlashPrices((fp) => {
          const next = { ...fp }
          delete next[newPrice]
          return next
        })
      }, settings.flashDuration)
    }
  }, [data, settings.flashDuration])

  // Cleanup flash timers on unmount
  useEffect(() => {
    return () => Object.values(flashTimersRef.current).forEach(clearTimeout)
  }, [])

  // Center on last trade price
  useEffect(() => {
    if (!data || !ladderRef.current || !settings.centerOnTrade) return
    if (hasCenteredRef.current) return

    const lastPrice = data.lastTrade.price
    const rowEl = ladderRef.current.querySelector(`[data-price="${lastPrice}"]`)
    if (rowEl) {
      rowEl.scrollIntoView({ block: 'center' })
      hasCenteredRef.current = true
    }
  }, [data, settings.centerOnTrade])

  // Emit ticker ownership update to Shell
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('window-ticker-update', { detail: { id: windowId, ticker } }))
  }, [windowId, ticker])

  // Color link subscription
  const handleLinkEvent = useCallback(
    ({ ticker: linkedTicker }) => {
      if (linkedTicker && linkedTicker !== ticker) {
        setTicker(linkedTicker)
      }
    },
    [ticker]
  )

  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return
    subscribeToLink(colorId, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorId, handleLinkEvent)
  }, [windowId, handleLinkEvent])

  // Ticker change handler
  const handleTickerChange = useCallback((e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    hasCenteredRef.current = false
    emitLinkedMarket(windowId, newTicker)
  }, [windowId])

  // Click-to-trade: place limit order at clicked price
  const handleLevelClick = useCallback((price, side) => {
    if (settings.clickAction !== 'limit') return
    const localId = orderIdRef.current++
    const order = {
      id: localId,
      side,
      size: orderSize,
      price,
      ticker,
      status: 'working',
      time: new Date().toLocaleTimeString(),
    }
    setWorkingOrders((prev) => [...prev, order])
    submitOrder({
      ticker,
      action: 'buy',
      side,
      type: 'limit',
      price,
      size: orderSize,
      timeInForce: 'gtc',
    }).then((result) => {
      const exchangeId = result?.order?.order_id ?? result?.order_id ?? null
      if (exchangeId) {
        setWorkingOrders((prev) =>
          prev.map((o) => (o.id === localId ? { ...o, exchangeId } : o))
        )
      }
    }).catch((err) => {
      console.error('[PriceLadder] Order placement failed:', err)
      setWorkingOrders((prev) => prev.filter((o) => o.id !== localId))
    })
  }, [settings.clickAction, orderSize, ticker, submitOrder])

  const cancelOrder = useCallback(async (orderId) => {
    const order = workingOrders.find((o) => o.id === orderId)
    if (order?.exchangeId) {
      cancelApiOrder(order.exchangeId).catch((err) =>
        console.error('[PriceLadder] Cancel failed:', err)
      )
    }
    setWorkingOrders((prev) => prev.filter((o) => o.id !== orderId))
  }, [cancelApiOrder, workingOrders])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
    setOrderSize(newSettings.defaultSize)
  }, [])

  // Re-center button
  const handleRecenter = useCallback(() => {
    if (!ladderRef.current || !lastPriceRef.current) return
    const rowEl = ladderRef.current.querySelector(`[data-price="${lastPriceRef.current}"]`)
    if (rowEl) rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  // Build ladder data
  const ladder = useMemo(() => buildLadder(data), [data])

  // Compute max volumes for bar widths
  const maxBid = useMemo(
    () => Math.max(1, ...ladder.map((l) => l.bidSize)),
    [ladder]
  )
  const maxAsk = useMemo(
    () => Math.max(1, ...ladder.map((l) => l.askSize)),
    [ladder]
  )

  // Total volumes
  const totalBid = useMemo(() => ladder.reduce((s, l) => s + l.bidSize, 0), [ladder])
  const totalAsk = useMemo(() => ladder.reduce((s, l) => s + l.askSize, 0), [ladder])

  // Working orders mapped by price
  const ordersByPrice = useMemo(() => {
    const map = {}
    for (const o of workingOrders) {
      if (!map[o.price]) map[o.price] = []
      map[o.price].push(o)
    }
    return map
  }, [workingOrders])

  const lastPrice = data?.lastTrade?.price ?? null
  const spread = useMemo(() => {
    if (!data?.yes?.bids?.length || !data?.no?.bids?.length) return null
    const bestBid = data.yes.bids[0]?.price ?? 0
    const bestAskPrice = data.no.bids[0] ? 100 - data.no.bids[0].price : 100
    return bestAskPrice - bestBid
  }, [data])

  // STUB: Price clustering/rounding logic — aggregate nearby price levels into groups
  // SOURCE: "ThinkorSwim price ladder clustering", futures DOM best practices
  // IMPLEMENT WHEN: User settings support cluster size configuration
  // STEPS: 1. Add clusterSize setting (e.g., 2, 5, 10 cent increments)
  //        2. Merge adjacent price levels into clusters, summing sizes
  //        3. Display cluster midpoint as the price label
  //        4. Adjust volume bar widths to reflect aggregated depth

  // STUB: P&L per price level — show potential P&L at each rung for open positions
  // SOURCE: "Sierra Chart DOM P&L column", professional trading tools
  // IMPLEMENT WHEN: Position data is available from omsService
  // STEPS: 1. Get current position for this ticker from omsService
  //        2. For each price level, calculate P&L = (price - avgEntry) * position
  //        3. Display as a new column with green/red coloring
  //        4. Update in real-time as position changes

  // STUB: Cumulative depth display — show cumulative bid/ask depth at each level
  // SOURCE: "Order book depth visualization", market microstructure analysis
  // IMPLEMENT WHEN: Settings panel supports depth display mode toggle
  // STEPS: 1. Add cumulative mode toggle to settings
  //        2. In cumulative mode, sum sizes from best bid/ask outward
  //        3. Display cumulative bars alongside individual level sizes
  //        4. Add depth imbalance indicator (cumBid / cumAsk ratio)


  const fontClass = `pl--font-${grid.fontSize}`

  return (
    <div
      className={`price-ladder ${fontClass}`}
      style={{
        ...(grid.bgColor ? { backgroundColor: grid.bgColor } : {}),
        ...(grid.textColor ? { color: grid.textColor } : {}),
      }}
    >
      {/* Ticker selector bar */}
      <div className="pl-ticker-bar">
        <select
          className="pl-ticker-select"
          value={ticker}
          onChange={handleTickerChange}
        >
          {(TICKERS.includes(ticker) ? TICKERS : [ticker, ...TICKERS]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="pl-recenter-btn" onClick={handleRecenter} title="Center on last price">
          &#8982;
        </button>
        <button
          className="pl-settings-btn"
          onClick={() => setShowSettings(true)}
          title="Price Ladder Settings"
        >
          &#9881;
        </button>
      </div>

      {data ? (
        <>
          {/* Column headers */}
          <div className="pl-header-row">
            {grid.visibleColumns.map((col, idx) => {
              const isOver = grid.dragState.dragging && grid.dragState.overIndex === idx
              return (
                <span
                  key={col.key}
                  className={`pl-col pl-col-${col.key}${isOver ? ' drag-over' : ''}`}
                  draggable
                  onDragStart={() => grid.onDragStart(idx)}
                  onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
                  onDragEnd={grid.onDragEnd}
                >
                  {col.label}
                </span>
              )
            })}
            {settings.showWorkingOrders && (
              <span className="pl-col pl-col-orders">Orders</span>
            )}
          </div>

          {/* Scrollable ladder */}
          <div className="pl-ladder-scroll" ref={ladderRef}>
            {ladder.map((level) => {
              const isLast = level.price === lastPrice
              const isAboveSpread = level.askSize > 0 && level.bidSize === 0
              const isBelowSpread = level.bidSize > 0 && level.askSize === 0
              const flash = flashPrices[level.price]
              const orders = ordersByPrice[level.price]
              const rowStyle = grid.getRowStyle(level)

              return (
                <div
                  key={level.price}
                  data-price={level.price}
                  className={`pl-row ${isLast ? 'pl-row--last' : ''} ${flash ? `pl-flash-${flash}` : ''}`}
                  style={{ height: grid.rowHeight, ...rowStyle }}
                >
                  {grid.visibleColumns.map((col) => {
                    if (col.key === 'bidSize') {
                      return (
                        <div
                          key="bidSize"
                          className="pl-cell pl-cell-bid"
                          onClick={() => level.bidSize > 0 && handleLevelClick(level.price, 'yes')}
                        >
                          {settings.showVolumeBars && level.bidSize > 0 && (
                            <div
                              className="pl-volume-bar pl-volume-bid"
                              style={{ width: `${(level.bidSize / maxBid) * 100}%` }}
                            />
                          )}
                          <span className="pl-cell-text">
                            {level.bidSize > 0 ? level.bidSize : ''}
                          </span>
                        </div>
                      )
                    }
                    if (col.key === 'price') {
                      return (
                        <div key="price" className={`pl-cell pl-cell-price ${isAboveSpread ? 'pl-price-ask' : ''} ${isBelowSpread ? 'pl-price-bid' : ''}`}>
                          {level.price}
                        </div>
                      )
                    }
                    if (col.key === 'askSize') {
                      return (
                        <div
                          key="askSize"
                          className="pl-cell pl-cell-ask"
                          onClick={() => level.askSize > 0 && handleLevelClick(level.price, 'no')}
                        >
                          {settings.showVolumeBars && level.askSize > 0 && (
                            <div
                              className="pl-volume-bar pl-volume-ask"
                              style={{ width: `${(level.askSize / maxAsk) * 100}%` }}
                            />
                          )}
                          <span className="pl-cell-text">
                            {level.askSize > 0 ? level.askSize : ''}
                          </span>
                        </div>
                      )
                    }
                    if (col.key === 'volume') {
                      return (
                        <div key="volume" className="pl-cell pl-cell-volume">
                          <span className="pl-cell-text">
                            {level.bidSize + level.askSize > 0 ? level.bidSize + level.askSize : ''}
                          </span>
                        </div>
                      )
                    }
                    return null
                  })}

                  {/* Working orders column (not part of grid columns) */}
                  {settings.showWorkingOrders && (
                    <div className="pl-cell pl-cell-orders">
                      {orders && orders.map((o) => (
                        <span
                          key={o.id}
                          className={`pl-order-tag ${o.side === 'yes' ? 'pl-order-bid' : 'pl-order-ask'}`}
                          onClick={() => cancelOrder(o.id)}
                          title="Click to cancel"
                        >
                          {o.side === 'yes' ? 'B' : 'S'}{o.size}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer info bar */}
          <div className="pl-footer">
            <div className="pl-footer-row">
              <span>Last: <strong>{lastPrice}c</strong></span>
              {spread !== null && <span>Spread: <strong>{spread}</strong></span>}
              <span>Size: </span>
              <input
                className="pl-size-input"
                type="number"
                min="1"
                value={orderSize}
                onChange={(e) => setOrderSize(Math.max(1, Number(e.target.value)))}
              />
            </div>
            {/* Quick-size buttons + template selector */}
            <div className="pl-quick-row">
              {QUICK_SIZES.map((s) => (
                <button
                  key={s}
                  className={`pl-quick-btn${orderSize === s ? ' pl-quick-btn--active' : ''}`}
                  onClick={() => setOrderSize(s)}
                >
                  {s}
                </button>
              ))}
              {templates.length > 0 && (
                <select
                  className="pl-template-select"
                  value=""
                  onChange={(e) => {
                    const t = templates.find((tpl) => tpl.id === e.target.value)
                    if (t) setOrderSize(t.size || 1)
                  }}
                >
                  <option value="" disabled>Templates</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.size})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="pl-footer-row pl-footer-totals">
              <span className="pl-total-bid">Bid: {totalBid}</span>
              <span className="pl-total-ask">Ask: {totalAsk}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="pl-loading">Loading {ticker}...</div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <PriceLadderSettings
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
          grid={grid}
        />
      )}
    </div>
  )
}

export default React.memo(PriceLadder)
