import React, { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeToTicker } from '../../services/mockData'
import { useMarketSearch } from '../../hooks/useKalshiData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
import MontageSettings from './MontageSettings'
import './Montage.css'

const LS_KEY = 'kalshi_montage_settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveSettings(settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

const DEFAULT_SETTINGS = {
  defaultOrderSize: 100,
  confirmBeforeSend: true,
  soundAlerts: true,
  depthLevels: 5,
  flashDuration: 300,
  fontSize: 'medium',
  showWorkingOrders: true,
}

function Montage({ windowId }) {
  const [ticker, setTicker] = useState('FED-DEC23')
  const [data, setData] = useState(null)
  const [settings, setSettings] = useState(() => loadSettings() || DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const { results: searchResults, loading: searchLoading, search } = useMarketSearch()
  const searchTimerRef = useRef(null)

  // Order entry state
  const [orderSize, setOrderSize] = useState(settings.defaultOrderSize)
  const [orderType, setOrderType] = useState('limit')
  const [limitPrice, setLimitPrice] = useState('')
  const [timeInForce, setTimeInForce] = useState('gtc')
  const [workingOrders, setWorkingOrders] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Flash state for price changes
  const prevPricesRef = useRef({ yes: null, no: null })
  const flashTimerRef = useRef({})
  const [bidFlash, setBidFlash] = useState(null)
  const [askFlash, setAskFlash] = useState(null)
  const orderIdRef = useRef(1)

  // Persist settings
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Subscribe to mock data
  useEffect(() => {
    const unsub = subscribeToTicker(ticker, (newData) => {
      setData((prev) => {
        if (prev) {
          const prevYes = prev.yes.price
          const prevNo = prev.no.price
          if (newData.yes.price !== prevYes) {
            setBidFlash(newData.yes.price > prevYes ? 'up' : 'down')
            clearTimeout(flashTimerRef.current.bid)
            flashTimerRef.current.bid = setTimeout(
              () => setBidFlash(null),
              settings.flashDuration
            )
          }
          if (newData.no.price !== prevNo) {
            setAskFlash(newData.no.price > prevNo ? 'up' : 'down')
            clearTimeout(flashTimerRef.current.ask)
            flashTimerRef.current.ask = setTimeout(
              () => setAskFlash(null),
              settings.flashDuration
            )
          }
        }
        return newData
      })
    })
    return unsub
  }, [ticker, settings.flashDuration])

  // Cleanup flash timers
  useEffect(() => {
    return () => {
      clearTimeout(flashTimerRef.current.bid)
      clearTimeout(flashTimerRef.current.ask)
    }
  }, [])

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

  // Search handlers
  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(searchTimerRef.current)
    if (q.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => search(q.trim()), 300)
    }
  }

  const handleSearchSelect = (t) => {
    setTicker(t)
    setSearchQuery('')
    setData(null)
    setLimitPrice('')
    emitLinkedMarket(windowId, t)
  }

  // Set limit price when clicking a bid/ask level
  const handlePriceClick = (price) => {
    setLimitPrice(price.toString())
    setOrderType('limit')
  }

  // Place order
  const placeOrder = (side) => {
    const price = orderType === 'limit' ? Number(limitPrice) : (data ? data.yes.price : 0)
    if (orderType === 'limit' && (!limitPrice || price <= 0 || price >= 100)) return

    const order = {
      id: orderIdRef.current++,
      side,
      size: orderSize,
      price,
      type: orderType,
      tif: timeInForce,
      ticker,
      status: 'working',
      time: new Date().toLocaleTimeString(),
    }

    if (settings.confirmBeforeSend) {
      setConfirmDialog({ order, onConfirm: () => executeOrder(order) })
    } else {
      executeOrder(order)
    }
  }

  const executeOrder = (order) => {
    setConfirmDialog(null)
    if (order.type === 'limit') {
      setWorkingOrders((prev) => [...prev, order])
    }
    // Market orders would execute immediately in a real system
  }

  const cancelOrder = (orderId) => {
    setWorkingOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
    setOrderSize(newSettings.defaultOrderSize)
  }

  const fontClass = `montage--font-${settings.fontSize}`

  // Derive ask levels from NO bids (ask price for YES = 100 - NO bid price)
  const bidLevels = data ? data.yes.bids.slice(0, settings.depthLevels) : []
  const askLevels = data
    ? data.no.bids.slice(0, settings.depthLevels).map((level) => ({
        price: 100 - level.price,
        size: level.size,
        orders: level.orders,
      }))
    : []

  return (
    <div className={`montage ${fontClass}`}>
      {/* Ticker search bar */}
      <div className="mt-ticker-bar">
        <span className="mt-current-ticker">{ticker}</span>
        <div className="mt-search-wrapper">
          <input
            className="mt-search-input"
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery.trim().length >= 2 && (
            <div className="mt-search-results">
              {searchLoading && <div className="mt-search-item mt-search-loading">Searching...</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="mt-search-item mt-search-empty">No results</div>
              )}
              {searchResults.map((m) => (
                <div key={m.ticker} className="mt-search-item" onClick={() => handleSearchSelect(m.ticker)}>
                  <span className="mt-search-ticker">{m.ticker}</span>
                  {m.title && <span className="mt-search-title">{m.title}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="mt-settings-btn"
          onClick={() => setShowSettings(true)}
          title="Montage Settings"
        >
          &#9881;
        </button>
      </div>

      {data ? (
        <>
          {/* Level II Book */}
          <div className="mt-book">
            <div className="mt-book-side mt-book-bid">
              <div className="mt-book-header">
                <span>Size</span>
                <span>BID</span>
              </div>
              {bidLevels.map((level, i) => (
                <div
                  key={i}
                  className={`mt-book-row mt-bid-row ${i === 0 && bidFlash ? `flash-${bidFlash}` : ''}`}
                  onClick={() => handlePriceClick(level.price)}
                >
                  <span className="mt-book-size">{level.size}</span>
                  <span className="mt-book-price mt-bid-price">{level.price}c</span>
                </div>
              ))}
            </div>
            <div className="mt-book-side mt-book-ask">
              <div className="mt-book-header">
                <span>ASK</span>
                <span>Size</span>
              </div>
              {askLevels.map((level, i) => (
                <div
                  key={i}
                  className={`mt-book-row mt-ask-row ${i === 0 && askFlash ? `flash-${askFlash}` : ''}`}
                  onClick={() => handlePriceClick(level.price)}
                >
                  <span className="mt-book-price mt-ask-price">{level.price}c</span>
                  <span className="mt-book-size">{level.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Market info strip */}
          <div className="mt-info-strip">
            <span>Last: <strong>{data.yes.price}c</strong></span>
            <span>Vol: <strong>{data.lastTrade.size}</strong></span>
            <span className={data.lastTrade.side === 'YES' ? 'text-win' : 'text-loss'}>
              {data.lastTrade.side}
            </span>
          </div>

          {/* Order Entry */}
          <div className="mt-order-entry">
            <div className="mt-order-row">
              <label className="mt-label">Shares</label>
              <input
                className="mt-input mt-shares-input"
                type="number"
                min="1"
                value={orderSize}
                onChange={(e) => setOrderSize(Math.max(1, Number(e.target.value)))}
              />
              <label className="mt-label">Type</label>
              <select
                className="mt-select"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
              >
                <option value="limit">Limit</option>
                <option value="market">Market</option>
              </select>
            </div>
            <div className="mt-order-row">
              {orderType === 'limit' && (
                <>
                  <label className="mt-label">Price</label>
                  <input
                    className="mt-input mt-price-input"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="1-99"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                  />
                </>
              )}
              <label className="mt-label">TIF</label>
              <select
                className="mt-select"
                value={timeInForce}
                onChange={(e) => setTimeInForce(e.target.value)}
              >
                <option value="gtc">GTC</option>
                <option value="ioc">IOC</option>
              </select>
            </div>
            <div className="mt-buttons">
              <button
                className="mt-btn mt-btn-buy-yes"
                onClick={() => placeOrder('yes')}
              >
                BUY YES
              </button>
              <button
                className="mt-btn mt-btn-buy-no"
                onClick={() => placeOrder('no')}
              >
                BUY NO
              </button>
            </div>
          </div>

          {/* Working Orders */}
          {settings.showWorkingOrders && workingOrders.length > 0 && (
            <div className="mt-working-orders">
              <div className="mt-wo-header">Working Orders</div>
              {workingOrders.map((order) => (
                <div key={order.id} className="mt-wo-row">
                  <span className={order.side === 'yes' ? 'text-win' : 'text-loss'}>
                    BUY {order.size} {order.side.toUpperCase()} @ {order.price}c
                  </span>
                  <button
                    className="mt-wo-cancel"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-loading">Loading {ticker}...</div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="mt-confirm-overlay">
          <div className="mt-confirm-dialog">
            <div className="mt-confirm-title">Confirm Order</div>
            <div className="mt-confirm-body">
              {confirmDialog.order.type.toUpperCase()} {confirmDialog.order.size}{' '}
              {confirmDialog.order.side.toUpperCase()} @ {confirmDialog.order.price}c
              <br />
              <span className="text-muted">{ticker} | {confirmDialog.order.tif.toUpperCase()}</span>
            </div>
            <div className="mt-confirm-buttons">
              <button
                className="mt-btn mt-btn-buy-yes"
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
              <button
                className="mt-btn mt-btn-cancel"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <MontageSettings
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(Montage)
