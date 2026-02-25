import React, { useState } from 'react'

const FONT_SIZES = ['small', 'medium', 'large']

function MontageSettings({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="mt-settings-overlay" onClick={onClose}>
      <div className="mt-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mt-settings-header">
          <span>Montage Settings</span>
          <button className="mt-settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="mt-settings-body">
          <div className="mt-settings-row">
            <label>Default Order Size</label>
            <input
              type="number"
              min="1"
              value={local.defaultOrderSize}
              onChange={(e) => update('defaultOrderSize', Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div className="mt-settings-row">
            <label>Confirm Before Send</label>
            <input
              type="checkbox"
              checked={local.confirmBeforeSend}
              onChange={(e) => update('confirmBeforeSend', e.target.checked)}
            />
          </div>
          <div className="mt-settings-row">
            <label>Sound Alerts</label>
            <input
              type="checkbox"
              checked={local.soundAlerts}
              onChange={(e) => update('soundAlerts', e.target.checked)}
            />
          </div>
          <div className="mt-settings-row">
            <label>Depth Levels</label>
            <input
              type="number"
              min="1"
              max="10"
              value={local.depthLevels}
              onChange={(e) => update('depthLevels', Math.max(1, Math.min(10, Number(e.target.value))))}
            />
          </div>
          <div className="mt-settings-row">
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
          <div className="mt-settings-row">
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
          <div className="mt-settings-row">
            <label>Show Working Orders</label>
            <input
              type="checkbox"
              checked={local.showWorkingOrders}
              onChange={(e) => update('showWorkingOrders', e.target.checked)}
            />
          </div>
        </div>
        <div className="mt-settings-footer">
          <button className="mt-btn mt-btn-buy-yes" onClick={handleSave}>Save</button>
          <button className="mt-btn mt-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* Inline styles to keep settings self-contained — uses same CSS vars */
const style = document.createElement('style')
style.textContent = `
.mt-settings-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.mt-settings-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 280px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.mt-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.mt-settings-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.mt-settings-close:hover {
  color: var(--text-primary);
}

.mt-settings-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mt-settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.mt-settings-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.mt-settings-row input[type="number"],
.mt-settings-row select {
  width: 80px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.mt-settings-row input[type="number"]:focus,
.mt-settings-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.mt-settings-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.mt-settings-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}
`
if (!document.querySelector('[data-montage-settings-style]')) {
  style.setAttribute('data-montage-settings-style', '')
  document.head.appendChild(style)
}

export default MontageSettings
