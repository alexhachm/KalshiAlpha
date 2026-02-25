# Time & Sales Component Spec

## Purpose
Real-time trade ticker showing individual trades as they occur. Standard T&S display used in trading terminals.

## Location
- Component: `src/components/quotes/TimeSale.jsx`
- Styles: `src/components/quotes/TimeSale.css`
- Mock data: `subscribeToTimeSales()` in `src/services/mockData.js`
- Window type: `time-sale`

## Columns
| Column | Width | Alignment | Format |
|--------|-------|-----------|--------|
| Time | 95px fixed | Left | HH:MM:SS.ms |
| Price | 50px fixed | Right | N¢ |
| Size | 55px fixed | Right | Integer |
| Side | Flex | Right | BUY / SELL |

## Color Coding
- **BUY** rows: `--accent-win` (green)
- **SELL** rows: `--accent-loss` (red)
- **Large trades** (above threshold): bold + text-shadow glow

## Features
- Ticker selector dropdown with linkBus color linking
- Pause/resume trade stream
- Clear trade list
- Auto-scroll to newest trades
- Size filter (minimum trade size to display)
- Large trade highlighting (configurable threshold)

## Settings (gear icon, inline panel)
| Setting | Type | Default | Range |
|---------|------|---------|-------|
| Max Rows | number | 200 | 50-1000 |
| Font Size | number | 11 | 9-16 |
| Min Size Filter | number | 0 | 0-1000 |
| Large Trade Threshold | number | 500 | 100-5000 |
| Auto-Scroll | checkbox | true | — |

Settings persist to `localStorage` key: `timesale_settings_{windowId}`

## Mock Data
`subscribeToTimeSales(ticker, callback)` generates trades at random intervals (100-500ms) with:
- Price: random walk from last price
- Side: 50/50 BUY/SELL
- Size: weighted distribution (60% small 1-50, 30% medium 50-200, 10% large 200-1000)

## Integration
- Registered in `WindowManager.jsx` COMPONENT_REGISTRY as `'time-sale'`
- Opens via Quotes > Time/Sale menu
- Default size: 300x400 (from Shell.jsx TYPE_SIZES)
- linkBus: subscribes to color group for cross-window market syncing
