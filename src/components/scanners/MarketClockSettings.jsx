import React, { useState } from 'react'

function MarketClockSettings({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="mcs-overlay" onClick={onClose}>
      <div className="mcs-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mcs-header">
          <span>Clock Settings</span>
          <button className="mcs-close" onClick={onClose}>&times;</button>
        </div>
        <div className="mcs-body">
          <div className="mcs-row">
            <label>Timezone</label>
            <select
              value={local.timezone}
              onChange={(e) => update('timezone', e.target.value)}
            >
              <option value="local">Local</option>
              <option value="utc">UTC</option>
            </select>
          </div>
          <div className="mcs-row">
            <label>Milliseconds</label>
            <input
              type="checkbox"
              checked={local.showMilliseconds}
              onChange={(e) => update('showMilliseconds', e.target.checked)}
            />
          </div>
          <div className="mcs-row">
            <label>Show Date</label>
            <input
              type="checkbox"
              checked={local.showDate}
              onChange={(e) => update('showDate', e.target.checked)}
            />
          </div>
          <div className="mcs-row">
            <label>Font Size</label>
            <input
              type="range"
              min={16}
              max={64}
              value={local.fontSize}
              onChange={(e) => update('fontSize', Number(e.target.value))}
            />
            <span className="mcs-font-val">{local.fontSize}px</span>
          </div>
        </div>
        <div className="mcs-footer">
          <button className="mcs-btn mcs-btn-save" onClick={handleSave}>Save</button>
          <button className="mcs-btn mcs-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* Inline styles — uses same CSS vars as rest of app */
const style = document.createElement('style')
style.textContent = `
.mcs-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.mcs-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 260px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.mcs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.mcs-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.mcs-close:hover {
  color: var(--text-primary);
}

.mcs-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mcs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.mcs-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.mcs-row select {
  width: 80px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.mcs-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.mcs-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.mcs-row input[type="range"] {
  flex: 1;
  accent-color: var(--accent-highlight);
  height: 14px;
  margin: 0 6px;
}

.mcs-font-val {
  color: var(--text-secondary);
  font-size: 10px;
  min-width: 28px;
  text-align: right;
  font-family: var(--font-mono);
}

.mcs-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.mcs-btn {
  flex: 1;
  padding: 6px 0;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--font-sans);
  cursor: pointer;
}

.mcs-btn-save {
  background: var(--accent-highlight);
  color: #fff;
  border-color: var(--accent-highlight);
}

.mcs-btn-save:hover {
  filter: brightness(1.1);
}

.mcs-btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.mcs-btn-cancel:hover {
  color: var(--text-primary);
  background: var(--bg-primary);
}
`
if (!document.querySelector('[data-market-clock-settings-style]')) {
  style.setAttribute('data-market-clock-settings-style', '')
  document.head.appendChild(style)
}

export default MarketClockSettings
