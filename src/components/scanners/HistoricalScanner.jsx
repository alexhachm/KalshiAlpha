import React, { useState, useCallback, useMemo } from 'react'
import { useHistoricalScan } from '../../hooks/useKalshiData'
import { emitLinkedMarket } from '../../services/linkBus'
import { useGridCustomization } from '../../hooks/useGridCustomization'
import * as settingsStore from '../../services/settingsStore'
import GridSettingsPanel from '../GridSettingsPanel'
import { Settings, Download, Search, Save, X } from 'lucide-react'
import './HistoricalScanner.css'

const PATTERNS = [
  { key: 'all', label: 'All Patterns' },
  { key: 'volume-breakout', label: 'Volume Breakout' },
  { key: 'price-reversal', label: 'Price Reversal' },
  { key: 'momentum-shift', label: 'Momentum Shift' },
  { key: 'mean-reversion', label: 'Mean Reversion' },
  { key: 'gap-fill', label: 'Gap Fill' },
]

const HS_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'ticker', label: 'Ticker' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'signal', label: 'Signal' },
  { key: 'roi', label: 'ROI %', numeric: true },
  { key: 'confidence', label: 'Confidence', numeric: true },
]

const FONT_SIZE_MAP = { small: 11, medium: 12, large: 14 }

const SIGNAL_FILTERS = [
  { key: 'all', label: 'All Signals' },
  { key: 'bull', label: 'Bullish' },
  { key: 'bear', label: 'Bearish' },
  { key: 'neutral', label: 'Neutral' },
]

const DEFAULT_SETTINGS = {
  maxResults: 100,
  defaultRangeDays: 30,
  showConfidenceBars: true,
  sortColumn: 'date',
  sortAsc: false,
  signalFilter: 'all',   // all | bull | bear | neutral
  minRoi: '',             // '' = no filter, number = threshold
  minConfidence: 1,       // 1-5
}

function sortResults(results, column, asc) {
  return [...results].sort((a, b) => {
    let cmp = 0
    if (column === 'date') {
      cmp = new Date(a.date) - new Date(b.date)
    } else if (column === 'roi') {
      cmp = a.roi - b.roi
    } else if (column === 'confidence') {
      cmp = a.confidence - b.confidence
    } else {
      cmp = String(a[column] || '').localeCompare(String(b[column] || ''))
    }
    // Stable sort: use id as tie-breaker to prevent row flickering
    if (cmp === 0) {
      cmp = String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, { numeric: true })
    }
    return asc ? cmp : -cmp
  })
}

function normalizeSignal(signal) {
  const normalized = String(signal || '').toLowerCase()
  if (normalized === 'bullish') return 'bull'
  if (normalized === 'bearish') return 'bear'
  if (normalized === 'bull' || normalized === 'bear' || normalized === 'neutral') return normalized
  return 'neutral'
}

function escapeCSVField(val) {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function ConfidenceBars({ level }) {
  return (
    <span className="hs-confidence" title={`Confidence: ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`hs-confidence-bar${i <= level ? ' hs-confidence-bar--active' : ''}`}
        />
      ))}
    </span>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDefaultDateRange(rangeDays) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - rangeDays)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

function exportToCSV(results) {
  const headers = ['Date', 'Ticker', 'Pattern', 'Signal', 'ROI %', 'Confidence']
  const rows = results.map((r) => [
    r.date, r.ticker, r.pattern, r.signal, r.roi.toFixed(2), r.confidence,
  ].map(escapeCSVField))
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `historical-scan-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function HistoricalScanner({ windowId }) {
  const { results, scanning, scan } = useHistoricalScan()
  const grid = useGridCustomization(`histScanner-${windowId}`, HS_COLUMNS)
  const fontSizePx = FONT_SIZE_MAP[grid.fontSize] || 12
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`historical-scanner-settings-${windowId}`)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [showSettings, setShowSettings] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState('all')
  const [presets, setPresets] = useState(() => settingsStore.getScannerPresets('historical'))
  const [presetName, setPresetName] = useState('')
  const [showPresetSave, setShowPresetSave] = useState(false)

  const defaultRange = getDefaultDateRange(settings.defaultRangeDays)
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)

  // Persist settings
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(`historical-scanner-settings-${windowId}`, JSON.stringify(next))
      return next
    })
  }, [windowId])

  const dateRangeValid = !startDate || !endDate || startDate <= endDate

  const handleScan = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) return
    setHasScanned(true)
    await scan({
      startDate,
      endDate,
      pattern: selectedPattern,
      maxResults: settings.maxResults,
    })
  }, [scan, startDate, endDate, selectedPattern, settings.maxResults])

  const handleRowClick = useCallback(
    (ticker) => {
      emitLinkedMarket(windowId, ticker)
    },
    [windowId]
  )

  const handleSortClick = useCallback((column) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        sortColumn: column,
        sortAsc: prev.sortColumn === column ? !prev.sortAsc : false,
      }
      localStorage.setItem(`historical-scanner-settings-${windowId}`, JSON.stringify(next))
      return next
    })
  }, [windowId])

  // Preset helpers
  const handleSavePreset = useCallback(() => {
    const name = presetName.trim()
    if (!name) return
    const filters = {
      pattern: selectedPattern,
      signalFilter: settings.signalFilter,
      minRoi: settings.minRoi,
      minConfidence: settings.minConfidence,
      rangeDays: settings.defaultRangeDays,
    }
    settingsStore.saveScannerPreset('historical', name, filters)
    setPresets(settingsStore.getScannerPresets('historical'))
    setPresetName('')
    setShowPresetSave(false)
  }, [presetName, selectedPattern, settings])

  const handleLoadPreset = useCallback((preset) => {
    if (preset.filters.pattern) setSelectedPattern(preset.filters.pattern)
    setSettings((prev) => {
      const next = {
        ...prev,
        signalFilter: preset.filters.signalFilter ?? prev.signalFilter,
        minRoi: preset.filters.minRoi ?? prev.minRoi,
        minConfidence: preset.filters.minConfidence ?? prev.minConfidence,
        defaultRangeDays: preset.filters.rangeDays ?? prev.defaultRangeDays,
      }
      localStorage.setItem(`historical-scanner-settings-${windowId}`, JSON.stringify(next))
      return next
    })
  }, [windowId])

  const handleDeletePreset = useCallback((name) => {
    settingsStore.deleteScannerPreset('historical', name)
    setPresets(settingsStore.getScannerPresets('historical'))
  }, [])

  // Filter and sort results
  const minRoiNum = settings.minRoi !== '' ? Number(settings.minRoi) : null
  const sorted = useMemo(() => {
    const filtered = results.filter((r) => {
      if (settings.signalFilter !== 'all' && normalizeSignal(r.signal) !== settings.signalFilter) return false
      if (minRoiNum != null && Number.isFinite(minRoiNum) && r.roi < minRoiNum) return false
      if (settings.minConfidence > 1 && r.confidence < settings.minConfidence) return false
      return true
    })
    return sortResults(filtered, settings.sortColumn, settings.sortAsc)
  }, [results, settings.sortColumn, settings.sortAsc, settings.signalFilter, minRoiNum, settings.minConfidence])

  return (
    <div className="historical-scanner">
      {/* Criteria bar */}
      <div className="hs-criteria">
        <div className="hs-criteria-row">
          <label className="hs-label">From</label>
          <input
            type="date"
            className="hs-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className="hs-label">To</label>
          <input
            type="date"
            className="hs-date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="hs-criteria-row">
          <label className="hs-label">Pattern</label>
          <select
            className="hs-pattern-select"
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
          >
            {PATTERNS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <label className="hs-label">Signal</label>
          <select
            className="hs-pattern-select"
            value={settings.signalFilter}
            onChange={(e) => updateSetting('signalFilter', e.target.value)}
          >
            {SIGNAL_FILTERS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            className={`hs-scan-btn${scanning ? ' hs-scan-btn--scanning' : ''}`}
            onClick={handleScan}
            disabled={scanning || !dateRangeValid}
            title={!dateRangeValid ? 'Start date must be before end date' : ''}
          >
            <Search size={12} />
            {scanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
        <div className="hs-criteria-row">
          <label className="hs-label">Min ROI %</label>
          <input
            type="number"
            className="hs-roi-input"
            placeholder="Any"
            value={settings.minRoi}
            onChange={(e) => updateSetting('minRoi', e.target.value)}
            step="any"
          />
          <label className="hs-label">Min Conf.</label>
          <select
            className="hs-pattern-select"
            value={settings.minConfidence}
            onChange={(e) => updateSetting('minConfidence', Number(e.target.value))}
          >
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5 only</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="hs-toolbar">
        <span className="hs-count">
          {sorted.length !== results.length
            ? `${sorted.length}/${results.length} results`
            : `${results.length} result${results.length !== 1 ? 's' : ''}`}
        </span>
        <div className="hs-toolbar-right">
          {/* Presets */}
          {presets.length > 0 && (
            <select
              className="hs-preset-select"
              value=""
              onChange={(e) => {
                const p = presets.find((pr) => pr.name === e.target.value)
                if (p) handleLoadPreset(p)
              }}
            >
              <option value="" disabled>Presets</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          )}
          {showPresetSave ? (
            <span className="hs-preset-save">
              <input
                className="hs-preset-input"
                type="text"
                placeholder="Preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset() }}
                autoFocus
              />
              <button className="hs-toolbar-btn" onClick={handleSavePreset} title="Save preset">
                <Save size={12} />
              </button>
              <button className="hs-toolbar-btn" onClick={() => setShowPresetSave(false)} title="Cancel">
                <X size={12} />
              </button>
            </span>
          ) : (
            <button
              className="hs-toolbar-btn"
              onClick={() => setShowPresetSave(true)}
              title="Save current criteria as preset"
            >
              <Save size={13} />
            </button>
          )}
          <button
            className="hs-toolbar-btn"
            onClick={() => exportToCSV(sorted)}
            disabled={results.length === 0}
            title="Export to CSV"
          >
            <Download size={13} />
          </button>
          <button
            className={`hs-toolbar-btn${showSettings ? ' hs-toolbar-btn--active' : ''}`}
            onClick={() => setShowSettings((s) => !s)}
            title="Scanner settings"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="hs-settings">
          <div className="hs-settings-row">
            <label>Max Results</label>
            <input
              type="number"
              min={10}
              max={500}
              value={settings.maxResults}
              onChange={(e) => updateSetting('maxResults', Math.max(10, Math.min(500, Number(e.target.value))))}
            />
          </div>
          <div className="hs-settings-row">
            <label>Default Range (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.defaultRangeDays}
              onChange={(e) => updateSetting('defaultRangeDays', Math.max(1, Math.min(365, Number(e.target.value))))}
            />
          </div>
          <div className="hs-settings-row">
            <label>Confidence Bars</label>
            <input
              type="checkbox"
              checked={settings.showConfidenceBars}
              onChange={(e) => updateSetting('showConfidenceBars', e.target.checked)}
            />
          </div>
          {presets.length > 0 && (
            <div className="hs-settings-row">
              <label>Saved Presets</label>
              <div className="hs-preset-list">
                {presets.map((p) => (
                  <span key={p.name} className="hs-preset-chip">
                    <span
                      className="hs-preset-chip-name"
                      onClick={() => handleLoadPreset(p)}
                      title={`Load "${p.name}"`}
                    >
                      {p.name}
                    </span>
                    <button
                      className="hs-preset-chip-del"
                      onClick={() => handleDeletePreset(p.name)}
                      title={`Delete "${p.name}"`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <GridSettingsPanel {...grid} />
        </div>
      )}

      {/* Results table */}
      <div className="hs-table-wrap" style={{ fontSize: fontSizePx }}>
        <table className="hs-table">
          <thead>
            <tr>
              {grid.visibleColumns.map((col) => {
                const fullIdx = grid.columns.findIndex((c) => c.key === col.key)
                const isDragOver = grid.dragState.dragging && grid.dragState.overIndex === fullIdx
                return (
                  <th
                    key={col.key}
                    className={`hs-th${settings.sortColumn === col.key ? ' hs-th--sorted' : ''}${isDragOver ? ' drag-over' : ''}`}
                    onClick={() => handleSortClick(col.key)}
                    draggable
                    onDragStart={() => grid.onDragStart(fullIdx)}
                    onDragOver={(e) => { e.preventDefault(); grid.onDragOver(fullIdx) }}
                    onDragEnd={grid.onDragEnd}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                    {settings.sortColumn === col.key && (
                      <span className="hs-sort-arrow">
                        {settings.sortAsc ? ' \u25B2' : ' \u25BC'}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const rowStyle = grid.getRowStyle(row) || {}
              return (
                <tr
                  key={row.id}
                  className="hs-row"
                  onClick={() => handleRowClick(row.ticker)}
                  style={{ ...rowStyle, height: grid.rowHeight }}
                >
                  {grid.visibleColumns.map((col) => {
                    let content, className = `hs-cell-${col.key}`
                    switch (col.key) {
                      case 'date': content = formatDate(row.date); break
                      case 'ticker': content = <span className="scanner-ticker-link">{row.ticker}</span>; break
                      case 'pattern': content = row.pattern; break
                      case 'signal':
                        {
                          const signal = normalizeSignal(row.signal)
                          content = signal.toUpperCase()
                          className += ` hs-signal-${signal}`
                        }
                        break
                      case 'roi':
                        content = `${row.roi >= 0 ? '+' : ''}${row.roi.toFixed(1)}%`
                        className += ` ${row.roi >= 0 ? 'hs-roi-positive' : 'hs-roi-negative'}`
                        break
                      case 'confidence':
                        content = settings.showConfidenceBars
                          ? <ConfidenceBars level={row.confidence} />
                          : `${row.confidence}/5`
                        break
                      default: content = null
                    }
                    return (
                      <td key={col.key} className={className} style={col.width ? { width: col.width } : undefined}>
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={grid.visibleColumns.length} className="hs-empty">
                  {scanning
                    ? 'Scanning historical data...'
                    : hasScanned
                      ? 'No matches found'
                      : 'Set criteria and click Scan to search'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(HistoricalScanner)
