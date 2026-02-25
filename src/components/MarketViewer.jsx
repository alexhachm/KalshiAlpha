import React, { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeToTicker } from '../services/mockData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../services/linkBus'
import './MarketViewer.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

function MarketViewer({ windowId }) {
  const [ticker, setTicker] = useState(TICKERS[0])
  const [data, setData] = useState(null)
  const prevPricesRef = useRef({ yes: null, no: null })
  const [yesFlash, setYesFlash] = useState(null)
  const [noFlash, setNoFlash] = useState(null)
  const flashTimerRef = useRef({})

  // Subscribe to mock data for the current ticker
  useEffect(() => {
    const unsub = subscribeToTicker(ticker, (newData) => {
      setData((prev) => {
        if (prev) {
          const prevYes = prev.yes.price
          const prevNo = prev.no.price
          if (newData.yes.price !== prevYes) {
            setYesFlash(newData.yes.price > prevYes ? 'up' : 'down')
            clearTimeout(flashTimerRef.current.yes)
            flashTimerRef.current.yes = setTimeout(() => setYesFlash(null), 500)
          }
          if (newData.no.price !== prevNo) {
            setNoFlash(newData.no.price > prevNo ? 'up' : 'down')
            clearTimeout(flashTimerRef.current.no)
            flashTimerRef.current.no = setTimeout(() => setNoFlash(null), 500)
          }
        }
        return newData
      })
    })
    return unsub
  }, [ticker])

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

  // When user changes ticker, emit to linked windows
  const handleTickerChange = (e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    setData(null)
    emitLinkedMarket(windowId, newTicker)
  }

  return (
    <div className="market-viewer">
      <div className="mv-ticker-bar">
        <select
          className="mv-ticker-select"
          value={ticker}
          onChange={handleTickerChange}
        >
          {TICKERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

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
