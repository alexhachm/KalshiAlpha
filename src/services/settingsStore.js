// Settings Store — localStorage-backed settings with defaults
// Single source of truth for all global settings

const LS_KEY = 'kalshi_settings'

const DEFAULTS = {
  // Connection
  connection: {
    apiKey: '',
    paperMode: true,
    wsReconnectInterval: 5,
    wsMaxRetries: 10,
  },
  // Appearance
  appearance: {
    theme: 'dark',
    accentColor: '#00d2ff',
    fontFamily: 'Inter',
    fontSize: 13,
    windowOpacity: 100,
  },
  // Trading
  trading: {
    defaultOrderSize: 1,
    confirmOrders: true,
    soundAlerts: true,
    autoCancelOnDisconnect: false,
  },
  // Color Coordination (reads/writes linkBus state too)
  colorCoordination: {
    linkingEnabled: true,
  },
  // Windows
  windows: {
    snapDistance: 10,
    mergeBehavior: 'tab',
    savedLayouts: [],
  },
  // Notifications
  notifications: {
    desktopNotifications: false,
    soundAlerts: true,
    notifyOnFill: true,
    notifyOnCancel: false,
    notifyOnConnection: true,
    notifyOnError: true,
  },
}

let _settings = null
const _listeners = new Set()

function load() {
  if (_settings) return _settings
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Deep merge with defaults so new keys are always present
      _settings = deepMerge(DEFAULTS, parsed)
    } else {
      _settings = structuredClone(DEFAULTS)
    }
  } catch {
    _settings = structuredClone(DEFAULTS)
  }
  return _settings
}

function save(settings) {
  _settings = settings
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings))
  } catch {
    // quota exceeded or unavailable
  }
  _listeners.forEach((fn) => fn(settings))
}

function get() {
  return load()
}

function update(section, key, value) {
  const s = load()
  if (s[section]) {
    s[section] = { ...s[section], [key]: value }
  }
  save({ ...s })
}

function updateSection(section, partial) {
  const s = load()
  s[section] = { ...s[section], ...partial }
  save({ ...s })
}

function subscribe(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

function reset() {
  _settings = structuredClone(DEFAULTS)
  save(_settings)
}

function deepMerge(defaults, overrides) {
  const result = { ...defaults }
  for (const key of Object.keys(defaults)) {
    if (key in overrides) {
      if (
        typeof defaults[key] === 'object' &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key]) &&
        typeof overrides[key] === 'object' &&
        overrides[key] !== null
      ) {
        result[key] = deepMerge(defaults[key], overrides[key])
      } else {
        result[key] = overrides[key]
      }
    }
  }
  return result
}

// Initialize on import
load()

export { DEFAULTS, get, update, updateSection, subscribe, reset, save }
