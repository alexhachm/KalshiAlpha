// Research Loop Engine — powers continuous codebase improvement
// Used by mac10 loop agents to enumerate, audit, and improve functions
// Integrates with changeTrackingService and auditStateService

import { addChange } from './changeTrackingService'
import {
  SCORING_RUBRIC,
  registerFunction,
  rateFunction,
  computeWeightedScore,
  getUnreviewedFunctions,
  getFunctionsByRating,
  markImproved,
  addImprovement,
  getImprovements,
  exportForPrioritization,
} from './auditStateService'

// ── Research source categories ──────────────────────────────────────────
// Each source describes a category of external knowledge that can improve the codebase.
// Sources requiring API keys are documented with stubs below.

const RESEARCH_SOURCES = [
  {
    id: 'kalshi-api',
    label: 'Kalshi API',
    description: 'Official Kalshi exchange API documentation and endpoint behavior',
    requiresKey: false,
    docUrl: 'https://trading-api.readme.io/reference/getting-started',
  },
  {
    id: 'prediction-markets',
    label: 'Prediction Markets',
    description: 'Academic research and best practices for prediction market UX and mechanics',
    requiresKey: false,
    docUrl: null,
  },
  {
    id: 'algotrading',
    label: 'Algorithmic Trading',
    description: 'Algorithmic trading patterns, order management, and execution strategies',
    requiresKey: false,
    docUrl: null,
  },
  {
    id: 'financial-apis',
    label: 'Financial APIs',
    description: 'External financial data feeds (market data, economic indicators, news)',
    requiresKey: true,
    // STUB: Requires API key for a financial data provider (e.g., Alpha Vantage, Polygon.io, or Quandl).
    // Setup instructions:
    //   1. Sign up at https://www.alphavantage.co/ (free tier: 25 requests/day)
    //      OR https://polygon.io/ (free tier: 5 API calls/min)
    //   2. Set environment variable: FINANCIAL_API_KEY=<your-key>
    //   3. Expected response format (Alpha Vantage example):
    //      { "Global Quote": { "01. symbol": "AAPL", "05. price": "150.00", ... } }
    //   4. Integration: fetch market context to enrich audit suggestions
    //      e.g., "This ticker component could display real-time price from Alpha Vantage"
    keyEnvVar: 'FINANCIAL_API_KEY',
    docUrl: 'https://www.alphavantage.co/documentation/',
  },
  {
    id: 'ux-patterns',
    label: 'UX Patterns',
    description: 'Bloomberg terminal UX conventions, financial dashboard patterns, accessibility',
    requiresKey: false,
    docUrl: null,
  },
  {
    id: 'quant-finance',
    label: 'Quantitative Finance',
    description: 'Quantitative models, risk metrics, probability calibration, Kelly criterion',
    requiresKey: false,
    docUrl: null,
  },
]

// ── Codebase enumeration ────────────────────────────────────────────────

/**
 * Parse a single JS/JSX file and extract exported functions/components.
 * Returns array of { filePath, name, type, lineCount }.
 *
 * Recognized patterns:
 *   - `export default function Foo`  / `export default Foo`
 *   - `export default React.memo(Foo)` (resolves Foo from `function Foo` in file)
 *   - `export { foo, bar }` (named exports, resolves each)
 *   - `export function foo()` / `export const foo =`
 */
function parseFunctionExports(filePath, source) {
  const lines = source.split('\n')
  const totalLines = lines.length
  const results = []
  const seen = new Set()

  // Collect all top-level function declarations for cross-reference
  const declaredFunctions = new Map()
  for (let i = 0; i < lines.length; i++) {
    const fnMatch = lines[i].match(/^function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/)
    if (fnMatch) {
      declaredFunctions.set(fnMatch[1], i + 1)
    }
    const constFnMatch = lines[i].match(/^const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:\(|function)/)
    if (constFnMatch) {
      declaredFunctions.set(constFnMatch[1], i + 1)
    }
  }

  // Measure function body length (simple heuristic: count lines until next top-level declaration or EOF)
  function measureFunction(name) {
    const startLine = declaredFunctions.get(name)
    if (!startLine) return totalLines // fallback to total file lines
    let depth = 0
    let started = false
    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i]
      for (const ch of line) {
        if (ch === '{') { depth++; started = true }
        if (ch === '}') depth--
      }
      if (started && depth <= 0) return i - (startLine - 1) + 1
    }
    return totalLines - startLine + 1
  }

  function addResult(name, type) {
    if (seen.has(name)) return
    seen.add(name)
    const lineCount = measureFunction(name)
    results.push({ filePath, name, type, lineCount })
  }

  for (const line of lines) {
    // export default function Foo(
    const expDefFn = line.match(/^export\s+default\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/)
    if (expDefFn) { addResult(expDefFn[1], 'component'); continue }

    // export default React.memo(Foo)
    const expDefMemo = line.match(/^export\s+default\s+React\.memo\(([A-Za-z_$][A-Za-z0-9_$]*)/)
    if (expDefMemo) { addResult(expDefMemo[1], 'component'); continue }

    // export default Foo  (plain identifier)
    const expDefId = line.match(/^export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*$/)
    if (expDefId) {
      const name = expDefId[1]
      const type = name[0] === name[0].toUpperCase() ? 'component' : 'function'
      addResult(name, type)
      continue
    }

    // export function foo(
    const expFn = line.match(/^export\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/)
    if (expFn) { addResult(expFn[1], 'function'); continue }

    // export const foo =
    const expConst = line.match(/^export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)/)
    if (expConst) { addResult(expConst[1], 'constant'); continue }

    // export { foo, bar, baz }
    const expNamed = line.match(/^export\s*\{([^}]+)\}/)
    if (expNamed) {
      const names = expNamed[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
      for (const name of names) {
        const type = declaredFunctions.has(name)
          ? (name[0] === name[0].toUpperCase() ? 'component' : 'function')
          : 'constant'
        addResult(name, type)
      }
    }
  }

  return results
}

/**
 * Enumerate all exported functions/components across the src/ directory.
 * Designed to run in a Node.js context (mac10 loop agent).
 *
 * Returns: Array<{ filePath, name, type, lineCount }>
 *   type: 'component' | 'function' | 'constant'
 */
async function enumerateCodebaseFunctions() {
  // Dynamic import — this runs in a Node.js mac10 loop context, not the browser
  const fs = await import('fs')
  const path = await import('path')

  const srcDir = path.resolve(process.cwd(), 'src')
  const results = []

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (/\.(jsx?|js)$/.test(entry.name) && !entry.name.endsWith('.worker.js')) {
        const source = fs.readFileSync(fullPath, 'utf-8')
        const relativePath = path.relative(process.cwd(), fullPath)
        const exports = parseFunctionExports(relativePath, source)
        results.push(...exports)
      }
    }
  }

  walk(srcDir)
  return results
}

// ── Audit ───────────────────────────────────────────────────────────────

/**
 * Audit a single function for quality. Returns ratings and improvement suggestions.
 * Designed to be called by the loop agent which reads the actual source and analyzes it.
 *
 * @param {string} filePath - relative path to the file
 * @param {string} functionName - name of the exported function
 * @returns {{ ratings, suggestions, source }} - ratings object + improvement suggestions
 */
async function auditFunction(filePath, functionName) {
  const fs = await import('fs')
  const source = fs.readFileSync(filePath, 'utf-8')
  const lines = source.split('\n')

  // Find the function in the file
  let startLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`function ${functionName}`) || lines[i].includes(`const ${functionName}`)) {
      startLine = i
      break
    }
  }

  if (startLine === -1) {
    return { ratings: null, suggestions: ['Function not found in file'], source: null }
  }

  // Extract function body
  let depth = 0
  let started = false
  let endLine = lines.length
  for (let i = startLine; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; started = true }
      if (ch === '}') depth--
    }
    if (started && depth <= 0) { endLine = i + 1; break }
  }

  const fnSource = lines.slice(startLine, endLine).join('\n')
  const fnLineCount = endLine - startLine

  // Heuristic quality analysis (the loop agent LLM will do deeper analysis)
  const ratings = {
    completeness: null,
    accuracy: null,
    performance: null,
    uxQuality: null,
  }

  const suggestions = []

  // Flag very long functions
  if (fnLineCount > 100) {
    suggestions.push(`Function is ${fnLineCount} lines — consider breaking into smaller functions`)
    ratings.completeness = 3
  }

  // Flag missing error handling in async functions
  if (fnSource.includes('async') && !fnSource.includes('catch') && !fnSource.includes('try')) {
    suggestions.push('Async function lacks error handling (no try/catch)')
    ratings.accuracy = 2
  }

  // Flag hardcoded values
  const hardcodedCount = (fnSource.match(/['"][^'"]{20,}['"]/g) || []).length
  if (hardcodedCount > 3) {
    suggestions.push(`${hardcodedCount} long hardcoded strings — consider extracting to constants`)
  }

  // Flag TODO/FIXME/HACK comments
  const todoMatches = fnSource.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi)
  if (todoMatches) {
    suggestions.push(`${todoMatches.length} TODO/FIXME markers found`)
  }

  return { ratings, suggestions, source: fnSource }
}

// ── Prioritization ─────────────────────────────────────────────────────

/**
 * Sort audit results by improvement impact (lowest rating first, longer functions first).
 * @param {Array} auditResults - array of { filePath, functionName, ratings, lineCount }
 * @returns {Array} sorted by descending impact
 */
function prioritizeImprovements(auditResults) {
  return auditResults
    .map((item) => {
      const vals = Object.values(item.ratings || {}).filter((v) => v !== null)
      const avgRating = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 5
      const impact = (5 - avgRating) * Math.log2(item.lineCount + 1)
      return { ...item, avgRating, impact }
    })
    .sort((a, b) => b.impact - a.impact)
}

// ── Change entry generation ─────────────────────────────────────────────

/**
 * Generate a change entry for changeTrackingService from an improvement.
 * @param {{ filePath, functionName, description, source, ratings }} improvement
 * @returns {object} the created change entry
 */
function generateChangeEntry(improvement) {
  return addChange({
    description: improvement.description || `Improved ${improvement.functionName}`,
    domain: guessDomain(improvement.filePath),
    filePath: improvement.filePath,
    functionName: improvement.functionName,
    source: improvement.source || 'research-loop',
    sourceUrl: improvement.sourceUrl || null,
    status: 'pending',
    diffBefore: improvement.diffBefore || null,
    diffAfter: improvement.diffAfter || null,
    tooltip: improvement.tooltip || null,
  })
}

/**
 * Guess domain from file path for change categorization.
 */
function guessDomain(filePath) {
  if (!filePath) return null
  if (filePath.includes('/trade/')) return 'trade'
  if (filePath.includes('/quotes/')) return 'quotes'
  if (filePath.includes('/scanners/')) return 'scanners'
  if (filePath.includes('/services/')) return 'services'
  if (filePath.includes('/hooks/')) return 'hooks'
  return 'general'
}

// ── Research source stubs ───────────────────────────────────────────────

/**
 * STUB: Fetch improvement suggestions from a research source.
 * Each source category has different integration requirements documented below.
 *
 * @param {string} sourceId - one of RESEARCH_SOURCES[].id
 * @param {object} context - { functionName, filePath, source, currentRatings }
 * @returns {Promise<Array<{ suggestion, confidence, sourceUrl }>>}
 */
async function fetchResearchSuggestions(sourceId, context) {
  const sourceConfig = RESEARCH_SOURCES.find((s) => s.id === sourceId)
  if (!sourceConfig) return []

  switch (sourceId) {
    case 'kalshi-api':
      // STUB: Query Kalshi API documentation for best practices
      // No API key needed — scrape or reference the public docs
      // URL: https://trading-api.readme.io/reference/getting-started
      // Integration approach:
      //   1. For functions in kalshiApi.js or kalshiWebSocket.js, check if the
      //      current implementation follows the latest API spec
      //   2. Compare parameter names, response handling, error codes
      //   3. Return suggestions for alignment with official docs
      // Expected return: [{ suggestion: "Use v3 endpoint for ...", confidence: 0.8, sourceUrl: "..." }]
      return []

    case 'prediction-markets':
      // STUB: Reference prediction market research
      // No API key needed — curated knowledge base
      // Sources: academic papers, Metaculus best practices, prediction market design patterns
      // Integration approach:
      //   1. For UI components showing probabilities, check calibration display
      //   2. For order book components, check against market microstructure patterns
      //   3. For position sizing, reference Kelly criterion and risk management
      // Expected return: [{ suggestion: "Display confidence intervals...", confidence: 0.6, sourceUrl: null }]
      return []

    case 'algotrading':
      // STUB: Reference algorithmic trading patterns
      // No API key needed — curated knowledge base
      // Sources: quantitative trading literature, order execution patterns
      // Integration approach:
      //   1. For OMS (omsEngine.js, omsService.js), check order lifecycle patterns
      //   2. For data feed (dataFeed.js), check reconnection and gap-fill strategies
      //   3. For trade components, check latency-sensitive rendering patterns
      // Expected return: [{ suggestion: "Implement TWAP/VWAP order types...", confidence: 0.5, sourceUrl: null }]
      return []

    case 'financial-apis':
      // STUB: Fetch enrichment data from financial API providers
      // REQUIRES API KEY: Set FINANCIAL_API_KEY environment variable
      //
      // Option A — Alpha Vantage (free tier: 25 req/day):
      //   1. Sign up: https://www.alphavantage.co/support/#api-key
      //   2. Endpoint: https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=KEY
      //   3. Response: { "Global Quote": { "05. price": "450.00", "10. change percent": "0.5%" } }
      //
      // Option B — Polygon.io (free tier: 5 calls/min):
      //   1. Sign up: https://polygon.io/dashboard/signup
      //   2. Endpoint: https://api.polygon.io/v2/aggs/ticker/SPY/prev?apiKey=KEY
      //   3. Response: { "results": [{ "c": 450.0, "h": 452.0, "l": 448.0 }] }
      //
      // Integration: Use market data to contextualize improvement suggestions
      //   e.g., "This chart component should handle extended-hours data" if API shows pre/post data
      //
      // const apiKey = process.env.FINANCIAL_API_KEY
      // if (!apiKey) return [{ suggestion: 'Set FINANCIAL_API_KEY for financial data enrichment', confidence: 1, sourceUrl: null }]
      // const res = await fetch(`https://www.alphavantage.co/query?function=...&apikey=${apiKey}`)
      // const data = await res.json()
      return []

    case 'ux-patterns':
      // STUB: Reference Bloomberg terminal and financial dashboard UX patterns
      // No API key needed — curated knowledge base
      // Sources: Bloomberg Terminal design guidelines, financial UX literature
      // Integration approach:
      //   1. For components: check against Bloomberg conventions (compact rows, tabular-nums,
      //      color-coded prices, keyboard navigation)
      //   2. For layouts: check grid density, information hierarchy, panel management
      //   3. For interactions: check hotkey patterns, rapid data entry, confirmation flows
      // Expected return: [{ suggestion: "Add keyboard nav to this grid...", confidence: 0.7, sourceUrl: null }]
      return []

    case 'quant-finance':
      // STUB: Reference quantitative finance models and metrics
      // No API key needed — curated knowledge base
      // Sources: quantitative finance literature, risk management frameworks
      // Integration approach:
      //   1. For analytics (analyticsCalc.js, analyticsService.js): check statistical methods
      //   2. For position display: check risk metrics (Sharpe, max drawdown, VaR)
      //   3. For probability display: check calibration methods and scoring rules
      // Expected return: [{ suggestion: "Add Brier score tracking...", confidence: 0.6, sourceUrl: null }]
      return []

    default:
      return []
  }
}

// ── Autonomous scoring engine pipeline ──────────────────────────────────

/**
 * Run a full inventory scan: enumerate all exported functions, register them
 * in the audit state, and return the inventory.
 *
 * This is the first phase of the autonomous pipeline — it builds the feature
 * inventory without performing any scoring.
 *
 * @returns {Promise<Array<{ filePath, name, type, lineCount }>>} all discovered exports
 */
async function runInventory() {
  const exports = await enumerateCodebaseFunctions()
  for (const fn of exports) {
    registerFunction(fn.filePath, fn.name, {
      type: fn.type,
      lineCount: fn.lineCount,
    })
  }
  return exports
}

/**
 * Score a batch of unreviewed functions using heuristic analysis.
 * Registers ratings and creates improvement records for each suggestion.
 *
 * @param {number} [batchSize=20] — max functions to score per invocation
 * @returns {Promise<Array<{ filePath, functionName, ratings, improvements }>>} scored entries
 */
async function scoreBatch(batchSize = 20) {
  const unreviewed = getUnreviewedFunctions()
  const batch = unreviewed.slice(0, batchSize)
  const results = []

  for (const entry of batch) {
    let audit
    try {
      audit = await auditFunction(entry.filePath, entry.functionName)
    } catch {
      // File may have been deleted or moved since inventory
      continue
    }

    if (!audit.ratings && audit.suggestions.length === 0) {
      // No signal — assign neutral ratings
      rateFunction(entry.filePath, entry.functionName, {
        completeness: 3,
        accuracy: 3,
        performance: 3,
        uxQuality: 3,
      })
      results.push({ filePath: entry.filePath, functionName: entry.functionName, ratings: { completeness: 3, accuracy: 3, performance: 3, uxQuality: 3 }, improvements: [] })
      continue
    }

    // Apply heuristic ratings (fill in nulls with default 3)
    const ratings = {
      completeness: audit.ratings?.completeness ?? 3,
      accuracy: audit.ratings?.accuracy ?? 3,
      performance: audit.ratings?.performance ?? 3,
      uxQuality: audit.ratings?.uxQuality ?? 3,
    }
    rateFunction(entry.filePath, entry.functionName, ratings)

    // Create improvement records from suggestions
    const improvements = []
    for (const suggestion of audit.suggestions) {
      const dim = inferDimension(suggestion)
      const score = computeWeightedScore(ratings)
      const imp = addImprovement({
        filePath: entry.filePath,
        functionName: entry.functionName,
        dimension: dim,
        suggestion,
        priority: score !== null ? Math.round((5 - score) * 20) : 50,
        source: 'heuristic-audit',
      })
      improvements.push(imp)
    }

    results.push({ filePath: entry.filePath, functionName: entry.functionName, ratings, improvements })
  }

  return results
}

/**
 * Infer which rubric dimension a suggestion maps to.
 */
function inferDimension(suggestion) {
  const lower = suggestion.toLowerCase()
  if (lower.includes('error handling') || lower.includes('try/catch') || lower.includes('bug')) return 'accuracy'
  if (lower.includes('break') || lower.includes('lines') || lower.includes('todo') || lower.includes('fixme')) return 'completeness'
  if (lower.includes('hardcoded') || lower.includes('constant')) return 'completeness'
  if (lower.includes('performance') || lower.includes('render') || lower.includes('memo')) return 'performance'
  if (lower.includes('keyboard') || lower.includes('accessibility') || lower.includes('ux') || lower.includes('feedback')) return 'uxQuality'
  return null
}

/**
 * Run the full autonomous pipeline: inventory → score → generate change entries → export.
 *
 * Returns a prioritized export suitable for the loop agent or dashboard consumption.
 *
 * @param {{ batchSize?: number }} [opts]
 * @returns {Promise<{ inventory: number, scored: number, export: object }>}
 */
async function runScoringEngine(opts = {}) {
  const { batchSize = 20 } = opts

  // Phase 1: Inventory
  const inventory = await runInventory()

  // Phase 2: Score unreviewed functions
  const scored = await scoreBatch(batchSize)

  // Phase 3: Generate change entries for low-scoring functions
  const lowScoring = getFunctionsByRating(2.5)
  for (const entry of lowScoring) {
    if (entry.improved) continue
    const openImps = getImprovements({ filePath: entry.filePath, status: 'open' })
    if (openImps.length === 0) continue
    generateChangeEntry({
      filePath: entry.filePath,
      functionName: entry.functionName,
      description: `Low score (${entry.avgRating.toFixed(1)}/5): ${openImps[0].suggestion}`,
      source: 'scoring-engine',
    })
  }

  // Phase 4: Export for prioritization
  const exportData = exportForPrioritization()

  return {
    inventory: inventory.length,
    scored: scored.length,
    export: exportData,
  }
}

// ── Exports ─────────────────────────────────────────────────────────────

export {
  RESEARCH_SOURCES,
  SCORING_RUBRIC,
  enumerateCodebaseFunctions,
  parseFunctionExports,
  auditFunction,
  prioritizeImprovements,
  generateChangeEntry,
  fetchResearchSuggestions,
  runInventory,
  scoreBatch,
  runScoringEngine,
  exportForPrioritization,
}
