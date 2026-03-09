import React from 'react'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'

function ChartSettings({ settings, onUpdate, onClose, availableTickers }) {
  const { dialogProps } = useDialogFocusTrap(true, onClose, { ariaLabel: 'Chart Settings' })
  const toggleOverlayTicker = (t) => {
    const current = settings.overlayTickers || []
    if (current.includes(t)) {
      onUpdate('overlayTickers', current.filter((x) => x !== t))
    } else {
      onUpdate('overlayTickers', [...current, t])
    }
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
            checked={settings.showGrid}
            onChange={(e) => onUpdate('showGrid', e.target.checked)}
          />
        </label>
        <label className="chart-setting-row">
          <span>Volume</span>
          <input
            type="checkbox"
            checked={settings.showVolume}
            disabled={settings.overlayMode}
            onChange={(e) => onUpdate('showVolume', e.target.checked)}
          />
        </label>
        <label className="chart-setting-row">
          <span>Crosshair</span>
          <select
            value={settings.crosshairStyle}
            onChange={(e) => onUpdate('crosshairStyle', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="magnet">Magnet</option>
          </select>
        </label>
        <label className="chart-setting-row">
          <span>Up Color</span>
          <input
            type="color"
            value={settings.upColor}
            onChange={(e) => onUpdate('upColor', e.target.value)}
          />
        </label>
        <label className="chart-setting-row">
          <span>Down Color</span>
          <input
            type="color"
            value={settings.downColor}
            onChange={(e) => onUpdate('downColor', e.target.value)}
          />
        </label>

        <div className="chart-settings-divider" />

        <label className="chart-setting-row">
          <span>Overlay Mode</span>
          <input
            type="checkbox"
            checked={settings.overlayMode}
            onChange={(e) => onUpdate('overlayMode', e.target.checked)}
          />
        </label>
        {settings.overlayMode && (
          <div className="chart-overlay-tickers">
            <span className="chart-setting-label">Compare Markets</span>
            {availableTickers.map((t) => (
              <label key={t} className="chart-overlay-ticker-row">
                <input
                  type="checkbox"
                  checked={(settings.overlayTickers || []).includes(t)}
                  onChange={() => toggleOverlayTicker(t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartSettings
