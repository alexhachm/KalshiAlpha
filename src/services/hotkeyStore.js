// Hotkey Store — localStorage-backed keybinding manager with profiles
// Manages hotkey bindings, profiles, and persistence for the hotkey system

const LS_KEY = 'kalshi_hotkeys'

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta']

const DEFAULT_BINDINGS = [
  {
    id: crypto.randomUUID(),
    key: 'Ctrl+B',
    script: 'Buy=Route:LIMIT Price=Price+0.00 Share=1 TIF=DAY',
    label: 'Quick Buy',
    active: true,
    category: 'trading',
  },
  {
    id: crypto.randomUUID(),
    key: 'Ctrl+S',
    script: 'Sell=Route:LIMIT Price=Price+0.00 Share=Pos TIF=DAY',
    label: 'Quick Sell',
    active: true,
    category: 'trading',
  },
  {
    id: crypto.randomUUID(),
    key: 'Escape',
    script: 'CXL',
    label: 'Cancel All',
    active: true,
    category: 'trading',
  },
  {
    id: crypto.randomUUID(),
    key: 'Ctrl+M',
    script: 'Focus=Montage',
    label: 'Focus Montage',
    active: true,
    category: 'navigation',
  },
  {
    id: crypto.randomUUID(),
    key: 'Ctrl+L',
    script: 'Focus=PriceLadder',
    label: 'Focus Price Ladder',
    active: true,
    category: 'navigation',
  },
  {
    id: crypto.randomUUID(),
    key: 'Ctrl+P',
    script: 'Focus=Positions',
    label: 'Focus Positions',
    active: true,
    category: 'navigation',
  },
  {
    id: crypto.randomUUID(),
    key: 'Ctrl+K',
    script: 'Focus=Chart',
    label: 'Focus Chart',
    active: true,
    category: 'navigation',
  },
]

const DEFAULT_TEMPLATES = [
  { id: crypto.randomUUID(), name: 'Scalp 1', size: 1, orderType: 'limit', timeInForce: 'ioc' },
  { id: crypto.randomUUID(), name: 'Standard 10', size: 10, orderType: 'limit', timeInForce: 'gtc' },
  { id: crypto.randomUUID(), name: 'Size 50', size: 50, orderType: 'limit', timeInForce: 'gtc' },
  { id: crypto.randomUUID(), name: 'Max 100', size: 100, orderType: 'limit', timeInForce: 'gtc' },
]

// --- Internal state ---
let _store = null
const _listeners = new Set()
let _configActive = false

function _notify() {
  const bindings = getBindings()
  _listeners.forEach((fn) => fn(bindings))
}

function _persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(_store))
  } catch {
    // quota exceeded or unavailable
  }
  _notify()
}

function _load() {
  if (_store) return _store
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.profiles && parsed.activeProfile) {
        _store = parsed
      } else {
        _store = _createDefaultStore()
      }
    } else {
      _store = _createDefaultStore()
    }
  } catch {
    _store = _createDefaultStore()
  }
  return _store
}

function _createDefaultStore() {
  return {
    activeProfile: 'Default',
    profiles: {
      Default: {
        name: 'Default',
        bindings: DEFAULT_BINDINGS.map((b) => ({ ...b, id: crypto.randomUUID() })),
        templates: DEFAULT_TEMPLATES.map((t) => ({ ...t, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
      },
    },
  }
}

function _activeProfile() {
  const store = _load()
  return store.profiles[store.activeProfile]
}

// --- Normalize key combos ---

const KEY_ALIASES = {
  ' ': 'Space',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
}

function normalizeKeyCombo(event) {
  const parts = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push('Meta')

  let key = event.key
  // Skip if key is just a modifier
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    return parts.join('+')
  }

  // Normalize key name
  if (KEY_ALIASES[key]) {
    key = KEY_ALIASES[key]
  } else if (key.length === 1) {
    key = key.toUpperCase()
  }
  // F1-F12 and named keys already correct

  parts.push(key)
  return parts.join('+')
}

/** Parse a string combo like "Shift+Ctrl+B" into canonical order "Ctrl+Shift+B" */
function _canonicalize(combo) {
  const parts = combo.split('+').map((p) => p.trim())
  const mods = []
  let key = null
  for (const p of parts) {
    const idx = MODIFIER_ORDER.indexOf(p)
    if (idx !== -1) {
      mods.push(p)
    } else {
      key = p
    }
  }
  mods.sort((a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b))
  if (key) mods.push(key)
  return mods.join('+')
}

// --- Binding CRUD ---

function getBindings() {
  const profile = _activeProfile()
  return profile.bindings.filter((b) => b.active)
}

function getAllBindings() {
  const profile = _activeProfile()
  return [...profile.bindings]
}

function addBinding({ key, script, label, category }) {
  const store = _load()
  const profile = store.profiles[store.activeProfile]
  const normalized = _canonicalize(key)

  // Conflict detection
  const conflict = profile.bindings.find((b) => b.key === normalized && b.active)
  if (conflict) {
    throw new Error(`Key "${normalized}" already bound to "${conflict.label}"`)
  }

  const binding = {
    id: crypto.randomUUID(),
    key: normalized,
    script,
    label: label || script,
    active: true,
    category: category || 'custom',
  }
  profile.bindings.push(binding)
  _persist()
  return { ...binding }
}

function updateBinding(id, updates) {
  const store = _load()
  const profile = store.profiles[store.activeProfile]
  const idx = profile.bindings.findIndex((b) => b.id === id)
  if (idx === -1) throw new Error(`Binding "${id}" not found`)

  // If key is being changed, check for conflicts
  if (updates.key) {
    const normalized = _canonicalize(updates.key)
    const conflict = profile.bindings.find(
      (b) => b.key === normalized && b.active && b.id !== id
    )
    if (conflict) {
      throw new Error(`Key "${normalized}" already bound to "${conflict.label}"`)
    }
    updates = { ...updates, key: normalized }
  }

  profile.bindings[idx] = { ...profile.bindings[idx], ...updates }
  _persist()
  return { ...profile.bindings[idx] }
}

function removeBinding(id) {
  const store = _load()
  const profile = store.profiles[store.activeProfile]
  const idx = profile.bindings.findIndex((b) => b.id === id)
  if (idx === -1) return
  profile.bindings.splice(idx, 1)
  _persist()
}

function findBindingByKey(keyCombo) {
  const profile = _activeProfile()
  const normalized = _canonicalize(keyCombo)
  return profile.bindings.find((b) => b.key === normalized && b.active) || null
}

// --- Order Template CRUD ---

function getTemplates() {
  const profile = _activeProfile()
  return [...(profile.templates || [])]
}

function addTemplate({ name, size, orderType, timeInForce }) {
  const store = _load()
  const profile = store.profiles[store.activeProfile]
  if (!profile.templates) profile.templates = []
  const template = {
    id: crypto.randomUUID(),
    name: name || 'Untitled',
    size: size || 1,
    orderType: orderType || 'limit',
    timeInForce: timeInForce || 'gtc',
  }
  profile.templates.push(template)
  _persist()
  return { ...template }
}

function updateTemplate(id, updates) {
  const store = _load()
  const profile = store.profiles[store.activeProfile]
  if (!profile.templates) throw new Error(`Template "${id}" not found`)
  const idx = profile.templates.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error(`Template "${id}" not found`)
  profile.templates[idx] = { ...profile.templates[idx], ...updates }
  _persist()
  return { ...profile.templates[idx] }
}

function removeTemplate(id) {
  const store = _load()
  const profile = store.profiles[store.activeProfile]
  if (!profile.templates) return
  const idx = profile.templates.findIndex((t) => t.id === id)
  if (idx === -1) return
  profile.templates.splice(idx, 1)
  _persist()
}

function findTemplateByName(name) {
  const profile = _activeProfile()
  if (!profile.templates) return null
  return profile.templates.find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  ) || null
}

// --- Profile management ---

function getProfiles() {
  const store = _load()
  return Object.values(store.profiles).map((p) => ({
    name: p.name,
    bindings: [...p.bindings],
    createdAt: p.createdAt,
  }))
}

function saveProfile(name) {
  const store = _load()
  const current = store.profiles[store.activeProfile]
  const profile = {
    name,
    bindings: current.bindings.map((b) => ({ ...b, id: crypto.randomUUID() })),
    templates: (current.templates || []).map((t) => ({ ...t, id: crypto.randomUUID() })),
    createdAt: new Date().toISOString(),
  }
  store.profiles[name] = profile
  _persist()
  return { ...profile }
}

function loadProfile(name) {
  const store = _load()
  if (!store.profiles[name]) {
    throw new Error(`Profile "${name}" not found`)
  }
  store.activeProfile = name
  _persist()
}

function deleteProfile(name) {
  const store = _load()
  if (name === 'Default') {
    throw new Error('Cannot delete the Default profile')
  }
  if (!store.profiles[name]) return
  delete store.profiles[name]
  if (store.activeProfile === name) {
    store.activeProfile = 'Default'
  }
  _persist()
}

function exportProfile(name) {
  const store = _load()
  const profile = store.profiles[name]
  if (!profile) throw new Error(`Profile "${name}" not found`)
  return JSON.stringify({ name: profile.name, bindings: profile.bindings, templates: profile.templates || [], createdAt: profile.createdAt })
}

function importProfile(jsonString) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON')
  }
  if (!data.name || !Array.isArray(data.bindings)) {
    throw new Error('Invalid profile format: requires name and bindings array')
  }
  // Validate and sanitize bindings
  const bindings = data.bindings.map((b) => ({
    id: crypto.randomUUID(),
    key: _canonicalize(String(b.key || '')),
    script: String(b.script || ''),
    label: String(b.label || b.script || ''),
    active: b.active !== false,
    category: ['trading', 'navigation', 'scanner', 'custom'].includes(b.category)
      ? b.category
      : 'custom',
  }))
  const templates = Array.isArray(data.templates)
    ? data.templates.map((t) => ({
        id: crypto.randomUUID(),
        name: String(t.name || 'Untitled'),
        size: Number(t.size) || 1,
        orderType: ['limit', 'market'].includes(t.orderType) ? t.orderType : 'limit',
        timeInForce: ['gtc', 'ioc', 'day'].includes(t.timeInForce) ? t.timeInForce : 'gtc',
      }))
    : []
  const profile = {
    name: data.name,
    bindings,
    templates,
    createdAt: data.createdAt || new Date().toISOString(),
  }
  const store = _load()
  store.profiles[data.name] = profile
  _persist()
  return { ...profile }
}

// --- Focus binding map ---

/**
 * Returns a map of focusTarget (lowercase) → binding key for all active FOCUS bindings.
 * Used by MenuBar to derive shortcut badges from the live store.
 * Example: { montage: 'Ctrl+M', priceladder: 'Ctrl+L', ... }
 */
function getFocusBindingMap() {
  const bindings = getBindings()
  const map = {}
  for (const binding of bindings) {
    const script = (binding.script || '').trim()
    const m = script.match(/^Focus=(\w+)$/i)
    if (m) {
      map[m[1].toLowerCase()] = binding.key
    }
  }
  return map
}

// --- Config context guard ---
// Set to true while HotkeyManager UI is mounted so trading hotkeys are suppressed.

function setConfigActive(active) {
  _configActive = !!active
}

function isConfigActive() {
  return _configActive
}

// --- Subscribe ---

function subscribe(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

// Initialize on import
_load()

export {
  getBindings,
  getAllBindings,
  addBinding,
  updateBinding,
  removeBinding,
  findBindingByKey,
  normalizeKeyCombo,
  getTemplates,
  addTemplate,
  updateTemplate,
  removeTemplate,
  findTemplateByName,
  getProfiles,
  saveProfile,
  loadProfile,
  deleteProfile,
  exportProfile,
  importProfile,
  getFocusBindingMap,
  subscribe,
  setConfigActive,
  isConfigActive,
}
