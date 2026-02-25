import React, { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeToTimeSales } from '../../services/mockData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
import './TimeSale.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

const DEFAULT_SETTINGS = {
  maxRows: 200,
  fontSize: 11,
  sizeFilter: 0,
  soundOnLarge: false,
  largeSizeThreshold: 500,
  autoScroll: true,
}

function loadSettings(windowId) {
  try {
    const raw = localStorage.getItem(`timesale_settings_${windowId}`)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(windowId, settings) {
  try {
    localStorage.setItem(`timesale_settings_${windowId}`, JSON.stringify(settings))
  } catch {
    // localStorage may be unavailable
  }
}

function formatTime(ts) {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function TimeSale({ windowId }) {
  const [ticker, setTicker] = useState(TICKERS[0])
  const [trades, setTrades] = useState([])
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [paused, setPaused] = useState(false)
  const listRef = useRef(null)
  const pausedRef = useRef(false)

  // Keep ref in sync for use inside subscription callback
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Subscribe to trade stream
  useEffect(() => {
    setTrades([])
    const unsub = subscribeToTimeSales(ticker, (trade) => {
      if (pausedRef.current) return
      setTrades((prev) => {
        const next = [...prev, trade]
        // Trim to maxRows (read from latest settings via closure)
        if (next.length > 500) return next.slice(-500)
        return next
      })
    })
    return unsub
  }, [ticker])

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [trades, settings.autoScroll])

  // Color link bus integration
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

  const handleTickerChange = (e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    emitLinkedMarket(windowId, newTicker)
  }

  // Filter trades by size threshold
  const visibleTrades = settings.sizeFilter > 0
    ? trades.filter((t) => t.size >= settings.sizeFilter)
    : trades

  // Trim to maxRows for display
  const displayTrades = visibleTrades.slice(-settings.maxRows)

  return (
    <div className="ts-component">
      <div className="ts-toolbar">
        <select className="ts-ticker-select" value={ticker} onChange={handleTickerChange}>
          {TICKERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span className="ts-trade-count">{trades.length} trades</span>

        <div className="ts-toolbar-right">
          <button
            className={`ts-btn ${paused ? 'ts-btn--active' : ''}`}
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? '\u25B6' : '\u275A\u275A'}
          </button>
          <button
            className="ts-btn"
            onClick={() => setTrades([])}
            title="Clear"
          >
            \u2715
          </button>
          <button
            className="ts-btn"
            onClick={() => setShowSettings((s) => !s)}
            title="Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="ts-header" style={{ fontSize: settings.fontSize }}>
        <span className="ts-col-time">Time</span>
        <span className="ts-col-price">Price</span>
        <span className="ts-col-size">Size</span>
        <span className="ts-col-side">Side</span>
      </div>

      {/* Trade list */}
      <div className="ts-list" ref={listRef} style={{ fontSize: settings.fontSize }}>
        {displayTrades.map((trade) => (
          <div
            key={trade.id}
            className={`ts-row ${trade.side === 'BUY' ? 'ts-row--buy' : 'ts-row--sell'}${
              trade.size >= (settings.largeSizeThreshold || 500) ? ' ts-row--large' : ''
            }`}
          >
            <span className="ts-col-time">{formatTime(trade.timestamp)}</span>
            <span className="ts-col-price">{trade.price}¢</span>
            <span className="ts-col-size">{trade.size}</span>
            <span className="ts-col-side">{trade.side}</span>
          </div>
        ))}
        {displayTrades.length === 0 && (
          <div className="ts-empty">Waiting for trades...</div>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="ts-settings-panel">
          <div className="ts-settings-header">
            <span>T&S Settings</span>
            <button className="ts-settings-close" onClick={() => setShowSettings(false)}>x</button>
          </div>
          <div className="ts-settings-body">
            <label className="ts-setting-row">
              <span>Max Rows</span>
              <input
                type="number"
                min={50}
                max={1000}
                step={50}
                value={settings.maxRows}
                onChange={(e) => updateSetting('maxRows', parseInt(e.target.value, 10) || 200)}
              />
            </label>
            <label className="ts-setting-row">
              <span>Font Size</span>
              <input
                type="number"
                min={9}
                max={16}
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value, 10) || 11)}
              />
            </label>
            <label className="ts-setting-row">
              <span>Min Size Filter</span>
              <input
                type="number"
                min={0}
                max={1000}
                step={10}
                value={settings.sizeFilter}
                onChange={(e) => updateSetting('sizeFilter', parseInt(e.target.value, 10) || 0)}
              />
            </label>
            <label className="ts-setting-row">
              <span>Large Trade</span>
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={settings.largeSizeThreshold}
                onChange={(e) => updateSetting('largeSizeThreshold', parseInt(e.target.value, 10) || 500)}
              />
            </label>
            <label className="ts-setting-row">
              <span>Auto-Scroll</span>
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => updateSetting('autoScroll', e.target.checked)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(TimeSale)
