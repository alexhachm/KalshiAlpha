import React, { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeToTimeSales } from '../../services/mockData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import GridSettingsPanel from '../GridSettingsPanel'
import './TimeSale.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

const TS_COLUMNS = [
  { key: 'price', label: 'Price', align: 'right', numeric: true },
  { key: 'size', label: 'Qty', align: 'right', numeric: true },
  { key: 'time', label: 'Time', align: 'left' },
  { key: 'side', label: 'Exchange', align: 'right' },
]

const FONT_SIZE_MAP = { small: 10, medium: 11, large: 13 }

const DEFAULT_SETTINGS = {
  maxRows: 200,
  sizeFilter: 0,
  soundOnLarge: false,
  largeSizeThreshold: 500,
  autoScroll: true,
  hideMilliseconds: true,
  priceDecimals: true,
  abbreviateSize: true,
}

const isAtBottom = (el) => el.scrollHeight - el.scrollTop - el.clientHeight < 2

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

function formatTime(ts, hideMs) {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  if (hideMs) return `${h}:${m}:${s}`
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function formatPrice(price, useTwo) {
  return useTwo ? `${Number(price).toFixed(2)}¢` : `${price}¢`
}

function formatSize(size, abbreviate) {
  if (!abbreviate || size < 1000) return size
  return `${(size / 1000).toFixed(1)}k`
}

function TimeSale({ windowId }) {
  const [ticker, setTicker] = useState(TICKERS[0])
  const [trades, setTrades] = useState([])
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [flashedIds, setFlashedIds] = useState(new Set())
  const listRef = useRef(null)
  const containerRef = useRef(null)
  const autoScrollRef = useRef(true)
  const pausedRef = useRef(false)
  const grid = useGridCustomization(`timeSale-${windowId}`, TS_COLUMNS)
  const fontSizePx = FONT_SIZE_MAP[grid.fontSize] || 11

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Toggle settings via right-click header event
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = () => setShowSettings((s) => !s)
    el.addEventListener('toggle-settings', handler)
    return () => el.removeEventListener('toggle-settings', handler)
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Subscribe to trade stream
  useEffect(() => {
    setTrades([])
    const unsub = subscribeToTimeSales(ticker, (trade) => {
      setTrades((prev) => {
        const next = [...prev, trade]
        if (next.length > 500) return next.slice(-500)
        return next
      })
      // Flash new entry
      setFlashedIds((prev) => new Set(prev).add(trade.id))
      setTimeout(() => {
        setFlashedIds((prev) => {
          const next = new Set(prev)
          next.delete(trade.id)
          return next
        })
      }, 500)
    })
    return unsub
  }, [ticker])

  // Auto-scroll to bottom when new trades arrive
  useEffect(() => {
    if (autoScrollRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [trades])

  // Freescroll: scroll away = pause, double-click = resume
  const handleListScroll = useCallback(() => {
    if (!listRef.current) return
    autoScrollRef.current = isAtBottom(listRef.current)
  }, [])

  const handleListDoubleClick = useCallback(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
    autoScrollRef.current = true
  }, [])

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
    <div ref={containerRef} className="ts-component">
      <div className="ts-toolbar">
        <select className="ts-ticker-select" value={ticker} onChange={handleTickerChange}>
          {TICKERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span className="ts-trade-count">{trades.length} trades</span>

        <div className="ts-toolbar-right">
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
      <div className="ts-header" style={{ fontSize: fontSizePx }}>
        {grid.visibleColumns.map((col) => {
          const fullIdx = grid.columns.findIndex((c) => c.key === col.key)
          const isDragOver = grid.dragState.dragging && grid.dragState.overIndex === fullIdx
          return (
            <span
              key={col.key}
              className={`ts-col-${col.key}${isDragOver ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => grid.onDragStart(fullIdx)}
              onDragOver={(e) => { e.preventDefault(); grid.onDragOver(fullIdx) }}
              onDragEnd={grid.onDragEnd}
              style={col.width ? { flex: `0 0 ${col.width}px` } : undefined}
            >
              {col.label}
            </span>
          )
        })}
      </div>

      {/* Trade list */}
      <div
        className="ts-list"
        ref={listRef}
        style={{ fontSize: fontSizePx }}
        onScroll={handleListScroll}
        onDoubleClick={handleListDoubleClick}
      >
        {displayTrades.map((trade) => {
          const rowStyle = grid.getRowStyle(trade) || {}
          return (
            <div
              key={trade.id}
              className={`ts-row ${trade.side === 'BUY' ? 'ts-row--buy' : 'ts-row--sell'}${
                trade.size >= (settings.largeSizeThreshold || 500) ? ' ts-row--large' : ''
              }${flashedIds.has(trade.id) ? ` ts-row--flash-${trade.side === 'BUY' ? 'buy' : 'sell'}` : ''}`}
              style={{ ...rowStyle, height: grid.rowHeight }}
            >
              {grid.visibleColumns.map((col) => (
                <span
                  key={col.key}
                  className={`ts-col-${col.key}`}
                  style={col.width ? { flex: `0 0 ${col.width}px` } : undefined}
                >
                  {col.key === 'time' ? formatTime(trade.timestamp, settings.hideMilliseconds) :
                   col.key === 'price' ? formatPrice(trade.price, settings.priceDecimals) :
                   col.key === 'size' ? formatSize(trade.size, settings.abbreviateSize) :
                   col.key === 'side' ? trade.side : null}
                </span>
              ))}
            </div>
          )
        })}
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
            <div className="ts-settings-divider" />
            <label className="ts-setting-row">
              <span>Hide Milliseconds</span>
              <input
                type="checkbox"
                checked={settings.hideMilliseconds}
                onChange={(e) => updateSetting('hideMilliseconds', e.target.checked)}
              />
            </label>
            <label className="ts-setting-row">
              <span>2 Decimal Price</span>
              <input
                type="checkbox"
                checked={settings.priceDecimals}
                onChange={(e) => updateSetting('priceDecimals', e.target.checked)}
              />
            </label>
            <label className="ts-setting-row">
              <span>Abbreviate Size</span>
              <input
                type="checkbox"
                checked={settings.abbreviateSize}
                onChange={(e) => updateSetting('abbreviateSize', e.target.checked)}
              />
            </label>
            <GridSettingsPanel {...grid} />
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(TimeSale)
