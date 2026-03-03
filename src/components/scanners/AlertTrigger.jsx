import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import GridSettingsPanel from '../GridSettingsPanel'
import * as alertService from '../../services/alertService'
import './AlertTrigger.css'

const LS_KEY_PREFIX = 'alert-trigger-settings-'

const DEFAULT_SETTINGS = {
  flashOnAlert: true,
}

const RULE_COLUMNS = [
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'type', label: 'Type', align: 'center' },
  { key: 'params', label: 'Params', align: 'left' },
  { key: 'enabled', label: 'Enabled', align: 'center' },
  { key: 'actions', label: '', align: 'center' },
]

const HISTORY_COLUMNS = [
  { key: 'time', label: 'Time', align: 'left' },
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'type', label: 'Type', align: 'center' },
  { key: 'message', label: 'Message', align: 'left' },
  { key: 'price', label: 'Price', align: 'right', numeric: true },
]

const RULE_TYPES = [
  { value: 'price_crosses', label: 'Price Crosses' },
  { value: 'pct_change', label: '% Change' },
  { value: 'volume_spike', label: 'Volume Spike' },
]

function formatParams(type, params) {
  if (!params) return ''
  switch (type) {
    case 'price_crosses':
      return `threshold: ${params.threshold ?? ''}`
    case 'pct_change':
      return `${params.threshold ?? ''}% / ${params.window ?? ''}s`
    case 'volume_spike':
      return `${params.multiplier ?? ''}x / ${params.window ?? ''}s`
    default:
      return JSON.stringify(params)
  }
}

function formatTime(isoOrTs) {
  if (!isoOrTs) return ''
  const d = new Date(isoOrTs)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function loadSettings(windowId) {
  try {
    const raw = localStorage.getItem(LS_KEY_PREFIX + windowId)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(windowId, settings) {
  try {
    localStorage.setItem(LS_KEY_PREFIX + windowId, JSON.stringify(settings))
  } catch { /* ignore */ }
}

function AlertTrigger({ windowId }) {
  const rulesGrid = useGridCustomization('alert-rules-' + windowId, RULE_COLUMNS)
  const historyGrid = useGridCustomization('alert-history-' + windowId, HISTORY_COLUMNS)

  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [rules, setRules] = useState([])
  const [history, setHistory] = useState([])
  const [flashedIds, setFlashedIds] = useState(new Set())
  const flashTimerRef = useRef(null)

  // Add-rule form state
  const [newTicker, setNewTicker] = useState('')
  const [newType, setNewType] = useState('price_crosses')
  const [newParam1, setNewParam1] = useState('')
  const [newParam2, setNewParam2] = useState('')

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Initialize alert service and subscribe
  useEffect(() => {
    alertService.initialize()
    setRules(alertService.getRules())
    setHistory(alertService.getHistory())

    const unsubRules = alertService.onRulesChange((updatedRules) => {
      setRules(updatedRules)
    })

    const unsubAlerts = alertService.onAlert((alert) => {
      setHistory(alertService.getHistory())
      // Flash new alert
      if (settings.flashOnAlert) {
        setFlashedIds((prev) => {
          const next = new Set(prev)
          next.add(alert.id)
          return next
        })
        clearTimeout(flashTimerRef.current)
        flashTimerRef.current = setTimeout(() => setFlashedIds(new Set()), 1200)
      }
    })

    return () => {
      unsubRules()
      unsubAlerts()
      alertService.destroy()
      clearTimeout(flashTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddRule = useCallback(() => {
    if (!newTicker.trim()) return

    let params
    switch (newType) {
      case 'price_crosses':
        params = { threshold: Number(newParam1) || 0 }
        break
      case 'pct_change':
        params = { threshold: Number(newParam1) || 0, window: Number(newParam2) || 60 }
        break
      case 'volume_spike':
        params = { multiplier: Number(newParam1) || 2, window: Number(newParam2) || 60 }
        break
      default:
        return
    }

    try {
      alertService.addRule({ type: newType, ticker: newTicker.trim().toUpperCase(), params })
      setNewTicker('')
      setNewParam1('')
      setNewParam2('')
    } catch (err) {
      console.error('[AlertTrigger] Failed to add rule:', err)
    }
  }, [newTicker, newType, newParam1, newParam2])

  const handleToggle = useCallback((id) => {
    try { alertService.toggleRule(id) } catch { /* ignore */ }
  }, [])

  const handleDelete = useCallback((id) => {
    try { alertService.removeRule(id) } catch { /* ignore */ }
  }, [])

  const handleClearHistory = useCallback(() => {
    alertService.clearHistory()
    setHistory([])
  }, [])

  // Param input fields depend on selected type
  const renderParamInputs = () => {
    switch (newType) {
      case 'price_crosses':
        return (
          <input
            className="at-input-param"
            type="number"
            step="any"
            placeholder="Price"
            value={newParam1}
            onChange={(e) => setNewParam1(e.target.value)}
          />
        )
      case 'pct_change':
        return (
          <>
            <input
              className="at-input-param"
              type="number"
              step="any"
              placeholder="%"
              value={newParam1}
              onChange={(e) => setNewParam1(e.target.value)}
            />
            <input
              className="at-input-param"
              type="number"
              placeholder="Window(s)"
              value={newParam2}
              onChange={(e) => setNewParam2(e.target.value)}
            />
          </>
        )
      case 'volume_spike':
        return (
          <>
            <input
              className="at-input-param"
              type="number"
              step="any"
              placeholder="Mult"
              value={newParam1}
              onChange={(e) => setNewParam1(e.target.value)}
            />
            <input
              className="at-input-param"
              type="number"
              placeholder="Window(s)"
              value={newParam2}
              onChange={(e) => setNewParam2(e.target.value)}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className={`alert-trigger at--font-${rulesGrid.fontSize}`}>
      {/* Header bar */}
      <div className="at-header-bar">
        <span className="at-title">Alert Trigger</span>
        <div className="at-header-right">
          <span className="at-count">{rules.length} rules</span>
          <button
            className="at-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Alert Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      <div className="at-panels">
        {/* Rules panel */}
        <div className="at-panel">
          <div className="at-panel-header">
            <span className="at-panel-title">Rules</span>
          </div>

          {/* Add Rule form */}
          <div className="at-add-form">
            <input
              className="at-input-ticker"
              type="text"
              placeholder="Ticker"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRule() }}
            />
            <select
              value={newType}
              onChange={(e) => {
                setNewType(e.target.value)
                setNewParam1('')
                setNewParam2('')
              }}
            >
              {RULE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            {renderParamInputs()}
            <button className="at-add-btn" onClick={handleAddRule}>Add</button>
          </div>

          {/* Rules table */}
          <div className="at-table-wrap">
            <table className="at-table">
              <thead>
                <tr>
                  {rulesGrid.visibleColumns.map((col, idx) => (
                    <th
                      key={col.key}
                      className={`at-th at-align-${col.align}${rulesGrid.dragState.dragging && rulesGrid.dragState.overIndex === idx ? ' drag-over' : ''}`}
                      draggable
                      onDragStart={() => rulesGrid.onDragStart(idx)}
                      onDragOver={(e) => { e.preventDefault(); rulesGrid.onDragOver(idx) }}
                      onDragEnd={rulesGrid.onDragEnd}
                      style={{ width: col.width || 'auto', cursor: 'grab' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={rulesGrid.visibleColumns.length} className="at-empty">
                      No rules defined. Add one above.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="at-row" style={{ height: rulesGrid.rowHeight }}>
                      {rulesGrid.visibleColumns.map((col) => {
                        if (col.key === 'ticker') {
                          return (
                            <td key={col.key} className={`at-td at-align-${col.align}`}>
                              {rule.ticker}
                            </td>
                          )
                        }
                        if (col.key === 'type') {
                          return (
                            <td key={col.key} className={`at-td at-align-${col.align}`}>
                              <span className="at-type-badge">{rule.type.replace('_', ' ')}</span>
                            </td>
                          )
                        }
                        if (col.key === 'params') {
                          return (
                            <td key={col.key} className={`at-td at-align-${col.align} at-params`}>
                              {formatParams(rule.type, rule.params)}
                            </td>
                          )
                        }
                        if (col.key === 'enabled') {
                          return (
                            <td key={col.key} className={`at-td at-align-${col.align}`}>
                              <button
                                className={`at-toggle-btn ${rule.enabled ? 'at-toggle-on' : 'at-toggle-off'}`}
                                onClick={() => handleToggle(rule.id)}
                              >
                                {rule.enabled ? 'ON' : 'OFF'}
                              </button>
                            </td>
                          )
                        }
                        if (col.key === 'actions') {
                          return (
                            <td key={col.key} className={`at-td at-align-${col.align}`}>
                              <button
                                className="at-delete-btn"
                                onClick={() => handleDelete(rule.id)}
                                title="Delete rule"
                              >
                                &times;
                              </button>
                            </td>
                          )
                        }
                        return (
                          <td key={col.key} className={`at-td at-align-${col.align}`}>
                            {rule[col.key]}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History panel */}
        <div className="at-panel">
          <div className="at-panel-header">
            <span className="at-panel-title">Alert History</span>
            {history.length > 0 && (
              <button className="at-clear-btn" onClick={handleClearHistory}>Clear</button>
            )}
          </div>
          <div className="at-table-wrap">
            <table className="at-table">
              <thead>
                <tr>
                  {historyGrid.visibleColumns.map((col, idx) => (
                    <th
                      key={col.key}
                      className={`at-th at-align-${col.align}${historyGrid.dragState.dragging && historyGrid.dragState.overIndex === idx ? ' drag-over' : ''}`}
                      draggable
                      onDragStart={() => historyGrid.onDragStart(idx)}
                      onDragOver={(e) => { e.preventDefault(); historyGrid.onDragOver(idx) }}
                      onDragEnd={historyGrid.onDragEnd}
                      style={{ width: col.width || 'auto', cursor: 'grab' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={historyGrid.visibleColumns.length} className="at-empty">
                      No alerts triggered yet.
                    </td>
                  </tr>
                ) : (
                  history.map((alert) => {
                    const isFlashed = flashedIds.has(alert.id)
                    return (
                      <tr
                        key={alert.id}
                        className={`at-row${isFlashed ? ' at-row-flash' : ''}`}
                        style={{ height: historyGrid.rowHeight }}
                      >
                        {historyGrid.visibleColumns.map((col) => {
                          if (col.key === 'time') {
                            return (
                              <td key={col.key} className={`at-td at-align-${col.align}`}>
                                {formatTime(alert.triggeredAt || alert.ts)}
                              </td>
                            )
                          }
                          if (col.key === 'ticker') {
                            return (
                              <td key={col.key} className={`at-td at-align-${col.align}`}>
                                {alert.ticker}
                              </td>
                            )
                          }
                          if (col.key === 'type') {
                            return (
                              <td key={col.key} className={`at-td at-align-${col.align}`}>
                                <span className="at-type-badge">{(alert.type || '').replace('_', ' ')}</span>
                              </td>
                            )
                          }
                          if (col.key === 'message') {
                            return (
                              <td key={col.key} className={`at-td at-align-${col.align}`}>
                                {alert.message || alert.label || ''}
                              </td>
                            )
                          }
                          if (col.key === 'price') {
                            return (
                              <td key={col.key} className={`at-td at-align-${col.align}`}>
                                {alert.price != null ? Number(alert.price).toFixed(2) : ''}
                              </td>
                            )
                          }
                          return (
                            <td key={col.key} className={`at-td at-align-${col.align}`}>
                              {alert[col.key]}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="at-settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="at-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="at-settings-header">
              <span>Alert Trigger Settings</span>
              <button className="at-settings-close" onClick={() => setShowSettings(false)}>&times;</button>
            </div>
            <div className="at-settings-body">
              <GridSettingsPanel {...rulesGrid} />
            </div>
            <div className="at-settings-footer">
              <button className="at-btn-save" onClick={() => setShowSettings(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(AlertTrigger)
