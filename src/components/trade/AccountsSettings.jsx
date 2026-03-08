import React, { useState } from 'react'
import GridSettingsPanel from '../GridSettingsPanel'
import '../GridSettingsPanel.css'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'

function AccountsSettings({ settings, grid, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })
  const { dialogProps } = useDialogFocusTrap(true, onClose, { ariaLabel: 'Accounts Settings' })

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="acct-settings-overlay" onClick={onClose}>
      <div className="acct-settings-panel" {...dialogProps} onClick={(e) => e.stopPropagation()}>
        <div className="acct-settings-header">
          <span>Accounts Settings</span>
          <button className="acct-settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="acct-settings-body">
          <GridSettingsPanel {...grid} />

          <div className="acct-settings-divider" />

          <div className="acct-settings-row">
            <label>Decimal Precision</label>
            <select
              value={local.decimalPrecision}
              onChange={(e) => update('decimalPrecision', Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="acct-settings-row">
            <label>Refresh Interval (s)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={local.refreshInterval}
              onChange={(e) => update('refreshInterval', Math.max(1, Math.min(60, Number(e.target.value))))}
            />
          </div>
        </div>
        <div className="acct-settings-footer">
          <button className="acct-btn-save" onClick={handleSave}>Save</button>
          <button className="acct-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* Inline styles */
const style = document.createElement('style')
style.textContent = `
.acct-settings-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.acct-settings-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 320px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.acct-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.acct-settings-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.acct-settings-close:hover {
  color: var(--text-primary);
}

.acct-settings-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acct-settings-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.acct-settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.acct-settings-row label {
  flex: 1;
  font-family: var(--font-sans);
}

.acct-settings-row input[type="number"],
.acct-settings-row select {
  width: 80px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.acct-settings-row input[type="number"]:focus,
.acct-settings-row select:focus {
  outline: none;
  border-color: var(--accent-highlight);
}

.acct-settings-row input[type="checkbox"] {
  accent-color: var(--accent-highlight);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.acct-settings-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.acct-btn-save {
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

.acct-btn-save:hover {
  opacity: 0.85;
}

.acct-btn-cancel {
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

.acct-btn-cancel:hover {
  opacity: 0.85;
}
`
if (!document.querySelector('[data-accounts-settings-style]')) {
  style.setAttribute('data-accounts-settings-style', '')
  document.head.appendChild(style)
}

export default AccountsSettings
