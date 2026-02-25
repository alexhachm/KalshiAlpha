import React, { useState } from 'react'

const FONT_SIZES = ['small', 'medium', 'large']
const CLICK_ACTIONS = [
  { value: 'limit', label: 'Place Limit Order' },
  { value: 'select', label: 'Select Price Only' },
]

function PriceLadderSettings({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="pls-overlay" onClick={onClose}>
      <div className="pls-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pls-header">
          <span>Price Ladder Settings</span>
          <button className="pls-close" onClick={onClose}>&times;</button>
        </div>
        <div className="pls-body">
          <div className="pls-row">
            <label>Visible Levels</label>
            <input
              type="number"
              min="5"
              max="99"
              value={local.visibleLevels}
              onChange={(e) => update('visibleLevels', Math.max(5, Math.min(99, Number(e.target.value))))}
            />
          </div>
          <div className="pls-row">
            <label>Center on Trade</label>
            <input
              type="checkbox"
              checked={local.centerOnTrade}
              onChange={(e) => update('centerOnTrade', e.target.checked)}
            />
          </div>
          <div className="pls-row">
            <label>Flash Duration (ms)</label>
            <input
              type="number"
              min="0"
              max="2000"
              step="50"
              value={local.flashDuration}
              onChange={(e) => update('flashDuration', Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="pls-row">
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
          <div className="pls-row">
            <label>Show Volume Bars</label>
            <input
              type="checkbox"
              checked={local.showVolumeBars}
              onChange={(e) => update('showVolumeBars', e.target.checked)}
            />
          </div>
          <div className="pls-row">
            <label>Show Working Orders</label>
            <input
              type="checkbox"
              checked={local.showWorkingOrders}
              onChange={(e) => update('showWorkingOrders', e.target.checked)}
            />
          </div>
          <div className="pls-row">
            <label>Click Action</label>
            <select
              value={local.clickAction}
              onChange={(e) => update('clickAction', e.target.value)}
            >
              {CLICK_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div className="pls-row">
            <label>Default Size</label>
            <input
              type="number"
              min="1"
              value={local.defaultSize}
              onChange={(e) => update('defaultSize', Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>
        <div className="pls-footer">
          <button className="pls-btn pls-btn-save" onClick={handleSave}>Save</button>
          <button className="pls-btn pls-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* Inline styles — uses same CSS vars as rest of app */
const style = document.createElement('style')
style.textContent = `
.pls-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.pls-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 280px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.pls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.pls-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.pls-close:hover {
  color: var(--text-primary);
}

.pls-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.pls-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.pls-row input[type="number"],
.pls-row select {
  width: 100px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.pls-row input[type="number"]:focus,
.pls-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.pls-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.pls-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.pls-btn {
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

.pls-btn:hover {
  opacity: 0.85;
}

.pls-btn-save {
  background: var(--accent-win);
  color: #000;
}

.pls-btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
`
if (!document.querySelector('[data-pl-settings-style]')) {
  style.setAttribute('data-pl-settings-style', '')
  document.head.appendChild(style)
}

export default PriceLadderSettings
