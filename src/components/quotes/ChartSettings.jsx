import React, { useState } from 'react'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'

function ChartSettings({ settings, onSave, onClose, availableTickers }) {
  const [draft, setDraft] = useState(() => ({ ...settings }))
  const { dialogProps } = useDialogFocusTrap(true, onClose, { ariaLabel: 'Chart Settings' })

  const updateDraft = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const toggleOverlayTicker = (t) => {
    const current = draft.overlayTickers || []
    if (current.includes(t)) {
      updateDraft('overlayTickers', current.filter((x) => x !== t))
    } else {
      updateDraft('overlayTickers', [...current, t])
    }
  }

  const updateIndicator = (idx, key, value) => {
    const indicators = [...(draft.indicators || [])]
    indicators[idx] = { ...indicators[idx], [key]: value }
    updateDraft('indicators', indicators)
  }

  const handleSave = () => {
    onSave(draft)
  }

  return (
    <div className="chart-settings-panel" {...dialogProps}>
      <div className="chart-settings-header">
        <span>Chart Settings</span>
        <button className="chart-settings-close" onClick={onClose}>x</button>
      </div>
      <div className="chart-settings-body">
        <label className="chart-setting-row">
          <span>Grid Lines</span>
          <input
            type="checkbox"
            checked={draft.showGrid}
            onChange={(e) => updateDraft('showGrid', e.target.checked)}
          />
        </label>
        <label className="chart-setting-row">
          <span>Volume</span>
          <input
            type="checkbox"
            checked={draft.showVolume}
            disabled={draft.overlayMode}
            onChange={(e) => updateDraft('showVolume', e.target.checked)}
          />
        </label>
        <label className="chart-setting-row">
          <span>Crosshair</span>
          <select
            value={draft.crosshairStyle}
            onChange={(e) => updateDraft('crosshairStyle', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="magnet">Magnet</option>
          </select>
        </label>
        <label className="chart-setting-row">
          <span>Up Color</span>
          <input
            type="color"
            value={draft.upColor}
            onChange={(e) => updateDraft('upColor', e.target.value)}
          />
        </label>
        <label className="chart-setting-row">
          <span>Down Color</span>
          <input
            type="color"
            value={draft.downColor}
            onChange={(e) => updateDraft('downColor', e.target.value)}
          />
        </label>

        <div className="chart-settings-divider" />

        <label className="chart-setting-row">
          <span>Overlay Mode</span>
          <input
            type="checkbox"
            checked={draft.overlayMode}
            onChange={(e) => updateDraft('overlayMode', e.target.checked)}
          />
        </label>
        {draft.overlayMode && (
          <div className="chart-overlay-tickers">
            <span className="chart-setting-label">Compare Markets</span>
            {availableTickers.map((t) => (
              <label key={t} className="chart-overlay-ticker-row">
                <input
                  type="checkbox"
                  checked={(draft.overlayTickers || []).includes(t)}
                  onChange={() => toggleOverlayTicker(t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        )}

        <div className="chart-settings-divider" />

        <span className="chart-setting-label">Indicators</span>
        {(draft.indicators || []).map((ind, idx) => (
          <div key={idx} className="chart-indicator-block">
            <label className="chart-setting-row">
              <span>{ind.type}</span>
              <input
                type="checkbox"
                checked={ind.enabled}
                onChange={(e) => updateIndicator(idx, 'enabled', e.target.checked)}
              />
            </label>
            <label className="chart-setting-row">
              <span>Period</span>
              <input
                type="number"
                min="2"
                max="200"
                value={ind.period}
                className="chart-indicator-period"
                onChange={(e) => updateIndicator(idx, 'period', Math.max(2, parseInt(e.target.value, 10) || 20))}
              />
            </label>
            <label className="chart-setting-row">
              <span>Color</span>
              <input
                type="color"
                value={ind.color}
                onChange={(e) => updateIndicator(idx, 'color', e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="chart-settings-footer">
        <button className="chart-settings-cancel-btn" onClick={onClose}>Cancel</button>
        <button className="chart-settings-save-btn" onClick={handleSave}>Save</button>
      </div>
    </div>
  )
}

export default ChartSettings
