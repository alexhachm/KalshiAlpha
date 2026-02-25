import React, { useState } from 'react'

const COLUMN_LABELS = {
  market: 'Market',
  account: 'Account',
  shares: 'Shares',
  avgCost: 'Avg Cost',
  realized: 'Realized',
  unrealized: 'Unrealized',
  type: 'Type',
}

const SORT_OPTIONS = [
  { value: 'market', label: 'Market' },
  { value: 'shares', label: 'Shares' },
  { value: 'avgCost', label: 'Avg Cost' },
  { value: 'unrealized', label: 'Unrealized P&L' },
  { value: 'type', label: 'Type' },
]

const FONT_SIZES = ['small', 'medium', 'large']

function PositionsSettings({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings, columns: { ...settings.columns } })

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
    <div className="pos-settings-overlay" onClick={onClose}>
      <div className="pos-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pos-settings-header">
          <span>Positions Settings</span>
          <button className="pos-settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="pos-settings-body">
          <div className="pos-settings-section-label">Visible Columns</div>
          {Object.keys(COLUMN_LABELS).map((key) => (
            <div key={key} className="pos-settings-row">
              <label>{COLUMN_LABELS[key]}</label>
              <input
                type="checkbox"
                checked={local.columns[key]}
                onChange={() => toggleColumn(key)}
              />
            </div>
          ))}

          <div className="pos-settings-divider" />

          <div className="pos-settings-section-label">Sorting</div>
          <div className="pos-settings-row">
            <label>Sort By</label>
            <select
              value={local.sortBy}
              onChange={(e) => update('sortBy', e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="pos-settings-row">
            <label>Sort Direction</label>
            <select
              value={local.sortDirection}
              onChange={(e) => update('sortDirection', e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="pos-settings-divider" />

          <div className="pos-settings-row">
            <label>Auto-Refresh (s)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={local.refreshInterval}
              onChange={(e) => update('refreshInterval', Math.max(1, Math.min(60, Number(e.target.value))))}
            />
          </div>

          <div className="pos-settings-row">
            <label>Font Size</label>
            <select
              value={local.fontSize}
              onChange={(e) => update('fontSize', e.target.value)}
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="pos-settings-row">
            <label>Flash on Change</label>
            <input
              type="checkbox"
              checked={local.flashOnChange}
              onChange={(e) => update('flashOnChange', e.target.checked)}
            />
          </div>
        </div>
        <div className="pos-settings-footer">
          <button className="pos-btn-save" onClick={handleSave}>Save</button>
          <button className="pos-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* Inline styles — same pattern as AccountsSettings */
const style = document.createElement('style')
style.textContent = `
.pos-settings-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.pos-settings-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 280px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.pos-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.pos-settings-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.pos-settings-close:hover {
  color: var(--text-primary);
}

.pos-settings-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pos-settings-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding-bottom: 2px;
}

.pos-settings-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.pos-settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.pos-settings-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.pos-settings-row input[type="number"],
.pos-settings-row select {
  width: 80px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.pos-settings-row input[type="number"]:focus,
.pos-settings-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.pos-settings-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.pos-settings-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.pos-btn-save {
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

.pos-btn-save:hover {
  opacity: 0.85;
}

.pos-btn-cancel {
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

.pos-btn-cancel:hover {
  opacity: 0.85;
}
`
if (!document.querySelector('[data-positions-settings-style]')) {
  style.setAttribute('data-positions-settings-style', '')
  document.head.appendChild(style)
}

export default PositionsSettings
