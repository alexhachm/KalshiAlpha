import React, { useRef, useEffect, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts'
import { generateOHLCV, subscribeToOHLCV } from '../../services/mockData'
import {
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  getColorGroup,
} from '../../services/linkBus'
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

const DEFAULT_SETTINGS = {
  chartType: 'candlestick',
  timeframe: 5,
  showGrid: true,
  crosshairStyle: 'normal',
  upColor: '#00c853',
  downColor: '#ff1744',
  showVolume: true,
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

function Chart({ windowId }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const mainSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const resizeObserverRef = useRef(null)

  const [ticker, setTicker] = useState(TICKERS[0])
  const [settings, setSettings] = useState(() => loadSettings(windowId))
  const [showSettings, setShowSettings] = useState(false)
  const [crosshairData, setCrosshairData] = useState(null)

  // Persist settings
  useEffect(() => {
    saveSettings(windowId, settings)
  }, [windowId, settings])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      volumeSeriesRef.current = null
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#121212' },
        textColor: '#a0a0a0',
        fontFamily: "'Roboto Mono', 'SF Mono', Consolas, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: settings.showGrid ? '#1e1e1e' : 'transparent',
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: settings.showGrid ? '#1e1e1e' : 'transparent',
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: settings.crosshairStyle === 'normal'
          ? CrosshairMode.Normal
          : CrosshairMode.Magnet,
        vertLine: { color: '#555', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#2a2a2a' },
        horzLine: { color: '#555', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#2a2a2a' },
      },
      rightPriceScale: {
        borderColor: '#333',
        scaleMargins: { top: 0.1, bottom: settings.showVolume ? 0.25 : 0.05 },
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
    })

    chartRef.current = chart

    // Create main series based on chart type
    let mainSeries
    if (settings.chartType === 'candlestick') {
      mainSeries = chart.addCandlestickSeries({
        upColor: settings.upColor,
        downColor: settings.downColor,
        borderUpColor: settings.upColor,
        borderDownColor: settings.downColor,
        wickUpColor: settings.upColor,
        wickDownColor: settings.downColor,
      })
    } else if (settings.chartType === 'line') {
      mainSeries = chart.addLineSeries({
        color: '#00d2ff',
        lineWidth: 2,
        crosshairMarkerRadius: 4,
      })
    } else {
      // area
      mainSeries = chart.addAreaSeries({
        topColor: 'rgba(0, 210, 255, 0.4)',
        bottomColor: 'rgba(0, 210, 255, 0.0)',
        lineColor: '#00d2ff',
        lineWidth: 2,
      })
    }
    mainSeriesRef.current = mainSeries

    // Volume series
    let volumeSeries = null
    if (settings.showVolume) {
      volumeSeries = chart.addHistogramSeries({
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
          color: c.close >= c.open ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 23, 68, 0.3)',
        }))
      )
    }

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

    // Fit content
    chart.timeScale().fitContent()

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect()
        chartRef.current.resize(width, height)
      }
    })
    ro.observe(chartContainerRef.current)
    resizeObserverRef.current = ro

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [ticker, settings.chartType, settings.timeframe, settings.showGrid, settings.crosshairStyle, settings.upColor, settings.downColor, settings.showVolume])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = subscribeToOHLCV(ticker, settings.timeframe, (bar) => {
      if (!mainSeriesRef.current) return
      if (settings.chartType === 'candlestick') {
        mainSeriesRef.current.update(bar)
      } else {
        mainSeriesRef.current.update({ time: bar.time, value: bar.close })
      }
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time: bar.time,
          value: bar.volume,
          color: bar.close >= bar.open ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 23, 68, 0.3)',
        })
      }
    })
    return unsub
  }, [ticker, settings.timeframe, settings.chartType])

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
    const colorId = getColorGroup(windowId)
    if (!colorId) return
    subscribeToLink(colorId, handleLinkEvent, windowId)
    return () => unsubscribeFromLink(colorId, handleLinkEvent)
  }, [windowId, handleLinkEvent])

  const handleTickerChange = (e) => {
    const newTicker = e.target.value
    setTicker(newTicker)
    emitLinkedMarket(windowId, newTicker)
  }

  // Format crosshair data for OHLC display
  const formatOHLC = (d) => {
    if (!d) return null
    if ('open' in d) {
      const change = d.close - d.open
      const pct = d.open !== 0 ? ((change / d.open) * 100).toFixed(2) : '0.00'
      return { o: d.open, h: d.high, l: d.low, c: d.close, change, pct }
    }
    return { value: d.value }
  }

  const ohlc = formatOHLC(crosshairData)

  return (
    <div className="chart-component">
      <div className="chart-toolbar">
        <select className="chart-ticker-select" value={ticker} onChange={handleTickerChange}>
          {TICKERS.map((t) => (
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
              className={`chart-type-btn ${settings.chartType === ct.value ? 'chart-type-btn--active' : ''}`}
              onClick={() => updateSetting('chartType', ct.value)}
            >
              {ct.label}
            </button>
          ))}
        </div>

        <button
          className="chart-settings-btn"
          onClick={() => setShowSettings((s) => !s)}
          title="Chart Settings"
        >
          &#9881;
        </button>
      </div>

      {/* OHLC data bar */}
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
        <div className="chart-settings-panel">
          <div className="chart-settings-header">
            <span>Chart Settings</span>
            <button className="chart-settings-close" onClick={() => setShowSettings(false)}>x</button>
          </div>
          <div className="chart-settings-body">
            <label className="chart-setting-row">
              <span>Grid Lines</span>
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => updateSetting('showGrid', e.target.checked)}
              />
            </label>
            <label className="chart-setting-row">
              <span>Volume</span>
              <input
                type="checkbox"
                checked={settings.showVolume}
                onChange={(e) => updateSetting('showVolume', e.target.checked)}
              />
            </label>
            <label className="chart-setting-row">
              <span>Crosshair</span>
              <select
                value={settings.crosshairStyle}
                onChange={(e) => updateSetting('crosshairStyle', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="magnet">Magnet</option>
              </select>
            </label>
            <label className="chart-setting-row">
              <span>Up Color</span>
              <input
                type="color"
                value={settings.upColor}
                onChange={(e) => updateSetting('upColor', e.target.value)}
              />
            </label>
            <label className="chart-setting-row">
              <span>Down Color</span>
              <input
                type="color"
                value={settings.downColor}
                onChange={(e) => updateSetting('downColor', e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Chart)
