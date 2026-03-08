// Settings Store — localStorage-backed settings with defaults
// Single source of truth for all global settings

const LS_KEY = 'kalshi_settings'
const DARK_THEME_CLASS = 'theme-dark'
const LIGHT_THEME_CLASS = 'theme-light'
const FONT_STACKS = {
  Inter: "'Inter', system-ui, -apple-system, sans-serif",
  'Roboto Mono': "'Roboto Mono', 'SF Mono', Consolas, monospace",
  'SF Mono': "'SF Mono', Consolas, monospace",
  Consolas: "Consolas, 'SF Mono', monospace",
  'system-ui': 'system-ui, -apple-system, sans-serif',
}
const THEME_VARIABLES = {
  dark: {
    '--bg-primary': '#0d1117',
    '--bg-secondary': '#161b22',
    '--bg-tertiary': '#1c2128',
    '--bg-hover': '#21262d',
    '--bg-active': '#2a3240',
    '--bg-input': '#0d1117',
    '--bg-row-alt': '#111820',
    '--bg-surface': '#131920',
    '--bg-elevated': '#1e2530',
    '--bg-overlay': 'rgba(1, 4, 9, 0.85)',
    '--text-primary': '#e1e4e8',
    '--text-heading': '#f0f3f6',
    '--text-secondary': '#8b949e',
    '--text-muted': '#484f58',
    '--text-label': '#6e7681',
    '--text-accent': '#d4a017',
    '--border-color': '#1a2233',
    '--border-subtle': '#111827',
    '--border-active': '#2a3a55',
    '--overlay-bg': 'rgba(2, 4, 8, 0.8)',
    '--scrollbar-thumb': '#1e2a3c',
    '--scrollbar-thumb-hover': '#2e3d55',
    '--scrollbar-track': '#0d1117',
    '--context-menu-bg': '#161b22',
    '--context-menu-border': '#1a2233',
  },
  light: {
    '--bg-primary': '#f4f7fb',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#e9eef6',
    '--bg-hover': '#dde6f2',
    '--bg-active': '#cfdbeb',
    '--bg-input': '#ffffff',
    '--bg-row-alt': '#eff4fb',
    '--bg-surface': '#ffffff',
    '--bg-elevated': '#f7faff',
    '--bg-overlay': 'rgba(220, 231, 245, 0.75)',
    '--text-primary': '#1b2430',
    '--text-heading': '#101722',
    '--text-secondary': '#425167',
    '--text-muted': '#6f7f95',
    '--text-label': '#5d6c82',
    '--text-accent': '#9b6f00',
    '--border-color': '#c8d4e6',
    '--border-subtle': '#dce5f2',
    '--border-active': '#aebed5',
    '--overlay-bg': 'rgba(180, 197, 222, 0.45)',
    '--scrollbar-thumb': '#b2c1d6',
    '--scrollbar-thumb-hover': '#8fa4c2',
    '--scrollbar-track': '#ecf2fb',
    '--context-menu-bg': '#ffffff',
    '--context-menu-border': '#c8d4e6',
  },
}
const BASE_FONT_TOKENS = {
  '--font-size-xs': 9.5,
  '--font-size-sm': 10.5,
  '--font-size-md': 11.5,
  '--font-size-lg': 12.5,
  '--font-size-xl': 14,
  '--font-size-data': 12,
  '--font-size-header': 10,
}
const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 20
const MIN_WINDOW_OPACITY = 30
const MAX_WINDOW_OPACITY = 100

const DEFAULTS = {
  // Connection
  connection: {
    apiKey: '',
    paperMode: true,
    wsUrl: '',
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
let _appearanceRuntimeUnsubscribe = null

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

function applyAppearanceSettings(appearanceInput = load().appearance) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const appearance = normalizeAppearance(appearanceInput)
  const themeVars = THEME_VARIABLES[appearance.theme] || THEME_VARIABLES.dark

  root.classList.remove(DARK_THEME_CLASS, LIGHT_THEME_CLASS)
  root.classList.add(appearance.theme === 'light' ? LIGHT_THEME_CLASS : DARK_THEME_CLASS)

  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  root.style.setProperty('--accent-highlight', appearance.accentColor)
  root.style.setProperty('--border-focus', appearance.accentColor)
  root.style.setProperty('--font-sans', toFontStack(appearance.fontFamily))
  root.style.setProperty('--window-opacity', `${appearance.windowOpacity / 100}`)

  const scale = appearance.fontSize / DEFAULTS.appearance.fontSize
  Object.entries(BASE_FONT_TOKENS).forEach(([token, base]) => {
    const nextValue = Math.round(base * scale * 10) / 10
    root.style.setProperty(token, `${nextValue}px`)
  })
}

function initAppearanceRuntime() {
  applyAppearanceSettings(load().appearance)

  if (_appearanceRuntimeUnsubscribe) return _appearanceRuntimeUnsubscribe

  _appearanceRuntimeUnsubscribe = subscribe((settings) => {
    applyAppearanceSettings(settings.appearance)
  })

  return _appearanceRuntimeUnsubscribe
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
  if (!s[section]) {
    console.warn(`[Settings] Unknown section "${section}" — ignoring updateSection`)
    return
  }
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

function normalizeAppearance(appearanceInput = {}) {
  const appearance = { ...DEFAULTS.appearance, ...appearanceInput }
  const theme = appearance.theme === 'light' ? 'light' : 'dark'
  const fontSize = clampNumber(appearance.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE, DEFAULTS.appearance.fontSize)
  const windowOpacity = clampNumber(
    appearance.windowOpacity,
    MIN_WINDOW_OPACITY,
    MAX_WINDOW_OPACITY,
    DEFAULTS.appearance.windowOpacity
  )
  const accentColor = isCssColor(appearance.accentColor)
    ? appearance.accentColor
    : DEFAULTS.appearance.accentColor

  return {
    ...appearance,
    theme,
    fontSize,
    windowOpacity,
    accentColor,
  }
}

function isCssColor(value) {
  if (typeof value !== 'string') return false
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  return CSS.supports('color', value)
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(min, Math.min(max, num))
}

function toFontStack(fontFamily) {
  if (typeof fontFamily !== 'string' || fontFamily.trim() === '') {
    return FONT_STACKS[DEFAULTS.appearance.fontFamily]
  }
  return FONT_STACKS[fontFamily] || `'${fontFamily.replace(/['"]/g, '')}', system-ui, -apple-system, sans-serif`
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

export { DEFAULTS, get, update, updateSection, subscribe, reset, save, applyAppearanceSettings, initAppearanceRuntime }
