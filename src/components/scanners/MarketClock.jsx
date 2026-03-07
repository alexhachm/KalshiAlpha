import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Settings } from 'lucide-react'
import MarketClockSettings from './MarketClockSettings'
import './MarketClock.css'

const DEFAULT_SETTINGS = {
  timezone: 'local', // 'local' | 'utc'
  showMilliseconds: false,
  showDate: false,
  fontSize: 32,
}

// Kalshi markets are open Mon-Fri (limited hours vary by market type).
// DST-aware via toLocaleString with America/New_York timezone.
function getMarketSession(date) {
  const etStr = date.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false, weekday: 'short' })
  const parts = etStr.split(' ')
  const day = parts[0]?.replace(',', '')
  const hour = parseInt(parts[1] || date.getHours(), 10)

  if (day === 'Sat' || day === 'Sun') return { label: 'CLOSED', status: 'closed' }
  if (hour >= 4 && hour < 9) return { label: 'PRE-MKT', status: 'pre' }
  if (hour >= 9 && hour < 18) return { label: 'OPEN', status: 'open' }
  if (hour >= 18 && hour < 20) return { label: 'POST-MKT', status: 'post' }
  return { label: 'CLOSED', status: 'closed' }
}

// STUB: Exchange calendar — holidays, half-days, special sessions
// SOURCE: Kalshi API /exchange/schedule endpoint
// IMPLEMENT WHEN: Kalshi publishes an official calendar API or static schedule
// STEPS:
//   1. Fetch exchange schedule from Kalshi API on mount
//   2. Cache schedule in localStorage with daily TTL
//   3. Cross-reference current date against holidays/half-days
//   4. Update getMarketSession to check calendar before time-based logic

function formatTime(date, settings) {
  const h = settings.timezone === 'utc' ? date.getUTCHours() : date.getHours()
  const m = settings.timezone === 'utc' ? date.getUTCMinutes() : date.getMinutes()
  const s = settings.timezone === 'utc' ? date.getUTCSeconds() : date.getSeconds()
  const ms = settings.timezone === 'utc' ? date.getUTCMilliseconds() : date.getMilliseconds()

  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')

  let time = `${hh}:${mm}:${ss}`
  if (settings.showMilliseconds) {
    // Show to 100th of a millisecond (5 decimal places on seconds → .XXX.XX)
    // We only get ms precision from Date, so pad the sub-ms digits
    const msStr = String(ms).padStart(3, '0')
    time += `.${msStr}00`
  }
  return time
}

function formatDate(date, settings) {
  const y = settings.timezone === 'utc' ? date.getUTCFullYear() : date.getFullYear()
  const m = settings.timezone === 'utc' ? date.getUTCMonth() + 1 : date.getMonth() + 1
  const d = settings.timezone === 'utc' ? date.getUTCDate() : date.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function MarketClock({ windowId }) {
  const [now, setNow] = useState(() => new Date())
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`market-clock-settings-${windowId}`)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [showSettings, setShowSettings] = useState(false)
  const rafRef = useRef(null)

  // Persist settings
  useEffect(() => {
    localStorage.setItem(`market-clock-settings-${windowId}`, JSON.stringify(settings))
  }, [settings, windowId])

  // Clock tick — use requestAnimationFrame for smooth ms updates, setInterval for seconds-only
  useEffect(() => {
    if (settings.showMilliseconds) {
      const tick = () => {
        setNow(new Date())
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    } else {
      // Update every second
      setNow(new Date())
      const interval = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(interval)
    }
  }, [settings.showMilliseconds])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
  }, [])

  const timeStr = formatTime(now, settings)
  const dateStr = settings.showDate ? formatDate(now, settings) : null
  const tzLabel = settings.timezone === 'utc' ? 'UTC' : 'LOCAL'
  const session = useMemo(() => getMarketSession(now), [
    Math.floor(now.getTime() / 60000) // recalculate at most once per minute
  ])

  return (
    <div className="market-clock">
      <div className="mc-display">
        <div className="mc-time" style={{ fontSize: `${settings.fontSize}px` }}>
          {settings.showMilliseconds ? (
            <>
              {timeStr.split('.')[0]}
              <span className="mc-time-ms">.{timeStr.split('.').slice(1).join('.')}</span>
            </>
          ) : timeStr}
        </div>
        {dateStr && <div className="mc-date">{dateStr}</div>}
        <div className="mc-tz">{tzLabel}</div>
        <div className={`mc-status mc-status--${session.status}`}>
          <span className="mc-status-dot" />
          {session.label}
        </div>
      </div>

      <button
        className={`mc-settings-btn${showSettings ? ' mc-settings-btn--active' : ''}`}
        onClick={() => setShowSettings((s) => !s)}
        title="Clock settings"
      >
        <Settings size={12} />
      </button>

      {showSettings && (
        <MarketClockSettings
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(MarketClock)
