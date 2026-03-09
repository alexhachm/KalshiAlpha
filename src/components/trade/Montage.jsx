import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTickerData, useOrderEntry, useMarketSearch } from '../../hooks/useKalshiData'
import useCombobox from '../../hooks/useCombobox'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
} from '../../services/linkBus'
import useColorGroup from '../../hooks/useColorGroup'
import { registerWindowTicker, unregisterWindowTicker } from '../../hooks/useHotkeyDispatch'
import MontageSettings from './MontageSettings'
import './Montage.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

const LS_KEY_PREFIX = 'montage-settings-'

function loadSettings(windowId) {
  try {
    const raw = localStorage.getItem(LS_KEY_PREFIX + windowId)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveSettings(windowId, settings) {
  try {
    localStorage.setItem(LS_KEY_PREFIX + windowId, JSON.stringify(settings))
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
  const [ticker, setTicker] = useState(TICKERS[0])
  const [settings, setSettings] = useState(() => loadSettings(windowId) || DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)

  // Report current ticker to hotkey dispatch registry
  useEffect(() => {
    registerWindowTicker(windowId, ticker)
    return () => unregisterWindowTicker(windowId)
  }, [windowId, ticker])

  // Data hooks
  const { data, error: tickerError } = useTickerData(ticker)
  const { submitOrder, cancelOrder: cancelApiOrder, submitting, error: orderError } = useOrderEntry()


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
  const prevDataRef = useRef(null)
  const flashTimerRef = useRef({})
  const [bidFlash, setBidFlash] = useState(null)
  const [askFlash, setAskFlash] = useState(null)
  const orderIdRef = useRef(1)
  const containerRef = useRef(null)

  // Toggle settings via right-click header event
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = () => setShowSettings((s) => !s)
    el.addEventListener('toggle-settings', handler)
    return () => el.removeEventListener('toggle-settings', handler)
  }, [])

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Flash detection on data changes
  useEffect(() => {
    if (!data) {
      prevDataRef.current = null
      return
    }
    const prev = prevDataRef.current
    if (prev) {
      if (data.yes.price !== prev.yes.price) {
        setBidFlash(data.yes.price > prev.yes.price ? 'up' : 'down')
        clearTimeout(flashTimerRef.current.bid)
        flashTimerRef.current.bid = setTimeout(
          () => setBidFlash(null),
          settings.flashDuration
        )
      }
      if (data.no.price !== prev.no.price) {
        setAskFlash(data.no.price > prev.no.price ? 'up' : 'down')
        clearTimeout(flashTimerRef.current.ask)
        flashTimerRef.current.ask = setTimeout(
          () => setAskFlash(null),
          settings.flashDuration
        )
      }
    }
    prevDataRef.current = data
  }, [data, settings.flashDuration])

  // Reset flash tracking on ticker change
  useEffect(() => {
    prevDataRef.current = null
  }, [ticker])

  // Clear stale state on ticker change
  useEffect(() => {
    setWorkingOrders([])
    setOrderSize(settings.defaultOrderSize)
    setLimitPrice('')
    setOrderType('limit')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker])

  // Cleanup flash timers
  useEffect(() => {
    return () => {
      clearTimeout(flashTimerRef.current.bid)
      clearTimeout(flashTimerRef.current.ask)
    }
  }, [])

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

  const colorId = useColorGroup(windowId)

  useEffect(() => {
    if (!colorId) return
    subscribeToLink(colorId, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorId, handleLinkEvent)
  }, [windowId, colorId, handleLinkEvent])

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => clearTimeout(searchTimerRef.current)
  }, [])

  // Search handlers
  const handleSearchSelect = useCallback((t) => {
    setTicker(t)
    setSearchQuery('')
    setLimitPrice('')
    combobox.close()
    emitLinkedMarket(windowId, t)
  }, [windowId])

  const combobox = useCombobox({
    id: `mt-search-${windowId}`,
    items: searchResults,
    onSelect: handleSearchSelect,
  })

  const handleSearchChange = useCallback((e) => {
    const q = e.target.value
    setSearchQuery(q)
    combobox.open()
    clearTimeout(searchTimerRef.current)
    if (q.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => search(q.trim()), 300)
    }
  }, [search, combobox.open])

  // Set limit price when clicking a bid/ask level
  const handlePriceClick = useCallback((price) => {
    setLimitPrice(price.toString())
    setOrderType('limit')
  }, [])

  // Place order — with size and price validation
  const placeOrder = (side) => {
    const roundedSize = Math.round(orderSize)
    if (roundedSize <= 0 || roundedSize > 10000 || !Number.isInteger(roundedSize)) return
    const price = orderType === 'limit' ? Math.round(Number(limitPrice)) : (data ? data.yes.price : 0)
    if (orderType === 'limit' && (!limitPrice || !Number.isInteger(price) || price <= 0 || price >= 100)) return
    if (orderType === 'market' && !data) return

    const order = {
      id: orderIdRef.current++,
      side,
      size: roundedSize,
      price,
      type: orderType,
      timeInForce,
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

  const executeOrder = async (order) => {
    setConfirmDialog(null)
    try {
      await submitOrder({
        ticker: order.ticker,
        action: 'buy',
        side: order.side,
        type: order.type,
        price: order.price,
        size: order.size,
        timeInForce: order.timeInForce,
      })
    } catch (err) {
      console.error('[Montage] Order placement failed:', err)
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      await cancelApiOrder(orderId)
    } catch (err) {
      console.error('[Montage] Cancel failed:', err)
    }
  }

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
    setOrderSize(newSettings.defaultOrderSize)
  }

  // STUB: Smart order routing — route orders through optimal execution path
  // SOURCE: "Smart Order Routing in electronic markets", SEC best execution requirements
  // IMPLEMENT WHEN: Multiple execution venues available (Kalshi API + dark pools)
  // STEPS: 1. Check available liquidity at each venue for requested size
  //        2. Split orders across venues to minimize market impact
  //        3. Track execution quality (fill rate, slippage) per venue
  //        4. Display routing decision in order confirmation dialog

  // STUB: Order type expansion — add stop-loss, trailing stop, bracket orders
  // SOURCE: "Professional trading order types", thinkorswim order entry
  // IMPLEMENT WHEN: omsService supports conditional/linked orders
  // STEPS: 1. Add stop price input field (shown when order type = 'stop' or 'stop-limit')
  //        2. Add bracket order mode: entry + take-profit + stop-loss in one submission
  //        3. Implement trailing stop with configurable trail amount
  //        4. Display active conditional orders in working orders section

  // STUB: Total cost preview — show max cost/risk before order submission
  // SOURCE: "Kalshi API order requirements", risk management best practices
  // IMPLEMENT WHEN: Data and order entry are functional
  // STEPS: 1. Calculate max cost = price * size for buy orders
  //        2. Calculate max profit = (100 - price) * size
  //        3. Display cost/profit preview below order buttons
  //        4. Warn if order cost exceeds available balance

  const fontClass = `montage--font-${settings.fontSize}`

  // Derive ask levels from NO bids (ask price for YES = 100 - NO bid price) — memoized
  const bidLevels = useMemo(
    () => data?.yes?.bids ? data.yes.bids.slice(0, settings.depthLevels) : [],
    [data, settings.depthLevels]
  )
  const askLevels = useMemo(
    () => data?.no?.bids
      ? data.no.bids.slice(0, settings.depthLevels).map((level) => ({
          price: 100 - level.price,
          size: level.size,
          orders: level.orders,
        }))
      : [],
    [data, settings.depthLevels]
  )

  // Max sizes for depth bar widths — memoized
  const maxBidSize = useMemo(() => Math.max(1, ...bidLevels.map((l) => l.size)), [bidLevels])
  const maxAskSize = useMemo(() => Math.max(1, ...askLevels.map((l) => l.size)), [askLevels])

  // Spread display — memoized
  const spread = useMemo(
    () => bidLevels.length > 0 && askLevels.length > 0
      ? askLevels[0].price - bidLevels[0].price
      : null,
    [bidLevels, askLevels]
  )

  return (
    <div ref={containerRef} className={`montage ${fontClass}`}>
      {/* Ticker search bar */}
      <div className="mt-ticker-bar">
        <span className="mt-current-ticker">{ticker}</span>
        <div className="mt-search-wrapper" ref={combobox.wrapperRef}>
          <input
            ref={combobox.inputRef}
            className="mt-search-input"
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={combobox.handleKeyDown}
            onFocus={() => searchQuery.trim().length >= 2 && combobox.open()}
            {...combobox.getInputProps()}
          />
          {combobox.isOpen && searchQuery.trim().length >= 2 && (
            <div className="mt-search-results" {...combobox.getListboxProps()}>
              {searchLoading && <div className="mt-search-item mt-search-loading">Searching...</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="mt-search-item mt-search-empty">No results</div>
              )}
              {searchResults.map((m, i) => (
                <div
                  key={m.ticker}
                  className={`mt-search-item${i === combobox.activeIndex ? ' mt-search-item--active' : ''}`}
                  {...combobox.getOptionProps(i)}
                  onClick={() => handleSearchSelect(m.ticker)}
                >
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

      {/* Error display */}
      {(tickerError || orderError) && (
        <div className="mt-error">
          {tickerError && <span>Data: {tickerError}</span>}
          {orderError && <span>Order: {orderError}</span>}
        </div>
      )}

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
                  <div className="mt-depth-bar" style={{ width: `${(level.size / maxBidSize) * 100}%` }} />
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
                  <div className="mt-depth-bar" style={{ width: `${(level.size / maxAskSize) * 100}%` }} />
                  <span className="mt-book-price mt-ask-price">{level.price}c</span>
                  <span className="mt-book-size">{level.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Market info strip */}
          <div className="mt-info-strip">
            <span>Last: <strong>{data.yes.price}c</strong></span>
            {spread !== null && <span>Spread: <strong>{spread}</strong></span>}
            <span>Qty: <strong>{data.lastTrade.size}</strong></span>
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
                step="1"
                value={orderSize}
                onChange={(e) => setOrderSize(Math.max(1, Math.round(Number(e.target.value))))}
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
                    step="1"
                    placeholder="1-99"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(String(Math.round(Number(e.target.value)) || ''))}
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
              <span className="text-muted">
                {ticker} | {confirmDialog.order.timeInForce.toUpperCase()}
              </span>
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
