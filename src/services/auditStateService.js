// Audit State Service — tracks codebase audit progress for the continuous iteration engine
// localStorage-backed persistence (mirrors settingsStore/alertService patterns)

const LS_KEY = 'kalshi-audit-state'

// Map keyed by "filePath::functionName" → { filePath, functionName, metadata, ratings, improved, changeId }
let _functions = null
const _listeners = new Set()

function load() {
  if (_functions) return _functions
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      _functions = new Map(JSON.parse(raw))
    } else {
      _functions = new Map()
    }
  } catch {
    _functions = new Map()
  }
  return _functions
}

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([..._functions.entries()]))
  } catch {
    // quota exceeded or unavailable
  }
}

function makeKey(filePath, functionName) {
  return `${filePath}::${functionName}`
}

function registerFunction(filePath, functionName, metadata) {
  load()
  const key = makeKey(filePath, functionName)
  if (_functions.has(key)) {
    // Update metadata only, preserve existing ratings
    const existing = _functions.get(key)
    existing.metadata = { ...existing.metadata, ...metadata }
    _functions.set(key, existing)
  } else {
    _functions.set(key, {
      filePath,
      functionName,
      metadata: metadata || {},
      ratings: null,
      improved: false,
      changeId: null,
    })
  }
  persist()
  _listeners.forEach((fn) => fn(_functions))
}

function rateFunction(filePath, functionName, ratings) {
  load()
  const key = makeKey(filePath, functionName)
  const entry = _functions.get(key)
  if (!entry) return null
  entry.ratings = {
    completeness: ratings.completeness ?? null,
    accuracy: ratings.accuracy ?? null,
    performance: ratings.performance ?? null,
    uxQuality: ratings.uxQuality ?? null,
  }
  _functions.set(key, entry)
  persist()
  _listeners.forEach((fn) => fn(_functions))
  return entry
}

function getAuditProgress() {
  load()
  let total = 0
  let reviewed = 0
  let improved = 0
  let pending = 0
  for (const entry of _functions.values()) {
    total++
    if (entry.ratings) {
      reviewed++
    } else {
      pending++
    }
    if (entry.improved) {
      improved++
    }
  }
  return { total, reviewed, improved, pending }
}

function getFunctionsByRating(maxRating) {
  load()
  const results = []
  for (const entry of _functions.values()) {
    if (!entry.ratings) continue
    const vals = Object.values(entry.ratings).filter((v) => v !== null)
    if (vals.length === 0) continue
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    if (avg <= maxRating) {
      results.push({ ...entry, avgRating: avg })
    }
  }
  results.sort((a, b) => a.avgRating - b.avgRating)
  return results
}

function getUnreviewedFunctions() {
  load()
  const results = []
  for (const entry of _functions.values()) {
    if (!entry.ratings) {
      results.push({ ...entry })
    }
  }
  return results
}

function markImproved(filePath, functionName, changeId) {
  load()
  const key = makeKey(filePath, functionName)
  const entry = _functions.get(key)
  if (!entry) return null
  entry.improved = true
  entry.changeId = changeId
  _functions.set(key, entry)
  persist()
  _listeners.forEach((fn) => fn(_functions))
  return entry
}

// Initialize on import
load()

export { registerFunction, rateFunction, getAuditProgress, getFunctionsByRating, getUnreviewedFunctions, markImproved }
