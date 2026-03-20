// Canonical tool manifest — single source of truth for all app-tool metadata.
// Human-editable, no runtime mutation.
//
// Downstream consumers (WindowManager, MenuBar, Shell, useHotkeyDispatch,
// hotkeyLanguage, docs generators) should import accessors from this module
// instead of maintaining their own copies.

/**
 * @typedef {Object} ToolEntry
 * @property {string}  type         - Unique window type key (e.g. 'montage', 'price-ladder')
 * @property {string}  category     - Menu category: 'login' | 'trade' | 'quotes' | 'scanners' | 'setup'
 * @property {string}  label        - Human-readable display name
 * @property {string|null} shortcut - Keyboard shortcut shown in menus (e.g. 'Ctrl+M'), or null
 * @property {{width: number, height: number}} defaultSize - Default window dimensions
 * @property {string|null} settingsKey   - LocalStorage key prefix for per-window settings, or null
 * @property {boolean} linkBus      - Whether this tool subscribes to color link bus
 * @property {string|null} focusTarget   - Hotkey focus-target alias (e.g. 'montage', 'watchlist'), or null
 */

/** @type {ToolEntry[]} */
const TOOL_MANIFEST = [
  // ── Login ──────────────────────────────────────────────────────────
  {
    type: 'login',
    category: 'login',
    label: 'Login',
    shortcut: null,
    defaultSize: { width: 360, height: 280 },
    settingsKey: null,
    linkBus: false,
    focusTarget: null,
  },

  // ── Trade ──────────────────────────────────────────────────────────
  {
    type: 'montage',
    category: 'trade',
    label: 'Montage',
    shortcut: 'Ctrl+M',
    defaultSize: { width: 350, height: 400 },
    settingsKey: 'montage-settings',
    linkBus: true,
    focusTarget: 'montage',
  },
  {
    type: 'price-ladder',
    category: 'trade',
    label: 'Price Ladder',
    shortcut: 'Ctrl+L',
    defaultSize: { width: 280, height: 500 },
    settingsKey: 'price-ladder-settings',
    linkBus: true,
    focusTarget: 'priceladder',
  },
  {
    type: 'accounts',
    category: 'trade',
    label: 'Accounts',
    shortcut: null,
    defaultSize: { width: 500, height: 300 },
    settingsKey: null,
    linkBus: false,
    focusTarget: 'accounts',
  },
  {
    type: 'positions',
    category: 'trade',
    label: 'Positions',
    shortcut: 'Ctrl+P',
    defaultSize: { width: 500, height: 300 },
    settingsKey: 'positions-settings',
    linkBus: true,
    focusTarget: 'positions',
  },
  {
    type: 'trade-log',
    category: 'trade',
    label: 'Trade Log',
    shortcut: null,
    defaultSize: { width: 550, height: 350 },
    settingsKey: null,
    linkBus: true,
    focusTarget: 'tradelog',
  },
  {
    type: 'event-log',
    category: 'trade',
    label: 'Event Log',
    shortcut: null,
    defaultSize: { width: 500, height: 250 },
    settingsKey: null,
    linkBus: false,
    focusTarget: 'eventlog',
  },
  {
    type: 'order-book',
    category: 'trade',
    label: 'Order Book',
    shortcut: null,
    defaultSize: { width: 400, height: 300 },
    settingsKey: null,
    linkBus: true,
    focusTarget: null,
  },
  {
    type: 'changes',
    category: 'trade',
    label: 'Changes',
    shortcut: null,
    defaultSize: { width: 400, height: 300 },
    settingsKey: null,
    linkBus: false,
    focusTarget: null,
  },

  // ── Quotes ─────────────────────────────────────────────────────────
  {
    type: 'chart',
    category: 'quotes',
    label: 'Chart',
    shortcut: 'Ctrl+K',
    defaultSize: { width: 600, height: 400 },
    settingsKey: 'chart_settings',
    linkBus: true,
    focusTarget: 'chart',
  },
  {
    type: 'time-sale',
    category: 'quotes',
    label: 'Time/Sale',
    shortcut: null,
    defaultSize: { width: 300, height: 400 },
    settingsKey: null,
    linkBus: true,
    focusTarget: 'timesale',
  },
  {
    type: 'market-viewer',
    category: 'quotes',
    label: 'Market Viewer',
    shortcut: null,
    defaultSize: { width: 350, height: 400 },
    settingsKey: null,
    linkBus: true,
    focusTarget: 'watchlist',
  },
  {
    type: 'news-chat',
    category: 'quotes',
    label: 'News/Chat',
    shortcut: null,
    defaultSize: { width: 400, height: 350 },
    settingsKey: null,
    linkBus: true,
    focusTarget: null,
  },

  // ── Scanners ───────────────────────────────────────────────────────
  {
    type: 'live-scanner',
    category: 'scanners',
    label: 'Live',
    shortcut: null,
    defaultSize: { width: 500, height: 350 },
    settingsKey: null,
    linkBus: true,
    focusTarget: 'scanner',
  },
  {
    type: 'historical-scanner',
    category: 'scanners',
    label: 'Historical',
    shortcut: null,
    defaultSize: { width: 500, height: 350 },
    settingsKey: null,
    linkBus: true,
    focusTarget: null,
  },
  {
    type: 'alert-trigger',
    category: 'scanners',
    label: 'Alert & Trigger',
    shortcut: null,
    defaultSize: { width: 450, height: 350 },
    settingsKey: null,
    linkBus: false,
    focusTarget: null,
  },
  {
    type: 'market-clock',
    category: 'scanners',
    label: 'Market Clock',
    shortcut: null,
    defaultSize: { width: 200, height: 100 },
    settingsKey: null,
    linkBus: false,
    focusTarget: null,
  },

  // ── Setup ──────────────────────────────────────────────────────────
  {
    type: 'hotkey-config',
    category: 'setup',
    label: 'Hotkey Config',
    shortcut: null,
    defaultSize: { width: 450, height: 400 },
    settingsKey: null,
    linkBus: false,
    focusTarget: null,
  },
]

// ── Indexes (built once at import time) ──────────────────────────────

const _byType = Object.create(null)
for (const entry of TOOL_MANIFEST) {
  _byType[entry.type] = entry
}

// ── Accessors ────────────────────────────────────────────────────────

/** All tool types as an array of strings. */
export function getToolTypes() {
  return TOOL_MANIFEST.map((e) => e.type)
}

/** Look up a single manifest entry by type. Returns undefined if not found. */
export function getToolByType(type) {
  return _byType[type]
}

/** Default window size for a given type. Returns { width, height } or undefined. */
export function getDefaultSize(type) {
  return _byType[type]?.defaultSize
}

/**
 * Map of type → { width, height } for every tool.
 * Drop-in replacement for Shell.jsx TYPE_SIZES.
 */
export function getTypeSizes() {
  const sizes = Object.create(null)
  for (const entry of TOOL_MANIFEST) {
    sizes[entry.type] = entry.defaultSize
  }
  return sizes
}

/**
 * Menu configuration array matching the shape MenuBar.jsx expects:
 *   [{ label, action? }, { label, items: [{ label, type, shortcut? }] }]
 *
 * Special entries (Login → action, Settings → action) are included.
 */
export function getMenuConfig() {
  const categoryOrder = ['trade', 'quotes', 'scanners', 'setup']
  const categoryLabels = {
    trade: 'Trade',
    quotes: 'Quotes',
    scanners: 'Scanners',
    setup: 'Setup',
  }

  const menu = [{ label: 'Login', action: 'login' }]

  for (const cat of categoryOrder) {
    const items = TOOL_MANIFEST.filter((e) => e.category === cat).map((e) => {
      const item = { label: e.label, type: e.type }
      if (e.focusTarget) item.focusTarget = e.focusTarget
      return item
    })
    if (items.length) {
      menu.push({ label: categoryLabels[cat], items })
    }
  }

  menu.push({ label: 'Settings', action: 'settings' })
  return menu
}

/**
 * Focus-target → window-type map for useHotkeyDispatch.
 * Only includes tools that have a focusTarget defined.
 */
export function getFocusTypeMap() {
  const map = Object.create(null)
  for (const entry of TOOL_MANIFEST) {
    if (entry.focusTarget) {
      map[entry.focusTarget] = entry.type
    }
  }
  return map
}

/**
 * Array of valid FOCUS target names (upper-cased) for hotkeyLanguage.
 */
export function getFocusTargets() {
  return TOOL_MANIFEST.filter((e) => e.focusTarget).map((e) =>
    e.focusTarget.toUpperCase(),
  )
}

/**
 * All tools that subscribe to the color link bus.
 */
export function getLinkBusTools() {
  return TOOL_MANIFEST.filter((e) => e.linkBus).map((e) => e.type)
}

/** The raw manifest array (read-only by convention). */
export { TOOL_MANIFEST }
