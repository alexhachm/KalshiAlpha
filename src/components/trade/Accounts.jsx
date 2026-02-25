import React, { useState, useEffect, useCallback, useRef } from 'react'
import AccountsSettings from './AccountsSettings'
import './Accounts.css'

const LS_KEY_PREFIX = 'accounts-settings-'

const DEFAULT_SETTINGS = {
  columns: {
    account: true,
    type: true,
    realizedPnl: true,
    unrealizedPnl: true,
    initEquity: true,
    tickets: true,
    shares: true,
  },
  decimalPrecision: 2,
  refreshInterval: 5,
  fontSize: 'medium',
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

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
  }

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(colKey)
      setSortDir('asc')
    }
  }

  // Sort accounts
  const sortedAccounts = [...accounts]
  if (sortCol) {
    sortedAccounts.sort((a, b) => {
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

  const visibleColumns = COLUMNS.filter((c) => settings.columns[c.key])

  // Totals row
  const totals = {
    account: 'Total',
    type: '',
    realizedPnl: accounts.reduce((s, a) => s + a.realizedPnl, 0),
    unrealizedPnl: accounts.reduce((s, a) => s + a.unrealizedPnl, 0),
    initEquity: accounts.reduce((s, a) => s + a.initEquity, 0),
    tickets: accounts.reduce((s, a) => s + a.tickets, 0),
    shares: accounts.reduce((s, a) => s + a.shares, 0),
  }

  const fontClass = `acct--font-${settings.fontSize}`

  return (
    <div className={`accounts ${fontClass}`}>
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
      <div className="acct-table-wrap">
        <table className="acct-table">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`acct-th acct-align-${col.align}`}
                  onClick={() => handleSort(col.key)}
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
              <tr key={acct.account} className="acct-row">
                {visibleColumns.map((col) => {
                  const val = acct[col.key]
                  const displayVal = col.numeric
                    ? formatValue(val, settings.decimalPrecision)
                    : val
                  const pnlClass =
                    col.numeric && typeof val === 'number'
                      ? val >= 0
                        ? 'text-win'
                        : 'text-loss'
                      : ''
                  const typeClass =
                    col.key === 'type'
                      ? acct.type === 'Paper'
                        ? 'acct-type-paper'
                        : 'acct-type-live'
                      : ''
                  return (
                    <td
                      key={col.key}
                      className={`acct-td acct-align-${col.align} ${pnlClass} ${typeClass}`}
                    >
                      {col.numeric && typeof val === 'number'
                        ? `$${displayVal}`
                        : displayVal}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* Totals row */}
            <tr className="acct-row acct-totals-row">
              {visibleColumns.map((col) => {
                const val = totals[col.key]
                const displayVal = col.numeric
                  ? formatValue(val, settings.decimalPrecision)
                  : val
                const pnlClass =
                  col.numeric && typeof val === 'number'
                    ? val >= 0
                      ? 'text-win'
                      : 'text-loss'
                    : ''
                return (
                  <td
                    key={col.key}
                    className={`acct-td acct-align-${col.align} ${pnlClass}`}
                  >
                    {col.key === 'account' ? (
                      <strong>{displayVal}</strong>
                    ) : col.numeric && typeof val === 'number' ? (
                      <strong>${displayVal}</strong>
                    ) : (
                      displayVal
                    )}
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
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(Accounts)
