import React, { useState } from 'react'
import GridSettingsPanel from '../GridSettingsPanel'
import '../GridSettingsPanel.css'

function OrderBookSettings({ settings, grid, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="obs-overlay" onClick={onClose}>
      <div className="obs-panel" onClick={(e) => e.stopPropagation()}>
        <div className="obs-header">
          <span>Order Book Settings</span>
          <button className="obs-close" onClick={onClose}>&times;</button>
        </div>
        <div className="obs-body">
          <GridSettingsPanel {...grid} />

          <div className="obs-divider" />

          <div className="obs-row">
            <label>Auto-Refresh (s)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={local.refreshInterval}
              onChange={(e) => update('refreshInterval', Math.max(1, Math.min(10, Number(e.target.value))))}
            />
          </div>
          <div className="obs-row">
            <label>Max Fills Displayed</label>
            <input
              type="number"
              min="10"
              max="100"
              step="10"
              value={local.maxFills}
              onChange={(e) => update('maxFills', Math.max(10, Math.min(100, Number(e.target.value))))}
            />
          </div>
          <div className="obs-row">
            <label>Flash on Fill</label>
            <input
              type="checkbox"
              checked={local.flashOnFill}
              onChange={(e) => update('flashOnFill', e.target.checked)}
            />
          </div>
          <div className="obs-row">
            <label>Show Cancelled Orders</label>
            <input
              type="checkbox"
              checked={local.showCancelled}
              onChange={(e) => update('showCancelled', e.target.checked)}
            />
          </div>
        </div>
        <div className="obs-footer">
          <button className="obs-btn obs-btn-save" onClick={handleSave}>Save</button>
          <button className="obs-btn obs-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const style = document.createElement('style')
style.textContent = `
.obs-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.obs-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 320px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.obs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.obs-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.obs-close:hover {
  color: var(--text-primary);
}

.obs-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.obs-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.obs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.obs-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.obs-row input[type="number"] {
  width: 90px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.obs-row input[type="number"]:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.obs-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.obs-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.obs-btn {
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

.obs-btn:hover {
  opacity: 0.85;
}

.obs-btn-save {
  background: var(--accent-win);
  color: #000;
}

.obs-btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
`
if (!document.querySelector('[data-order-book-settings-style]')) {
  style.setAttribute('data-order-book-settings-style', '')
  document.head.appendChild(style)
}

export default OrderBookSettings
