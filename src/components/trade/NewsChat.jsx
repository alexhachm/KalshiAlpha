import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useMarketSearch } from '../../hooks/useKalshiData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
import './NewsChat.css'
import { TICKERS } from '../../constants/tickers'

const TICKER_SET = new Set(TICKERS)

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

// Signal classification keywords for mock sentiment tagging
const BULLISH_KEYWORDS = [
  'strong buy', 'bullish signal', 'breakout', 'surges', 'pile into',
  'conviction rating', 'momentum', 'arbitrage opportunity',
]
const BEARISH_KEYWORDS = [
  'risk-off', 'dries up', 'widen spreads', 'uncertainty', 'hedging',
  'reversion', 'divergence flagged',
]
const BREAKING_KEYWORDS = [
  'spike', 'detected', 'flash', 'breakout', 'block trade',
]
const HIGH_VOLUME_KEYWORDS = [
  'volume', 'surges', 'open interest', 'institutional flow', 'block trade',
  'pile into', 'retail flow', 'smart money',
]

function classifySignal(headline) {
  const lower = headline.toLowerCase()
  if (BULLISH_KEYWORDS.some((kw) => lower.includes(kw))) return 'bullish'
  if (BEARISH_KEYWORDS.some((kw) => lower.includes(kw))) return 'bearish'
  return 'neutral'
}

function classifyUrgency(headline) {
  const lower = headline.toLowerCase()
  if (BREAKING_KEYWORDS.some((kw) => lower.includes(kw))) return 'breaking'
  return 'routine'
}

function classifyVolume(headline) {
  const lower = headline.toLowerCase()
  return HIGH_VOLUME_KEYWORDS.some((kw) => lower.includes(kw))
}

const SIGNAL_LABELS = { bullish: 'Bull', bearish: 'Bear', neutral: 'Neut' }
const FILTER_OPTIONS = ['all', 'bullish', 'bearish', 'breaking', 'volume']
const FILTER_LABELS = {
  all: 'All',
  bullish: 'Bullish',
  bearish: 'Bearish',
  breaking: 'Breaking',
  volume: 'Volume',
}

function generateNewsItems() {
  const now = Date.now()
  const seededItems = TICKERS.map((ticker, i) => {
    const timeOffset = Math.floor(Math.random() * 3600000) // up to 1 hour ago
    const ts = new Date(now - timeOffset)
    const headline = HEADLINES[i % HEADLINES.length]
    return {
      id: `news-${i}-${now}`,
      time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts.getTime(),
      ticker,
      headline,
      signal: classifySignal(headline),
      urgency: classifyUrgency(headline),
      highVolume: classifyVolume(headline),
    }
  })

  const randomItems = Array.from({ length: Math.max(0, 20 - TICKERS.length) }, (_, i) => {
    const idx = i + TICKERS.length
    const timeOffset = Math.floor(Math.random() * 3600000) // up to 1 hour ago
    const ts = new Date(now - timeOffset)
    const headline = HEADLINES[idx % HEADLINES.length]
    return {
      id: `news-${idx}-${now}`,
      time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts.getTime(),
      ticker: TICKERS[Math.floor(Math.random() * TICKERS.length)],
      headline,
      signal: classifySignal(headline),
      urgency: classifyUrgency(headline),
      highVolume: classifyVolume(headline),
    }
  })

  return [...seededItems, ...randomItems].sort((a, b) => b.timestamp - a.timestamp)
}

function NewsChat({ windowId }) {
  const [filterTicker, setFilterTicker] = useState('')
  const [signalFilter, setSignalFilter] = useState('all')
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

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => clearTimeout(searchTimerRef.current)
  }, [])

  // Color link subscription — inbound market sync
  const handleLinkEvent = useCallback(
    ({ ticker: linkedTicker }) => {
      if (linkedTicker && linkedTicker !== filterTicker) {
        setFilterTicker(linkedTicker)
      }
    },
    [filterTicker]
  )

  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return
    subscribeToLink(colorId, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorId, handleLinkEvent)
  }, [windowId, handleLinkEvent])

  const handleSearchChange = useCallback((e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(searchTimerRef.current)
    if (q.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => search(q.trim()), 300)
    }
  }, [search])

  const handleSearchSelect = useCallback((t) => {
    if (!TICKER_SET.has(t)) return
    setFilterTicker(t)
    setSearchQuery('')
    emitLinkedMarket(windowId, t)
  }, [windowId])

  const clearFilter = useCallback(() => {
    setFilterTicker('')
  }, [])

  const { supportedResults, unsupportedResults } = useMemo(() => {
    const supported = []
    const unsupported = []
    searchResults.forEach((market) => {
      if (TICKER_SET.has(market.ticker)) supported.push(market)
      else unsupported.push(market)
    })
    return { supportedResults: supported, unsupportedResults: unsupported }
  }, [searchResults])

  // Memoize filtered items — ticker filter + signal/urgency filter
  const filteredItems = useMemo(() => {
    let result = items
    if (filterTicker) {
      result = result.filter((item) => item.ticker === filterTicker)
    }
    if (signalFilter !== 'all') {
      switch (signalFilter) {
        case 'bullish':
          result = result.filter((item) => item.signal === 'bullish')
          break
        case 'bearish':
          result = result.filter((item) => item.signal === 'bearish')
          break
        case 'breaking':
          result = result.filter((item) => item.urgency === 'breaking')
          break
        case 'volume':
          result = result.filter((item) => item.highVolume)
          break
        default:
          break
      }
    }
    return result
  }, [items, filterTicker, signalFilter])

  // Signal filter counts for badges
  const signalCounts = useMemo(() => {
    const base = filterTicker ? items.filter((item) => item.ticker === filterTicker) : items
    return {
      all: base.length,
      bullish: base.filter((i) => i.signal === 'bullish').length,
      bearish: base.filter((i) => i.signal === 'bearish').length,
      breaking: base.filter((i) => i.urgency === 'breaking').length,
      volume: base.filter((i) => i.highVolume).length,
    }
  }, [items, filterTicker])

  // STUB: Real news feed integration — connect to live news APIs
  // IMPLEMENT WHEN: API keys configured and news service available

  // Signal tagging is now implemented via keyword classification.
  // STUB: Upgrade to NLP/FinBERT sentiment analysis when AI service available.

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
              {!searchLoading && searchResults.length > 0 && supportedResults.length === 0 && (
                <div className="nc-search-item nc-search-empty">Matches found, but none have local mock news coverage.</div>
              )}
              {supportedResults.map((m) => (
                <div key={m.ticker} className="nc-search-item" onClick={() => handleSearchSelect(m.ticker)}>
                  <span className="nc-search-ticker">{m.ticker}</span>
                  {m.title && <span className="nc-search-title">{m.title}</span>}
                </div>
              ))}
              {unsupportedResults.map((m) => (
                <div key={`${m.ticker}-unsupported`} className="nc-search-item nc-search-empty" title="No local mock news coverage for this ticker">
                  <span className="nc-search-ticker">{m.ticker}</span>
                  <span className="nc-search-title">No local mock news coverage</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="nc-signal-bar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            className={`nc-signal-btn nc-signal-btn--${opt}${signalFilter === opt ? ' nc-signal-btn--active' : ''}`}
            onClick={() => setSignalFilter(opt)}
          >
            {FILTER_LABELS[opt]}
            {signalCounts[opt] > 0 && (
              <span className="nc-signal-count">{signalCounts[opt]}</span>
            )}
          </button>
        ))}
      </div>
      <div className="nc-feed">
        {filteredItems.length === 0 ? (
          <div className="nc-empty">
            {filterTicker
              ? `No ${signalFilter !== 'all' ? FILTER_LABELS[signalFilter].toLowerCase() + ' ' : ''}news for ${filterTicker}`
              : `No ${FILTER_LABELS[signalFilter].toLowerCase()} news`}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`nc-item${item.urgency === 'breaking' ? ' nc-item--breaking' : ''}`}
            >
              <span className="nc-time">{item.time}</span>
              <span className={`nc-signal-tag nc-signal-tag--${item.signal}`}>
                {SIGNAL_LABELS[item.signal]}
              </span>
              {item.urgency === 'breaking' && (
                <span className="nc-urgency-badge">BRK</span>
              )}
              {item.highVolume && (
                <span className="nc-volume-badge">VOL</span>
              )}
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
