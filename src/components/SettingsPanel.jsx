import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  LINK_COLORS,
  isLinkingEnabled,
  setLinkingEnabled,
} from '../services/linkBus'
import './SettingsPanel.css'

function SettingsPanel({ isOpen, onClose }) {
  const [linkingOn, setLinkingOn] = useState(isLinkingEnabled)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Sync state when panel opens
  useEffect(() => {
    if (isOpen) setLinkingOn(isLinkingEnabled())
  }, [isOpen])

  const handleToggleLinking = () => {
    const next = !linkingOn
    setLinkingOn(next)
    setLinkingEnabled(next)
  }

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          {/* Color Coordination */}
          <section className="settings-section">
            <h3 className="settings-section-title">Color Coordination</h3>
            <div className="settings-row">
              <span className="settings-label">Enable window linking</span>
              <button
                className={`settings-toggle ${linkingOn ? 'settings-toggle--on' : ''}`}
                onClick={handleToggleLinking}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Link colors</span>
              <div className="settings-color-swatches">
                {LINK_COLORS.map((c) => (
                  <div
                    key={c.id}
                    className="settings-swatch"
                    style={{ backgroundColor: c.hex }}
                    title={c.id}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <p className="settings-placeholder">
              Theme, font size, and accent color options coming soon.
            </p>
          </section>

          {/* Trading */}
          <section className="settings-section">
            <h3 className="settings-section-title">Trading</h3>
            <p className="settings-placeholder">
              Default order size, confirmation, and sound alert options coming
              soon.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
