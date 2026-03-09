import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTickerData, useMarketSearch } from '../hooks/useKalshiData'
import useCombobox from '../hooks/useCombobox'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../services/linkBus'
import { registerWindowTicker, unregisterWindowTicker } from '../hooks/useHotkeyDispatch'
import { formatCents, sideLabel } from '../services/displayFormat'
import './MarketViewer.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

function MarketViewer({ windowId }) {
  const [ticker, setTicker] = useState(TICKERS[0])

  // Report current ticker to hotkey dispatch registry
  useEffect(() => {
    registerWindowTicker(windowId, ticker)
    return () => unregisterWindowTicker(windowId)
  }, [windowId, ticker])

  const [yesFlash, setYesFlash] = useState(null)
  const [noFlash, setNoFlash] = useState(null)
  const flashTimerRef = useRef({})
  const prevPricesRef = useRef({ yes: null, no: null })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const { results: searchResults, loading: searchLoading, search } = useMarketSearch()

  const handleSearchSelect = useCallback((t) => {
    setTicker(t)
    setSearchQuery('')
    combobox.close()
    emitLinkedMarket(windowId, t)
  }, [windowId])

  const combobox = useCombobox({
    id: `mv-search-${windowId}`,
    items: searchResults,
    onSelect: handleSearchSelect,
  })

  // Subscribe to ticker data via hook
  const { data } = useTickerData(ticker)

  // Flash detection on price changes
  useEffect(() => {
    if (!data) return

    const prevYes = prevPricesRef.current.yes
    const prevNo = prevPricesRef.current.no

    if (prevYes !== null && data.yes.price !== prevYes) {
      setYesFlash(data.yes.price > prevYes ? 'up' : 'down')
      clearTimeout(flashTimerRef.current.yes)
      flashTimerRef.current.yes = setTimeout(() => setYesFlash(null), 500)
    }
    if (prevNo !== null && data.no.price !== prevNo) {
      setNoFlash(data.no.price > prevNo ? 'up' : 'down')
      clearTimeout(flashTimerRef.current.no)
      flashTimerRef.current.no = setTimeout(() => setNoFlash(null), 500)
    }

    prevPricesRef.current = { yes: data.yes.price, no: data.no.price }
  }, [data])

  // Reset prev prices when ticker changes
  useEffect(() => {
    prevPricesRef.current = { yes: null, no: null }
  }, [ticker])

  // Cleanup flash timers and search timer on unmount
  const searchTimerRef = useRef(null)
  useEffect(() => {
    return () => {
      clearTimeout(flashTimerRef.current.yes)
      clearTimeout(flashTimerRef.current.no)
      clearTimeout(searchTimerRef.current)
    }
  }, [])

  // Emit ticker ownership update to Shell
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('window-ticker-update', { detail: { id: windowId, ticker } }))
  }, [windowId, ticker])

  // Use ref for ticker to avoid re-subscribing to link bus on every ticker change
  const tickerRef = useRef(ticker)
  useEffect(() => { tickerRef.current = ticker }, [ticker])

  // Subscribe to link bus events — stable callback via ref
  const handleLinkEvent = useCallback(
    ({ ticker: linkedTicker }) => {
      if (linkedTicker && linkedTicker !== tickerRef.current) {
        setTicker(linkedTicker)
      }
    },
    []
  )

  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return

    subscribeToLink(colorId, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorId, handleLinkEvent)
  }, [windowId, handleLinkEvent])

  // When user changes ticker, emit to linked windows
  const handleTickerChange = (e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    emitLinkedMarket(windowId, newTicker)
  }


  // Search handler with debounce
  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    combobox.open()
    clearTimeout(searchTimerRef.current)
    if (q.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => search(q.trim()), 300)
    }
  }

  return (
    <div className="market-viewer">
      <div className="mv-ticker-bar">
        <select
          className="mv-ticker-select"
          value={ticker}
          onChange={handleTickerChange}
        >
          {(TICKERS.includes(ticker) ? TICKERS : [ticker, ...TICKERS]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="mv-search-wrapper" ref={combobox.wrapperRef}>
          <input
            ref={combobox.inputRef}
            className="mv-search-input"
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={combobox.handleKeyDown}
            onFocus={() => searchQuery.trim().length >= 2 && combobox.open()}
            {...combobox.getInputProps()}
          />
          {combobox.isOpen && searchQuery.trim().length >= 2 && (
            <div className="mv-search-results" {...combobox.getListboxProps()}>
              {searchLoading && <div className="mv-search-item mv-search-loading">Searching...</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="mv-search-item mv-search-empty">No results</div>
              )}
              {searchResults.map((m, i) => (
                <div
                  key={m.ticker}
                  className={`mv-search-item${i === combobox.activeIndex ? ' mv-search-item--active' : ''}`}
                  {...combobox.getOptionProps(i)}
                  onClick={() => handleSearchSelect(m.ticker)}
                >
                  <span className="mv-search-ticker">{m.ticker}</span>
                  {m.title && <span className="mv-search-title">{m.title}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data ? (
        <>
          <div className="mv-header-row">
            <span className="mv-ticker-name">{data.ticker}</span>
            <span className="mv-last-trade">
              Last: {formatCents(data.lastTrade.price)}
              <span className={data.lastTrade.side === 'YES' ? 'text-win' : 'text-loss'}>
                {' '}{sideLabel(data.lastTrade.side)}
              </span>
              <span className="text-muted"> x{data.lastTrade.size}</span>
            </span>
          </div>

          <div className="mv-prices">
            <div className={`mv-price-box mv-yes ${yesFlash === 'up' ? 'mv-flash-up' : yesFlash === 'down' ? 'mv-flash-down' : ''}`}>
              <span className="mv-price-label">YES</span>
              <span className="mv-price-value mv-yes-price">{formatCents(data.yes.price)}</span>
            </div>
            <div className={`mv-price-box mv-no ${noFlash === 'up' ? 'mv-flash-up' : noFlash === 'down' ? 'mv-flash-down' : ''}`}>
              <span className="mv-price-label">NO</span>
              <span className="mv-price-value mv-no-price">{formatCents(data.no.price)}</span>
            </div>
          </div>

          <div className="mv-depth-section">
            <div className="mv-depth-title">Bid Depth (YES)</div>
            <table className="mv-depth-table">
              <thead>
                <tr>
                  <th>Price</th>
                  <th>Size</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.yes.bids.map((level, i) => (
                  <tr key={i}>
                    <td className="mv-bid-price">{formatCents(level.price)}</td>
                    <td>{level.size}</td>
                    <td>{level.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="mv-loading">Loading {ticker}...</div>
      )}
    </div>
  )
}

export default React.memo(MarketViewer)
