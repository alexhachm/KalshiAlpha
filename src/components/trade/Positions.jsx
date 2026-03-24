import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import PositionsSettings from './PositionsSettings'
import { getPositionSummaries, on, submitOrder } from '../../services/omsService'
import { emitLinkedMarket, subscribeToLink, unsubscribeFromLink, getColorGroup } from '../../services/linkBus'
import './Positions.css'

const LS_KEY_PREFIX = 'positions-settings-'

const DEFAULT_SETTINGS = {
  sortBy: 'unrealized',
  sortDirection: 'desc',
  refreshInterval: 2,
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

/**
 * Map OMS position summaries (cents-based) to display format (dollar-based).
 * @param {Array} summaries - from omsService.getPositionSummaries()
 * @returns {Array} Display-format positions
 */
function mapOmsPositions(summaries) {
  return summaries.map((pos) => ({
    market: pos.ticker,
    account: 'KA-100482',
    shares: pos.contracts,
    avgCost: +(pos.avgCost / 100).toFixed(2),
    realized: +(pos.realized / 100).toFixed(2),
    unrealized: +(pos.unrealized / 100).toFixed(2),
    type: pos.side === 'yes' ? 'Long' : 'Short',
  }))
}

function fetchPositions() {
  const summaries = getPositionSummaries({})
  return mapOmsPositions(summaries)
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
  const grid = useGridCustomization('positions-' + windowId, COLUMNS)
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [positions, setPositions] = useState(fetchPositions)
  const [selectedRow, setSelectedRow] = useState(null)
  const [flashedRows, setFlashedRows] = useState(new Set())
  const [flattenConfirm, setFlattenConfirm] = useState(false)
  const [flattenProgress, setFlattenProgress] = useState(null)
  const intervalRef = useRef(null)
  const flashTimeoutRef = useRef(null)
  const flattenDismissRef = useRef(null)

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Refresh positions from OMS
  const refreshData = useCallback(() => {
    setPositions((prev) => {
      const newPositions = fetchPositions()

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
          clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = setTimeout(() => setFlashedRows(new Set()), 600)
        }
      }

      return newPositions
    })
  }, [settings.flashOnChange])

  // Periodic refresh on interval
  useEffect(() => {
    intervalRef.current = setInterval(refreshData, settings.refreshInterval * 1000)
    return () => clearInterval(intervalRef.current)
  }, [settings.refreshInterval, refreshData])

  // Subscribe to OMS events for real-time updates
  useEffect(() => {
    const unsubs = []
    unsubs.push(on('order:filled', refreshData))
    unsubs.push(on('position:updated', refreshData))
    unsubs.push(on('sync:complete', refreshData))
    return () => unsubs.forEach((unsub) => unsub())
  }, [refreshData])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(flashTimeoutRef.current)
      clearTimeout(flattenDismissRef.current)
    }
  }, [])

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

  const handleRowClick = useCallback((market) => {
    setSelectedRow(market)
    emitLinkedMarket(windowId, market)
  }, [windowId])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
  }, [])

  const handleFlattenAll = useCallback(async () => {
    const posToFlatten = positions.filter((p) => p.shares > 0)
    if (posToFlatten.length === 0) return

    setFlattenConfirm(false)
    setFlattenProgress({ total: posToFlatten.length, completed: 0, failed: 0, results: [] })

    await Promise.all(posToFlatten.map(async (pos) => {
      const side = pos.type === 'Long' ? 'yes' : 'no'
      try {
        await submitOrder({
          ticker: pos.market,
          side,
          action: 'sell',
          type: 'market',
          count: pos.shares,
        })
        setFlattenProgress((prev) => prev ? {
          ...prev,
          completed: prev.completed + 1,
          results: [...prev.results, { market: pos.market, success: true }],
        } : prev)
      } catch (err) {
        setFlattenProgress((prev) => prev ? {
          ...prev,
          failed: prev.failed + 1,
          results: [...prev.results, { market: pos.market, success: false, error: err.message }],
        } : prev)
      }
    }))

    clearTimeout(flattenDismissRef.current)
    flattenDismissRef.current = setTimeout(() => setFlattenProgress(null), 3000)
  }, [positions])

  // Sort positions — memoized
  const sortedPositions = useMemo(() => {
    const result = [...positions]
    const sortKey = settings.sortBy
    const sortDir = settings.sortDirection
    if (sortKey) {
      result.sort((a, b) => {
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
    return result
  }, [positions, settings.sortBy, settings.sortDirection])

  // Total P&L summary — memoized
  const totalPnl = useMemo(() => ({
    unrealized: positions.reduce((sum, p) => sum + p.unrealized, 0),
    realized: positions.reduce((sum, p) => sum + p.realized, 0),
    totalShares: positions.reduce((sum, p) => sum + p.shares, 0),
  }), [positions])

  const handleSort = useCallback((colKey) => {
    setSettings((prev) => ({
      ...prev,
      sortBy: colKey,
      sortDirection: prev.sortBy === colKey
        ? (prev.sortDirection === 'asc' ? 'desc' : 'asc')
        : 'desc',
    }))
  }, [])

  return (
    <div className={`positions pos--font-${grid.fontSize}`}>
      {/* Header bar */}
      {/* STUB: Position Greeks — calculate delta, gamma, theta for event contract positions */}
      {/* SOURCE: "Event contract pricing models", prediction market theory */}
      {/* IMPLEMENT WHEN: Implied probability and time-to-expiry data available */}
      {/* STEPS: 1. Model binary option delta = dP/dS (sensitivity to underlying) */}
      {/*        2. Compute theta = daily time decay based on expiry date */}
      {/*        3. Add delta and theta columns to position grid */}
      {/*        4. Show portfolio-level aggregate Greeks in header */}

      {/* STUB: Position risk heat map — visual risk concentration display */}
      {/* SOURCE: "Portfolio risk visualization", Bloomberg PORT analytics */}
      {/* IMPLEMENT WHEN: Multiple correlated positions exist */}
      {/* STEPS: 1. Calculate position size as % of total portfolio value */}
      {/*        2. Color-code rows by concentration risk (>20% = red) */}
      {/*        3. Add correlation matrix between positions */}
      {/*        4. Display max drawdown estimate per position */}

      <div className="pos-header-bar">
        <span className="pos-title">Open Positions</span>
        <div className="pos-header-right">
          <span className={`pos-total-pnl ${totalPnl.unrealized >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
            P&L: {totalPnl.unrealized >= 0 ? '+' : '-'}${Math.abs(totalPnl.unrealized).toFixed(2)}
          </span>
          <span className="pos-count">{positions.length} open</span>
          {positions.length > 0 && (
            <button
              className="pos-flatten-btn"
              onClick={() => setFlattenConfirm(true)}
              disabled={flattenProgress !== null}
              title="Close all open positions at market"
            >
              Flatten All
            </button>
          )}
          <button
            className="pos-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Positions Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      {/* Flatten All — confirmation dialog */}
      {flattenConfirm && (
        <div className="pos-flatten-overlay">
          <div className="pos-flatten-dialog">
            <div className="pos-flatten-dialog-title">Flatten All Positions</div>
            <div className="pos-flatten-dialog-body">
              Submit market sell orders for{' '}
              <strong>{positions.length}</strong> position{positions.length !== 1 ? 's' : ''}{' '}
              (<strong>{totalPnl.totalShares}</strong> total contracts).
              This cannot be undone.
            </div>
            <div className="pos-flatten-dialog-actions">
              <button className="pos-flatten-cancel-btn" onClick={() => setFlattenConfirm(false)}>
                Cancel
              </button>
              <button className="pos-flatten-confirm-btn" onClick={handleFlattenAll}>
                Confirm Flatten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flatten All — progress indicator */}
      {flattenProgress !== null && (
        <div className="pos-flatten-progress">
          <div className="pos-flatten-progress-header">
            Flattening {flattenProgress.completed + flattenProgress.failed}/{flattenProgress.total}
            {flattenProgress.failed > 0 && (
              <span className="pos-flatten-progress-errors"> ({flattenProgress.failed} failed)</span>
            )}
          </div>
          {flattenProgress.results.map((r) => (
            <div
              key={r.market}
              className={`pos-flatten-result ${r.success ? 'pos-flatten-ok' : 'pos-flatten-err'}`}
            >
              {r.success ? '\u2713' : '\u2717'} {r.market}
              {!r.success && <span className="pos-flatten-err-msg"> — {r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="pos-table-wrap" style={{ ...(grid.bgColor && { backgroundColor: grid.bgColor }), ...(grid.textColor && { color: grid.textColor }) }}>
        <table className="pos-table">
          <thead>
            <tr>
              {grid.visibleColumns.map((col, idx) => (
                <th
                  key={col.key}
                  className={`pos-th pos-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === idx ? ' drag-over' : ''}`}
                  onClick={() => handleSort(col.key)}
                  draggable
                  onDragStart={() => grid.onDragStart(idx)}
                  onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
                  onDragEnd={grid.onDragEnd}
                  style={{ width: col.width || 'auto', cursor: 'grab' }}
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
                <td colSpan={grid.visibleColumns.length} className="pos-empty">
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
                    style={{ height: grid.rowHeight, ...grid.getRowStyle(pos) }}
                  >
                    {grid.visibleColumns.map((col) => {
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

                      // Unrealized column: colored by positive/negative/zero with +/- prefix
                      if (col.key === 'unrealized') {
                        const pnlClass = val > 0 ? 'pnl-positive' : val < 0 ? 'pnl-negative' : 'pnl-zero'
                        const prefix = val > 0 ? '+$' : val < 0 ? '-$' : '$'
                        return (
                          <td key={col.key} className={`pos-td pos-align-${col.align} ${pnlClass}`}>
                            {prefix}{Math.abs(val).toFixed(2)}
                          </td>
                        )
                      }

                      // Realized column: same P&L color coding
                      if (col.key === 'realized') {
                        const pnlClass = val > 0 ? 'pnl-positive' : val < 0 ? 'pnl-negative' : 'pnl-zero'
                        const prefix = val > 0 ? '+$' : val < 0 ? '-$' : '$'
                        return (
                          <td key={col.key} className={`pos-td pos-align-${col.align} ${pnlClass}`}>
                            {prefix}{Math.abs(val).toFixed(2)}
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
          grid={grid}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default React.memo(Positions)
