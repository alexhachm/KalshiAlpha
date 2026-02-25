import React, { useState } from 'react'

const FONT_SIZES = ['small', 'medium', 'large']

function EventLogSettings({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="el-settings-overlay" onClick={onClose}>
      <div className="el-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="el-settings-header">
          <span>Event Log Settings</span>
          <button className="el-settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="el-settings-body">
          <div className="el-settings-row">
            <label>Log Level Filter</label>
            <select
              value={local.logLevel}
              onChange={(e) => update('logLevel', e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="info">Info+</option>
              <option value="warn">Warn+</option>
              <option value="error">Error Only</option>
            </select>
          </div>
          <div className="el-settings-row">
            <label>Max Lines</label>
            <input
              type="number"
              min="50"
              max="5000"
              step="50"
              value={local.maxLines}
              onChange={(e) => update('maxLines', Math.max(50, Math.min(5000, Number(e.target.value))))}
            />
          </div>
          <div className="el-settings-row">
            <label>Auto-Scroll</label>
            <input
              type="checkbox"
              checked={local.autoScroll}
              onChange={(e) => update('autoScroll', e.target.checked)}
            />
          </div>
          <div className="el-settings-row">
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
        </div>
        <div className="el-settings-footer">
          <button className="el-btn el-btn-save" onClick={handleSave}>Save</button>
          <button className="el-btn el-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* Inline styles — follows MontageSettings pattern */
const style = document.createElement('style')
style.textContent = `
.el-settings-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.el-settings-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 280px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.el-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.el-settings-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.el-settings-close:hover {
  color: var(--text-primary);
}

.el-settings-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.el-settings-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.el-settings-row input[type="number"],
.el-settings-row select {
  width: 90px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.el-settings-row input[type="number"]:focus,
.el-settings-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.el-settings-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.el-settings-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.el-btn {
  flex: 1;
  padding: 6px 8px;
  border: none;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.el-btn:hover {
  opacity: 0.85;
}

.el-btn-save {
  background: var(--accent-win);
  color: #000;
}

.el-btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
`
if (!document.querySelector('[data-event-log-settings-style]')) {
  style.setAttribute('data-event-log-settings-style', '')
  document.head.appendChild(style)
}

export default EventLogSettings
