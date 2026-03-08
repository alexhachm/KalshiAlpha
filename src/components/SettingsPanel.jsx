import React, { useState, useEffect, useCallback } from 'react'
import { X, Wifi, Palette, BarChart3, Link2, Layout, Bell, Eye, EyeOff, RotateCcw } from 'lucide-react'
import {
  LINK_COLORS,
  isLinkingEnabled,
  setLinkingEnabled,
} from '../services/linkBus'
import {
  get as getSettings,
  update as updateSetting,
  reset as resetSettings,
  subscribe as subscribeSettings,
} from '../services/settingsStore'
import './SettingsPanel.css'

const TABS = [
  { id: 'connection', label: 'Connection', icon: Wifi },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'trading', label: 'Trading', icon: BarChart3 },
  { id: 'color', label: 'Color Linking', icon: Link2 },
  { id: 'windows', label: 'Windows', icon: Layout },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const FONT_OPTIONS = ['Inter', 'Roboto Mono', 'SF Mono', 'Consolas', 'system-ui']
const THEME_OPTIONS = [{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]
const MERGE_OPTIONS = [
  { value: 'tab', label: 'Tabbed' },
  { value: 'stack', label: 'Stacked' },
  { value: 'disabled', label: 'Disabled' },
]

const CONNECTION_STATUS_LABELS = {
  mock: 'Mock mode (no credentials)',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
}

// --- Reusable controls ---

function Toggle({ value, onChange }) {
  return (
    <button
      className={`settings-toggle ${value ? 'settings-toggle--on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className="settings-toggle-knob" />
    </button>
  )
}

function NumberInput({ value, onChange, min, max, step = 1 }) {
  const handleChange = (e) => {
    let v = Number(e.target.value)
    if (min != null && v < min) v = min
    if (max != null && v > max) v = max
    onChange(v)
  }
  return (
    <input
      type="number"
      className="settings-number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select className="settings-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
  )
}

function Row({ label, children, description }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <span className="settings-label" title={description || undefined}>{label}</span>
        {description && <span className="settings-desc">{description}</span>}
      </div>
      <div className="settings-row-right">{children}</div>
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="settings-password">
      <input
        type={visible ? 'text' : 'password'}
        className="settings-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button className="settings-eye-btn" onClick={() => setVisible(!visible)} title={visible ? 'Hide' : 'Show'}>
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

// --- Sections ---

function ConnectionSection({ settings, onUpdate, connectionStatus = 'mock' }) {
  const conn = settings.connection
  const normalizedStatus = CONNECTION_STATUS_LABELS[connectionStatus] ? connectionStatus : 'disconnected'
  return (
    <>
      <Row label="Runtime status" description="Current live data-feed state">
        <span className="settings-label">{CONNECTION_STATUS_LABELS[normalizedStatus]}</span>
      </Row>
      <Row label="API Key" description="Kalshi API key for authentication">
        <PasswordInput
          value={conn.apiKey}
          onChange={(v) => onUpdate('connection', 'apiKey', v)}
          placeholder="Enter API key..."
        />
      </Row>
      <Row label="Paper mode" description="Use paper trading (no real money)">
        <Toggle value={conn.paperMode} onChange={(v) => onUpdate('connection', 'paperMode', v)} />
      </Row>
      <Row label="WebSocket URL" description="Custom WS endpoint (leave blank for default)">
        <input
          type="text"
          className="settings-text-input"
          value={conn.wsUrl}
          onChange={(e) => onUpdate('connection', 'wsUrl', e.target.value)}
          placeholder={conn.paperMode ? 'wss://demo-api.kalshi.co/trade-api/ws/v2' : 'wss://api.elections.kalshi.com/trade-api/ws/v2'}
        />
      </Row>
      <Row label="Reconnect interval" description="Seconds between WebSocket reconnect attempts">
        <NumberInput value={conn.wsReconnectInterval} onChange={(v) => onUpdate('connection', 'wsReconnectInterval', v)} min={1} max={60} />
      </Row>
      <Row label="Max retries" description="Maximum WebSocket reconnection attempts">
        <NumberInput value={conn.wsMaxRetries} onChange={(v) => onUpdate('connection', 'wsMaxRetries', v)} min={1} max={100} />
      </Row>
    </>
  )
}

function AppearanceSection({ settings, onUpdate }) {
  const app = settings.appearance
  return (
    <>
      <Row label="Theme">
        <Select value={app.theme} onChange={(v) => onUpdate('appearance', 'theme', v)} options={THEME_OPTIONS} />
      </Row>
      <Row label="Accent color">
        <input type="color" className="settings-color-picker" value={app.accentColor} onChange={(e) => onUpdate('appearance', 'accentColor', e.target.value)} />
      </Row>
      <Row label="Font family">
        <Select value={app.fontFamily} onChange={(v) => onUpdate('appearance', 'fontFamily', v)} options={FONT_OPTIONS} />
      </Row>
      <Row label="Font size" description="Base font size in pixels">
        <NumberInput value={app.fontSize} onChange={(v) => onUpdate('appearance', 'fontSize', v)} min={10} max={20} />
      </Row>
      <Row label="Window opacity" description="0-100%">
        <div className="settings-slider-row">
          <input type="range" className="settings-slider" min={30} max={100} value={app.windowOpacity} onChange={(e) => onUpdate('appearance', 'windowOpacity', Number(e.target.value))} />
          <span className="settings-slider-value">{app.windowOpacity}%</span>
        </div>
      </Row>
    </>
  )
}

function TradingSection({ settings, onUpdate }) {
  const t = settings.trading
  return (
    <>
      <Row label="Default order size" description="Contracts per order">
        <NumberInput value={t.defaultOrderSize} onChange={(v) => onUpdate('trading', 'defaultOrderSize', v)} min={1} max={10000} />
      </Row>
      <Row label="Confirm orders" description="Show confirmation dialog before sending">
        <Toggle value={t.confirmOrders} onChange={(v) => onUpdate('trading', 'confirmOrders', v)} />
      </Row>
      <Row label="Sound alerts" description="Play sounds on fills and cancels">
        <Toggle value={t.soundAlerts} onChange={(v) => onUpdate('trading', 'soundAlerts', v)} />
      </Row>
      <Row label="Auto-cancel on disconnect" description="Cancel open orders when connection drops">
        <Toggle value={t.autoCancelOnDisconnect} onChange={(v) => onUpdate('trading', 'autoCancelOnDisconnect', v)} />
      </Row>
    </>
  )
}

function ColorSection() {
  const [linkingOn, setLinkingOn] = useState(() => isLinkingEnabled())

  const handleToggle = (val) => {
    setLinkingOn(val)
    setLinkingEnabled(val)
  }

  return (
    <>
      <Row label="Enable window linking" description="Sync market selection across linked windows">
        <Toggle value={linkingOn} onChange={handleToggle} />
      </Row>
      <Row label="Link group colors" description="Available color groups for window linking">
        <div className="settings-color-swatches">
          {LINK_COLORS.map((c) => (
            <div key={c.id} className="settings-swatch" style={{ backgroundColor: c.hex }} title={c.id} />
          ))}
        </div>
      </Row>
    </>
  )
}

function WindowsSection({ settings, onUpdate }) {
  const w = settings.windows
  return (
    <>
      <Row label="Snap distance" description="Pixels to trigger window snapping">
        <NumberInput value={w.snapDistance} onChange={(v) => onUpdate('windows', 'snapDistance', v)} min={0} max={50} />
      </Row>
      <Row label="Merge behavior" description="How windows combine when dragged together">
        <Select value={w.mergeBehavior} onChange={(v) => onUpdate('windows', 'mergeBehavior', v)} options={MERGE_OPTIONS} />
      </Row>
    </>
  )
}

function NotificationsSection({ settings, onUpdate }) {
  const n = settings.notifications
  return (
    <>
      <Row label="Desktop notifications" description="Show OS-level notifications">
        <Toggle value={n.desktopNotifications} onChange={(v) => onUpdate('notifications', 'desktopNotifications', v)} />
      </Row>
      <Row label="Sound alerts" description="Play audio for notification events">
        <Toggle value={n.soundAlerts} onChange={(v) => onUpdate('notifications', 'soundAlerts', v)} />
      </Row>
      <div className="settings-sub-header">Notify on:</div>
      <Row label="Order fills">
        <Toggle value={n.notifyOnFill} onChange={(v) => onUpdate('notifications', 'notifyOnFill', v)} />
      </Row>
      <Row label="Order cancels">
        <Toggle value={n.notifyOnCancel} onChange={(v) => onUpdate('notifications', 'notifyOnCancel', v)} />
      </Row>
      <Row label="Connection changes">
        <Toggle value={n.notifyOnConnection} onChange={(v) => onUpdate('notifications', 'notifyOnConnection', v)} />
      </Row>
      <Row label="Errors">
        <Toggle value={n.notifyOnError} onChange={(v) => onUpdate('notifications', 'notifyOnError', v)} />
      </Row>
    </>
  )
}

const SECTIONS = {
  connection: ConnectionSection,
  appearance: AppearanceSection,
  trading: TradingSection,
  color: ColorSection,
  windows: WindowsSection,
  notifications: NotificationsSection,
}

// --- Main Settings Panel ---

function SettingsPanel({ isOpen, onClose, connectionStatus = 'mock' }) {
  const [activeTab, setActiveTab] = useState('connection')
  const [settings, setSettings] = useState(() => getSettings())

  useEffect(() => subscribeSettings((next) => setSettings(next)), [])

  useEffect(() => {
    if (isOpen) setSettings(getSettings())
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleUpdate = useCallback((section, key, value) => {
    updateSetting(section, key, value)
  }, [])

  const handleReset = useCallback(() => {
    resetSettings()
  }, [])

  if (!isOpen) return null

  const SectionComponent = SECTIONS[activeTab]

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <div className="settings-header-actions">
            <button className="settings-reset-btn" onClick={handleReset} title="Reset to defaults">
              <RotateCcw size={14} />
            </button>
            <button className="settings-close" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="settings-content">
          <nav className="settings-sidebar">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="settings-body">
            <h3 className="settings-section-title">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h3>
            {SectionComponent && (
              <SectionComponent
                settings={settings}
                onUpdate={handleUpdate}
                connectionStatus={connectionStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
