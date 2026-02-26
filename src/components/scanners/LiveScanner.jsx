import React, { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeToScanner } from '../../services/dataFeed'
import { emitLinkedMarket } from '../../services/linkBus'
import { Settings, Trash2 } from 'lucide-react'
import './LiveScanner.css'

const DEFAULT_SETTINGS = {
  maxResults: 50,
  sortColumn: 'time',
  sortAsc: false,
  filterType: 'all', // all | bull | bear | neutral
  minConviction: 1,
  showConvictionBars: true,
}

const SORT_COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'ticker', label: 'Ticker' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'type', label: 'Type' },
  { key: 'conviction', label: 'Conviction' },
]

function sortAlerts(alerts, column, asc) {
  return [...alerts].sort((a, b) => {
    let cmp = 0
    if (column === 'time') {
      cmp = a.id - b.id
    } else if (column === 'conviction') {
      cmp = a.conviction - b.conviction
    } else {
      cmp = String(a[column] || '').localeCompare(String(b[column] || ''))
    }
    return asc ? cmp : -cmp
  })
}

function ConvictionBars({ level }) {
  return (
    <span className="ls-conviction" title={`Conviction: ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`ls-conviction-bar${i <= level ? ' ls-conviction-bar--active' : ''}`}
        />
      ))}
    </span>
  )
}

function LiveScanner({ windowId }) {
  const [alerts, setAlerts] = useState([])
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`live-scanner-settings-${windowId}`)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [showSettings, setShowSettings] = useState(false)
  const [paused, setPaused] = useState(false)
  const alertsRef = useRef([])
  const tableBodyRef = useRef(null)

  // Persist settings
  useEffect(() => {
    localStorage.setItem(`live-scanner-settings-${windowId}`, JSON.stringify(settings))
  }, [settings, windowId])

  // Subscribe to scanner alerts
  useEffect(() => {
    if (paused) return

    const unsub = subscribeToScanner((alert) => {
      alertsRef.current = [alert, ...alertsRef.current].slice(0, settings.maxResults)
      setAlerts([...alertsRef.current])
    })
    return unsub
  }, [paused, settings.maxResults])

  // Handle click on alert row — emit to linked windows
  const handleRowClick = useCallback(
    (ticker) => {
      emitLinkedMarket(windowId, ticker)
    },
    [windowId]
  )

  const handleClear = useCallback(() => {
    alertsRef.current = []
    setAlerts([])
  }, [])

  const handleSortClick = useCallback((column) => {
    setSettings((prev) => ({
      ...prev,
      sortColumn: column,
      sortAsc: prev.sortColumn === column ? !prev.sortAsc : false,
    }))
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Filter and sort
  const filtered = alerts.filter((a) => {
    if (settings.filterType !== 'all' && a.type !== settings.filterType) return false
    if (a.conviction < settings.minConviction) return false
    return true
  })
  const sorted = sortAlerts(filtered, settings.sortColumn, settings.sortAsc)

  return (
    <div className="live-scanner">
      {/* Toolbar */}
      <div className="ls-toolbar">
        <div className="ls-toolbar-left">
          <select
            className="ls-filter-select"
            value={settings.filterType}
            onChange={(e) => updateSetting('filterType', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="bull">Bull</option>
            <option value="bear">Bear</option>
            <option value="neutral">Neutral</option>
          </select>
          <span className="ls-count">{sorted.length} alerts</span>
        </div>
        <div className="ls-toolbar-right">
          <button
            className={`ls-toolbar-btn${paused ? ' ls-toolbar-btn--active' : ''}`}
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Resume scanning' : 'Pause scanning'}
          >
            {paused ? '▶' : '⏸'}
          </button>
          <button
            className="ls-toolbar-btn"
            onClick={handleClear}
            title="Clear alerts"
          >
            <Trash2 size={13} />
          </button>
          <button
            className={`ls-toolbar-btn${showSettings ? ' ls-toolbar-btn--active' : ''}`}
            onClick={() => setShowSettings((s) => !s)}
            title="Scanner settings"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="ls-settings">
          <div className="ls-settings-row">
            <label>Max Results</label>
            <input
              type="number"
              min={10}
              max={200}
              value={settings.maxResults}
              onChange={(e) => updateSetting('maxResults', Math.max(10, Math.min(200, Number(e.target.value))))}
            />
          </div>
          <div className="ls-settings-row">
            <label>Min Conviction</label>
            <select
              value={settings.minConviction}
              onChange={(e) => updateSetting('minConviction', Number(e.target.value))}
            >
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3 only</option>
            </select>
          </div>
          <div className="ls-settings-row">
            <label>Conviction Bars</label>
            <input
              type="checkbox"
              checked={settings.showConvictionBars}
              onChange={(e) => updateSetting('showConvictionBars', e.target.checked)}
            />
          </div>
        </div>
      )}

      {/* Alerts table */}
      <div className="ls-table-wrap" ref={tableBodyRef}>
        <table className="ls-table">
          <thead>
            <tr>
              {SORT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`ls-th${settings.sortColumn === col.key ? ' ls-th--sorted' : ''}`}
                  onClick={() => handleSortClick(col.key)}
                >
                  {col.label}
                  {settings.sortColumn === col.key && (
                    <span className="ls-sort-arrow">
                      {settings.sortAsc ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((alert) => (
              <tr
                key={alert.id}
                className="ls-row"
                onClick={() => handleRowClick(alert.ticker)}
              >
                <td className="ls-cell-time">{alert.time}</td>
                <td className="ls-cell-ticker">{alert.ticker}</td>
                <td className="ls-cell-strategy">{alert.strategy}</td>
                <td className={`ls-cell-type ls-type-${alert.type}`}>
                  {alert.type.toUpperCase()}
                </td>
                <td className="ls-cell-conviction">
                  {settings.showConvictionBars ? (
                    <ConvictionBars level={alert.conviction} />
                  ) : (
                    alert.conviction
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="ls-empty">
                  {paused ? 'Scanner paused' : 'Waiting for alerts...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(LiveScanner)
