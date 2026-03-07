// Change Tracking Service — manages the change log for the continuous iteration engine
// localStorage-backed persistence with subscriber pattern (mirrors settingsStore/alertService)

const LS_KEY = 'kalshi-changes'

let _changes = null
let _nextId = 0
const _listeners = new Set()

function load() {
  if (_changes) return _changes
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      _changes = JSON.parse(raw)
      // Restore next ID counter from existing data
      _nextId = _changes.reduce((max, c) => {
        const num = typeof c.id === 'number' ? c.id : 0
        return num >= max ? num + 1 : max
      }, 0)
    } else {
      _changes = []
    }
  } catch {
    _changes = []
  }
  return _changes
}

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(_changes))
  } catch {
    // quota exceeded or unavailable
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `change-${_nextId++}`
}

function addChange({ description, domain, filePath, functionName, source, sourceUrl, status, diffBefore, diffAfter, tooltip, timestamp }) {
  load()
  const change = {
    id: generateId(),
    description: description || '',
    domain: domain || null,
    filePath: filePath || null,
    functionName: functionName || null,
    source: source || null,
    sourceUrl: sourceUrl || null,
    status: status || 'pending',
    diffBefore: diffBefore || null,
    diffAfter: diffAfter || null,
    tooltip: tooltip || null,
    timestamp: timestamp || new Date().toISOString(),
  }
  _changes.push(change)
  persist()
  _listeners.forEach((fn) => fn(change, _changes))
  return change
}

function getChanges(filters) {
  load()
  if (!filters) return [..._changes]
  return _changes.filter((c) => {
    if (filters.domain && c.domain !== filters.domain) return false
    if (filters.status && c.status !== filters.status) return false
    if (filters.startDate && c.timestamp < filters.startDate) return false
    if (filters.endDate && c.timestamp > filters.endDate) return false
    return true
  })
}

function getChangeById(id) {
  load()
  return _changes.find((c) => c.id === id) || null
}

function updateChangeStatus(id, newStatus) {
  load()
  const change = _changes.find((c) => c.id === id)
  if (!change) return null
  change.status = newStatus
  persist()
  _listeners.forEach((fn) => fn(change, _changes))
  return change
}

function subscribeToChanges(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

// Initialize on import
load()

export { addChange, getChanges, getChangeById, updateChangeStatus, subscribeToChanges }
