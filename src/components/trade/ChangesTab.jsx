import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getChanges, subscribeToChanges } from '../../services/changeTrackingService'
import './ChangesTab.css'

const STATUS_LABELS = {
  implemented: 'Implemented',
  stub: 'Stub',
  pending: 'Pending',
  'needs-manual-intervention': 'Needs Intervention',
}

const DOMAINS = ['all', 'trade', 'scanners', 'services', 'ui/theme']
const STATUSES = ['all', 'implemented', 'stub', 'pending', 'needs-manual-intervention']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

const AUTO_REFRESH_INTERVAL = 30000 // 30s

function formatRelativeTime(iso) {
  if (!iso) return ''
  const delta = Date.now() - new Date(iso).getTime()
  if (delta < 60000) return `${Math.floor(delta / 1000)}s ago`
  if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`
  if (delta < 86400000) return `${Math.floor(delta / 3600000)}h ago`
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${h}:${m}`
}

function ChangesTab() {
  const [changes, setChanges] = useState(() => getChanges())
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDomain, setFilterDomain] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [expandedDiffs, setExpandedDiffs] = useState(new Set())
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [, forceUpdate] = useState(0)
  const tooltipRef = useRef(null)

  // Subscribe to live changes
  useEffect(() => {
    const unsubscribe = subscribeToChanges(() => {
      setChanges(getChanges())
    })
    return unsubscribe
  }, [])

  // Auto-refresh every 30s for relative timestamps
  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), AUTO_REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = useCallback(() => {
    setChanges(getChanges())
  }, [])

  const toggleDiff = useCallback((id) => {
    setExpandedDiffs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleCard = useCallback((id) => {
    setExpandedCards((prev) => {
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
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.source && c.source.toLowerCase().includes(q)) ||
        (c.domain && c.domain.toLowerCase().includes(q)) ||
        (c.filePath && c.filePath.toLowerCase().includes(q)) ||
        (c.functionName && c.functionName.toLowerCase().includes(q))
    )
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
    pending: changes.filter((c) => c.status === 'pending').length,
    'needs-manual-intervention': changes.filter((c) => c.status === 'needs-manual-intervention').length,
  }

  return (
    <div className="changes-tab">
      {/* Header */}
      <div className="ct-header-bar">
        <span className="ct-title">CHANGES LOG</span>
        <div className="ct-header-right">
          <span className="ct-count">{sorted.length} entries</span>
          <button className="ct-refresh-btn" onClick={handleRefresh} title="Refresh">
            ↻
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="ct-search-bar">
        <input
          className="ct-search-input"
          type="text"
          placeholder="Search changes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                {s === 'all'
                  ? `All Status (${statusCounts.all})`
                  : `${STATUS_LABELS[s] || s} (${statusCounts[s] || 0})`}
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
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Change entries */}
      <div className="ct-entries" ref={tooltipRef}>
        {sorted.length === 0 ? (
          <div className="ct-empty">
            {changes.length === 0 ? 'No changes logged yet' : 'No changes match filters'}
          </div>
        ) : (
          sorted.map((change) => {
            const isCardExpanded = expandedCards.has(change.id)
            const isDiffExpanded = expandedDiffs.has(change.id)
            const hasDiff = change.diffBefore || change.diffAfter
            const statusLabel = STATUS_LABELS[change.status] || change.status || 'Unknown'
            const statusClass = change.status
              ? `ct-badge--${change.status}`
              : 'ct-badge--pending'

            return (
              <div key={change.id} className="ct-card">
                {/* Top row: badge, domain, timestamp */}
                <div className="ct-card-row">
                  <span className={`ct-badge ${statusClass}`}>{statusLabel}</span>
                  {change.domain && (
                    <span className="ct-domain">{change.domain}</span>
                  )}
                  <span className="ct-timestamp">{formatRelativeTime(change.timestamp)}</span>
                </div>

                {/* Description */}
                <div className="ct-card-desc">{change.description || '(no description)'}</div>

                {/* Metadata row */}
                <div className="ct-card-meta">
                  <span className="ct-source">
                    {change.source || (change.filePath ? change.filePath : '')}
                    {change.functionName ? ` › ${change.functionName}` : ''}
                  </span>
                  <div className="ct-card-actions">
                    <button
                      className="ct-expand-btn"
                      onClick={() => toggleCard(change.id)}
                      title={isCardExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isCardExpanded ? '▲ Details' : '▼ Details'}
                    </button>
                    {hasDiff && (
                      <button
                        className="ct-diff-toggle"
                        onClick={() => toggleDiff(change.id)}
                      >
                        {isDiffExpanded ? 'Hide Diff' : 'Show Diff'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isCardExpanded && (
                  <div className="ct-detail-panel">
                    {change.tooltip && (
                      <div className="ct-detail-row">
                        <span className="ct-detail-label">Reasoning:</span>
                        <span className="ct-detail-value">{change.tooltip}</span>
                      </div>
                    )}
                    {change.filePath && (
                      <div className="ct-detail-row">
                        <span className="ct-detail-label">File:</span>
                        <span className="ct-detail-value ct-detail-file">{change.filePath}</span>
                      </div>
                    )}
                    {change.functionName && (
                      <div className="ct-detail-row">
                        <span className="ct-detail-label">Function:</span>
                        <span className="ct-detail-value ct-detail-file">{change.functionName}</span>
                      </div>
                    )}
                    {change.sourceUrl && (
                      <div className="ct-detail-row">
                        <span className="ct-detail-label">URL:</span>
                        <span className="ct-detail-value">{change.sourceUrl}</span>
                      </div>
                    )}
                    <div className="ct-detail-row">
                      <span className="ct-detail-label">ID:</span>
                      <span className="ct-detail-value ct-detail-id">{change.id}</span>
                    </div>
                    <div className="ct-detail-row">
                      <span className="ct-detail-label">Time:</span>
                      <span className="ct-detail-value">
                        {change.timestamp ? new Date(change.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Diff view */}
                {isDiffExpanded && hasDiff && (
                  <div className="ct-diff">
                    {change.diffBefore != null && (
                      <div className="ct-diff-section">
                        <span className="ct-diff-label ct-diff-label--before">Before</span>
                        <pre className="ct-diff-code ct-diff-code--before">{change.diffBefore}</pre>
                      </div>
                    )}
                    {change.diffAfter != null && (
                      <div className="ct-diff-section">
                        <span className="ct-diff-label ct-diff-label--after">After</span>
                        <pre className="ct-diff-code ct-diff-code--after">{change.diffAfter}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default React.memo(ChangesTab)
