import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import TradeLogSettings from './TradeLogSettings'
import { emitLinkedMarket, subscribeToLink, unsubscribeFromLink, getColorGroup } from '../../services/linkBus'
import './TradeLog.css'

const LS_KEY_PREFIX = 'trade-log-settings-'

const DEFAULT_SETTINGS = {
  sortBy: 'date',
  sortDirection: 'desc',
  filter: 'all',
  dateRange: 'all',
  refreshInterval: 5,
  flashOnChange: false,
}

const COLUMNS = [
  { key: 'market',      label: 'Market',     align: 'left' },
  { key: 'account',     label: 'Account',    align: 'left' },
  { key: 'shares',      label: 'Shares',     align: 'right' },
  { key: 'avgCost',     label: 'Avg Cost',   align: 'right', numeric: true },
  { key: 'realized',    label: 'Realized',   align: 'right', numeric: true },
  { key: 'unrealized',  label: 'Unrealized', align: 'right', numeric: true },
  { key: 'type',        label: 'Type',       align: 'center' },
  { key: 'status',      label: 'Status',     align: 'center' },
  { key: 'date',        label: 'Date',       align: 'left' },
]

const MOCK_TICKERS = [
  'KXBTC-25FEB28', 'KXETH-25MAR15', 'KXSPY-25FEB28', 'KXNASDAQ-25MAR01',
  'KXGOLD-25MAR10', 'KXTSLA-25FEB28', 'KXAAPL-25MAR05', 'KXAMZN-25MAR12',
  'KXEUR-25MAR01', 'KXCRUDE-25FEB28', 'KXVIX-25MAR07',
]

function randomDate(daysBack) {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
  return d.toISOString().slice(0, 10)
}

function generateMockTradelog() {
  const count = 8 + Math.floor(Math.random() * 6)
  const rows = []

  for (let i = 0; i < count; i++) {
    const ticker = MOCK_TICKERS[Math.floor(Math.random() * MOCK_TICKERS.length)]
    const isLong = Math.random() > 0.4
    const isOpen = Math.random() > 0.45
    const shares = Math.floor(Math.random() * 400) + 20
    const avgCost = +(Math.random() * 0.8 + 0.1).toFixed(2)
    const exitPrice = isOpen ? avgCost + (Math.random() - 0.45) * 0.3 : avgCost + (Math.random() - 0.5) * 0.4
    const unrealized = isOpen
      ? +((exitPrice - avgCost) * shares * (isLong ? 1 : -1)).toFixed(2)
      : 0
    const realized = isOpen
      ? 0
      : +((exitPrice - avgCost) * shares * (isLong ? 1 : -1)).toFixed(2)

    rows.push({
      id: `${ticker}-${i}`,
      market: ticker,
      account: 'KA-100482',
      shares,
      avgCost,
      realized,
      unrealized,
      type: isLong ? 'Long' : 'Short',
      status: isOpen ? 'Open' : 'Closed',
      date: randomDate(30),
    })
  }

  return rows
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

function exportCsv(rows, columns) {
  const headers = columns.map((c) => c.label).join(',')
  const lines = rows.map((row) =>
    columns.map((c) => {
      const v = row[c.key]
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`
      return v ?? ''
    }).join(',')
  )
  const csv = [headers, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tradelog_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function applyDateFilter(rows, dateRange) {
  if (dateRange === 'all') return rows
  const now = new Date()
  const cutoff = new Date(now)
  if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0)
  else if (dateRange === '7d') cutoff.setDate(now.getDate() - 7)
  else if (dateRange === '30d') cutoff.setDate(now.getDate() - 30)
  else return rows

  return rows.filter((r) => new Date(r.date) >= cutoff)
}

function TradeLog({ windowId }) {
  const grid = useGridCustomization('trade-log-' + windowId, COLUMNS)
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [allRows, setAllRows] = useState(generateMockTradelog)
  const [activeFilter, setActiveFilter] = useState(settings.filter)
  const [selectedRow, setSelectedRow] = useState(null)
  const [flashedRows, setFlashedRows] = useState(new Set())
  const intervalRef = useRef(null)

  // Sync activeFilter with settings
  useEffect(() => {
    setActiveFilter(settings.filter)
  }, [settings.filter])

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Refresh data
  const refreshData = useCallback(() => {
    setAllRows((prev) => {
      const next = generateMockTradelog()

      if (settings.flashOnChange) {
        const prevMap = {}
        prev.forEach((r) => { prevMap[r.id] = r.unrealized })
        const flashed = new Set()
        next.forEach((r) => {
          if (prevMap[r.id] !== undefined && prevMap[r.id] !== r.unrealized) {
            flashed.add(r.id)
          }
        })
        if (flashed.size > 0) {
          setFlashedRows(flashed)
          setTimeout(() => setFlashedRows(new Set()), 600)
        }
      }

      return next
    })
  }, [settings.flashOnChange])

  useEffect(() => {
    intervalRef.current = setInterval(refreshData, settings.refreshInterval * 1000)
    return () => clearInterval(intervalRef.current)
  }, [settings.refreshInterval, refreshData])

  // Color link
  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return
    const handler = ({ ticker }) => setSelectedRow(ticker)
    subscribeToLink(colorId, handler, windowId)
    return () => unsubscribeFromLink(colorId, handler)
  }, [windowId])

  const handleRowClick = (market) => {
    setSelectedRow(market)
    emitLinkedMarket(windowId, market)
  }

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
    setActiveFilter(newSettings.filter)
  }

  // Filter
  const filtered = applyDateFilter(
    activeFilter === 'all'
      ? allRows
      : allRows.filter((r) => r.status.toLowerCase() === activeFilter),
    settings.dateRange
  )

  // Sort
  const sorted = [...filtered]
  const sortKey = settings.sortBy
  const sortDir = settings.sortDirection
  if (sortKey) {
    sorted.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va ?? '')
      const sb = String(vb ?? '')
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }

  const handleSort = (colKey) => {
    setSettings((prev) => ({
      ...prev,
      sortBy: colKey,
      sortDirection: prev.sortBy === colKey
        ? (prev.sortDirection === 'asc' ? 'desc' : 'asc')
        : 'desc',
    }))
  }

  const handleExport = () => {
    exportCsv(sorted, grid.visibleColumns)
  }

  const openCount = allRows.filter((r) => r.status === 'Open').length
  const closedCount = allRows.filter((r) => r.status === 'Closed').length

  return (
    <div className={`tradelog tradelog--font-${grid.fontSize}`}>
      {/* Header bar */}
      <div className="tl-header-bar">
        <span className="tl-title">Trade Log</span>
        <div className="tl-header-right">
          <span className="tl-count">{sorted.length} rows</span>
          <button className="tl-csv-btn" onClick={handleExport} title="Export CSV">⬇ CSV</button>
          <button
            className="tl-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Trade Log Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="tl-filter-bar">
        {['all', 'open', 'closed'].map((f) => (
          <button
            key={f}
            className={`tl-filter-btn ${activeFilter === f ? 'tl-filter-active' : ''}`}
            onClick={() => {
              setActiveFilter(f)
              setSettings((prev) => ({ ...prev, filter: f }))
            }}
          >
            {f === 'all'
              ? `All (${allRows.length})`
              : f === 'open'
                ? `Open (${openCount})`
                : `Closed (${closedCount})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tl-table-wrap" style={{ ...(grid.bgColor && { backgroundColor: grid.bgColor }), ...(grid.textColor && { color: grid.textColor }) }}>
        <table className="tl-table">
          <thead>
            <tr>
              {grid.visibleColumns.map((col, idx) => (
                <th
                  key={col.key}
                  className={`tl-th tl-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === idx ? ' drag-over' : ''}`}
                  onClick={() => handleSort(col.key)}
                  draggable
                  onDragStart={() => grid.onDragStart(idx)}
                  onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
                  onDragEnd={grid.onDragEnd}
                  style={{ width: col.width || 'auto', cursor: 'grab' }}
                >
                  {col.label}
                  {settings.sortBy === col.key && (
                    <span className="tl-sort-arrow">
                      {settings.sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={grid.visibleColumns.length} className="tl-empty">
                  No positions to display
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const isLong = row.type === 'Long'
                const isOpen = row.status === 'Open'
                const isFlashed = flashedRows.has(row.id)
                const isSelected = selectedRow === row.market
                const rowClass = [
                  'tl-row',
                  isFlashed ? 'tl-row-flash' : '',
                  isSelected ? 'tl-row-selected' : '',
                ].filter(Boolean).join(' ')

                return (
                  <tr
                    key={row.id}
                    className={rowClass}
                    onClick={() => handleRowClick(row.market)}
                    style={{ height: grid.rowHeight, ...grid.getRowStyle(row) }}
                  >
                    {grid.visibleColumns.map((col) => {
                      const val = row[col.key]

                      if (col.key === 'market') {
                        return (
                          <td key={col.key} className={`tl-td tl-align-${col.align} ${isLong ? 'tl-market-long' : 'tl-market-short'}`}>
                            {val}
                          </td>
                        )
                      }

                      if (col.key === 'type') {
                        return (
                          <td key={col.key} className={`tl-td tl-align-${col.align}`}>
                            <span className={`tl-badge ${isLong ? 'tl-badge-long' : 'tl-badge-short'}`}>{val}</span>
                          </td>
                        )
                      }

                      if (col.key === 'status') {
                        return (
                          <td key={col.key} className={`tl-td tl-align-${col.align}`}>
                            <span className={`tl-badge ${isOpen ? 'tl-badge-open' : 'tl-badge-closed'}`}>{val}</span>
                          </td>
                        )
                      }

                      if (col.key === 'unrealized') {
                        const cls = val >= 0 ? 'text-win' : 'text-loss'
                        return (
                          <td key={col.key} className={`tl-td tl-align-${col.align} ${cls}`}>
                            {isOpen ? `$${val.toFixed(2)}` : '\u2014'}
                          </td>
                        )
                      }

                      if (col.key === 'realized') {
                        const cls = val >= 0 ? 'text-win' : 'text-loss'
                        return (
                          <td key={col.key} className={`tl-td tl-align-${col.align} ${val !== 0 ? cls : ''}`}>
                            {!isOpen ? `$${val.toFixed(2)}` : '\u2014'}
                          </td>
                        )
                      }

                      if (col.numeric) {
                        return (
                          <td key={col.key} className={`tl-td tl-align-${col.align}`}>
                            ${typeof val === 'number' ? val.toFixed(2) : val}
                          </td>
                        )
                      }

                      return (
                        <td key={col.key} className={`tl-td tl-align-${col.align}`}>
                          {val}
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

      {showSettings && (
        <TradeLogSettings
          settings={settings}
          grid={grid}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(TradeLog)
