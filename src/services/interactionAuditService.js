// Interaction Audit Service — audits end-to-end user flows for completeness and quality
// Produces structured findings consumable by the prioritization pipeline in researchLoop.js

import { addImprovement, computeWeightedScore } from './auditStateService'

// ── Flow Definitions ────────────────────────────────────────────────────
// Each flow describes a critical user interaction path through the application.
// Steps reference the component/service chain and the checks to perform.

const INTERACTION_FLOWS = [
  {
    id: 'navigation',
    label: 'Navigation & Window Management',
    description: 'User opens, focuses, moves, and closes windows via MenuBar and hotkeys',
    steps: [
      {
        id: 'nav-open',
        label: 'Open window from MenuBar',
        components: ['src/components/MenuBar.jsx', 'src/components/Shell.jsx'],
        checks: ['dispatch-open-window', 'default-position', 'z-index-top'],
      },
      {
        id: 'nav-focus',
        label: 'Focus window on click',
        components: ['src/components/Window.jsx', 'src/components/Shell.jsx'],
        checks: ['z-index-promotion', 'focus-visual-indicator'],
      },
      {
        id: 'nav-hotkey',
        label: 'Navigate via hotkeys',
        components: ['src/components/Shell.jsx', 'src/hooks/useHotkeyDispatch.js'],
        checks: ['hotkey-binding-exists', 'focus-target-correct'],
      },
      {
        id: 'nav-close',
        label: 'Close window',
        components: ['src/components/Window.jsx', 'src/components/Shell.jsx'],
        checks: ['state-cleanup', 'settings-preserved'],
      },
    ],
  },
  {
    id: 'scanning',
    label: 'Market Scanning',
    description: 'User scans live and historical markets, selects a market, and views quotes',
    steps: [
      {
        id: 'scan-live',
        label: 'Live scanner loads markets',
        components: ['src/components/scanners/LiveScanner.jsx', 'src/services/dataFeed.js'],
        checks: ['data-subscription', 'loading-state', 'error-fallback'],
      },
      {
        id: 'scan-historical',
        label: 'Historical scanner filters',
        components: ['src/components/scanners/HistoricalScanner.jsx'],
        checks: ['filter-controls', 'sort-columns', 'empty-state'],
      },
      {
        id: 'scan-select',
        label: 'Select market from scanner',
        components: ['src/components/scanners/LiveScanner.jsx', 'src/services/linkBus.js'],
        checks: ['link-bus-emit', 'row-highlight', 'linked-windows-update'],
      },
      {
        id: 'scan-quote',
        label: 'Quote view updates from selection',
        components: ['src/components/quotes/Chart.jsx', 'src/components/quotes/TimeSale.jsx'],
        checks: ['ticker-sync', 'chart-render', 'time-sale-data'],
      },
    ],
  },
  {
    id: 'order-entry',
    label: 'Order Entry',
    description: 'User enters an order via PriceLadder or OrderBook, submits, and sees confirmation',
    steps: [
      {
        id: 'order-price-select',
        label: 'Select price level',
        components: ['src/components/trade/PriceLadder.jsx', 'src/components/trade/OrderBook.jsx'],
        checks: ['click-action-config', 'price-highlight', 'size-input'],
      },
      {
        id: 'order-submit',
        label: 'Submit order to OMS',
        components: ['src/services/omsService.js', 'src/services/omsEngine.js'],
        checks: ['validation-before-submit', 'api-call-format', 'optimistic-update'],
      },
      {
        id: 'order-confirm',
        label: 'Order confirmation feedback',
        components: ['src/components/trade/Montage.jsx', 'src/components/trade/TradeLog.jsx'],
        checks: ['fill-notification', 'position-update', 'trade-log-entry'],
      },
      {
        id: 'order-cancel',
        label: 'Cancel working order',
        components: ['src/services/omsService.js', 'src/components/trade/PriceLadder.jsx'],
        checks: ['cancel-api-call', 'ui-removal', 'state-rollback'],
      },
    ],
  },
  {
    id: 'alerts',
    label: 'Alert Management',
    description: 'User creates an alert rule, receives a trigger, and reviews history',
    steps: [
      {
        id: 'alert-create',
        label: 'Create alert rule',
        components: ['src/components/scanners/AlertTrigger.jsx', 'src/services/alertService.js'],
        checks: ['form-validation', 'rule-persistence', 'type-params-match'],
      },
      {
        id: 'alert-trigger',
        label: 'Alert fires on condition',
        components: ['src/services/alertService.js', 'src/services/alertEngine.worker.js'],
        checks: ['condition-evaluation', 'notification-dispatch', 'flash-feedback'],
      },
      {
        id: 'alert-history',
        label: 'Review alert history',
        components: ['src/components/scanners/AlertTrigger.jsx'],
        checks: ['history-tab-render', 'time-format', 'scroll-performance'],
      },
      {
        id: 'alert-toggle',
        label: 'Enable/disable alert rule',
        components: ['src/components/scanners/AlertTrigger.jsx', 'src/services/alertService.js'],
        checks: ['toggle-persistence', 'evaluation-skip', 'ui-state-sync'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Customization',
    description: 'User adjusts global and per-window settings with persistence',
    steps: [
      {
        id: 'settings-global',
        label: 'Open global settings panel',
        components: ['src/components/SettingsPanel.jsx', 'src/services/settingsStore.js'],
        checks: ['panel-toggle', 'current-values-load', 'section-tabs'],
      },
      {
        id: 'settings-grid',
        label: 'Customize grid columns/density',
        components: ['src/components/GridSettingsPanel.jsx', 'src/hooks/useGridCustomization.js'],
        checks: ['column-toggle', 'density-change', 'live-preview'],
      },
      {
        id: 'settings-persist',
        label: 'Settings persist across reload',
        components: ['src/services/settingsStore.js'],
        checks: ['localstorage-write', 'load-on-mount', 'migration-handling'],
      },
      {
        id: 'settings-per-window',
        label: 'Per-window settings isolation',
        components: ['src/components/trade/PriceLadderSettings.jsx', 'src/components/trade/OrderBookSettings.jsx'],
        checks: ['window-id-scoping', 'independent-persistence', 'settings-icon-toggle'],
      },
    ],
  },
]

// ── Check Implementations ───────────────────────────────────────────────
// Each check inspects source code for patterns that indicate proper implementation.

const CHECK_REGISTRY = {
  // Navigation checks
  'dispatch-open-window': {
    label: 'Dispatches OPEN_WINDOW action',
    test: (sources) => patternInAny(sources, /dispatch\(\s*\{\s*type:\s*['"]OPEN_WINDOW['"]/),
  },
  'default-position': {
    label: 'Provides default window position',
    test: (sources) => patternInAny(sources, /position|initialX|initialY|INITIAL_X|INITIAL_Y/),
  },
  'z-index-top': {
    label: 'Brings new window to top z-index',
    test: (sources) => patternInAny(sources, /zIndex|nextZ|z-index/i),
  },
  'z-index-promotion': {
    label: 'Promotes z-index on focus',
    test: (sources) => patternInAny(sources, /FOCUS_WINDOW|bringToFront|zIndex/),
  },
  'focus-visual-indicator': {
    label: 'Visual indicator for focused window',
    test: (sources) => patternInAny(sources, /focused|active.*class|isFocused/i),
  },
  'hotkey-binding-exists': {
    label: 'Hotkey bindings registered',
    test: (sources) => patternInAny(sources, /useHotkeyDispatch|registerHotkey|onKeyDown/),
  },
  'focus-target-correct': {
    label: 'Hotkey targets correct window',
    test: (sources) => patternInAny(sources, /focusWindow|FOCUS_WINDOW|windowId/),
  },
  'state-cleanup': {
    label: 'Window state cleaned up on close',
    test: (sources) => patternInAny(sources, /CLOSE_WINDOW|removeWindow|filter.*id/),
  },
  'settings-preserved': {
    label: 'Window settings not lost on close',
    test: (sources) => patternInAny(sources, /localStorage|saveSettings|settingsId/),
  },

  // Scanning checks
  'data-subscription': {
    label: 'Data feed subscription on mount',
    test: (sources) => patternInAny(sources, /useEffect.*subscribe|useTickerData|dataFeed/),
  },
  'loading-state': {
    label: 'Loading state while data loads',
    test: (sources) => patternInAny(sources, /loading|isLoading|Loading|spinner/i),
  },
  'error-fallback': {
    label: 'Error state fallback',
    test: (sources) => patternInAny(sources, /error|Error|catch|fallback/i),
  },
  'filter-controls': {
    label: 'Filter controls for scanner',
    test: (sources) => patternInAny(sources, /filter|Filter|search|Search/),
  },
  'sort-columns': {
    label: 'Sortable columns',
    test: (sources) => patternInAny(sources, /sort|Sort|orderBy|sortKey/i),
  },
  'empty-state': {
    label: 'Empty state when no results',
    test: (sources) => patternInAny(sources, /empty|no.*results|no.*data|length\s*===?\s*0/i),
  },
  'link-bus-emit': {
    label: 'Emits linked market on selection',
    test: (sources) => patternInAny(sources, /emitLinkedMarket|emitLink|linkBus/),
  },
  'row-highlight': {
    label: 'Highlights selected row',
    test: (sources) => patternInAny(sources, /selected|active.*row|highlight|selectedRow/i),
  },
  'linked-windows-update': {
    label: 'Linked windows receive update',
    test: (sources) => patternInAny(sources, /subscribeToLink|onLinkedMarket|linkBus/),
  },
  'ticker-sync': {
    label: 'Ticker syncs from link bus',
    test: (sources) => patternInAny(sources, /ticker|setTicker|subscribeToLink/),
  },
  'chart-render': {
    label: 'Chart renders with data',
    test: (sources) => patternInAny(sources, /canvas|Chart|svg|drawChart|renderChart/i),
  },
  'time-sale-data': {
    label: 'Time & sales data populated',
    test: (sources) => patternInAny(sources, /trades|timeSale|recentTrades|tradeHistory/i),
  },

  // Order entry checks
  'click-action-config': {
    label: 'Click action configurable (limit/market)',
    test: (sources) => patternInAny(sources, /clickAction|click.*action|limit|market/i),
  },
  'price-highlight': {
    label: 'Highlights price level on hover/selection',
    test: (sources) => patternInAny(sources, /hover|highlight|selected.*price|activePrice/i),
  },
  'size-input': {
    label: 'Order size input available',
    test: (sources) => patternInAny(sources, /size|quantity|defaultSize|orderSize/i),
  },
  'validation-before-submit': {
    label: 'Validates order before submission',
    test: (sources) => patternInAny(sources, /validat|invalid|check.*order|orderValid/i),
  },
  'api-call-format': {
    label: 'API call with proper order format',
    test: (sources) => patternInAny(sources, /placeOrder|submitOrder|createOrder|POST.*order/i),
  },
  'optimistic-update': {
    label: 'Optimistic UI update on submit',
    test: (sources) => patternInAny(sources, /optimistic|pending.*order|working.*order/i),
  },
  'fill-notification': {
    label: 'Fill/execution notification',
    test: (sources) => patternInAny(sources, /fill|execution|filled|FILL/),
  },
  'position-update': {
    label: 'Position updates after fill',
    test: (sources) => patternInAny(sources, /position|updatePosition|positions/i),
  },
  'trade-log-entry': {
    label: 'Trade appears in trade log',
    test: (sources) => patternInAny(sources, /tradeLog|trade.*log|TradeLog|recentTrades/i),
  },
  'cancel-api-call': {
    label: 'Cancel order API call',
    test: (sources) => patternInAny(sources, /cancelOrder|cancel.*order|DELETE.*order/i),
  },
  'ui-removal': {
    label: 'Cancelled order removed from UI',
    test: (sources) => patternInAny(sources, /remove.*order|filter.*cancel|working.*order/i),
  },
  'state-rollback': {
    label: 'State rolled back on cancel',
    test: (sources) => patternInAny(sources, /rollback|revert|cancel.*state|remove.*working/i),
  },

  // Alert checks
  'form-validation': {
    label: 'Alert form validates inputs',
    test: (sources) => patternInAny(sources, /validat|required|invalid|error.*form/i),
  },
  'rule-persistence': {
    label: 'Alert rule persisted',
    test: (sources) => patternInAny(sources, /addRule|saveRule|localStorage|persist/i),
  },
  'type-params-match': {
    label: 'Rule type params match selected type',
    test: (sources) => patternInAny(sources, /RULE_PARAM_DEFAULTS|paramDefaults|typeParams/i),
  },
  'condition-evaluation': {
    label: 'Alert condition evaluated against data',
    test: (sources) => patternInAny(sources, /evaluat|checkAlert|checkRule|trigger.*condition/i),
  },
  'notification-dispatch': {
    label: 'Notification dispatched on trigger',
    test: (sources) => patternInAny(sources, /notification|Notification|notify|dispatch.*alert/i),
  },
  'flash-feedback': {
    label: 'Visual flash on alert trigger',
    test: (sources) => patternInAny(sources, /flash|blink|highlight.*alert|flashOnAlert/i),
  },
  'history-tab-render': {
    label: 'Alert history tab renders',
    test: (sources) => patternInAny(sources, /history|History|HISTORY_COLUMNS|alertHistory/i),
  },
  'time-format': {
    label: 'Times formatted consistently',
    test: (sources) => patternInAny(sources, /toLocaleString|formatTime|dateFormat|toISOString/i),
  },
  'scroll-performance': {
    label: 'Scroll performance for long lists',
    test: (sources) => patternInAny(sources, /virtualized|overflow.*auto|maxHeight|scrollable/i),
  },
  'toggle-persistence': {
    label: 'Toggle state persisted',
    test: (sources) => patternInAny(sources, /enabled|toggle.*persist|saveRule|updateRule/i),
  },
  'evaluation-skip': {
    label: 'Disabled rules skip evaluation',
    test: (sources) => patternInAny(sources, /enabled.*false|skip.*disabled|if.*enabled/i),
  },
  'ui-state-sync': {
    label: 'UI reflects toggle state',
    test: (sources) => patternInAny(sources, /enabled|checkbox|toggle|Switch/i),
  },

  // Settings checks
  'panel-toggle': {
    label: 'Settings panel toggles open/closed',
    test: (sources) => patternInAny(sources, /showSettings|toggleSettings|isOpen|setShow/i),
  },
  'current-values-load': {
    label: 'Current values loaded on open',
    test: (sources) => patternInAny(sources, /getSettings|loadSettings|useState.*settings|initial/i),
  },
  'section-tabs': {
    label: 'Settings organized in sections/tabs',
    test: (sources) => patternInAny(sources, /tab|Tab|section|Section|category/i),
  },
  'column-toggle': {
    label: 'Grid column visibility toggles',
    test: (sources) => patternInAny(sources, /column.*visible|toggleColumn|hiddenColumns|visibleColumns/i),
  },
  'density-change': {
    label: 'Grid density/font-size control',
    test: (sources) => patternInAny(sources, /density|fontSize|compact|comfortable|rowHeight/i),
  },
  'live-preview': {
    label: 'Settings changes preview in real-time',
    test: (sources) => patternInAny(sources, /onChange|useEffect.*settings|preview|immediate/i),
  },
  'localstorage-write': {
    label: 'Settings written to localStorage',
    test: (sources) => patternInAny(sources, /localStorage\.setItem|persist|save.*settings/i),
  },
  'load-on-mount': {
    label: 'Settings loaded on component mount',
    test: (sources) => patternInAny(sources, /useEffect.*load|useState.*getSettings|loadSettings/i),
  },
  'migration-handling': {
    label: 'Settings migration for schema changes',
    test: (sources) => patternInAny(sources, /migrat|version|schema|upgrade|DEFAULT_SETTINGS/i),
  },
  'window-id-scoping': {
    label: 'Settings scoped by window ID',
    test: (sources) => patternInAny(sources, /windowId|settingsId|window.*id|LS_KEY.*id/i),
  },
  'independent-persistence': {
    label: 'Per-window settings stored independently',
    test: (sources) => patternInAny(sources, /localStorage.*windowId|settings-\$\{|LS_KEY_PREFIX/i),
  },
  'settings-icon-toggle': {
    label: 'Settings icon opens per-window panel',
    test: (sources) => patternInAny(sources, /showSettings|toggleSettings|settings.*icon|gear/i),
  },
}

// ── Helper ──────────────────────────────────────────────────────────────

function patternInAny(sources, regex) {
  return sources.some((src) => regex.test(src))
}

// ── Audit Runner ────────────────────────────────────────────────────────

/**
 * Read source files for a step's components. Runs in Node.js (mac10 loop agent context).
 * Returns array of file content strings.
 */
async function readStepSources(step) {
  const fs = await import('fs')
  const sources = []
  for (const filePath of step.components) {
    try {
      sources.push(fs.readFileSync(filePath, 'utf-8'))
    } catch {
      // File may not exist — recorded as missing
    }
  }
  return sources
}

/**
 * Run a single flow audit. Returns structured findings for each step.
 *
 * @param {object} flow - one of INTERACTION_FLOWS
 * @returns {Promise<{ flowId, flowLabel, steps: Array<{ stepId, stepLabel, passed, failed, missing }> }>}
 */
async function auditFlow(flow) {
  const stepResults = []

  for (const step of flow.steps) {
    const sources = await readStepSources(step)
    const missingFiles = step.components.filter((_, i) => !sources[i] || sources[i] === undefined)
    const availableSources = sources.filter(Boolean)

    const passed = []
    const failed = []

    for (const checkId of step.checks) {
      const check = CHECK_REGISTRY[checkId]
      if (!check) {
        failed.push({ checkId, label: checkId, reason: 'Unknown check' })
        continue
      }

      if (availableSources.length === 0) {
        failed.push({ checkId, label: check.label, reason: 'No source files available' })
        continue
      }

      if (check.test(availableSources)) {
        passed.push({ checkId, label: check.label })
      } else {
        failed.push({ checkId, label: check.label, reason: 'Pattern not found in component sources' })
      }
    }

    stepResults.push({
      stepId: step.id,
      stepLabel: step.label,
      components: step.components,
      missingFiles,
      passed,
      failed,
      score: step.checks.length > 0 ? passed.length / step.checks.length : 1,
    })
  }

  // Compute overall flow score
  const totalChecks = stepResults.reduce((sum, s) => sum + s.passed.length + s.failed.length, 0)
  const passedChecks = stepResults.reduce((sum, s) => sum + s.passed.length, 0)

  return {
    flowId: flow.id,
    flowLabel: flow.label,
    description: flow.description,
    steps: stepResults,
    totalChecks,
    passedChecks,
    score: totalChecks > 0 ? passedChecks / totalChecks : 1,
  }
}

/**
 * Run audits for all interaction flows.
 * Returns a complete report with per-flow and overall scores.
 *
 * @returns {Promise<{ generatedAt, flows, overallScore, findings }>}
 */
async function runInteractionAudit() {
  const flowResults = []

  for (const flow of INTERACTION_FLOWS) {
    const result = await auditFlow(flow)
    flowResults.push(result)
  }

  // Flatten findings: each failed check becomes a finding
  const findings = []
  for (const flow of flowResults) {
    for (const step of flow.steps) {
      for (const fail of step.failed) {
        findings.push({
          flowId: flow.flowId,
          flowLabel: flow.flowLabel,
          stepId: step.stepId,
          stepLabel: step.stepLabel,
          checkId: fail.checkId,
          checkLabel: fail.label,
          reason: fail.reason,
          components: step.components,
          severity: step.score < 0.5 ? 'high' : step.score < 0.75 ? 'medium' : 'low',
        })
      }
    }
  }

  // Sort findings: high severity first, then by flow
  findings.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    const sa = severityOrder[a.severity] ?? 2
    const sb = severityOrder[b.severity] ?? 2
    if (sa !== sb) return sa - sb
    return a.flowId.localeCompare(b.flowId)
  })

  const totalChecks = flowResults.reduce((sum, f) => sum + f.totalChecks, 0)
  const passedChecks = flowResults.reduce((sum, f) => sum + f.passedChecks, 0)

  return {
    generatedAt: new Date().toISOString(),
    flows: flowResults,
    overallScore: totalChecks > 0 ? passedChecks / totalChecks : 1,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    findings,
  }
}

/**
 * Convert interaction audit findings into improvement records in auditStateService.
 * This bridges the interaction audit output into the existing prioritization pipeline.
 *
 * @param {Array} findings - from runInteractionAudit().findings
 * @returns {Array} created improvement records
 */
function findingsToImprovements(findings) {
  const improvements = []

  for (const finding of findings) {
    const primaryFile = finding.components[0] || 'unknown'
    const priority = finding.severity === 'high' ? 80 : finding.severity === 'medium' ? 50 : 20

    const imp = addImprovement({
      filePath: primaryFile,
      functionName: `[flow:${finding.flowId}] ${finding.stepLabel}`,
      dimension: inferDimensionFromFlow(finding.flowId),
      suggestion: `${finding.checkLabel}: ${finding.reason}`,
      priority,
      source: 'interaction-audit',
    })
    improvements.push(imp)
  }

  return improvements
}

/**
 * Map flow IDs to scoring dimensions for integration with the rubric.
 */
function inferDimensionFromFlow(flowId) {
  switch (flowId) {
    case 'navigation': return 'uxQuality'
    case 'scanning': return 'completeness'
    case 'order-entry': return 'accuracy'
    case 'alerts': return 'completeness'
    case 'settings': return 'uxQuality'
    default: return null
  }
}

/**
 * Full interaction audit pipeline: run all flows → generate findings → create improvements → return report.
 * Designed to be called from the researchLoop scoring engine.
 *
 * @returns {Promise<{ report, improvements }>}
 */
async function runInteractionAuditPipeline() {
  const report = await runInteractionAudit()
  const improvements = findingsToImprovements(report.findings)

  return {
    report,
    improvements,
    summary: {
      flowsAudited: report.flows.length,
      overallScore: Math.round(report.overallScore * 100),
      totalFindings: report.findings.length,
      highSeverity: report.findings.filter((f) => f.severity === 'high').length,
      mediumSeverity: report.findings.filter((f) => f.severity === 'medium').length,
      lowSeverity: report.findings.filter((f) => f.severity === 'low').length,
      improvementsCreated: improvements.length,
    },
  }
}

// ── Exports ─────────────────────────────────────────────────────────────

export {
  INTERACTION_FLOWS,
  CHECK_REGISTRY,
  auditFlow,
  runInteractionAudit,
  findingsToImprovements,
  runInteractionAuditPipeline,
}
