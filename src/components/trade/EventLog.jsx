import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import EventLogSettings from './EventLogSettings'
import './EventLog.css'

const LS_KEY_PREFIX = 'event-log-settings-'
const SS_KEY_PREFIX = 'event-log-session-'
const MAX_LOG_ENTRIES = 10000

const isAtBottom = (el) => el.scrollHeight - el.scrollTop - el.clientHeight < 2

const DEFAULT_SETTINGS = {
  logLevel: 'all',
  maxLines: 500,
  autoScroll: true,
}

const COLUMNS = [
  { key: 'time',    label: 'Time',    align: 'left' },
  { key: 'level',   label: 'Level',   align: 'center' },
  { key: 'source',  label: 'Source',  align: 'left' },
  { key: 'message', label: 'Message', align: 'left' },
]

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

function loadSessionLog(windowId) {
  try {
    const raw = sessionStorage.getItem(SS_KEY_PREFIX + windowId)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.map((e) => ({ ...e, time: new Date(e.time) }))
    }
  } catch { /* ignore */ }
  return null
}

function saveSessionLog(windowId, entries) {
  try {
    const toSave = entries.length > MAX_LOG_ENTRIES
      ? entries.slice(entries.length - MAX_LOG_ENTRIES)
      : entries
    sessionStorage.setItem(
      SS_KEY_PREFIX + windowId,
      JSON.stringify(toSave.map((e) => ({
        ...e,
        time: e.time instanceof Date ? e.time.toISOString() : e.time,
      })))
    )
  } catch { /* ignore */ }
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="el-search-match">{part}</mark>
      : part
  )
}

// Generate initial system startup events
function getStartupEntries() {
  const now = new Date()
  const entries = []
  const t = (offsetMs) => new Date(now.getTime() - offsetMs)

  entries.push({
    id: 1,
    time: t(5000),
    level: 'info',
    source: 'SYSTEM',
    message: 'KalshiAlpha Terminal starting...',
  })
  entries.push({
    id: 2,
    time: t(4200),
    level: 'info',
    source: 'SYSTEM',
    message: 'Initializing window manager',
  })
  entries.push({
    id: 3,
    time: t(3500),
    level: 'info',
    source: 'API',
    message: 'Connecting to Kalshi Paper Trading API...',
  })
  entries.push({
    id: 4,
    time: t(2800),
    level: 'warn',
    source: 'API',
    message: 'No API key configured \u2014 using demo mode',
  })
  entries.push({
    id: 5,
    time: t(2000),
    level: 'info',
    source: 'DATA',
    message: 'Mock data feed initialized',
  })
  entries.push({
    id: 6,
    time: t(1500),
    level: 'info',
    source: 'WS',
    message: 'WebSocket connection simulated (mock mode)',
  })
  entries.push({
    id: 7,
    time: t(800),
    level: 'info',
    source: 'SYSTEM',
    message: 'Terminal ready',
  })

  return entries
}

// Simulated periodic events
const PERIODIC_EVENTS = [
  { level: 'info', source: 'DATA', message: 'Orderbook snapshot received' },
  { level: 'info', source: 'WS', message: 'Heartbeat OK' },
  { level: 'info', source: 'DATA', message: 'Market data refreshed' },
  { level: 'warn', source: 'WS', message: 'Latency spike detected: 450ms' },
  { level: 'info', source: 'API', message: 'REST rate limit: 48/60 remaining' },
  { level: 'error', source: 'API', message: 'Request timeout on /markets \u2014 retrying' },
  { level: 'info', source: 'DATA', message: 'Ticker subscription updated' },
  { level: 'warn', source: 'DATA', message: 'Stale quote detected for FED-DEC23' },
  { level: 'info', source: 'WS', message: 'Reconnect successful' },
  { level: 'error', source: 'WS', message: 'Connection dropped \u2014 reconnecting...' },
  { level: 'info', source: 'SYSTEM', message: 'Auto-save layout complete' },
  { level: 'info', source: 'AUTH', message: 'Session token refreshed' },
]

function EventLog({ windowId }) {
  const grid = useGridCustomization('event-log-' + windowId, COLUMNS)
  const [entries, setEntries] = useState(() => getStartupEntries())
  const [settings, setSettings] = useState(() => loadSettings(windowId) || DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [jsonCopyStatus, setJsonCopyStatus] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const listRef = useRef(null)
  const autoScrollRef = useRef(true)
  const nextIdRef = useRef(8) // startup entries use 1-7
  const matchRefsMap = useRef({})

  // Build a set of visible column keys for fast lookup — memoized
  const visibleKeys = useMemo(
    () => new Set(grid.visibleColumns.map((c) => c.key)),
    [grid.visibleColumns]
  )

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Load previous session entries on mount
  useEffect(() => {
    const prev = loadSessionLog(windowId)
    if (prev && prev.length > 0) {
      const maxId = prev.reduce((m, e) => Math.max(m, typeof e.id === 'number' ? e.id : 0), 0)
      if (maxId >= nextIdRef.current) {
        nextIdRef.current = maxId + 1
      }
      const separator = {
        id: nextIdRef.current++,
        time: new Date(),
        level: 'info',
        source: 'SYSTEM',
        message: '--- Previous session ---',
      }
      setEntries((current) => [...prev, separator, ...current])
    }
    // windowId is stable per component instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist entries to sessionStorage on change
  useEffect(() => {
    saveSessionLog(windowId, entries)
  }, [windowId, entries])

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (settings.autoScroll && autoScrollRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [entries, settings.autoScroll])

  // Freescroll: scroll away = pause, scroll to bottom = resume
  const handleListScroll = useCallback(() => {
    if (!listRef.current) return
    autoScrollRef.current = isAtBottom(listRef.current)
  }, [])

  // Double-click to snap back to newest entries
  const handleListDoubleClick = useCallback(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
    autoScrollRef.current = true
  }, [])

  // Simulate periodic events
  useEffect(() => {
    const interval = setInterval(() => {
      const template = PERIODIC_EVENTS[Math.floor(Math.random() * PERIODIC_EVENTS.length)]
      setEntries((prev) => {
        const newEntry = {
          id: nextIdRef.current++,
          time: new Date(),
          level: template.level,
          source: template.source,
          message: template.message,
        }
        const updated = [...prev, newEntry]
        // Enforce max lines
        if (updated.length > settings.maxLines) {
          return updated.slice(updated.length - settings.maxLines)
        }
        return updated
      })
    }, 3000 + Math.random() * 4000) // every 3-7 seconds

    return () => clearInterval(interval)
  }, [settings.maxLines])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
  }, [])

  const handleClearLog = useCallback(() => {
    setEntries([])
    nextIdRef.current = 1
    try { sessionStorage.removeItem(SS_KEY_PREFIX + windowId) } catch { /* ignore */ }
  }, [windowId])

  const handleExportLog = useCallback(() => {
    const lines = entries.map(
      (e) => `[${formatTime(e.time)}] [${e.level.toUpperCase()}] [${e.source}] ${e.message}`
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-log-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [entries])

  // Filter entries by log level — memoized
  const filteredEntries = useMemo(
    () => settings.logLevel === 'all'
      ? entries
      : entries.filter((e) => {
          if (settings.logLevel === 'error') return e.level === 'error'
          if (settings.logLevel === 'warn') return e.level === 'warn' || e.level === 'error'
          return true // 'info' shows all
        }),
    [entries, settings.logLevel]
  )

  // Log level counters for status display — memoized
  const levelCounts = useMemo(() => {
    const counts = { info: 0, warn: 0, error: 0 }
    for (const e of entries) {
      if (counts[e.level] !== undefined) counts[e.level]++
    }
    return counts
  }, [entries])

  // Debounce search query — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentMatchIdx(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter by search query — only searches message field (case-insensitive)
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return filteredEntries
    const q = debouncedQuery.toLowerCase()
    return filteredEntries.filter((e) => e.message.toLowerCase().includes(q))
  }, [filteredEntries, debouncedQuery])

  // Entries shown in the list
  const displayedEntries = debouncedQuery ? searchResults : filteredEntries

  // Scroll current match into view when navigating
  useEffect(() => {
    if (!debouncedQuery || searchResults.length === 0) return
    const entry = searchResults[currentMatchIdx]
    if (entry) {
      const el = matchRefsMap.current[entry.id]
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [currentMatchIdx, debouncedQuery, searchResults])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    setCurrentMatchIdx(0)
  }, [])

  const handlePrevMatch = useCallback(() => {
    setCurrentMatchIdx((i) => (i > 0 ? i - 1 : searchResults.length - 1))
  }, [searchResults.length])

  const handleNextMatch = useCallback(() => {
    setCurrentMatchIdx((i) => (i < searchResults.length - 1 ? i + 1 : 0))
  }, [searchResults.length])

  const handleExportJsonLog = useCallback(() => {
    const data = displayedEntries.map((e) => ({
      timestamp: e.time.toISOString(),
      level: e.level,
      source: e.source,
      message: e.message,
      metadata: {},
    }))
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setJsonCopyStatus('copied')
      setTimeout(() => setJsonCopyStatus(null), 2000)
    }).catch(() => {
      setJsonCopyStatus('failed')
      setTimeout(() => setJsonCopyStatus(null), 2000)
    })
  }, [displayedEntries])

  return (
    <div
      className={`event-log el--font-${grid.fontSize}`}
      style={{ ...(grid.bgColor && { backgroundColor: grid.bgColor }), ...(grid.textColor && { color: grid.textColor }) }}
    >
      {/* Toolbar */}
      <div className="el-toolbar">
        <div className="el-toolbar-left">
          <select
            className="el-level-select"
            value={settings.logLevel}
            onChange={(e) => setSettings((s) => ({ ...s, logLevel: e.target.value }))}
          >
            <option value="all">All Levels</option>
            <option value="info">Info+</option>
            <option value="warn">Warn+</option>
            <option value="error">Error Only</option>
          </select>
          <div className="el-search-wrap">
            <input
              className="el-search-input"
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {debouncedQuery && (
              <span className="el-search-count">
                {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
              </span>
            )}
            {debouncedQuery && (
              <>
                <button
                  className="el-tool-btn el-search-nav"
                  onClick={handlePrevMatch}
                  disabled={searchResults.length === 0}
                  title="Previous match"
                >
                  &#8593;
                </button>
                <button
                  className="el-tool-btn el-search-nav"
                  onClick={handleNextMatch}
                  disabled={searchResults.length === 0}
                  title="Next match"
                >
                  &#8595;
                </button>
              </>
            )}
            {searchQuery && (
              <button
                className="el-tool-btn el-search-clear"
                onClick={handleSearchClear}
                title="Clear search"
              >
                &#215;
              </button>
            )}
          </div>
          <span className="el-count">
            {displayedEntries.length} entries
            {levelCounts.error > 0 && <span className="el-level--error"> ({levelCounts.error} err)</span>}
            {levelCounts.warn > 0 && <span className="el-level--warn"> ({levelCounts.warn} warn)</span>}
          </span>
        </div>
        <div className="el-toolbar-right">
          <button className="el-tool-btn" onClick={handleClearLog} title="Clear Log">
            &#8999;
          </button>
          <button className="el-tool-btn" onClick={handleExportLog} title="Export Log">
            &#8615;
          </button>
          <button
            className="el-tool-btn el-tool-btn--json"
            onClick={handleExportJsonLog}
            title="Copy JSON to clipboard"
          >
            {jsonCopyStatus === 'copied' ? '✓' : jsonCopyStatus === 'failed' ? '✗' : 'JSON'}
          </button>
          <button
            className="el-tool-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="el-entries" ref={listRef} onScroll={handleListScroll} onDoubleClick={handleListDoubleClick}>
        {displayedEntries.length === 0 ? (
          <div className="el-empty">
            {debouncedQuery ? 'No matches found' : 'No log entries'}
          </div>
        ) : (
          displayedEntries.map((entry, idx) => {
            const isCurrentMatch = debouncedQuery && entry === searchResults[currentMatchIdx]
            return (
              <div
                key={entry.id}
                ref={(el) => {
                  if (el) matchRefsMap.current[entry.id] = el
                  else delete matchRefsMap.current[entry.id]
                }}
                className={`el-entry el-entry--${entry.level}${isCurrentMatch ? ' el-entry--current-match' : ''}`}
                style={{ height: grid.rowHeight }}
              >
                {visibleKeys.has('time') && (
                  <span className="el-time">{formatTime(entry.time)}</span>
                )}
                {visibleKeys.has('level') && (
                  <span className={`el-level el-level--${entry.level}`}>
                    {entry.level.toUpperCase()}
                  </span>
                )}
                {visibleKeys.has('source') && (
                  <span className="el-source">[{entry.source}]</span>
                )}
                {visibleKeys.has('message') && (
                  <span className="el-message">
                    {highlightText(entry.message, debouncedQuery)}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <EventLogSettings
          settings={settings}
          grid={grid}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(EventLog)
