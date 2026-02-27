import React, { useState, useEffect, useRef } from 'react'
import { useMarketSearch } from '../../hooks/useKalshiData'
import './NewsChat.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

const HEADLINES = [
  'Market sees elevated volume ahead of expiry',
  'New polling data shifts probability estimates',
  'Large block trade detected on order book',
  'Analyst raises conviction rating to strong buy',
  'Implied probability diverges from polling average',
  'Institutional flow detected in late session',
  'Early settlement data suggests tighter race',
  'Volatility spike triggers risk-off positioning',
  'Contrarian indicators flash bullish signal',
  'Open interest surges past weekly average',
  'Market makers widen spreads on uncertainty',
  'Correlation breakout observed across related events',
  'Liquidity dries up ahead of data release',
  'Momentum traders pile into breakout setup',
  'Price reversion after overnight gap fill',
  'Sentiment analysis shows shifting consensus',
  'Hedging activity increases near key support',
  'Cross-market arbitrage opportunity narrows',
  'Retail flow dominates morning session',
  'Smart money divergence flagged by scanner',
]

function generateNewsItems() {
  const now = Date.now()
  return Array.from({ length: 20 }, (_, i) => {
    const timeOffset = Math.floor(Math.random() * 3600000) // up to 1 hour ago
    const ts = new Date(now - timeOffset)
    return {
      id: `news-${i}-${now}`,
      time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts.getTime(),
      ticker: TICKERS[Math.floor(Math.random() * TICKERS.length)],
      headline: HEADLINES[i % HEADLINES.length],
    }
  }).sort((a, b) => b.timestamp - a.timestamp)
}

function NewsChat({ windowId }) {
  const [filterTicker, setFilterTicker] = useState('')
  const [items, setItems] = useState(() => generateNewsItems())

  // Search state for ticker filter
  const [searchQuery, setSearchQuery] = useState('')
  const { results: searchResults, loading: searchLoading, search } = useMarketSearch()
  const searchTimerRef = useRef(null)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(generateNewsItems())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(searchTimerRef.current)
    if (q.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => search(q.trim()), 300)
    }
  }

  const handleSearchSelect = (t) => {
    setFilterTicker(t)
    setSearchQuery('')
  }

  const clearFilter = () => {
    setFilterTicker('')
  }

  const filteredItems = filterTicker
    ? items.filter((item) => item.ticker === filterTicker)
    : items

  return (
    <div className="nc-container">
      <div className="nc-search-bar">
        {filterTicker && (
          <span className="nc-filter-badge" onClick={clearFilter} title="Click to clear filter">
            {filterTicker} &times;
          </span>
        )}
        <div className="nc-search-wrapper">
          <input
            className="nc-search-input"
            type="text"
            placeholder={filterTicker ? 'Change filter...' : 'Filter by market...'}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery.trim().length >= 2 && (
            <div className="nc-search-results">
              {searchLoading && <div className="nc-search-item nc-search-loading">Searching...</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="nc-search-item nc-search-empty">No results</div>
              )}
              {searchResults.map((m) => (
                <div key={m.ticker} className="nc-search-item" onClick={() => handleSearchSelect(m.ticker)}>
                  <span className="nc-search-ticker">{m.ticker}</span>
                  {m.title && <span className="nc-search-title">{m.title}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="nc-feed">
        {filteredItems.length === 0 ? (
          <div className="nc-empty">No news for {filterTicker}</div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="nc-item">
              <span className="nc-time">{item.time}</span>
              <span className="nc-ticker-badge">{item.ticker}</span>
              <span className="nc-headline">{item.headline}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default React.memo(NewsChat)
