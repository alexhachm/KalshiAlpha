# Market Clock

## Purpose
Precision clock for trading. Displays current time in 24-hour military format with optional millisecond precision and date display.

## Default Display
- `HH:MM:SS` in 24-hour military time
- Timezone label below (LOCAL or UTC)

## Features
- Real-time clock updating every second (or every frame when milliseconds enabled)
- Optional millisecond display down to 100th of a millisecond
- UTC or local timezone toggle
- Configurable font size (16px–64px)
- Optional date display (YYYY-MM-DD)

## Settings (gear icon / right-click header)
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Timezone | select | local | Local or UTC |
| Milliseconds | checkbox | off | Show time to .XXX00 precision |
| Show Date | checkbox | off | Display YYYY-MM-DD below time |
| Font Size | range | 32px | Clock digit size (16–64px) |

## Persistence
Settings stored in `localStorage` with key `market-clock-settings-{windowId}`.

## Files
- `src/components/scanners/MarketClock.jsx` — clock display component
- `src/components/scanners/MarketClockSettings.jsx` — settings overlay panel
- `src/components/scanners/MarketClock.css` — styles

## Implementation Notes
- Uses `requestAnimationFrame` when milliseconds enabled for smooth updates
- Falls back to `setInterval(1000)` when milliseconds disabled (performance)
- Registered in `WindowManager.jsx` under `market-clock` type
- Default window size: 200x100 (set in Shell.jsx TYPE_SIZES)
