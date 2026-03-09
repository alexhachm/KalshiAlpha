// Audit State Service — tracks codebase audit progress for the continuous iteration engine
// localStorage-backed persistence (mirrors settingsStore/alertService patterns)

const LS_KEY = 'kalshi-audit-state'
const LS_IMPROVEMENTS_KEY = 'kalshi-audit-improvements'

// ── Scoring Rubric ──────────────────────────────────────────────────────
// Each dimension rated 1-5. Weights sum to 1.0 and control prioritization impact.

const SCORING_RUBRIC = {
  completeness: {
    weight: 0.3,
    description: 'Does the function fully implement its intended behavior?',
    scale: {
      1: 'Stub or placeholder — no meaningful logic',
      2: 'Partial implementation — major gaps in behavior',
      3: 'Core path works — edge cases and error states missing',
      4: 'Mostly complete — minor edge cases unhandled',
      5: 'Fully implemented — all paths covered',
    },
  },
  accuracy: {
    weight: 0.25,
    description: 'Is the logic correct? Are there bugs or incorrect assumptions?',
    scale: {
      1: 'Known bugs or fundamentally wrong approach',
      2: 'Flawed logic in common paths',
      3: 'Correct for happy path — edge cases may fail',
      4: 'Correct with minor concerns',
      5: 'Verified correct — handles all known cases',
    },
  },
  performance: {
    weight: 0.2,
    description: 'Is the function efficient for its expected usage patterns?',
    scale: {
      1: 'O(n²+) on hot path or blocks UI thread',
      2: 'Unnecessary re-renders or redundant computation',
      3: 'Acceptable — no obvious bottlenecks',
      4: 'Well-optimized — appropriate memoization/caching',
      5: 'Optimal — measured and verified performance',
    },
  },
  uxQuality: {
    weight: 0.25,
    description: 'For user-facing code: clarity, feedback, keyboard access, loading states?',
    scale: {
      1: 'No feedback, broken UX, inaccessible',
      2: 'Minimal UX — missing loading/error states',
      3: 'Functional UX — basic states handled',
      4: 'Good UX — keyboard accessible, proper feedback',
      5: 'Polished — smooth transitions, full accessibility',
    },
  },
}

// Map keyed by "filePath::functionName" → { filePath, functionName, metadata, ratings, improved, changeId, improvements }
let _functions = null
let _improvements = null
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

function loadImprovements() {
  if (_improvements) return _improvements
  try {
    const raw = localStorage.getItem(LS_IMPROVEMENTS_KEY)
    _improvements = raw ? JSON.parse(raw) : []
  } catch {
    _improvements = []
  }
  return _improvements
}

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([..._functions.entries()]))
  } catch {
    // quota exceeded or unavailable
  }
}

function persistImprovements() {
  try {
    localStorage.setItem(LS_IMPROVEMENTS_KEY, JSON.stringify(_improvements))
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
  entry.ratedAt = new Date().toISOString()
  _functions.set(key, entry)
  persist()
  _listeners.forEach((fn) => fn(_functions))
  return entry
}

/**
 * Compute a weighted score (0-5) from a ratings object using SCORING_RUBRIC weights.
 * Returns null if no rated dimensions.
 */
function computeWeightedScore(ratings) {
  if (!ratings) return null
  let totalWeight = 0
  let weightedSum = 0
  for (const [dim, config] of Object.entries(SCORING_RUBRIC)) {
    const val = ratings[dim]
    if (val !== null && val !== undefined) {
      weightedSum += val * config.weight
      totalWeight += config.weight
    }
  }
  return totalWeight > 0 ? weightedSum / totalWeight : null
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
    const score = computeWeightedScore(entry.ratings)
    if (score === null) continue
    if (score <= maxRating) {
      results.push({ ...entry, avgRating: score })
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

// ── Improvement records ─────────────────────────────────────────────────

/**
 * Add an improvement record linked to a function.
 * @param {{ filePath, functionName, dimension, suggestion, priority, source }} opts
 * @returns {object} the created improvement record
 */
function addImprovement({ filePath, functionName, dimension, suggestion, priority, source }) {
  loadImprovements()
  const record = {
    id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    filePath,
    functionName,
    dimension: dimension || null,
    suggestion: suggestion || '',
    priority: priority ?? 0,
    source: source || 'audit',
    status: 'open',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  }
  _improvements.push(record)
  persistImprovements()
  return record
}

/**
 * Get improvement records, optionally filtered.
 * @param {{ status, filePath, dimension }} [filters]
 */
function getImprovements(filters) {
  loadImprovements()
  if (!filters) return [..._improvements]
  return _improvements.filter((r) => {
    if (filters.status && r.status !== filters.status) return false
    if (filters.filePath && r.filePath !== filters.filePath) return false
    if (filters.dimension && r.dimension !== filters.dimension) return false
    return true
  })
}

/**
 * Resolve an improvement record (mark as done).
 */
function resolveImprovement(id) {
  loadImprovements()
  const record = _improvements.find((r) => r.id === id)
  if (!record) return null
  record.status = 'resolved'
  record.resolvedAt = new Date().toISOString()
  persistImprovements()
  return record
}

// ── Export for prioritization ───────────────────────────────────────────

/**
 * Export all function scores and improvement opportunities as a prioritized list.
 * Each entry includes weighted score, per-dimension ratings, and linked improvements.
 * Sorted by ascending score (worst-first) for prioritization.
 */
function exportForPrioritization() {
  load()
  loadImprovements()

  const entries = []
  for (const entry of _functions.values()) {
    const score = computeWeightedScore(entry.ratings)
    const linkedImprovements = _improvements.filter(
      (imp) => imp.filePath === entry.filePath && imp.functionName === entry.functionName && imp.status === 'open'
    )
    entries.push({
      filePath: entry.filePath,
      functionName: entry.functionName,
      type: entry.metadata?.type || null,
      lineCount: entry.metadata?.lineCount || null,
      ratings: entry.ratings,
      weightedScore: score,
      improved: entry.improved,
      ratedAt: entry.ratedAt || null,
      openImprovements: linkedImprovements.length,
      improvements: linkedImprovements,
    })
  }

  // Sort: unrated first, then by ascending weighted score (worst-first)
  entries.sort((a, b) => {
    if (a.weightedScore === null && b.weightedScore === null) return 0
    if (a.weightedScore === null) return -1
    if (b.weightedScore === null) return -1
    return a.weightedScore - b.weightedScore
  })

  return {
    generatedAt: new Date().toISOString(),
    progress: getAuditProgress(),
    rubric: SCORING_RUBRIC,
    entries,
  }
}

// Initialize on import
load()
loadImprovements()

export {
  SCORING_RUBRIC,
  registerFunction,
  rateFunction,
  computeWeightedScore,
  getAuditProgress,
  getFunctionsByRating,
  getUnreviewedFunctions,
  markImproved,
  addImprovement,
  getImprovements,
  resolveImprovement,
  exportForPrioritization,
}
