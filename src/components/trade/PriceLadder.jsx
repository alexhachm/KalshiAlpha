import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { subscribeToTicker } from '../../services/mockData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
import PriceLadderSettings from './PriceLadderSettings'
import './PriceLadder.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
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
  if (!data) return []

  const bidMap = {}
  const askMap = {}

  // YES bids = our bids
  for (const level of data.yes.bids) {
    bidMap[level.price] = level.size
  }

  // NO bids → asks (ask price for YES = 100 - NO bid price)
  for (const level of data.no.bids) {
    const askPrice = 100 - level.price
    askMap[askPrice] = level.size
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
  const [ticker, setTicker] = useState(TICKERS[0])
  const [data, setData] = useState(null)
  const [settings, setSettings] = useState(() => loadSettings(windowId) || DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [orderSize, setOrderSize] = useState(settings.defaultSize)
  const [workingOrders, setWorkingOrders] = useState([])
  const [flashPrices, setFlashPrices] = useState({})

  const ladderRef = useRef(null)
  const lastPriceRef = useRef(null)
  const hasCenteredRef = useRef(false)
  const flashTimersRef = useRef({})
  const orderIdRef = useRef(1)

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Subscribe to mock data
  useEffect(() => {
    hasCenteredRef.current = false
    const unsub = subscribeToTicker(ticker, (newData) => {
      setData((prev) => {
        // Flash detection on last trade price change
        if (prev && newData.lastTrade.price !== prev.lastTrade.price) {
          const dir = newData.lastTrade.price > prev.lastTrade.price ? 'up' : 'down'
          const p = newData.lastTrade.price
          setFlashPrices((fp) => ({ ...fp, [p]: dir }))
          clearTimeout(flashTimersRef.current[p])
          flashTimersRef.current[p] = setTimeout(() => {
            setFlashPrices((fp) => {
              const next = { ...fp }
              delete next[p]
              return next
            })
          }, settings.flashDuration)
        }
        lastPriceRef.current = newData.lastTrade.price
        return newData
      })
    })
    return () => {
      unsub()
      Object.values(flashTimersRef.current).forEach(clearTimeout)
    }
  }, [ticker, settings.flashDuration])

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

  // Color link subscription
  const handleLinkEvent = useCallback(
    ({ ticker: linkedTicker }) => {
      if (linkedTicker && linkedTicker !== ticker) {
        setTicker(linkedTicker)
        setData(null)
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
  const handleTickerChange = (e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    setData(null)
    hasCenteredRef.current = false
    emitLinkedMarket(windowId, newTicker)
  }

  // Click-to-trade: place limit order at clicked price
  const handleLevelClick = (price, side) => {
    if (settings.clickAction !== 'limit') return
    const order = {
      id: orderIdRef.current++,
      side,
      size: orderSize,
      price,
      ticker,
      status: 'working',
      time: new Date().toLocaleTimeString(),
    }
    setWorkingOrders((prev) => [...prev, order])
  }

  const cancelOrder = (orderId) => {
    setWorkingOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
    setOrderSize(newSettings.defaultSize)
  }

  // Re-center button
  const handleRecenter = () => {
    if (!ladderRef.current || !lastPriceRef.current) return
    const rowEl = ladderRef.current.querySelector(`[data-price="${lastPriceRef.current}"]`)
    if (rowEl) rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

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

  const lastPrice = data ? data.lastTrade.price : null
  const spread = data
    ? (() => {
        const bestBid = data.yes.bids[0]?.price ?? 0
        const bestAskPrice = data.no.bids[0] ? 100 - data.no.bids[0].price : 100
        return bestAskPrice - bestBid
      })()
    : null

  const fontClass = `pl--font-${settings.fontSize}`

  return (
    <div className={`price-ladder ${fontClass}`}>
      {/* Ticker selector bar */}
      <div className="pl-ticker-bar">
        <select
          className="pl-ticker-select"
          value={ticker}
          onChange={handleTickerChange}
        >
          {TICKERS.map((t) => (
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
            <span className="pl-col pl-col-bid">Bids</span>
            <span className="pl-col pl-col-price">Price</span>
            <span className="pl-col pl-col-ask">Asks</span>
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

              return (
                <div
                  key={level.price}
                  data-price={level.price}
                  className={`pl-row ${isLast ? 'pl-row--last' : ''} ${flash ? `pl-flash-${flash}` : ''}`}
                >
                  {/* Bid cell */}
                  <div
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

                  {/* Price cell */}
                  <div className={`pl-cell pl-cell-price ${isAboveSpread ? 'pl-price-ask' : ''} ${isBelowSpread ? 'pl-price-bid' : ''}`}>
                    {level.price}
                  </div>

                  {/* Ask cell */}
                  <div
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

                  {/* Working orders column */}
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
        />
      )}
    </div>
  )
}

export default React.memo(PriceLadder)
