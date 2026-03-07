import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import AccountsSettings from './AccountsSettings'
import './Accounts.css'

const LS_KEY_PREFIX = 'accounts-settings-'

const DEFAULT_SETTINGS = {
  decimalPrecision: 2,
  refreshInterval: 5,
}

const COLUMNS = [
  { key: 'account', label: 'Account #', align: 'left' },
  { key: 'type', label: 'Type', align: 'center' },
  { key: 'realizedPnl', label: 'Realized P&L', align: 'right', numeric: true },
  { key: 'unrealizedPnl', label: 'Unrealized P&L', align: 'right', numeric: true },
  { key: 'initEquity', label: 'Init Equity', align: 'right', numeric: true },
  { key: 'tickets', label: 'Tickets', align: 'right' },
  { key: 'shares', label: 'Shares', align: 'right' },
]

function generateMockAccounts() {
  return [
    {
      account: 'KA-100482',
      type: 'Paper',
      realizedPnl: (Math.random() - 0.3) * 2000,
      unrealizedPnl: (Math.random() - 0.5) * 800,
      initEquity: 10000,
      tickets: Math.floor(Math.random() * 50) + 10,
      shares: Math.floor(Math.random() * 3000) + 500,
    },
    {
      account: 'KA-100483',
      type: 'Live',
      realizedPnl: (Math.random() - 0.4) * 5000,
      unrealizedPnl: (Math.random() - 0.5) * 1500,
      initEquity: 25000,
      tickets: Math.floor(Math.random() * 120) + 20,
      shares: Math.floor(Math.random() * 8000) + 1000,
    },
  ]
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

function formatValue(value, precision) {
  if (typeof value !== 'number') return value
  return value.toFixed(precision)
}

function Accounts({ windowId }) {
  const grid = useGridCustomization('accounts-' + windowId, COLUMNS)
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [accounts, setAccounts] = useState(generateMockAccounts)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const intervalRef = useRef(null)

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Refresh data on interval
  const refreshData = useCallback(() => {
    setAccounts(generateMockAccounts())
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(refreshData, settings.refreshInterval * 1000)
    return () => clearInterval(intervalRef.current)
  }, [settings.refreshInterval, refreshData])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
  }, [])

  const handleSort = useCallback((colKey) => {
    setSortCol((prev) => {
      if (prev === colKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return colKey
    })
  }, [])

  // Sort accounts — memoized
  const sortedAccounts = useMemo(() => {
    const result = [...accounts]
    if (sortCol) {
      result.sort((a, b) => {
        const va = a[sortCol]
        const vb = b[sortCol]
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortDir === 'asc' ? va - vb : vb - va
        }
        const sa = String(va)
        const sb = String(vb)
        return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
      })
    }
    return result
  }, [accounts, sortCol, sortDir])

  // Totals row — memoized
  const totals = useMemo(() => ({
    account: 'Total',
    type: '',
    realizedPnl: accounts.reduce((s, a) => s + a.realizedPnl, 0),
    unrealizedPnl: accounts.reduce((s, a) => s + a.unrealizedPnl, 0),
    initEquity: accounts.reduce((s, a) => s + a.initEquity, 0),
    tickets: accounts.reduce((s, a) => s + a.tickets, 0),
    shares: accounts.reduce((s, a) => s + a.shares, 0),
  }), [accounts])

  // STUB: Return on equity (ROE) display — calculate and show ROE per account
  // SOURCE: "Portfolio performance metrics", GIPS standards
  // IMPLEMENT WHEN: initEquity and realized P&L are accurate
  // STEPS: 1. Compute ROE = (realizedPnl + unrealizedPnl) / initEquity * 100
  //        2. Add ROE column to account grid
  //        3. Color-code: green > 0%, red < 0%
  //        4. Show annualized ROE if account creation date available

  // STUB: Account margin utilization — show buying power and margin usage
  // SOURCE: "Kalshi API balance endpoints", margin trading best practices
  // IMPLEMENT WHEN: Kalshi API balance/margin data is available
  // STEPS: 1. Fetch available balance and margin data from API
  //        2. Add "Available" and "Used Margin" columns
  //        3. Show utilization bar (used/total margin)
  //        4. Color-code: yellow > 70%, red > 90% utilization

  // STUB: Account performance chart — mini sparkline showing equity curve
  // SOURCE: "Bloomberg portfolio analytics", equity curve visualization
  // IMPLEMENT WHEN: Historical P&L data is tracked over time
  // STEPS: 1. Track daily P&L snapshots in localStorage/IndexedDB
  //        2. Render mini sparkline in each account row
  //        3. Show tooltip with detailed daily breakdown on hover
  //        4. Add expanded chart view on click

  return (
    <div className={`accounts acct--font-${grid.fontSize}`}>
      {/* Header bar */}
      <div className="acct-header-bar">
        <span className="acct-title">Account Overview</span>
        <button
          className="acct-settings-btn"
          onClick={() => setShowSettings(true)}
          title="Accounts Settings"
        >
          &#9881;
        </button>
      </div>

      {/* Table */}
      <div className="acct-table-wrap" style={{ ...(grid.bgColor && { backgroundColor: grid.bgColor }), ...(grid.textColor && { color: grid.textColor }) }}>
        <table className="acct-table">
          <thead>
            <tr>
              {grid.visibleColumns.map((col, idx) => (
                <th
                  key={col.key}
                  className={`acct-th acct-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === idx ? ' drag-over' : ''}`}
                  onClick={() => handleSort(col.key)}
                  draggable
                  onDragStart={() => grid.onDragStart(idx)}
                  onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
                  onDragEnd={grid.onDragEnd}
                  style={{ width: col.width || 'auto', cursor: 'grab' }}
                >
                  {col.label}
                  {sortCol === col.key && (
                    <span className="acct-sort-arrow">
                      {sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((acct) => (
              <tr
                key={acct.account}
                className="acct-row"
                style={{ height: grid.rowHeight, ...grid.getRowStyle(acct) }}
              >
                {grid.visibleColumns.map((col) => {
                  const val = acct[col.key]
                  const isPnl = col.key === 'realizedPnl' || col.key === 'unrealizedPnl'
                  const pnlClass =
                    isPnl && typeof val === 'number'
                      ? val > 0 ? 'text-win' : val < 0 ? 'text-loss' : ''
                      : ''
                  const typeClass =
                    col.key === 'type'
                      ? acct.type === 'Paper'
                        ? 'acct-type-paper'
                        : 'acct-type-live'
                      : ''
                  let content
                  if (isPnl && typeof val === 'number') {
                    const prefix = val > 0 ? '+$' : val < 0 ? '-$' : '$'
                    content = `${prefix}${Math.abs(val).toFixed(settings.decimalPrecision)}`
                  } else if (col.numeric && typeof val === 'number') {
                    content = `$${formatValue(val, settings.decimalPrecision)}`
                  } else {
                    content = val
                  }
                  return (
                    <td
                      key={col.key}
                      className={`acct-td acct-align-${col.align} ${pnlClass} ${typeClass}`}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* Totals row */}
            <tr className="acct-row acct-totals-row" style={{ height: grid.rowHeight }}>
              {grid.visibleColumns.map((col) => {
                const val = totals[col.key]
                const isPnl = col.key === 'realizedPnl' || col.key === 'unrealizedPnl'
                const pnlClass =
                  isPnl && typeof val === 'number'
                    ? val > 0 ? 'text-win' : val < 0 ? 'text-loss' : ''
                    : ''
                let content
                if (col.key === 'account') {
                  content = <strong>{val}</strong>
                } else if (isPnl && typeof val === 'number') {
                  const prefix = val > 0 ? '+$' : val < 0 ? '-$' : '$'
                  content = <strong>{prefix}{Math.abs(val).toFixed(settings.decimalPrecision)}</strong>
                } else if (col.numeric && typeof val === 'number') {
                  content = <strong>${formatValue(val, settings.decimalPrecision)}</strong>
                } else {
                  content = val
                }
                return (
                  <td
                    key={col.key}
                    className={`acct-td acct-align-${col.align} ${pnlClass}`}
                  >
                    {content}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <AccountsSettings
          settings={settings}
          grid={grid}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(Accounts)
