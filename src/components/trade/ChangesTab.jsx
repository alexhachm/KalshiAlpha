import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getChanges, subscribeToChanges } from '../../services/changeTrackingService'
import './ChangesTab.css'

const STATUS_LABELS = {
  implemented: 'Implemented',
  stub: 'Stub',
  'needs-manual-intervention': 'Needs Intervention',
}

const DOMAINS = ['all', 'trade', 'scanners', 'services', 'ui/theme']
const STATUSES = ['all', 'implemented', 'stub', 'needs-manual-intervention']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

function formatTimestamp(iso) {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}/${day} ${h}:${m}:${s}`
}

function ChangesTab() {
  const [changes, setChanges] = useState(() => getChanges())
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDomain, setFilterDomain] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [expandedDiffs, setExpandedDiffs] = useState(new Set())
  const [tooltipId, setTooltipId] = useState(null)
  const tooltipRef = useRef(null)
  const tooltipTimerRef = useRef(null)

  // Subscribe to live changes
  useEffect(() => {
    const unsubscribe = subscribeToChanges((newChange) => {
      setChanges((prev) => [newChange, ...prev])
    })
    return unsubscribe
  }, [])

  // Close tooltip on click outside
  useEffect(() => {
    if (!tooltipId) return
    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltipId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [tooltipId])

  const handleMouseEnter = useCallback((id) => {
    tooltipTimerRef.current = setTimeout(() => setTooltipId(id), 400)
  }, [])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(tooltipTimerRef.current)
    setTooltipId(null)
  }, [])

  const toggleDiff = useCallback((id) => {
    setExpandedDiffs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Filter
  let filtered = changes
  if (filterStatus !== 'all') {
    filtered = filtered.filter((c) => c.status === filterStatus)
  }
  if (filterDomain !== 'all') {
    filtered = filtered.filter((c) => c.domain === filterDomain)
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime()
    const tb = new Date(b.timestamp).getTime()
    return sortOrder === 'newest' ? tb - ta : ta - tb
  })

  // Counts
  const statusCounts = {
    all: changes.length,
    implemented: changes.filter((c) => c.status === 'implemented').length,
    stub: changes.filter((c) => c.status === 'stub').length,
    'needs-manual-intervention': changes.filter((c) => c.status === 'needs-manual-intervention').length,
  }

  return (
    <div className="changes-tab">
      {/* Header */}
      <div className="ct-header-bar">
        <span className="ct-title">CHANGES</span>
        <span className="ct-count">{sorted.length} entries</span>
      </div>

      {/* Filter/Sort controls */}
      <div className="ct-toolbar">
        <div className="ct-toolbar-left">
          <select
            className="ct-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? `All Status (${statusCounts.all})` : `${STATUS_LABELS[s]} (${statusCounts[s]})`}
              </option>
            ))}
          </select>
          <select
            className="ct-select"
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Domains' : d}
              </option>
            ))}
          </select>
        </div>
        <div className="ct-toolbar-right">
          <select
            className="ct-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Change entries */}
      <div className="ct-entries">
        {sorted.length === 0 ? (
          <div className="ct-empty">No changes match filters</div>
        ) : (
          sorted.map((change) => (
            <div
              key={change.id}
              className="ct-card"
              onMouseEnter={() => handleMouseEnter(change.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="ct-card-row">
                <span className={`ct-badge ct-badge--${change.status}`}>
                  {STATUS_LABELS[change.status]}
                </span>
                <span className="ct-domain">{change.domain}</span>
                <span className="ct-timestamp">{formatTimestamp(change.timestamp)}</span>
              </div>
              <div className="ct-card-desc">{change.description}</div>
              <div className="ct-card-meta">
                <span className="ct-source">{change.source}</span>
                <button
                  className="ct-diff-toggle"
                  onClick={() => toggleDiff(change.id)}
                >
                  {expandedDiffs.has(change.id) ? 'Hide Diff' : 'Show Diff'}
                </button>
              </div>

              {/* Diff view */}
              {expandedDiffs.has(change.id) && (
                <div className="ct-diff">
                  <div className="ct-diff-section">
                    <span className="ct-diff-label ct-diff-label--before">Before</span>
                    <pre className="ct-diff-code ct-diff-code--before">{change.before}</pre>
                  </div>
                  <div className="ct-diff-section">
                    <span className="ct-diff-label ct-diff-label--after">After</span>
                    <pre className="ct-diff-code ct-diff-code--after">{change.after}</pre>
                  </div>
                </div>
              )}

              {/* Tooltip */}
              {tooltipId === change.id && (
                <div className="ct-tooltip" ref={tooltipRef}>
                  <div className="ct-tooltip-row">
                    <span className="ct-tooltip-label">ID:</span>
                    <span className="ct-tooltip-value">{change.id}</span>
                  </div>
                  <div className="ct-tooltip-row">
                    <span className="ct-tooltip-label">Description:</span>
                    <span className="ct-tooltip-value">{change.description}</span>
                  </div>
                  <div className="ct-tooltip-row">
                    <span className="ct-tooltip-label">Domain:</span>
                    <span className="ct-tooltip-value">{change.domain}</span>
                  </div>
                  <div className="ct-tooltip-row">
                    <span className="ct-tooltip-label">Source:</span>
                    <span className="ct-tooltip-value">{change.source}</span>
                  </div>
                  <div className="ct-tooltip-row">
                    <span className="ct-tooltip-label">Status:</span>
                    <span className="ct-tooltip-value">{STATUS_LABELS[change.status]}</span>
                  </div>
                  <div className="ct-tooltip-row">
                    <span className="ct-tooltip-label">Files:</span>
                    <span className="ct-tooltip-value ct-tooltip-files">
                      {change.files.join(', ')}
                    </span>
                  </div>
                  {change.sourceUrl && (
                    <div className="ct-tooltip-row">
                      <span className="ct-tooltip-label">URL:</span>
                      <span className="ct-tooltip-value">{change.sourceUrl}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default React.memo(ChangesTab)
