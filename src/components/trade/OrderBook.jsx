import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import OrderBookSettings from './OrderBookSettings'
import {
  getAllOrders,
  getOpenOrders,
  getRecentFills,
  getPositionSummaries,
  cancelOrder,
  on,
  ORDER_STATUS,
} from '../../services/omsService'
import { subscribeToLink, unsubscribeFromLink, getColorGroup } from '../../services/linkBus'
import './OrderBook.css'

const LS_KEY_PREFIX = 'order-book-settings-'

const DEFAULT_SETTINGS = {
  refreshInterval: 2,
  maxFills: 50,
  flashOnFill: true,
  showCancelled: false,
}

const TABS = [
  { key: 'orders', label: 'Open Orders' },
  { key: 'fills', label: 'Fills' },
  { key: 'positions', label: 'Positions' },
]

const ORDER_COLUMNS = [
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'side', label: 'Side', align: 'center' },
  { key: 'type', label: 'Type', align: 'center' },
  { key: 'price', label: 'Price', align: 'right', numeric: true },
  { key: 'count', label: 'Qty', align: 'right', numeric: true },
  { key: 'filledCount', label: 'Filled', align: 'right', numeric: true },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'center' },
]

const FILL_COLUMNS = [
  { key: 'time', label: 'Time', align: 'left' },
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'side', label: 'Side', align: 'center' },
  { key: 'price', label: 'Price', align: 'right', numeric: true },
  { key: 'count', label: 'Qty', align: 'right', numeric: true },
]

const POSITION_COLUMNS = [
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'side', label: 'Side', align: 'center' },
  { key: 'contracts', label: 'Contracts', align: 'right', numeric: true },
  { key: 'avgPrice', label: 'Avg Price', align: 'right', numeric: true },
  { key: 'unrealized', label: 'Unrealized', align: 'right', numeric: true },
  { key: 'total', label: 'Total P&L', align: 'right', numeric: true },
]

const STATUS_CLASS = {
  [ORDER_STATUS.PENDING]: 'ob-status-pending',
  [ORDER_STATUS.SUBMITTED]: 'ob-status-submitted',
  [ORDER_STATUS.OPEN]: 'ob-status-open',
  [ORDER_STATUS.PARTIAL]: 'ob-status-partial',
  [ORDER_STATUS.FILLED]: 'ob-status-filled',
  [ORDER_STATUS.CANCELLED]: 'ob-status-cancelled',
  [ORDER_STATUS.REJECTED]: 'ob-status-rejected',
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

function formatTime(ts) {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function formatCents(cents) {
  if (cents == null) return '--'
  return (cents / 100).toFixed(2)
}

function formatPnl(cents) {
  if (cents == null) return '--'
  const val = (cents / 100).toFixed(2)
  return cents >= 0 ? `+$${val}` : `-$${Math.abs(cents / 100).toFixed(2)}`
}

function OrderBook({ windowId }) {
  const [activeTab, setActiveTab] = useState('orders')
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [orders, setOrders] = useState([])
  const [fills, setFills] = useState([])
  const [positions, setPositions] = useState([])
  const [flashedFills, setFlashedFills] = useState(new Set())
  const [linkedTicker, setLinkedTicker] = useState(null)
  const [cancellingIds, setCancellingIds] = useState(new Set())
  const intervalRef = useRef(null)

  const gridOrders = useGridCustomization('order-book-orders-' + windowId, ORDER_COLUMNS)
  const gridFills = useGridCustomization('order-book-fills-' + windowId, FILL_COLUMNS)
  const gridPositions = useGridCustomization('order-book-positions-' + windowId, POSITION_COLUMNS)

  const activeGrid = activeTab === 'orders' ? gridOrders : activeTab === 'fills' ? gridFills : gridPositions

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  // Refresh data from omsService
  const refreshData = useCallback(() => {
    const allOrders = settings.showCancelled
      ? getAllOrders()
      : getAllOrders().filter(
          (o) => o.status !== ORDER_STATUS.CANCELLED && o.status !== ORDER_STATUS.REJECTED
        )
    setOrders(allOrders)
    setFills(getRecentFills(settings.maxFills))
    setPositions(getPositionSummaries({}))
  }, [settings.showCancelled, settings.maxFills])

  // Auto-refresh interval
  useEffect(() => {
    refreshData()
    intervalRef.current = setInterval(refreshData, settings.refreshInterval * 1000)
    return () => clearInterval(intervalRef.current)
  }, [settings.refreshInterval, refreshData])

  // Subscribe to omsService events for real-time updates
  useEffect(() => {
    const unsubs = []

    unsubs.push(on('order:created', refreshData))
    unsubs.push(on('order:updated', refreshData))
    unsubs.push(on('order:filled', refreshData))
    unsubs.push(on('order:cancelled', refreshData))
    unsubs.push(on('order:rejected', refreshData))
    unsubs.push(on('position:updated', refreshData))
    unsubs.push(on('sync:complete', refreshData))

    unsubs.push(
      on('fill', (fill) => {
        refreshData()
        if (settings.flashOnFill && fill) {
          const fillKey = fill.fillId || Date.now()
          setFlashedFills((prev) => new Set(prev).add(fillKey))
          setTimeout(() => {
            setFlashedFills((prev) => {
              const next = new Set(prev)
              next.delete(fillKey)
              return next
            })
          }, 600)
        }
      })
    )

    return () => unsubs.forEach((fn) => fn())
  }, [refreshData, settings.flashOnFill])

  // linkBus: receive ticker context
  useEffect(() => {
    const colorId = getColorGroup(windowId)
    if (!colorId) return
    const handler = ({ ticker }) => setLinkedTicker(ticker)
    subscribeToLink(colorId, handler, windowId)
    return () => unsubscribeFromLink(colorId, handler)
  }, [windowId])

  // Cancel order handler
  const handleCancel = useCallback(async (orderId) => {
    setCancellingIds((prev) => new Set(prev).add(orderId))
    try {
      await cancelOrder(orderId)
    } catch {
      // error will be reflected in order status via events
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }, [])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
  }, [])

  // Filter orders by linked ticker if set
  const displayOrders = linkedTicker
    ? orders.filter((o) => o.ticker === linkedTicker)
    : orders

  const openOrders = displayOrders.filter(
    (o) =>
      o.status !== ORDER_STATUS.FILLED &&
      o.status !== ORDER_STATUS.CANCELLED &&
      o.status !== ORDER_STATUS.REJECTED
  )

  const displayFills = linkedTicker
    ? fills.filter((f) => f.ticker === linkedTicker)
    : fills

  const displayPositions = linkedTicker
    ? positions.filter((p) => p.ticker === linkedTicker)
    : positions

  return (
    <div className={`order-book ob--font-${activeGrid.fontSize}`}>
      {/* Tab bar */}
      <div className="ob-tab-bar">
        <div className="ob-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ob-tab ${activeTab === tab.key ? 'ob-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'orders' && openOrders.length > 0 && (
                <span className="ob-tab-badge">{openOrders.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="ob-tab-actions">
          {linkedTicker && (
            <span className="ob-linked-ticker">{linkedTicker}</span>
          )}
          <button
            className="ob-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Order Book Settings"
          >
            &#9881;
          </button>
        </div>
      </div>

      {/* Tab panels */}
      <div
        className="ob-panel"
        style={{
          ...(activeGrid.bgColor && { backgroundColor: activeGrid.bgColor }),
          ...(activeGrid.textColor && { color: activeGrid.textColor }),
        }}
      >
        {activeTab === 'orders' && (
          <OrdersPanel
            orders={settings.showCancelled ? displayOrders : openOrders}
            grid={gridOrders}
            cancellingIds={cancellingIds}
            onCancel={handleCancel}
          />
        )}

        {activeTab === 'fills' && (
          <FillsPanel
            fills={displayFills}
            grid={gridFills}
            flashedFills={flashedFills}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsPanel
            positions={displayPositions}
            grid={gridPositions}
          />
        )}
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <OrderBookSettings
          settings={settings}
          grid={activeGrid}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function OrdersPanel({ orders, grid, cancellingIds, onCancel }) {
  if (orders.length === 0) {
    return <div className="ob-empty">No orders</div>
  }

  return (
    <table className="ob-table">
      <thead>
        <tr>
          {grid.visibleColumns.map((col, idx) => (
            <th
              key={col.key}
              className={`ob-th ob-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => grid.onDragStart(idx)}
              onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
              onDragEnd={grid.onDragEnd}
              style={{ width: col.width || 'auto', cursor: 'grab' }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const visibleKeys = new Set(grid.visibleColumns.map((c) => c.key))
          const isCancelling = cancellingIds.has(order.clientOrderId)
          const statusClass = STATUS_CLASS[order.status] || ''

          return (
            <tr key={order.clientOrderId} className="ob-row" style={{ height: grid.rowHeight }}>
              {visibleKeys.has('ticker') && (
                <td className="ob-td ob-align-left">{order.ticker}</td>
              )}
              {visibleKeys.has('side') && (
                <td className={`ob-td ob-align-center ob-side-${order.side}`}>
                  {order.side?.toUpperCase()}
                </td>
              )}
              {visibleKeys.has('type') && (
                <td className="ob-td ob-align-center">{order.type}</td>
              )}
              {visibleKeys.has('price') && (
                <td className="ob-td ob-align-right">{formatCents(order.price)}</td>
              )}
              {visibleKeys.has('count') && (
                <td className="ob-td ob-align-right">{order.count}</td>
              )}
              {visibleKeys.has('filledCount') && (
                <td className="ob-td ob-align-right">{order.filledCount || 0}</td>
              )}
              {visibleKeys.has('status') && (
                <td className="ob-td ob-align-center">
                  <span className={`ob-status-badge ${statusClass}`}>
                    {order.status}
                  </span>
                </td>
              )}
              {visibleKeys.has('actions') && (
                <td className="ob-td ob-align-center">
                  {order.status !== ORDER_STATUS.FILLED &&
                   order.status !== ORDER_STATUS.CANCELLED &&
                   order.status !== ORDER_STATUS.REJECTED && (
                    <button
                      className="ob-cancel-btn"
                      onClick={() => onCancel(order.clientOrderId)}
                      disabled={isCancelling}
                      title="Cancel order"
                    >
                      {isCancelling ? '...' : 'Cancel'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function FillsPanel({ fills, grid, flashedFills }) {
  if (fills.length === 0) {
    return <div className="ob-empty">No fills</div>
  }

  return (
    <table className="ob-table">
      <thead>
        <tr>
          {grid.visibleColumns.map((col, idx) => (
            <th
              key={col.key}
              className={`ob-th ob-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => grid.onDragStart(idx)}
              onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
              onDragEnd={grid.onDragEnd}
              style={{ width: col.width || 'auto', cursor: 'grab' }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fills.map((fill, i) => {
          const visibleKeys = new Set(grid.visibleColumns.map((c) => c.key))
          const isFlashed = flashedFills.has(fill.fillId)
          const rowClass = `ob-row ${isFlashed ? 'ob-row-flash' : ''}`

          return (
            <tr key={fill.fillId || i} className={rowClass} style={{ height: grid.rowHeight }}>
              {visibleKeys.has('time') && (
                <td className="ob-td ob-align-left ob-time">{formatTime(fill.timestamp)}</td>
              )}
              {visibleKeys.has('ticker') && (
                <td className="ob-td ob-align-left">{fill.ticker || '--'}</td>
              )}
              {visibleKeys.has('side') && (
                <td className={`ob-td ob-align-center ob-side-${fill.side || 'yes'}`}>
                  {(fill.side || '--').toUpperCase()}
                </td>
              )}
              {visibleKeys.has('price') && (
                <td className="ob-td ob-align-right">{formatCents(fill.price)}</td>
              )}
              {visibleKeys.has('count') && (
                <td className="ob-td ob-align-right">{fill.count}</td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function PositionsPanel({ positions, grid }) {
  if (positions.length === 0) {
    return <div className="ob-empty">No positions</div>
  }

  return (
    <table className="ob-table">
      <thead>
        <tr>
          {grid.visibleColumns.map((col, idx) => (
            <th
              key={col.key}
              className={`ob-th ob-align-${col.align}${grid.dragState.dragging && grid.dragState.overIndex === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => grid.onDragStart(idx)}
              onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx) }}
              onDragEnd={grid.onDragEnd}
              style={{ width: col.width || 'auto', cursor: 'grab' }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {positions.map((pos) => {
          const visibleKeys = new Set(grid.visibleColumns.map((c) => c.key))
          const key = `${pos.ticker}:${pos.side}`

          return (
            <tr key={key} className="ob-row" style={{ height: grid.rowHeight }}>
              {visibleKeys.has('ticker') && (
                <td className="ob-td ob-align-left">{pos.ticker}</td>
              )}
              {visibleKeys.has('side') && (
                <td className={`ob-td ob-align-center ob-side-${pos.side}`}>
                  {pos.side?.toUpperCase()}
                </td>
              )}
              {visibleKeys.has('contracts') && (
                <td className="ob-td ob-align-right">{pos.contracts}</td>
              )}
              {visibleKeys.has('avgPrice') && (
                <td className="ob-td ob-align-right">{formatCents(pos.avgPrice)}</td>
              )}
              {visibleKeys.has('unrealized') && (
                <td className={`ob-td ob-align-right ${pos.unrealized >= 0 ? 'text-win' : 'text-loss'}`}>
                  {formatPnl(pos.unrealized)}
                </td>
              )}
              {visibleKeys.has('total') && (
                <td className={`ob-td ob-align-right ${pos.total >= 0 ? 'text-win' : 'text-loss'}`}>
                  {formatPnl(pos.total)}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default React.memo(OrderBook)
