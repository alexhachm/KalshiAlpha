import React, { useState } from 'react'

const COLUMN_LABELS = {
  market:     'Market',
  account:    'Account',
  shares:     'Shares',
  avgCost:    'Avg Cost',
  realized:   'Realized',
  unrealized: 'Unrealized',
  type:       'Type',
  status:     'Status',
  date:       'Date',
}

const SORT_OPTIONS = [
  { value: 'date',       label: 'Date' },
  { value: 'market',     label: 'Market' },
  { value: 'shares',     label: 'Shares' },
  { value: 'avgCost',    label: 'Avg Cost' },
  { value: 'realized',   label: 'Realized P&L' },
  { value: 'unrealized', label: 'Unrealized P&L' },
  { value: 'type',       label: 'Type' },
]

const FILTER_OPTIONS = [
  { value: 'all',    label: 'All Positions' },
  { value: 'open',   label: 'Open Only' },
  { value: 'closed', label: 'Closed Only' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'all',   label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d',    label: 'Last 7 Days' },
  { value: '30d',   label: 'Last 30 Days' },
]

const FONT_SIZES = ['small', 'medium', 'large']

function TradeLogSettings({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({
    ...settings,
    columns: { ...settings.columns },
  })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const toggleColumn = (colKey) => {
    setLocal((prev) => ({
      ...prev,
      columns: { ...prev.columns, [colKey]: !prev.columns[colKey] },
    }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="tls-overlay" onClick={onClose}>
      <div className="tls-panel" onClick={(e) => e.stopPropagation()}>
        <div className="tls-header">
          <span>Trade Log Settings</span>
          <button className="tls-close" onClick={onClose}>&times;</button>
        </div>

        <div className="tls-body">
          <div className="tls-section-label">Visible Columns</div>
          {Object.entries(COLUMN_LABELS).map(([key, label]) => (
            <div key={key} className="tls-row">
              <label>{label}</label>
              <input
                type="checkbox"
                checked={local.columns[key] ?? true}
                onChange={() => toggleColumn(key)}
              />
            </div>
          ))}

          <div className="tls-divider" />

          <div className="tls-section-label">Filter</div>
          <div className="tls-row">
            <label>Show</label>
            <select value={local.filter} onChange={(e) => update('filter', e.target.value)}>
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="tls-row">
            <label>Date Range</label>
            <select value={local.dateRange} onChange={(e) => update('dateRange', e.target.value)}>
              {DATE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="tls-divider" />

          <div className="tls-section-label">Sorting</div>
          <div className="tls-row">
            <label>Sort By</label>
            <select value={local.sortBy} onChange={(e) => update('sortBy', e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="tls-row">
            <label>Direction</label>
            <select value={local.sortDirection} onChange={(e) => update('sortDirection', e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="tls-divider" />

          <div className="tls-row">
            <label>Auto-Refresh (s)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={local.refreshInterval}
              onChange={(e) => update('refreshInterval', Math.max(1, Math.min(60, Number(e.target.value))))}
            />
          </div>

          <div className="tls-row">
            <label>Font Size</label>
            <select value={local.fontSize} onChange={(e) => update('fontSize', e.target.value)}>
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="tls-row">
            <label>Flash on Change</label>
            <input
              type="checkbox"
              checked={local.flashOnChange}
              onChange={(e) => update('flashOnChange', e.target.checked)}
            />
          </div>
        </div>

        <div className="tls-footer">
          <button className="tls-btn-save" onClick={handleSave}>Save</button>
          <button className="tls-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const style = document.createElement('style')
style.textContent = `
.tls-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.tls-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 290px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.tls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.tls-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.tls-close:hover { color: var(--text-primary); }

.tls-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tls-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding-bottom: 2px;
}

.tls-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.tls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.tls-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.tls-row input[type="number"],
.tls-row select {
  width: 90px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.tls-row input[type="number"]:focus,
.tls-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.tls-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.tls-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.tls-btn-save {
  flex: 1;
  padding: 6px 8px;
  border: none;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: var(--accent-win);
  color: #000;
  transition: opacity 0.15s;
}

.tls-btn-save:hover { opacity: 0.85; }

.tls-btn-cancel {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  transition: opacity 0.15s;
}

.tls-btn-cancel:hover { opacity: 0.85; }
`
if (!document.querySelector('[data-tradelog-settings-style]')) {
  style.setAttribute('data-tradelog-settings-style', '')
  document.head.appendChild(style)
}

export default TradeLogSettings
