import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTickerData, useAvailableMarkets } from '../hooks/useKalshiData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../services/linkBus'
import './MarketViewer.css'

function MarketViewer({ windowId }) {
  const { markets, activeTicker, setActiveMarket } = useAvailableMarkets()
  const [ticker, setTicker] = useState(activeTicker)
  const { data } = useTickerData(ticker)
  const [yesFlash, setYesFlash] = useState(null)
  const [noFlash, setNoFlash] = useState(null)
  const flashTimerRef = useRef({})
  const prevDataRef = useRef(null)

  // Flash detection on price changes
  useEffect(() => {
    if (!data || !prevDataRef.current) {
      prevDataRef.current = data
      return
    }
    const prevYes = prevDataRef.current.yes?.price
    const prevNo = prevDataRef.current.no?.price
    if (data.yes.price !== prevYes) {
      setYesFlash(data.yes.price > prevYes ? 'up' : 'down')
      clearTimeout(flashTimerRef.current.yes)
      flashTimerRef.current.yes = setTimeout(() => setYesFlash(null), 500)
    }
    if (data.no.price !== prevNo) {
      setNoFlash(data.no.price > prevNo ? 'up' : 'down')
      clearTimeout(flashTimerRef.current.no)
      flashTimerRef.current.no = setTimeout(() => setNoFlash(null), 500)
    }
    prevDataRef.current = data
  }, [data])

  // Cleanup flash timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(flashTimerRef.current.yes)
      clearTimeout(flashTimerRef.current.no)
    }
  }, [])

  // Subscribe to link bus events
  const handleLinkEvent = useCallback(
    ({ ticker: linkedTicker }) => {
      if (linkedTicker && linkedTicker !== ticker) {
        setTicker(linkedTicker)
        setActiveMarket(linkedTicker)
      }
    },
    [ticker, setActiveMarket]
  )

  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return
    subscribeToLink(colorId, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorId, handleLinkEvent)
  }, [windowId, handleLinkEvent])

  // When user selects a market
  const handleMarketSelect = (newTicker) => {
    setTicker(newTicker)
    setActiveMarket(newTicker)
    emitLinkedMarket(windowId, newTicker)
  }

  // Find current market metadata
  const currentMarket = markets.find((m) => m.ticker === ticker)

  return (
    <div className="market-viewer">
      <div className="mv-market-list">
        {markets.map((m) => (
          <div
            key={m.ticker}
            className={`mv-market-card ${m.ticker === ticker ? 'mv-market-card-active' : ''}`}
            onClick={() => handleMarketSelect(m.ticker)}
          >
            <div className="mv-card-ticker">{m.ticker}</div>
            <div className="mv-card-title">{m.title}</div>
            <div className="mv-card-meta">
              <span className="mv-card-category">{m.category}</span>
              <span className="mv-card-expiry">Exp: {new Date(m.expiry).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {currentMarket && (
        <div className="mv-market-detail">
          <div className="mv-detail-title">{currentMarket.title}</div>
          {currentMarket.subtitle && (
            <div className="mv-detail-subtitle">{currentMarket.subtitle}</div>
          )}
        </div>
      )}

      {data ? (
        <>
          <div className="mv-header-row">
            <span className="mv-ticker-name">{data.ticker}</span>
            <span className="mv-last-trade">
              Last: {data.lastTrade.price}c
              <span className={data.lastTrade.side === 'YES' ? 'text-win' : 'text-loss'}>
                {' '}{data.lastTrade.side}
              </span>
              <span className="text-muted"> x{data.lastTrade.size}</span>
            </span>
          </div>

          <div className="mv-prices">
            <div className={`mv-price-box mv-yes ${yesFlash === 'up' ? 'flash-up' : yesFlash === 'down' ? 'flash-down' : ''}`}>
              <span className="mv-price-label">YES</span>
              <span className="mv-price-value mv-yes-price">{data.yes.price}c</span>
            </div>
            <div className={`mv-price-box mv-no ${noFlash === 'up' ? 'flash-up' : noFlash === 'down' ? 'flash-down' : ''}`}>
              <span className="mv-price-label">NO</span>
              <span className="mv-price-value mv-no-price">{data.no.price}c</span>
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
                    <td className="mv-bid-price">{level.price}c</td>
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
