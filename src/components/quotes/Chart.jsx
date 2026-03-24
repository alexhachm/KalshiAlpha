import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts'
import { generateOHLCV, subscribeToOHLCV } from '../../services/dataFeed'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
  subscribeToGroupChanges,
  unsubscribeToGroupChanges,
} from '../../services/linkBus'
import { registerWindowTicker, unregisterWindowTicker } from '../../hooks/useHotkeyDispatch'
import ChartSettings from './ChartSettings'
import './Chart.css'

const TICKERS = [
  'FED-DEC23', 'CPI-NOV', 'GDP-Q4', 'NVDA-EARN', 'BTC-100K-EOY',
  'TSLA-DELIV', 'SPX-4600-DEC', 'UNEMP-RATE', 'GOOG-ANTITRUST',
]

const TIMEFRAMES = [
  { label: '1m', minutes: 1 },
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '1h', minutes: 60 },
  { label: '4h', minutes: 240 },
  { label: '1D', minutes: 1440 },
]

const CHART_TYPES = [
  { label: 'Candle', value: 'candlestick' },
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' },
]

const OVERLAY_COLORS = [
  '#00d2ff', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#a855f7', '#ff8c42', '#4ecdc4', '#f472b6',
]

const DEFAULT_SETTINGS = {
  chartType: 'candlestick',
  timeframe: 5,
  showGrid: true,
  crosshairStyle: 'normal',
  upColor: '#00c853',
  downColor: '#ff1744',
  showVolume: true,
  overlayMode: false,
  overlayTickers: [],
  indicators: [
    { type: 'SMA', period: 20, color: '#00d2ff', enabled: true },
    { type: 'EMA', period: 20, color: '#ffd93d', enabled: true },
  ],
}

// Read CSS custom property values for chart canvas theming
function getThemeColors() {
  const s = getComputedStyle(document.documentElement)
  const v = (name) => s.getPropertyValue(name).trim()
  return {
    bgPrimary: v('--bg-primary') || '#060910',
    textSecondary: v('--text-secondary') || '#7c8698',
    borderSubtle: v('--border-subtle') || '#111827',
    borderColor: v('--border-color') || '#1a2233',
    textMuted: v('--text-muted') || '#4e5869',
    bgSecondary: v('--bg-secondary') || '#0d1119',
    accentWin: v('--accent-win') || '#3ecf8e',
    accentLoss: v('--accent-loss') || '#e05c5c',
  }
}

function normalizeToPercent(candles) {
  if (!candles || !candles.length) return []
  const base = candles[0]?.close
  if (base == null || base === 0) return candles.map((c) => ({ time: c.time, value: 0 }))
  return candles.map((c) => ({
    time: c.time,
    value: ((c.close - base) / base) * 100,
  }))
}

function loadSettings(windowId) {
  try {
    const raw = localStorage.getItem(`chart_settings_${windowId}`)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(windowId, settings) {
  try {
    localStorage.setItem(`chart_settings_${windowId}`, JSON.stringify(settings))
  } catch {
    // localStorage may be unavailable
  }
}

function calcSMA(candles, period) {
  if (!candles || candles.length < period) return []
  const result = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) sum += candles[i - j].close
    result.push({ time: candles[i].time, value: sum / period })
  }
  return result
}

function calcEMA(candles, period) {
  if (!candles || candles.length < period) return []
  const k = 2 / (period + 1)
  let sum = 0
  for (let i = 0; i < period; i++) sum += candles[i].close
  let ema = sum / period
  const result = [{ time: candles[period - 1].time, value: ema }]
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k)
    result.push({ time: candles[i].time, value: ema })
  }
  return result
}

function Chart({ windowId }) {
  const outerRef = useRef(null)
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const mainSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const overlaySeriesRef = useRef([])
  const themeRef = useRef(null)
  const basePricesRef = useRef({})
  const indicatorSeriesRef = useRef([])
  const indicatorCandlesRef = useRef([])

  const [ticker, setTicker] = useState(TICKERS[0])
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [crosshairData, setCrosshairData] = useState(null)

  // Report current ticker to hotkey dispatch registry
  useEffect(() => {
    registerWindowTicker(windowId, ticker)
    return () => unregisterWindowTicker(windowId)
  }, [windowId, ticker])

  const overlayTickersKey = (settings.overlayTickers || []).join(',')
  const indicatorsKey = JSON.stringify(settings.indicators || [])

  // Toggle settings via right-click header event
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const handler = () => setShowSettings((s) => !s)
    el.addEventListener('toggle-settings', handler)
    return () => el.removeEventListener('toggle-settings', handler)
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettings(windowId, next)
      return next
    })
  }, [windowId])

  const handleSettingsSave = useCallback((newSettings) => {
    setSettings(newSettings)
    saveSettings(windowId, newSettings)
    setShowSettings(false)
  }, [windowId])

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      volumeSeriesRef.current = null
      overlaySeriesRef.current = []
    }

    const isOverlay = settings.overlayMode
    const showVol = settings.showVolume && !isOverlay
    const theme = getThemeColors()
    themeRef.current = theme

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: theme.bgPrimary },
        textColor: theme.textSecondary,
        fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: settings.showGrid ? theme.borderSubtle : 'transparent',
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: settings.showGrid ? theme.borderSubtle : 'transparent',
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: settings.crosshairStyle === 'normal'
          ? CrosshairMode.Normal
          : CrosshairMode.Magnet,
        vertLine: { color: theme.textMuted, width: 1, style: LineStyle.Dashed, labelBackgroundColor: theme.bgSecondary },
        horzLine: { color: theme.textMuted, width: 1, style: LineStyle.Dashed, labelBackgroundColor: theme.bgSecondary },
      },
      rightPriceScale: {
        borderColor: theme.borderColor,
        scaleMargins: { top: 0.1, bottom: showVol ? 0.25 : 0.05 },
      },
      timeScale: {
        borderColor: theme.borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
    })

    chartRef.current = chart

    if (isOverlay) {
      // --- Overlay mode: percent-normalized line series ---
      const allTickers = [ticker, ...(settings.overlayTickers || [])]
      const overlayArr = []

      allTickers.forEach((t, i) => {
        const candles = generateOHLCV(t, 200, settings.timeframe)
        if (!candles.length) return

        basePricesRef.current[t] = candles[0].close
        const normalized = normalizeToPercent(candles)

        const series = chart.addSeries(LineSeries, {
          color: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
          lineWidth: i === 0 ? 2 : 1.5,
          title: t,
          priceFormat: {
            type: 'custom',
            formatter: (p) => p.toFixed(2) + '%',
            minMove: 0.01,
          },
        })
        series.setData(normalized)

        if (i === 0) {
          mainSeriesRef.current = series
        }
        overlayArr.push({ ticker: t, series })
      })

      overlaySeriesRef.current = overlayArr

      // Crosshair for overlay: show % values for each ticker
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData) {
          setCrosshairData(null)
          return
        }
        const vals = {}
        overlayArr.forEach(({ ticker: t, series }, i) => {
          const d = param.seriesData.get(series)
          if (d) vals[t] = { value: d.value, colorIdx: i }
        })
        if (Object.keys(vals).length > 0) {
          setCrosshairData({ overlay: true, data: vals })
        }
      })
    } else {
      // --- Normal mode: candlestick/line/area ---
      let mainSeries
      if (settings.chartType === 'candlestick') {
        mainSeries = chart.addSeries(CandlestickSeries, {
          upColor: settings.upColor,
          downColor: settings.downColor,
          borderUpColor: settings.upColor,
          borderDownColor: settings.downColor,
          wickUpColor: settings.upColor,
          wickDownColor: settings.downColor,
        })
      } else if (settings.chartType === 'line') {
        mainSeries = chart.addSeries(LineSeries, {
          color: theme.accentWin,
          lineWidth: 2,
          crosshairMarkerRadius: 4,
        })
      } else {
        mainSeries = chart.addSeries(AreaSeries, {
          topColor: theme.accentWin + '66',
          bottomColor: theme.accentWin + '00',
          lineColor: theme.accentWin,
          lineWidth: 2,
        })
      }
      mainSeriesRef.current = mainSeries

      // Volume series
      let volumeSeries = null
      if (settings.showVolume) {
        volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#555',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        })
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        })
        volumeSeriesRef.current = volumeSeries
      }

      // Load historical data
      const candles = generateOHLCV(ticker, 200, settings.timeframe)

      if (settings.chartType === 'candlestick') {
        mainSeries.setData(candles)
      } else {
        mainSeries.setData(candles.map((c) => ({ time: c.time, value: c.close })))
      }

      if (volumeSeries) {
        volumeSeries.setData(
          candles.map((c) => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? theme.accentWin + '4D' : theme.accentLoss + '4D',
          }))
        )
      }

      // EMA/SMA indicator overlays
      indicatorCandlesRef.current = candles
      const indicators = settings.indicators || []
      const indArr = []
      indicators.forEach((ind) => {
        if (!ind.enabled) return
        const data = ind.type === 'EMA' ? calcEMA(candles, ind.period) : calcSMA(candles, ind.period)
        if (!data.length) return
        const series = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 1,
          title: `${ind.type}(${ind.period})`,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
          lastValueVisible: false,
          priceLineVisible: false,
        })
        series.setData(data)
        indArr.push({ type: ind.type, period: ind.period, series, lastEMA: data[data.length - 1].value })
      })
      indicatorSeriesRef.current = indArr

      // Crosshair move handler for data display
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData) {
          setCrosshairData(null)
          return
        }
        const data = param.seriesData.get(mainSeries)
        if (data) {
          setCrosshairData(data)
        }
      })
    }

    // Fit content
    chart.timeScale().fitContent()

    return () => {
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      volumeSeriesRef.current = null
      overlaySeriesRef.current = []
      indicatorSeriesRef.current = []
    }
  }, [ticker, settings.chartType, settings.timeframe, settings.showGrid, settings.crosshairStyle, settings.upColor, settings.downColor, settings.showVolume, settings.overlayMode, overlayTickersKey, indicatorsKey])

  // Subscribe to real-time updates
  useEffect(() => {
    if (settings.overlayMode) {
      const allTickers = [ticker, ...(settings.overlayTickers || [])]
      const unsubs = []

      allTickers.forEach((t) => {
        const unsub = subscribeToOHLCV(t, settings.timeframe, (bar) => {
          const entry = overlaySeriesRef.current.find((o) => o.ticker === t)
          if (!entry) return
          const base = basePricesRef.current[t]
          if (!base) return
          entry.series.update({
            time: bar.time,
            value: ((bar.close - base) / base) * 100,
          })
        })
        unsubs.push(unsub)
      })

      return () => unsubs.forEach((u) => u())
    }

    // Normal mode
    const unsub = subscribeToOHLCV(ticker, settings.timeframe, (bar) => {
      if (!mainSeriesRef.current) return
      if (settings.chartType === 'candlestick') {
        mainSeriesRef.current.update(bar)
      } else {
        mainSeriesRef.current.update({ time: bar.time, value: bar.close })
      }
      if (volumeSeriesRef.current) {
        const t = themeRef.current || {}
        volumeSeriesRef.current.update({
          time: bar.time,
          value: bar.volume,
          color: bar.close >= bar.open ? (t.accentWin || '#3ecf8e') + '4D' : (t.accentLoss || '#e05c5c') + '4D',
        })
      }
      // Update indicator series incrementally
      const buf = indicatorCandlesRef.current
      if (buf.length > 0) {
        if (bar.time === buf[buf.length - 1].time) {
          buf[buf.length - 1] = bar
        } else {
          buf.push(bar)
        }
        indicatorSeriesRef.current.forEach((indEntry) => {
          const { type, period, series } = indEntry
          if (buf.length < period) return
          if (type === 'SMA') {
            const slice = buf.slice(-period)
            const val = slice.reduce((s, c) => s + c.close, 0) / period
            series.update({ time: bar.time, value: val })
          } else {
            const k = 2 / (period + 1)
            indEntry.lastEMA = bar.close * k + indEntry.lastEMA * (1 - k)
            series.update({ time: bar.time, value: indEntry.lastEMA })
          }
        })
      }
    })
    return unsub
  }, [ticker, settings.timeframe, settings.chartType, settings.overlayMode, overlayTickersKey])

  // Emit ticker ownership update to Shell
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('window-ticker-update', { detail: { id: windowId, ticker } }))
  }, [windowId, ticker])

  // Track live color group — reacts to runtime relink/unlink
  const [colorGroup, setColorGroup] = useState(() => getColorGroup(windowId))

  useEffect(() => {
    setColorGroup(getColorGroup(windowId))
    const handleGroupChange = ({ windowId: changedId, colorId }) => {
      if (changedId === windowId) setColorGroup(colorId)
    }
    subscribeToGroupChanges(handleGroupChange)
    return () => unsubscribeToGroupChanges(handleGroupChange)
  }, [windowId])

  // Color link bus integration
  const handleLinkEvent = useCallback(
    ({ ticker: linkedTicker }) => {
      if (linkedTicker && linkedTicker !== ticker) {
        setTicker(linkedTicker)
      }
    },
    [ticker]
  )

  useEffect(() => {
    if (!colorGroup) return
    subscribeToLink(colorGroup, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorGroup, handleLinkEvent)
  }, [colorGroup, windowId, handleLinkEvent])

  const handleTickerChange = useCallback((e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    emitLinkedMarket(windowId, newTicker)
  }, [windowId])

  // Format crosshair data for OHLC display (normal mode only)
  const formatOHLC = (d) => {
    if (!d) return null
    if ('open' in d) {
      const change = d.close - d.open
      const pct = d.open !== 0 ? ((change / d.open) * 100).toFixed(2) : '0.00'
      return { o: d.open, h: d.high, l: d.low, c: d.close, change, pct }
    }
    return { value: d.value }
  }

  const ohlc = crosshairData && !crosshairData.overlay ? formatOHLC(crosshairData) : null
  const selectorTickers = useMemo(() => TICKERS.includes(ticker) ? TICKERS : [ticker, ...TICKERS], [ticker])
  const availableTickers = useMemo(() => selectorTickers.filter((t) => t !== ticker), [selectorTickers, ticker])

  // STUB: VWAP indicator — Volume Weighted Average Price overlay
  // SOURCE: "VWAP calculation for intraday trading", institutional benchmarks
  // IMPLEMENT WHEN: Volume data is available per candle from dataFeed
  // STEPS: 1. Compute cumulative (price * volume) / cumulative volume
  //        2. Add LineSeries overlay in chart initialization effect
  //        3. Update VWAP line on each new bar
  //        4. Add VWAP toggle in chart toolbar, persist in settings

  // STUB: EMA/SMA indicators — Exponential/Simple Moving Average overlays
  // SOURCE: "Technical analysis moving averages", standard TA library
  // IMPLEMENT WHEN: Chart settings support indicator configuration
  // STEPS: 1. Compute EMA(period) = price * k + prev_ema * (1-k), where k = 2/(period+1)
  //        2. Support multiple periods (9, 21, 50, 200) with distinct colors
  //        3. Add/remove indicator LineSeries dynamically
  //        4. Add indicator panel in settings with period/color picker

  // STUB: Bollinger Bands — volatility band overlay
  // SOURCE: "Bollinger Bands calculation", John Bollinger's technical analysis
  // IMPLEMENT WHEN: EMA indicator is implemented (prerequisite)
  // STEPS: 1. Compute SMA(20) as middle band
  //        2. Upper = SMA + 2 * stddev(20), Lower = SMA - 2 * stddev(20)
  //        3. Render as AreaSeries (shaded band) + LineSeries (middle)
  //        4. Add squeeze detection (bandwidth < threshold) with visual indicator

  // STUB: Data gap handling — detect and mark gaps in OHLCV data
  // SOURCE: "Financial chart data gap visualization", TradingView gap handling
  // IMPLEMENT WHEN: Real market data has trading hours / session breaks
  // STEPS: 1. Detect time gaps > 2x expected interval between candles
  //        2. Insert visual gap marker (dashed vertical line)
  //        3. Optionally fill gaps with interpolated data (configurable)
  //        4. Add gap statistics display in chart info bar

  return (
    <div ref={outerRef} className="chart-component">
      <div className="chart-toolbar">
        <select className="chart-ticker-select" value={ticker} onChange={handleTickerChange}>
          {(TICKERS.includes(ticker) ? TICKERS : [ticker, ...TICKERS]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className="chart-timeframes">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.minutes}
              className={`chart-tf-btn ${settings.timeframe === tf.minutes ? 'chart-tf-btn--active' : ''}`}
              onClick={() => updateSetting('timeframe', tf.minutes)}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="chart-type-btns">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              className={`chart-type-btn ${!settings.overlayMode && settings.chartType === ct.value ? 'chart-type-btn--active' : ''}`}
              disabled={settings.overlayMode}
              onClick={() => updateSetting('chartType', ct.value)}
            >
              {ct.label}
            </button>
          ))}
          <button
            className={`chart-type-btn ${settings.overlayMode ? 'chart-type-btn--active' : ''}`}
            onClick={() => updateSetting('overlayMode', !settings.overlayMode)}
            title="Overlay comparison mode"
          >
            Overlay
          </button>
        </div>

        <button
          className="chart-settings-btn"
          onClick={() => setShowSettings((s) => !s)}
          title="Chart Settings"
        >
          &#9881;
        </button>
      </div>

      {/* Overlay legend */}
      {settings.overlayMode && (
        <div className="chart-overlay-legend">
          {[ticker, ...(settings.overlayTickers || [])].map((t, i) => (
            <span key={t} className="chart-overlay-legend-item">
              <span
                className="chart-overlay-legend-swatch"
                style={{ backgroundColor: OVERLAY_COLORS[i % OVERLAY_COLORS.length] }}
              />
              <span>{t}</span>
              {crosshairData?.overlay && crosshairData.data[t] != null && (
                <span className={crosshairData.data[t].value >= 0 ? 'text-win' : 'text-loss'}>
                  {crosshairData.data[t].value >= 0 ? '+' : ''}{crosshairData.data[t].value.toFixed(2)}%
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* OHLC data bar (normal mode only) */}
      {ohlc && (
        <div className="chart-ohlc-bar">
          {'o' in ohlc ? (
            <>
              <span>O <span className="chart-ohlc-val">{ohlc.o}</span></span>
              <span>H <span className="chart-ohlc-val">{ohlc.h}</span></span>
              <span>L <span className="chart-ohlc-val">{ohlc.l}</span></span>
              <span>C <span className="chart-ohlc-val">{ohlc.c}</span></span>
              <span className={ohlc.change >= 0 ? 'text-win' : 'text-loss'}>
                {ohlc.change >= 0 ? '+' : ''}{ohlc.change.toFixed(2)} ({ohlc.pct}%)
              </span>
            </>
          ) : (
            <span>Price: <span className="chart-ohlc-val">{ohlc.value}</span></span>
          )}
        </div>
      )}

      <div className="chart-canvas-container" ref={chartContainerRef} />

      {/* Settings panel */}
      {showSettings && (
        <ChartSettings
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          availableTickers={availableTickers}
        />
      )}
    </div>
  )
}

export default React.memo(Chart)
