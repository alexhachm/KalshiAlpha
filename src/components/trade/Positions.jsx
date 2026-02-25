import React, { useState, useEffect, useCallback, useRef } from 'react'
import PositionsSettings from './PositionsSettings'
import { emitLinkedMarket, subscribeToLink, unsubscribeFromLink, getColorGroup } from '../../services/linkBus'
import './Positions.css'

const LS_KEY_PREFIX = 'positions-settings-'

const DEFAULT_SETTINGS = {
  columns: {
    market: true,
    account: true,
    shares: true,
    avgCost: true,
    realized: true,
    unrealized: true,
    type: true,
  },
  sortBy: 'unrealized',
  sortDirection: 'desc',
  refreshInterval: 2,
  fontSize: 'medium',
  flashOnChange: true,
}

const COLUMNS = [
  { key: 'market', label: 'Market', align: 'left' },
  { key: 'account', label: 'Account', align: 'left' },
  { key: 'shares', label: 'Shares', align: 'right' },
  { key: 'avgCost', label: 'Avg Cost', align: 'right', numeric: true },
  { key: 'realized', label: 'Realized', align: 'right', numeric: true },
  { key: 'unrealized', label: 'Unrealized', align: 'right', numeric: true },
  { key: 'type', label: 'Type', align: 'center' },
]

const MOCK_TICKERS = [
  'KXBTC-25FEB28', 'KXETH-25MAR15', 'KXSPY-25FEB28', 'KXNASDAQ-25MAR01',
  'KXGOLD-25MAR10', 'KXTSLA-25FEB28', 'KXAAPL-25MAR05', 'KXAMZN-25MAR12',
]

function generateMockPositions() {
  const count = 3 + Math.floor(Math.random() * 4)
  const used = new Set()
  const positions = []

  for (let i = 0; i < count; i++) {
    let ticker
    do {
      ticker = MOCK_TICKERS[Math.floor(Math.random() * MOCK_TICKERS.length)]
    } while (used.has(ticker))
    used.add(ticker)

    const isLong = Math.random() > 0.4
    const shares = Math.floor(Math.random() * 400) + 50
    const avgCost = +(Math.random() * 0.8 + 0.1).toFixed(2)
    const currentPrice = avgCost + (Math.random() - 0.45) * 0.3
    const unrealized = +((currentPrice - avgCost) * shares * (isLong ? 1 : -1)).toFixed(2)

    positions.push({
      market: ticker,
      account: 'KA-100482',
      shares,
      avgCost,
      realized: 0,
      unrealized,
      type: isLong ? 'Long' : 'Short',
    })
  }

  return positions
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

function Positions({ windowId }) {
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [positions, setPositions] = useState(generateMockPositions)
  const [selectedRow, setSelectedRow] = useState(null)
  const [flashedRows, setFlashedRows] = useState(new Set())
  const prevUnrealizedRef = useRef({})
  const intervalRef = useRef(null)

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Refresh data on interval
  const refreshData = useCallback(() => {
    setPositions((prev) => {
      const newPositions = generateMockPositions()

      // Check for P&L changes if flash is enabled
      if (settings.flashOnChange) {
        const prevMap = {}
        prev.forEach((p) => { prevMap[p.market] = p.unrealized })

        const flashed = new Set()
        newPositions.forEach((p) => {
          if (prevMap[p.market] !== undefined && prevMap[p.market] !== p.unrealized) {
            flashed.add(p.market)
          }
        })

        if (flashed.size > 0) {
          setFlashedRows(flashed)
          setTimeout(() => setFlashedRows(new Set()), 600)
        }
      }

      return newPositions
    })
  }, [settings.flashOnChange])

  useEffect(() => {
    intervalRef.current = setInterval(refreshData, settings.refreshInterval * 1000)
    return () => clearInterval(intervalRef.current)
  }, [settings.refreshInterval, refreshData])

  // Color link subscription
  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return

    const handler = ({ ticker }) => {
      setSelectedRow(ticker)
    }

    subscribeToLink(colorId, handler, windowId)
    return () => unsubscribeFromLink(colorId, handler)
  }, [windowId])

  const handleRowClick = (market) => {
    setSelectedRow(market)
    emitLinkedMarket(windowId, market)
  }

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
  }

  // Sort positions
  const sortedPositions = [...positions]
  const sortKey = settings.sortBy
  const sortDir = settings.sortDirection
  if (sortKey) {
    sortedPositions.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va)
      const sb = String(vb)
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

  const visibleColumns = COLUMNS.filter((c) => settings.columns[c.key])

  const fontClass = `pos--font-${settings.fontSize}`

  return (
    <div className={`positions ${fontClass}`}>
      {/* Header bar */}
      <div className="pos-header-bar">
        <span className="pos-title">Open Positions</span>
        <div className="pos-header-right">
          <span className="pos-count">{positions.length} open</span>
          <button
            className="pos-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Positions Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="pos-table-wrap">
        <table className="pos-table">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`pos-th pos-align-${col.align}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {settings.sortBy === col.key && (
                    <span className="pos-sort-arrow">
                      {settings.sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPositions.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="pos-empty">
                  No open positions
                </td>
              </tr>
            ) : (
              sortedPositions.map((pos) => {
                const isLong = pos.type === 'Long'
                const isFlashed = flashedRows.has(pos.market)
                const isSelected = selectedRow === pos.market
                const rowClasses = [
                  'pos-row',
                  isFlashed ? 'pos-row-flash' : '',
                  isSelected ? 'pos-row-selected' : '',
                ].filter(Boolean).join(' ')

                return (
                  <tr
                    key={pos.market}
                    className={rowClasses}
                    onClick={() => handleRowClick(pos.market)}
                  >
                    {visibleColumns.map((col) => {
                      const val = pos[col.key]

                      // Market column: colored by Long/Short
                      if (col.key === 'market') {
                        return (
                          <td
                            key={col.key}
                            className={`pos-td pos-align-${col.align} ${isLong ? 'pos-market-long' : 'pos-market-short'}`}
                          >
                            {val}
                          </td>
                        )
                      }

                      // Type column: badge
                      if (col.key === 'type') {
                        return (
                          <td key={col.key} className={`pos-td pos-align-${col.align}`}>
                            <span className={`pos-type-badge ${isLong ? 'pos-type-long' : 'pos-type-short'}`}>
                              {val}
                            </span>
                          </td>
                        )
                      }

                      // Unrealized column: colored by positive/negative
                      if (col.key === 'unrealized') {
                        const pnlClass = val >= 0 ? 'text-win' : 'text-loss'
                        return (
                          <td key={col.key} className={`pos-td pos-align-${col.align} ${pnlClass}`}>
                            ${val.toFixed(2)}
                          </td>
                        )
                      }

                      // Numeric columns
                      if (col.numeric) {
                        return (
                          <td key={col.key} className={`pos-td pos-align-${col.align}`}>
                            ${typeof val === 'number' ? val.toFixed(2) : val}
                          </td>
                        )
                      }

                      // Default
                      return (
                        <td key={col.key} className={`pos-td pos-align-${col.align}`}>
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

      {/* Settings panel */}
      {showSettings && (
        <PositionsSettings
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(Positions)
