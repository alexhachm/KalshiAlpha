import React, { useState, useEffect, useRef, useCallback } from 'react'
import EventLogSettings from './EventLogSettings'
import './EventLog.css'

const LS_KEY_PREFIX = 'event-log-settings-'

const DEFAULT_SETTINGS = {
  logLevel: 'all', // 'all' | 'info' | 'warn' | 'error'
  maxLines: 500,
  autoScroll: true,
  fontSize: 'medium',
}

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

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
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
    message: 'No API key configured — using demo mode',
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
  { level: 'error', source: 'API', message: 'Request timeout on /markets — retrying' },
  { level: 'info', source: 'DATA', message: 'Ticker subscription updated' },
  { level: 'warn', source: 'DATA', message: 'Stale quote detected for FED-DEC23' },
  { level: 'info', source: 'WS', message: 'Reconnect successful' },
  { level: 'error', source: 'WS', message: 'Connection dropped — reconnecting...' },
  { level: 'info', source: 'SYSTEM', message: 'Auto-save layout complete' },
  { level: 'info', source: 'AUTH', message: 'Session token refreshed' },
]

function EventLog({ windowId }) {
  const [entries, setEntries] = useState(() => getStartupEntries())
  const [settings, setSettings] = useState(() => loadSettings(windowId) || DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const logEndRef = useRef(null)
  const nextIdRef = useRef(8) // startup entries use 1-7

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (settings.autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries, settings.autoScroll])

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
  }, [])

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

  // Filter entries by log level
  const filteredEntries = settings.logLevel === 'all'
    ? entries
    : entries.filter((e) => {
        if (settings.logLevel === 'error') return e.level === 'error'
        if (settings.logLevel === 'warn') return e.level === 'warn' || e.level === 'error'
        return true // 'info' shows all
      })

  const fontClass = `el--font-${settings.fontSize}`

  return (
    <div className={`event-log ${fontClass}`}>
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
          <span className="el-count">{filteredEntries.length} entries</span>
        </div>
        <div className="el-toolbar-right">
          <button className="el-tool-btn" onClick={handleClearLog} title="Clear Log">
            &#8999;
          </button>
          <button className="el-tool-btn" onClick={handleExportLog} title="Export Log">
            &#8615;
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
      <div className="el-entries">
        {filteredEntries.length === 0 ? (
          <div className="el-empty">No log entries</div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className={`el-entry el-entry--${entry.level}`}>
              <span className="el-time">{formatTime(entry.time)}</span>
              <span className={`el-level el-level--${entry.level}`}>
                {entry.level.toUpperCase()}
              </span>
              <span className="el-source">[{entry.source}]</span>
              <span className="el-message">{entry.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <EventLogSettings
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(EventLog)
