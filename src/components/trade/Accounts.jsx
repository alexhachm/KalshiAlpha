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
  { key: 'roe', label: 'ROE', align: 'right' },
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
  const [sort, setSort] = useState({ col: null, dir: 'asc' })
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
    setSort((prev) => prev.col === colKey
      ? { col: colKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col: colKey, dir: 'asc' }
    )
  }, [])

  // Sort accounts — memoized
  const sortedAccounts = useMemo(() => {
    const result = accounts.map(a => ({
      ...a,
      roe: a.initEquity === 0 ? null : (a.realizedPnl + a.unrealizedPnl) / a.initEquity * 100,
    }))
    if (sort.col) {
      result.sort((a, b) => {
        const va = a[sort.col]
        const vb = b[sort.col]
        if (typeof va === 'number' && typeof vb === 'number') {
          return sort.dir === 'asc' ? va - vb : vb - va
        }
        const sa = String(va)
        const sb = String(vb)
        return sort.dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
      })
    }
    return result
  }, [accounts, sort])

  // Totals row — memoized
  const totals = useMemo(() => {
    const totalRealizedPnl = accounts.reduce((s, a) => s + a.realizedPnl, 0)
    const totalUnrealizedPnl = accounts.reduce((s, a) => s + a.unrealizedPnl, 0)
    const totalInitEquity = accounts.reduce((s, a) => s + a.initEquity, 0)
    return {
      account: 'Total',
      type: '',
      realizedPnl: totalRealizedPnl,
      unrealizedPnl: totalUnrealizedPnl,
      roe: totalInitEquity === 0 ? null : (totalRealizedPnl + totalUnrealizedPnl) / totalInitEquity * 100,
      initEquity: totalInitEquity,
      tickets: accounts.reduce((s, a) => s + a.tickets, 0),
      shares: accounts.reduce((s, a) => s + a.shares, 0),
    }
  }, [accounts])

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
              {grid.visibleColumns.map((col) => {
                const fullIdx = grid.columns.findIndex((c) => c.key === col.key)
                return (
                  <th
                    key={col.key}
                    className={`acct-th acct-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === fullIdx ? ' drag-over' : ''}`}
                    onClick={() => handleSort(col.key)}
                    draggable
                    onDragStart={() => grid.onDragStart(fullIdx)}
                    onDragOver={(e) => { e.preventDefault(); grid.onDragOver(fullIdx) }}
                    onDragEnd={grid.onDragEnd}
                    style={{ width: col.width || 'auto', cursor: 'grab' }}
                  >
                    {col.label}
                    {sort.col === col.key && (
                      <span className="acct-sort-arrow">
                        {sort.dir === 'asc' ? ' \u25B2' : ' \u25BC'}
                      </span>
                    )}
                  </th>
                )
              })}
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
                  const isRoe = col.key === 'roe'
                  const pnlClass =
                    isPnl && typeof val === 'number'
                      ? val > 0 ? 'text-win' : val < 0 ? 'text-loss' : ''
                      : isRoe && typeof val === 'number'
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
                  } else if (isRoe) {
                    if (val === null || val === undefined) {
                      content = 'N/A'
                    } else {
                      const prefix = val > 0 ? '+' : ''
                      content = `${prefix}${val.toFixed(2)}%`
                    }
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
                const isRoe = col.key === 'roe'
                const pnlClass =
                  isPnl && typeof val === 'number'
                    ? val > 0 ? 'text-win' : val < 0 ? 'text-loss' : ''
                    : isRoe && typeof val === 'number'
                      ? val > 0 ? 'text-win' : val < 0 ? 'text-loss' : ''
                      : ''
                let content
                if (col.key === 'account') {
                  content = <strong>{val}</strong>
                } else if (isPnl && typeof val === 'number') {
                  const prefix = val > 0 ? '+$' : val < 0 ? '-$' : '$'
                  content = <strong>{prefix}{Math.abs(val).toFixed(settings.decimalPrecision)}</strong>
                } else if (isRoe) {
                  if (val === null || val === undefined) {
                    content = <strong>N/A</strong>
                  } else {
                    const prefix = val > 0 ? '+' : ''
                    content = <strong>{prefix}{val.toFixed(2)}%</strong>
                  }
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
