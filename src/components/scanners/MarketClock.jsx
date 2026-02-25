import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Settings } from 'lucide-react'
import MarketClockSettings from './MarketClockSettings'
import './MarketClock.css'

const DEFAULT_SETTINGS = {
  timezone: 'local', // 'local' | 'utc'
  showMilliseconds: false,
  showDate: false,
  fontSize: 32,
}

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

  return (
    <div className="market-clock">
      <div className="mc-display">
        <div className="mc-time" style={{ fontSize: `${settings.fontSize}px` }}>
          {timeStr}
        </div>
        {dateStr && <div className="mc-date">{dateStr}</div>}
        <div className="mc-tz">{tzLabel}</div>
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
