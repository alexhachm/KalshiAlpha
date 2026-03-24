# quotes-chart Domain Knowledge

## Bollinger Bands (2026-03-23)
- calcBollingerBands(candles, period, multiplier) returns { middle, upper, lower } arrays of { time, value }
- hexToRgba(hex, alpha) helper converts #rrggbb to rgba() string for lightweight-charts color props
- BB AreaSeries (upper fill) + two LineSeries (lower dashed, middle dashed) added after main series
- Squeeze detection: markers on lowerSeries via setMarkers() — works in lightweight-charts v5
- bbSeriesRef.current stores { upper, lower, middle, period, multiplier } for real-time incremental updates
- bollingerKey = JSON.stringify(settings.bollinger) used in both useEffect dep arrays
- ChartSettings.jsx: updateBollinger() helper pattern mirrors updateIndicator()
- Period/multiplier/color/squeeze fields shown conditionally only when bollinger.enabled is true
- Settings persist automatically through existing handleSettingsSave -> saveSettings flow
