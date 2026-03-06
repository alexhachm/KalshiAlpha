# KalshiAlpha — Comprehensive UI Audit

> Compiled 2026-03-06. Source audits by worker-2, worker-3, worker-4 (Opus).
> Covers: Every UI component, service, hook, and design token in the application.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Global Layout and Shell](#2-global-layout-and-shell)
   - [Shell](#shell)
   - [WindowManager](#windowmanager)
   - [Window](#window)
   - [PopoutWindow](#popoutwindow)
   - [SnapManager](#snapmanager)
   - [TitleBar](#titlebar)
   - [MenuBar](#menubar)
3. [Color Palette Inventory](#3-color-palette-inventory)
4. [Typography Inventory](#4-typography-inventory)
5. [Spacing System](#5-spacing-system)
6. [Trade and Quotes Components](#6-trade-and-quotes-components)
   - [OrderBook](#orderbook)
   - [Montage](#montage)
   - [PriceLadder](#priceladder)
   - [Positions](#positions)
   - [TradeLog](#tradelog)
   - [EventLog](#eventlog)
   - [NewsChat](#newschat)
   - [Accounts](#accounts)
   - [Chart](#chart)
   - [ChartSettings](#chartsettings)
   - [TimeSale](#timesale)
   - [MarketViewer](#marketviewer)
   - [Settings Companions (Trade)](#settings-companions-trade)
7. [Scanner, Alert and Analytics Components](#7-scanner-alert-and-analytics-components)
   - [LiveScanner](#livescanner)
   - [HistoricalScanner](#historicalscanner)
   - [AlertTrigger](#alerttrigger)
   - [MarketClock](#marketclock)
   - [MarketClockSettings](#marketclocksettings)
8. [Services and Data Flow](#8-services-and-data-flow)
   - [alertService.js](#alertservicejs)
   - [alertEngine.worker.js](#alertengineworkerjs)
   - [analyticsService.js](#analyticsservicejs)
   - [analyticsCalc.js](#analyticscalcjs)
   - [omsEngine.js](#omsenginejs)
   - [omsService.js](#omsservicejs)
   - [dataFeed.js](#datafeedjs)
   - [hotkeyStore.js](#hotkeystorejs)
   - [hotkeyLanguage.js](#hotkeylanguagejs)
   - [settingsStore.js](#settingsstorejs)
   - [linkBus.js](#linkbusjs)
9. [Hooks](#9-hooks)
   - [useKalshiData.js](#usekalshidatajs)
   - [useGridCustomization.js](#usegridcustomizationjs)
   - [useHotkeyDispatch.js](#usehotkeydispatchjs)
10. [Global Settings Panel](#10-global-settings-panel)
11. [GridSettingsPanel](#11-gridsettingspanel)
12. [HotkeyManager](#12-hotkeymanager)
13. [Workflow Analysis per Tool](#13-workflow-analysis-per-tool)
14. [Interactive States Catalog](#14-interactive-states-catalog)
15. [Data Display Patterns](#15-data-display-patterns)
16. [Cross-Component Patterns](#16-cross-component-patterns)
17. [Known Issues and Pain Points](#17-known-issues-and-pain-points)

---

## 1. Executive Summary

KalshiAlpha is a desktop trading terminal (React + Vite) for Kalshi binary options. The UI follows a windowed desktop paradigm with draggable, resizable, mergeable windows managed by a central Shell component.

**Architecture:** Shell → MenuBar + WindowManager → Window (draggable/resizable containers) → Component (OrderBook, Montage, Chart, etc.). Services are module-level singletons communicating via `Set<callback>` listener patterns. Data flows through `dataFeed.js` (real/mock adapter) → React hooks → components.

**Design System:** Dark theme with 5-tier background hierarchy (`#060910` → `#243044`), gold accent (`#d4a853`), green/red for buy/sell (`#3ecf8e`/`#e05c5c`). Two font families (Inter sans-serif, JetBrains Mono monospace), 5-step type scale (9.5px–14px), 5-step spacing scale (2px–14px).

**Key Findings:**
- **6 CSS gaps**: Window tab bar classes (6 classes), Accounts component (entire CSS file missing), PopoutWindow hardcoded colors, Chart canvas hardcoded colors, flash keyframes missing for Montage, market status indicators defined but never rendered
- **Token violations**: MarketClockSettings inline style injection with hardcoded px; all Settings Companion panels use hardcoded px; Chart canvas colors diverge from design tokens; MarketViewer has one hardcoded `20px` font-size
- **Data flow inconsistencies**: LiveScanner and TimeSale import from `mockData` directly instead of `dataFeed`, bypassing the real/mock adapter
- **Dead CSS**: AlertTrigger has `.at-row--triggered/pending/expired` and `.at-status-badge` classes never applied in JSX; MarketClock has `.mc-status` classes never rendered
- **Z-index stack**: Ranges from 1 (resize handles) to 100000 (context menu), with potential layering issues between settings overlay (10000) and menu bar (10001)

---

## 2. Global Layout and Shell

### Shell

**Files:** `src/components/Shell.jsx`, `src/components/Shell.css`

#### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.shell-workspace` | background | `var(--bg-primary)` (#060910) |

#### Layout
| Property | Value |
|----------|-------|
| `.shell` display | `flex` |
| `.shell` flex-direction | `column` |
| `.shell` width | `100vw` |
| `.shell` height | `100vh` |
| `.shell` overflow | `hidden` |
| `.shell-workspace` flex | `1` |
| `.shell-workspace` position | `relative` |
| `.shell-workspace` overflow | `hidden` |

#### Stacking
- Shell is the root flex container — no z-index.
- MenuBar and WindowManager sit inside this flexbox.

#### JS Constants (Shell.jsx)
- `DEFAULT_WIDTH`: 400, `DEFAULT_HEIGHT`: 300
- `INITIAL_X`: 50, `INITIAL_Y`: 10
- `TYPE_SIZES`: Per-type default sizes (mirrors CSS vars but used in JS — see [Spacing System](#5-spacing-system))

#### Workflow
1. Shell renders: `<MenuBar>` (fixed height top bar), `<div.shell-workspace>` (flexible area for windows), and `<SettingsPanel>` (modal overlay).
2. User opens windows from MenuBar → dispatches to `windowReducer`.
3. Reducer supports: OPEN_WINDOW, CLOSE_WINDOW, FOCUS_WINDOW, MERGE_WINDOWS, SET_ACTIVE_TAB, DETACH_TAB, POP_OUT_WINDOW, POP_IN_WINDOW.
4. `useHotkeyDispatch` hook provides keyboard navigation (see [useHotkeyDispatch](#usehotkeydispatchjs)).
5. Custom events (`open-window`) allow child components to open windows.

---

### WindowManager

**File:** `src/components/WindowManager.jsx`

- No CSS file — renders directly into parent `.shell-workspace`.
- Maps over `windows` object, rendering either `<Window>` or `<PopoutWindow>` per entry.
- Uses `COMPONENT_REGISTRY` map to resolve `win.type` → React component.

#### Component Registry
```
login → Placeholder, montage → Montage, price-ladder → PriceLadder,
accounts → Accounts, positions → Positions, trade-log → TradeLog,
event-log → EventLog, order-book → OrderBook, chart → Chart,
time-sale → TimeSale, market-viewer → MarketViewer, news-chat → NewsChat,
live-scanner → LiveScanner, historical-scanner → HistoricalScanner,
alert-trigger → AlertTrigger, market-clock → MarketClock,
hotkey-config → HotkeyManager
```

#### Placeholder Component
- Inline `<div className="window-placeholder">` with centered text.
- Styled in Window.css: center-aligned, `--font-size-lg`, `--text-muted`.

---

### Window

**Files:** `src/components/Window.jsx`, `src/components/Window.css`

#### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.window` | background | `var(--bg-secondary)` (#0d1119) |
| `.window` | border | `1px solid var(--border-color)` (#1a2233) |
| `.window:focus-within` | border-color | `var(--accent-highlight)` (#d4a853) |
| `.window-titlebar` | background | `var(--bg-tertiary)` (#151c28) |
| `.window-title` | color | `var(--text-secondary)` (#7c8698) |
| `.window-close-btn` | color | `var(--text-muted)` (#4e5869) |
| `.window-close-btn:hover` | background | `var(--accent-sell)` (#e05c5c) |
| `.window-close-btn:hover` | color | `var(--text-primary)` (#cdd1da) |
| `.window-color-chip` | border | `1px solid var(--border-subtle)` (#111827) |
| `.window-color-chip` | background | dynamic (JS: LINK_COLORS[idx].hex or #555) |
| `.window-color-picker` | background | `var(--bg-secondary)` |
| `.window-color-picker` | border | `1px solid var(--border-color)` |
| `.window-color-swatch--active` | border | `2px solid var(--text-heading)` (#e8ecf4) |
| `.window-color-unlink` | color | `var(--text-secondary)` → hover: `var(--text-primary)` |
| `.window-context-menu` | background | `var(--bg-secondary)` |
| `.window-context-menu` | border | `1px solid var(--border-color)` |
| `.window-context-item` | color | `var(--text-secondary)` → hover: `var(--text-primary)` |
| `.window-context-item:hover` | background | `var(--bg-hover)` |
| `.window-context-separator` | background | `var(--border-color)` |
| `.window--pinned` | border-color | `var(--accent-highlight)` |

#### Fonts
| Element | Size | Family | Weight |
|---------|------|--------|--------|
| `.window-title` | `--font-size-sm` | `--font-sans` | normal |
| `.window-color-unlink` | `--font-size-xs` | — | — |
| `.window-context-menu` | `--font-size-md` | — | — |
| `.window-placeholder` | `--font-size-lg` | — | — |
| `.window-pin-icon` | `--font-size-xs` | — | — |

#### Padding / Margin / Gap
| Element | Property | Value |
|---------|----------|-------|
| `.window-titlebar` | padding | `0 var(--spacing-sm)` (0 4px) |
| `.window-body` | padding | `var(--spacing-sm)` (4px) |
| `.window-color-chip` | margin-right | `var(--spacing-sm)` (4px) |
| `.window-color-picker` | padding | `var(--spacing-md)` (6px) |
| `.window-color-picker-swatches` | gap | `var(--spacing-sm)` (4px) |
| `.window-close-btn` | padding | `var(--spacing-xs)` (2px) |
| `.window-controls` | gap | `var(--spacing-xs)` (2px), margin-left `var(--spacing-sm)` |
| `.window-context-menu` | padding | `var(--spacing-xs) 0` (2px 0) |
| `.window-context-item` | padding | `var(--spacing-md) var(--spacing-lg)` (6px 10px) |

#### Border-Radius
| Element | border-radius |
|---------|---------------|
| `.window` | `var(--radius-md)` (3px) |
| `.window-close-btn` | `var(--radius-sm)` (2px) |
| `.window-color-chip` | `var(--radius-sm)` (2px) |
| `.window-color-picker` | `var(--radius-sm)` (2px) |
| `.window-color-swatch` | `50%` (circle) |
| `.window-context-menu` | `var(--radius-sm)` (2px) |

#### Shadows
| Element | Shadow |
|---------|--------|
| `.window` | `var(--shadow-sm)` |
| `.window-color-chip:hover` | `var(--shadow-chip)` |
| `.window-color-swatch:hover` | `var(--shadow-chip)` |
| `.window-color-swatch--active` | `var(--shadow-chip)` |
| `.window-color-picker` | `var(--shadow-md)` |
| `.window-context-menu` | `var(--shadow-md)` |

#### Z-Ordering
| Element | z-index |
|---------|---------|
| `.window` | dynamic from `zIndex` prop (increments on focus) |
| `.window--pinned` | `99999` (inline style) |
| `.resize-handle` | `1` |
| `.window-color-picker` | `1000` |
| `.window-context-menu` | `100000` |

#### Layout
- `.window`: `position: absolute`, `display: flex`, `flex-direction: column`, overflow hidden
- `.window-titlebar`: `display: flex`, `align-items: center`, `height: var(--window-titlebar-height)` (22px), `flex-shrink: 0`
- `.window-body`: `flex: 1`, `overflow: auto`

#### Resize Handles
- 8 handles: n, s, e, w, ne, nw, se, sw
- Edge handles: `--resize-handle-size` (4px) thick, inset -3px
- Corner handles: 10px × 10px, positioned at corners with -3px inset

#### Drag/Resize Behavior
- **Drag**: mousedown on titlebar → mousemove calculates delta → applies snap via [SnapManager](#snapmanager) → updates DOM directly (posRef, not state) → re-renders on mouseup
- **Resize**: mousedown on handle → mousemove adjusts size with min constraints → updates SnapManager → DOM direct manipulation → re-renders on mouseup
- **Group drag**: If window has color link, emits drag deltas to other linked windows via [linkBus](#linkbusjs)
- **Merge detection**: During drag, checks if center-top overlaps another window's titlebar area → highlights target with `.window--merge-target` class → on drop, calls `onMerge(sourceId, targetId)`

#### Interactive Elements
1. **Color chip** (titlebar left) — click: toggle color picker; shift+click: cycle colors
2. **Color picker dropdown** — swatches + "Unlink" button
3. **Close button** (titlebar right) — X icon from lucide-react
4. **Tab bar** (below titlebar, for merged windows) — tab labels + detach (×) buttons
5. **Context menu** (right-click titlebar) — Pop Out, Pin to Top, Hide Title Bar, Settings
6. **Resize handles** (8 edges/corners)
7. **Double-click titlebar** → pop out window

#### Missing CSS (Bug)
The following classes are referenced in JSX but have **no CSS rules** in Window.css:
- `.window-tab-bar`, `.window-tab`, `.window-tab--active`, `.window-tab-label`, `.window-tab-detach`, `.window--merge-target`

---

### PopoutWindow

**File:** `src/components/PopoutWindow.jsx`

#### Colors (Inline Styles)
| Element | Property | Value |
|---------|----------|-------|
| `w.document.body` | backgroundColor | `#121212` (hardcoded — does NOT match `--bg-primary` #060910) |
| `w.document.body` | color | `#e0e0e0` (hardcoded — does NOT match `--text-primary` #cdd1da) |
| `#popout-root div` | background | `var(--bg-secondary)` |

#### Fonts (Inline Styles)
| Element | fontFamily |
|---------|-----------|
| `w.document.body` | `'Inter', system-ui, sans-serif` (hardcoded) |

#### Layout
- Opens `window.open()` with specified width/height, centered on screen
- Creates a `#popout-root` div: 100% width, 100vh height, flex column
- Body: margin 0, padding 0, overflow hidden

#### Behavior
- Copies all `<style>` and `<link[rel=stylesheet]>` from parent
- Copies all CSS custom properties from `:root` computed style
- Registers in module-level `openPopouts` Set for cleanup on parent unload
- Calls `onClose` when popup is closed by user
- Renders children via `createPortal()`

---

### SnapManager

**File:** `src/components/SnapManager.jsx`

#### Constants
| Name | Value |
|------|-------|
| `DEFAULT_SNAP_DISTANCE` | `10` (pixels) |
| `TITLEBAR_HEIGHT` | `32` (pixels — refers to Electron titlebar, not `--window-titlebar-height` which is 22px) |

#### API
| Function | Description |
|----------|-------------|
| `register(id, rect)` | Add window to registry |
| `unregister(id)` | Remove window from registry |
| `update(id, rect)` | Update window position/size |
| `getRect(id)` | Get window rect |
| `calculateSnap(id, x, y, w, h, snapDist)` | Returns snapped `{ x, y, didSnapX, didSnapY }` |
| `findMergeTarget(draggedId, dragX, dragY, dragWidth)` | Returns target window id if center-top overlaps |
| `findOpenPosition(width, height)` | Finds non-overlapping position for new window |

#### Snap Logic
1. Screen edges: left (x=0), right (x+w=screenW), top (y=0), bottom (y+h=screenH-32)
2. Other windows: left↔right, right↔left, left↔left, right↔right (same for vertical)
3. Default snap distance: 10px

#### Position Finding (`findOpenPosition`)
- Scans grid: step = max(width, 100) × max(height, 80)
- Tests for overlap with all registered windows
- Falls back to cascade: `(50 + offset, 10 + offset)` where offset = `(count % 10) * 30`

---

### TitleBar

**Files:** `src/components/TitleBar.jsx`, `src/components/TitleBar.css`

#### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.titlebar` | background | `var(--bg-primary)` (#060910) |
| `.titlebar` | border-bottom | `1px solid var(--border-color)` (#1a2233) |
| `.titlebar-title` | color | `var(--text-secondary)` (#7c8698) |
| `.titlebar-btn` | color | `var(--text-secondary)` (#7c8698) |
| `.titlebar-btn:hover` | background | `var(--bg-tertiary)` (#151c28) |
| `.titlebar-btn:hover` | color | `var(--text-primary)` (#cdd1da) |
| `.titlebar-btn:active` | background | `var(--border-color)` (#1a2233) |
| `.titlebar-btn--close:hover` | background | `var(--titlebar-close-hover)` (#e81123) |
| `.titlebar-btn--close:hover` | color | `var(--text-heading)` (#e8ecf4) |
| `.titlebar-btn--close:active` | background | `var(--titlebar-close-active)` (#bf0f1d) |

#### Fonts
| Element | Size | Weight | Letter-Spacing |
|---------|------|--------|----------------|
| `.titlebar-title` | `--font-size-sm` (10.5px) | 500 | 0.5px |

#### Layout
- `.titlebar`: flex, align-items center, justify-content space-between, height `32px` (hardcoded), flex-shrink 0
- `-webkit-app-region: drag` for Electron window drag
- Only renders if `window.electronAPI` exists (Electron only)

---

### MenuBar

**Files:** `src/components/MenuBar.jsx`, `src/components/MenuBar.css`

#### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.menu-bar` | background | `var(--bg-secondary)` (#0d1119) |
| `.menu-bar` | border-bottom | `1px solid var(--border-color)` |
| `.menu-item` | color | `var(--text-secondary)` (#7c8698) |
| `.menu-item:hover` | background | `var(--bg-hover)` (#1c2538) |
| `.menu-item:hover` | color | `var(--text-primary)` (#cdd1da) |
| `.menu-item--active` | background | `var(--bg-active)` (#243044) |
| `.menu-item--active` | color | `var(--text-heading)` (#e8ecf4) |
| `.menu-dropdown` | background | `var(--bg-secondary)` |
| `.menu-dropdown` | border | `1px solid var(--border-color)` |
| `.menu-dropdown-item` | color | `var(--text-secondary)` |
| `.menu-dropdown-item:hover` | background | `var(--bg-hover)` |
| `.menu-dropdown-item:hover` | color | `var(--text-primary)` |

#### Fonts
| Element | Size | Letter-Spacing | Text-Transform |
|---------|------|----------------|----------------|
| `.menu-bar` | `--font-size-sm` (10.5px) | — | — |
| `.menu-item` | inherited | 0.5px | uppercase |
| `.menu-dropdown-item` | `--font-size-sm` (10.5px) | — | — |

#### Layout
| Element | Properties |
|---------|-----------|
| `.menu-bar` | flex, align-items center, height `var(--menu-bar-height)` (26px), position relative |
| `.menu-item` | position relative, height 100%, flex with center alignment |
| `.menu-dropdown` | position absolute, top 100%, left 0, min-width 170px |

#### Z-Ordering
| Element | z-index |
|---------|---------|
| `.menu-bar` | `10001` |
| `.menu-dropdown` | `10002` |

#### Menu Structure
```
Login (action: login)
Trade → Montage, Price Ladder, Accounts, Positions, Trade Log, Event Log, Order Book
Quotes → Chart, Time/Sale, Market Viewer, News/Chat
Scanners → Live, Historical, Alert & Trigger, Market Clock
Setup → Hotkey Config
Settings (action: settings)
```

---

## 3. Color Palette Inventory

All CSS custom properties from `:root` in `src/index.css`:

### Core Backgrounds
| Variable | Value | Description |
|----------|-------|-------------|
| `--bg-primary` | `#060910` | Deep blue-black, main app background |
| `--bg-secondary` | `#0d1119` | Slightly lighter, panel/window backgrounds |
| `--bg-tertiary` | `#151c28` | Third tier, titlebars, button backgrounds |
| `--bg-hover` | `#1c2538` | Hover state background |
| `--bg-active` | `#243044` | Active/pressed state background |
| `--bg-input` | `#080c12` | Input field background |
| `--bg-row-alt` | `#0a0f17` | Alternating table row |

### Surface & Elevation Layers
| Variable | Value | Description | Used? |
|----------|-------|-------------|-------|
| `--bg-surface` | `#101520` | Surface layer | **No** — defined but unused |
| `--bg-elevated` | `#1a2332` | Elevated surface | **No** — defined but unused |
| `--bg-overlay` | `rgba(2, 4, 8, 0.82)` | Overlay backdrop | Yes |

### Text
| Variable | Value | Description |
|----------|-------|-------------|
| `--text-primary` | `#cdd1da` | Main text, crisp contrast |
| `--text-heading` | `#e8ecf4` | Headings, emphasis |
| `--text-secondary` | `#7c8698` | Secondary text |
| `--text-muted` | `#4e5869` | Muted/disabled text |
| `--text-label` | `#5a657a` | Label text |
| `--text-accent` | `#d4a853` | Gold accent text |

### Accents
| Variable | Value | Description |
|----------|-------|-------------|
| `--accent-win` | `#3ecf8e` | Green — win/positive |
| `--accent-loss` | `#e05c5c` | Red — loss/negative |
| `--accent-highlight` | `#d4a853` | Gold — highlight/accent |
| `--accent-buy` | `#3ecf8e` | Buy side (same value as `--accent-win`) |
| `--accent-sell` | `#e05c5c` | Sell side (same value as `--accent-loss`) |
| `--accent-warning` | `#e5952e` | Orange warning |
| `--accent-info` | `#5490d4` | Blue informational |
| `--accent-neutral` | `#656e80` | Neutral grey |

### Borders
| Variable | Value | Description | Used? |
|----------|-------|-------------|-------|
| `--border-color` | `#1a2233` | Standard border | Yes |
| `--border-subtle` | `#111827` | Subtle/thin border | Yes |
| `--border-focus` | `#d4a853` | Focus ring (= accent-highlight) | Yes |
| `--border-active` | `#2a3a55` | Active state border | **No** — defined but unused |

### Shadows
| Variable | Value |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.45), 0 0 1px rgba(0,10,30,0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,5,20,0.3)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,5,20,0.4)` |
| `--shadow-chip` | `0 1px 4px rgba(0,0,0,0.5)` |
| `--overlay-bg` | `rgba(2, 4, 8, 0.8)` |

### Glow Effects
| Variable | Value | Used? |
|----------|-------|-------|
| `--shadow-glow-win` | `0 0 12px rgba(62,207,142,0.3)` | In MarketClock CSS (not rendered) |
| `--shadow-glow-loss` | `0 0 12px rgba(224,92,92,0.3)` | In MarketClock CSS (not rendered) |
| `--shadow-glow-highlight` | `0 0 12px rgba(212,168,83,0.25)` | **No** — unused |
| `--shadow-glow-info` | `0 0 10px rgba(84,144,212,0.2)` | **No** — unused |

### Titlebar Close Button
| Variable | Value |
|----------|-------|
| `--titlebar-close-hover` | `#e81123` |
| `--titlebar-close-active` | `#bf0f1d` |

### Flash Animations
| Variable | Value |
|----------|-------|
| `--flash-win-bg` | `rgba(62,207,142,0.22)` |
| `--flash-loss-bg` | `rgba(224,92,92,0.22)` |

### Scrollbar
| Variable | Value |
|----------|-------|
| `--scrollbar-thumb` | `#1e2a3c` |
| `--scrollbar-thumb-hover` | `#2e3d55` |
| `--scrollbar-track` | `var(--bg-primary)` |

### Context Menu
| Variable | Value | Used? |
|----------|-------|-------|
| `--context-menu-bg` | `var(--bg-secondary)` | **No** — context menus use `var(--bg-secondary)` directly |
| `--context-menu-border` | `var(--border-color)` | **No** — same |
| `--context-menu-shadow` | `var(--shadow-lg)` | **No** — same |

### Radii
| Variable | Value |
|----------|-------|
| `--radius-sm` | `2px` |
| `--radius-md` | `3px` |
| `--radius-lg` | `5px` |

### Transitions
| Variable | Value |
|----------|-------|
| `--transition-fast` | `80ms ease` |
| `--transition-normal` | `150ms ease` |

### Hardcoded Colors Outside Token System
| Location | Color | Should Be |
|----------|-------|-----------|
| PopoutWindow body bg | `#121212` | `var(--bg-primary)` (#060910) |
| PopoutWindow body text | `#e0e0e0` | `var(--text-primary)` (#cdd1da) |
| Chart canvas background | `#121212` | `var(--bg-primary)` |
| Chart canvas text | `#a0a0a0` | `var(--text-secondary)` |
| Chart grid lines | `#1e1e1e` | `var(--border-subtle)` |
| Chart crosshair | `#555` | `var(--text-muted)` |
| Chart scale borders | `#333` | `var(--border-color)` |
| Chart candle up | `#00c853` | `var(--accent-win)` (#3ecf8e) |
| Chart candle down | `#ff1744` | `var(--accent-loss)` (#e05c5c) |
| Chart line color | `#00d2ff` | No token exists |
| Chart volume up | `rgba(0, 200, 83, 0.3)` | Based on `--accent-win` |
| Chart volume down | `rgba(255, 23, 68, 0.3)` | Based on `--accent-loss` |
| MarketClockSettings save btn | `#fff` | `var(--bg-primary)` |

---

## 4. Typography Inventory

### CSS Variable Font Sizes
| Variable | Value |
|----------|-------|
| `--font-size-xs` | `9.5px` |
| `--font-size-sm` | `10.5px` |
| `--font-size-md` | `11.5px` |
| `--font-size-lg` | `12.5px` |
| `--font-size-xl` | `14px` |

### Font Families
| Variable | Value |
|----------|-------|
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif` |
| `--font-mono` | `'JetBrains Mono', 'SF Mono', Consolas, monospace` |

### Body Defaults (index.css)
- Font family: `var(--font-sans)`
- Font size: `var(--font-size-md)` = 11.5px
- Line height: `1.4`
- Letter spacing: `0.01em`
- Font smoothing: `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`

### Font Size Usage Across All Components

| Component / Class | Size | Family | Weight | Line-Height | Letter-Spacing |
|-------------------|------|--------|--------|-------------|----------------|
| **Body** | `--font-size-md` (11.5px) | `--font-sans` | normal | 1.4 | 0.01em |
| **TitleBar .titlebar-title** | `--font-size-sm` (10.5px) | `--font-sans` | 500 | — | 0.5px |
| **MenuBar .menu-bar** | `--font-size-sm` (10.5px) | inherited (sans) | — | — | — |
| **MenuBar .menu-item** | inherited (10.5px) | inherited | — | — | 0.5px |
| **MenuBar .menu-dropdown-item** | `--font-size-sm` (10.5px) | inherited | — | — | — |
| **Window .window-title** | `--font-size-sm` (10.5px) | `--font-sans` | — | — | — |
| **Window .window-context-menu** | `--font-size-md` (11.5px) | inherited | — | — | — |
| **Window .window-color-unlink** | `--font-size-xs` (9.5px) | inherited | — | — | — |
| **Window .window-placeholder** | `--font-size-lg` (12.5px) | inherited | — | — | — |
| **Window .window-pin-icon** | `--font-size-xs` (9.5px) | inherited | — | — | — |
| **MarketViewer .market-viewer** | `--font-size-xs` (9.5px) | `--font-mono` | — | — | — |
| **MarketViewer .mv-price-value** | **20px** (hardcoded) | `--font-mono` | 700 | — | — |
| **SettingsPanel .settings-title** | `--font-size-lg` (12.5px) | — | 600 | — | — |
| **SettingsPanel .settings-section-title** | `--font-size-xs` (9.5px) | — | 600 | — | 0.5px |
| **SettingsPanel .settings-tab** | `--font-size-md` (11.5px) | — | — | — | — |
| **GridSettingsPanel .gs-section-title** | `--font-size-xs` (9.5px) | — | 600 | — | 0.5px |
| **HotkeyManager .hk** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-btn** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-binding-delete** | `--font-size-xl` (14px) | — | — | 1 | — |
| **OrderBook root** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **OrderBook tab text** | `--font-size-xs` (9.5px) | — | 600 | — | — |
| **OrderBook th** | `--font-size-xs` (9.5px) | — | 700 | — | 0.5px |
| **Montage root** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **Montage book header** | `--font-size-xs` (9.5px) | — | — | — | 1px |
| **Montage buttons** | `--font-size-md` (11.5px) | — | 700 | — | — |
| **PriceLadder root** | `--font-size-lg` (12.5px) | `--font-mono` | — | — | — |
| **PriceLadder cell text** | `--font-size-md` (11.5px) | — | — | — | — |
| **Positions title** | `--font-size-sm` (10.5px) | — | 700 | — | 0.5px |
| **EventLog root** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **NewsChat root** | `--font-size-lg` (12.5px) | `--font-mono` | — | — | — |
| **Chart toolbar buttons** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **Chart internal font** | `11px` (hardcoded) | `'Roboto Mono'` (hardcoded) | — | — | — |
| **TimeSale FONT_SIZE_MAP** | 10/11/13px (inline) | `--font-mono` | — | — | — |
| **LiveScanner root** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **HistoricalScanner root** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **AlertTrigger** | token-controlled | `--font-mono` | — | — | — |
| **MarketClock time** | 16-64px (inline range) | — | 600 | — | 2px |

### Hardcoded Font Sizes (Non-Variable)
| Location | Size | Notes |
|----------|------|-------|
| MarketViewer `.mv-price-value` | `20px` | Only hardcoded size in component CSS |
| Chart canvas `fontSize` | `11` | lightweight-charts config |
| TimeSale `FONT_SIZE_MAP` | 10/11/13px | Inline style, not using tokens |
| MarketClock `.mc-time` | 16-64px | Range slider, inline style |
| All Settings Companions | `12px`/`13px` | Inline injected styles |

### Font Weight Summary
- **400**: table headers (`.mv-depth-table th`)
- **500**: titlebar title, active settings tab, OHLC values
- **600**: section titles, binding keys, editor titles, headings, search ticker, settings title, filter buttons, tab text, position title, trade type badges
- **700**: ticker name, price values, book headers, table headers, buttons, settings panel headers

---

## 5. Spacing System

### CSS Variable Spacing Scale
| Variable | Value |
|----------|-------|
| `--spacing-xs` | `2px` |
| `--spacing-sm` | `4px` |
| `--spacing-md` | `6px` |
| `--spacing-lg` | `10px` |
| `--spacing-xl` | `14px` |

### Layout Constants
| Variable | Value |
|----------|-------|
| `--menu-bar-height` | `26px` |
| `--window-titlebar-height` | `22px` |
| `--window-min-width` | `200px` |
| `--window-min-height` | `150px` |
| `--window-default-width` | `400px` |
| `--window-default-height` | `300px` |
| `--resize-handle-size` | `4px` |
| `--cascade-offset` | `30px` |

### Component Default Sizes
| Variable | Value |
|----------|-------|
| `--montage-width` | `350px` |
| `--montage-height` | `400px` |
| `--price-ladder-width` | `280px` |
| `--price-ladder-height` | `500px` |
| `--chart-width` | `600px` |
| `--chart-height` | `400px` |
| `--market-viewer-width` | `350px` |
| `--market-viewer-height` | `400px` |
| `--scanner-width` | `500px` |
| `--scanner-height` | `350px` |
| `--time-sale-width` | `300px` |
| `--time-sale-height` | `400px` |
| `--market-clock-width` | `200px` |
| `--market-clock-height` | `100px` |
| `--event-log-width` | `500px` |
| `--event-log-height` | `250px` |
| `--accounts-width` | `500px` |
| `--accounts-height` | `300px` |
| `--positions-width` | `500px` |
| `--positions-height` | `300px` |
| `--trade-log-width` | `550px` |
| `--trade-log-height` | `350px` |
| `--news-chat-width` | `400px` |
| `--news-chat-height` | `350px` |
| `--login-width` | `360px` |
| `--login-height` | `280px` |
| `--hotkey-config-width` | `450px` |
| `--hotkey-config-height` | `400px` |
| `--alert-trigger-width` | `450px` |
| `--alert-trigger-height` | `350px` |
| `--historical-scanner-width` | `500px` |
| `--historical-scanner-height` | `350px` |
| `--live-scanner-width` | `500px` |
| `--live-scanner-height` | `350px` |
| `--settings-width` | `500px` |
| `--settings-height` | `450px` |

**Note:** These CSS variables are defined but NOT consumed by CSS. The actual sizing lives in `Shell.jsx`'s `TYPE_SIZES` JS constant, which duplicates the same values. The CSS variables serve as documentation only.

---

## 6. Trade and Quotes Components

### OrderBook

**Files:** `src/components/trade/OrderBook.jsx` (507 lines), `OrderBook.css` (275 lines)

#### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Tab bar:** `flex; justify-content: space-between; height: 28px; border-bottom: 1px solid var(--border-color); padding: 0 var(--spacing-sm)`
- **Panel:** `flex: 1; overflow: auto; min-height: 0`
- **Table:** `width: 100%; border-collapse: collapse; table-layout: fixed`

#### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-sm)` (10.5px)
- **Font-size modifiers:** `.ob--font-small` → xs, `.ob--font-medium` → sm, `.ob--font-large` → md
- **Tab text:** `var(--font-size-xs)` (9.5px), `font-weight: 600`
- **Table header (th):** `var(--font-size-xs)`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.5px`
- **Status badge:** `var(--font-size-xs)`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.3px`

#### Colors
- **Tab inactive:** `var(--text-muted)` → hover: `var(--text-primary)` → active: `var(--accent-highlight)` with bottom border
- **Tab badge:** bg `var(--accent-highlight)`, text `var(--bg-primary)`
- **Table header bg:** `var(--bg-secondary)` (note: differs from Positions/TradeLog which use `var(--bg-tertiary)`)
- **Even rows:** `var(--bg-row-alt)`, row hover: `var(--bg-hover)`
- **Side YES:** `var(--accent-buy)`, `font-weight: 600`; NO: `var(--accent-sell)`
- **Status badges:** pending/submitted/open/partial → `color-mix` backgrounds; filled/cancelled → muted; rejected → sell accent
- **P&L:** `.text-win` → `var(--accent-win)`, `.text-loss` → `var(--accent-sell)` (un-scoped — uses `--accent-win` not `--accent-buy`)

#### Row Dimensions
- **Row height:** `20px` (CSS), overridable by `grid.rowHeight`
- **Columns:** Ticker (left), Side (center), Type (center), Price (right), Qty (right), Filled (right), Status (center), Actions (center)

#### Flash Animation
- `.ob-row-flash`: `animation: ob-flash 0.6s ease-out` → from `color-mix(var(--accent-highlight) 30%, transparent)` to transparent

#### Workflow
1. Data from [omsService](#omsservicejs) (getOpenOrders, getRecentFills, getPositionSummaries)
2. Auto-refresh on configurable interval (default 2s)
3. Real-time updates via omsService event subscriptions
4. Fill flash: 600ms highlight on new fills
5. [LinkBus](#linkbusjs) filtering for cross-window ticker context

---

### Montage

**Files:** `src/components/trade/Montage.jsx` (457 lines), `Montage.css` (401 lines)

#### Layout
- **Container:** `flex-direction: column; height: 100%; gap: var(--spacing-xs)`
- **Ticker bar:** `flex; align-items: center; gap: var(--spacing-xs)`
- **Book:** `flex; gap: var(--spacing-xs)` — two sides (bid/ask), each `flex: 1; flex-direction: column`
- **Order entry:** `flex-direction: column; gap: var(--spacing-xs); border-top: 1px solid var(--border-color)`

#### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-md)` (11.5px)
- **Book header:** `var(--font-size-xs)`, `text-transform: uppercase`, `letter-spacing: 1px`
- **Labels:** `var(--font-size-xs)`, `text-transform: uppercase`, `letter-spacing: 0.5px`, `var(--text-muted)`
- **Buttons:** `var(--font-size-md)`, `font-weight: 700`

#### Colors
- **Current ticker badge:** bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, border `var(--border-color)`
- **Search input:** bg `var(--bg-tertiary)`, focus border `var(--border-focus)`
- **Bid price:** `var(--accent-buy)`, `font-weight: 600`; Ask: `var(--accent-sell)`
- **BUY YES button:** bg `var(--accent-buy)`, text `var(--text-heading)`
- **BUY NO button:** bg `var(--accent-sell)`, text `var(--text-heading)`
- **Error bar:** text `var(--accent-sell)`, bg `color-mix(var(--accent-sell) 8%, transparent)`

#### Data Display
- **Prices:** shown as `{price}c` (integer cents)
- **Bid/Ask levels:** configurable depth (default 5 levels)
- **Ask derivation:** Ask price for YES = 100 - NO bid price

#### Flash Animation
- **No CSS keyframes defined** — bid/ask flash uses JS class toggle with `flash-up`/`flash-down` but no corresponding CSS keyframes in Montage.css (relies on global `index.css` animations)

#### Workflow
1. Data from `useTickerData(ticker)` hook → `useOrderEntry()` for submissions
2. Search via `useMarketSearch()` hook
3. [LinkBus](#linkbusjs) subscription for cross-window ticker sync
4. Order flow: select side → fill size/type/price/TIF → click BUY YES/NO → optional confirm → submit via API

---

### PriceLadder

**Files:** `src/components/trade/PriceLadder.jsx` (429 lines), `PriceLadder.css` (310 lines)

#### Layout
- **Container:** `flex-direction: column; height: 100%; user-select: none`
- **Ticker bar:** `flex; align-items: center; gap: var(--spacing-sm)`
- **Header row:** `flex; font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 1px`
- **Ladder scroll:** `flex: 1; overflow-y: auto; min-height: 0`
- **Footer:** `flex-direction: column; gap: var(--spacing-xs); border-top: 1px solid var(--border-color)`

#### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-lg)` (12.5px) — larger than other components
- **Cell text:** `var(--font-size-md)` (11.5px)
- **Price column:** `font-weight: 600`
- **Working order tags:** `var(--font-size-xs)`, `font-weight: 600`

#### Colors
- **Bid cell hover:** `color-mix(var(--accent-win) 8%, transparent)`
- **Ask cell hover:** `color-mix(var(--accent-loss) 8%, transparent)`
- **Volume bars (bid):** `var(--accent-win)`, `opacity: 0.12`; (ask): `var(--accent-loss)`
- **Last price row:** bg `color-mix(var(--accent-highlight) 6%, transparent)`, border `var(--accent-highlight)`
- **Order tags (bid):** bg `color-mix(var(--accent-win) 15%, transparent)`, text `var(--accent-win)`

#### Column Layout
| Column | Width | Align |
|--------|-------|-------|
| Bid | flex: 1 | right |
| Price | 42px | center |
| Ask | flex: 1 | left |
| Vol | 48px | center |
| Orders | 56px | center |

#### Row Dimensions
- **Row height:** `18px` (CSS), overridable

#### Flash Animation
- `.pl-flash-up`: 0.3s green flash; `.pl-flash-down`: 0.3s red flash

#### Scrollbar Styling
- Width: `6px`, track: `var(--bg-primary)`, thumb: `var(--border-color)`, hover → `var(--text-muted)`

---

### Positions

**Files:** `src/components/trade/Positions.jsx` (315 lines), `Positions.css` (189 lines)

#### Layout
- **Container:** `flex-direction: column; height: 100%`
- **Header bar:** `flex; justify-content: space-between; padding: var(--spacing-xs) var(--spacing-sm); border-bottom`
- **Table:** `width: 100%; border-collapse: collapse; table-layout: auto`

#### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-md)` (11.5px)
- **Title:** `var(--font-size-sm)`, `font-weight: 700`, uppercase, `letter-spacing: 0.5px`
- **Table header:** `var(--font-size-xs)`, `font-weight: 600`, uppercase
- **Type badge:** `var(--font-size-xs)`, `font-weight: 700`, uppercase

#### Colors
- **Table header bg:** `var(--bg-tertiary)` (differs from OrderBook's `var(--bg-secondary)`)
- **Selected row:** `color-mix(var(--accent-highlight) 10%, transparent)`
- **Market name (long):** `var(--accent-buy)`, `font-weight: 600`; (short): `var(--accent-sell)`
- **Type badge (long):** bg `color-mix(var(--accent-buy) 15%, transparent)`, text `var(--accent-buy)`

#### Flash Animation
- `pos-flash 0.6s ease-out` → from `color-mix(var(--accent-warning) 25%, transparent)` to transparent

---

### TradeLog

**Files:** `src/components/trade/TradeLog.jsx` (402 lines), `TradeLog.css` (231 lines)

#### Layout
- Same pattern as Positions with added filter bar
- **Filter bar:** `flex; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-sm); border-bottom`

#### Colors
- **Filter active:** bg `var(--accent-highlight)`, text `var(--bg-primary)`, border `var(--accent-highlight)`
- **Filter inactive:** bg `var(--bg-tertiary)`, text `var(--text-muted)`, hover text `var(--text-secondary)`
- **Badges:** Long/Short (buy/sell accents), Open (info), Closed (neutral) — all use `color-mix` pattern

#### Data Display
- **Unrealized:** `$X.XX` if open, em-dash `—` if closed
- **Realized:** `$X.XX` if closed, em-dash `—` if open
- **CSV Export:** Downloads as `tradelog_YYYY-MM-DD.csv`

---

### EventLog

**Files:** `src/components/trade/EventLog.jsx` (293 lines), `EventLog.css` (163 lines)

#### Layout
- **Entry row:** `flex; align-items: baseline; gap: var(--spacing-sm); padding: 1px var(--spacing-sm); line-height: 1.6`

#### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-sm)` (10.5px)
- **Level label:** `var(--font-size-xs)`, `font-weight: 700`, `min-width: 38px`, `text-align: center`

#### Colors
- **Level INFO:** `var(--accent-info)` (#5490d4)
- **Level WARN:** `var(--accent-warning)` (#e5952e)
- **Level ERROR:** `var(--accent-sell)` (#e05c5c)
- **Error entry bg:** `color-mix(var(--accent-sell) 6%, transparent)`

#### Data Display
- **Time format:** `HH:MM:SS.mmm` (24-hour with milliseconds)
- **Source:** Bracketed `[SOURCE]` — SYSTEM, API, DATA, WS, AUTH
- **Auto-scroll:** Scrolls to bottom on new entries; scroll away pauses; double-click resumes

---

### NewsChat

**Files:** `src/components/trade/NewsChat.jsx` (137 lines), `NewsChat.css` (164 lines)

#### Typography
- **Root font:** `var(--font-mono)`, `var(--font-size-lg)` (12.5px) — largest default among trade components

#### Colors
- **Filter badge:** bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, hover border/text `var(--accent-loss)` (turns red to indicate removal)
- **Ticker badge:** bg `var(--bg-tertiary)`, text `var(--accent-highlight)`

#### Data Display
- **Time:** `HH:MM` (locale time string)
- **Headlines:** Simulated news strings, auto-refresh every 30s
- **No settings panel** — NewsChat has no settings companion

---

### Accounts

**Files:** `src/components/trade/Accounts.jsx` (251 lines), **no dedicated CSS file**

#### Colors
- **Type badge classes:** `.acct-type-paper`, `.acct-type-live` (referenced in JSX but **no CSS defined**)
- **P&L coloring:** `.text-win` / `.text-loss` classes (no scoped override like other components)

#### Columns
| Column | Key | Align |
|--------|-----|-------|
| Account # | account | left |
| Type | type | center |
| Realized P&L | realizedPnl | right |
| Unrealized P&L | unrealizedPnl | right |
| Init Equity | initEquity | right |
| Tickets | tickets | right |
| Shares | shares | right |

#### Gap
**No Accounts.css file exists** — all `acct-*` classes are undefined. Component relies on inherited styles or is unstyled.

---

### Chart

**Files:** `src/components/quotes/Chart.jsx` (485 lines), `Chart.css` (274 lines)

#### Layout
- **Container:** `flex-direction: column; height: 100%; background: var(--bg-primary); overflow: hidden`
- **Toolbar:** `flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-lg); background: var(--bg-secondary); min-height: 30px`
- **Canvas container:** `flex: 1; min-height: 0`

#### Colors (Chart canvas — hardcoded hex, NOT tokens)
See [Hardcoded Colors Outside Token System](#hardcoded-colors-outside-token-system) in Color Palette Inventory.

- **Overlay line colors:** `['#00d2ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#a855f7', '#ff8c42', '#4ecdc4', '#f472b6']`

#### CSS Colors (toolbar/chrome — uses tokens)
- **Timeframe active:** text `var(--accent-highlight)`, border `var(--accent-highlight)`, bg `color-mix(var(--accent-highlight) 10%, transparent)`
- **Settings panel:** bg `var(--bg-secondary)`, border `var(--border-color)`, radius `var(--radius-lg)`, shadow `var(--shadow-lg)`, `width: 200px`

#### Data Display
- **OHLC display:** `O {open} H {high} L {low} C {close}` with change and percent
- **Timeframes:** 1m, 5m, 15m, 1h, 4h, 1D
- **Chart types:** Candle, Line, Area, Overlay

---

### ChartSettings

**File:** `src/components/quotes/ChartSettings.jsx` (95 lines)

Compact settings panel rendered absolutely positioned over the chart. No dedicated CSS — uses classes from `Chart.css`.

| Setting | Input Type | Default |
|---------|-----------|---------|
| Grid Lines | checkbox | true |
| Volume | checkbox (disabled in overlay) | true |
| Crosshair | select (Normal/Magnet) | normal |
| Up Color | color picker | #00c853 |
| Down Color | color picker | #ff1744 |
| Overlay Mode | checkbox | false |
| Compare Markets | ticker checkboxes (in overlay) | [] |

---

### TimeSale

**Files:** `src/components/quotes/TimeSale.jsx` (333 lines), `TimeSale.css` (239 lines)

#### Typography
- Font size controlled by `FONT_SIZE_MAP`: small 10px, medium 11px, large 13px (applied via inline `style.fontSize`)

#### Colors
- **Buy row:** `var(--accent-win)` (#3ecf8e); **Sell row:** `var(--accent-loss)` (#e05c5c)
- **Large trade row:** `font-weight: 600`

#### Column Widths (flex-based)
| Column | Key | Flex | Align |
|--------|-----|------|-------|
| Price | price | `0 1 40px` | right |
| Qty | size | `0 1 32px` | right |
| Time | time | `1` | left (fills remaining) |
| Exchange | side | `0 1 30px` | right |

#### Data Display
- **Price:** `formatPrice(price, useTwo)` → `"X.XX¢"` or `"X¢"`
- **Size:** `formatSize(size, abbreviate)` → raw or `"X.Xk"` for >= 1000

#### Data Source
**NOTE:** TimeSale imports from `../../services/mockData` directly (NOT via hooks/dataFeed) — will never use real data.

---

### MarketViewer

**Files:** `src/components/MarketViewer.jsx`, `src/components/MarketViewer.css`

#### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.mv-ticker-name` | color | `var(--accent-info)` (#5490d4) |
| `.mv-yes-price` | color | `var(--accent-buy)` (#3ecf8e) |
| `.mv-no-price` | color | `var(--accent-sell)` (#e05c5c) |
| `.mv-price-value` | font-size | **20px** (hardcoded — only hardcoded size in component CSS) |

#### Layout
- `.market-viewer`: flex column, height 100%, `--font-mono` base, `--font-size-xs` (9.5px) — smallest default
- `.mv-prices`: flex row with equal-width boxes (`var(--bg-tertiary)`, `var(--border-subtle)`)
- `.mv-depth-section`: flex 1, min-height 0 (scroll containment)
- `.mv-search-results` z-index: `100`

#### Behavior
- Subscribes to `useTickerData(ticker)` for real-time data
- Flash animation on price change (uses global `.flash-up` / `.flash-down` classes from index.css)
- Search with 300ms debounce via `useMarketSearch()`
- [LinkBus](#linkbusjs) for cross-window ticker sync

---

### Settings Companions (Trade)

All settings panels follow a consistent inline-style pattern using `document.createElement('style')`.

#### Common Pattern
```
Overlay: position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 20
Panel: bg var(--bg-secondary); border 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.5)
Header: padding 10px 12px; font-size 13px; font-weight 700
Body: padding 10px 12px; gap 8-10px
Row: font-size 12px; color var(--text-secondary)
Labels: font-family var(--font-sans)
Inputs: bg var(--bg-tertiary); border 1px solid var(--border-color); border-radius 3px; padding 3px 6px; font-family var(--font-mono); font-size 12px
Checkboxes: accent-color var(--accent-highlight); width/height 16px
Save button: bg var(--accent-win); color #000
Cancel button: bg var(--bg-tertiary); color var(--text-secondary)
Button: padding 6px 8px; border-radius 3px; font-size 12px; font-weight 700
```

**Issue:** These are hardcoded px values, not design tokens. E.g., `padding: 10px 12px` instead of `var(--spacing-lg)`, `font-size: 13px` instead of `var(--font-size-lg)`, `border-radius: 6px` instead of `var(--radius-lg)`.

#### Per-Component Settings
| Component | Panel Width | Unique Settings | Has GridSettingsPanel? |
|-----------|-----------|-----------------|----------------------|
| OrderBookSettings | 320px | Refresh interval, max fills, flash on fill, show cancelled | Yes |
| MontageSettings | 280px | Default order size, confirm, sound, depth, flash, font, working orders | **No** |
| PriceLadderSettings | 280px | Visible levels, center on trade, flash, volume bars, working orders, click action, default size | Yes |
| PositionsSettings | 320px | Sort by, sort direction, refresh interval, flash on change | Yes |
| TradeLogSettings | 320px | Filter, date range, sort by, sort direction, refresh interval, flash | Yes |
| EventLogSettings | 320px | Log level filter, max lines, auto-scroll | Yes |
| AccountsSettings | 320px | Decimal precision, refresh interval | Yes |

---

## 7. Scanner, Alert and Analytics Components

### LiveScanner

**File:** `src/components/scanners/LiveScanner.jsx` (279 lines)
**CSS:** `src/components/scanners/LiveScanner.css` (339 lines)

#### Layout & Structure
- **Root:** `.live-scanner` — full-height flex column, `font-family: var(--font-mono)`, `font-size: var(--font-size-sm)`
- **Toolbar (`.ls-toolbar`):** Flex row, space-between, `padding: var(--spacing-xs) var(--spacing-sm)`, `border-bottom: 1px solid var(--border-color)`
- **Settings panel (`.ls-settings`):** Collapsible, `background: var(--bg-tertiary)`, contains max results, min conviction, conviction bars toggle, [GridSettingsPanel](#11-gridsettingspanel)
- **Table:** `table-layout: fixed`, `border-collapse: collapse`, sticky thead

#### Colors & Typography
| Element | Color/Font | Token |
|---------|-----------|-------|
| Column headers | Muted, uppercase, 600 weight | `var(--text-muted)`, `var(--font-size-xs)`, `letter-spacing: 0.5px` |
| Sorted column header | Accent | `var(--accent-highlight)` |
| Type BULL | Buy accent | `var(--accent-buy)` |
| Type BEAR | Sell accent | `var(--accent-sell)` |
| Type NEUTRAL | Neutral accent | `var(--accent-neutral)` |
| Conviction bars active (1-2) | Buy accent | `var(--accent-buy)` |
| Conviction bar active (3) | Info accent | `var(--accent-info)` |
| Ticker cell | `font-weight: 600`, `var(--accent-highlight)` on link | — |

#### Animations
- `.ls-row--updated`: `ls-flash-update` 0.6s, from `var(--flash-win-bg)` to transparent
- `.ls-row--new`: `ls-flash-new` 0.8s, from `rgba(212, 168, 83, 0.18)` to transparent
- `.ls-live-dot`: 6×6px circle, `var(--accent-win)`, uses global `glow-pulse` 1.5s infinite

#### Data Flow
1. `subscribeToScanner()` from `mockData.js` (imported directly, **NOT via dataFeed**)
2. Alerts accumulated in ref + state, capped at `settings.maxResults`
3. Filtered by type and min conviction, sorted by selected column

---

### HistoricalScanner

**File:** `src/components/scanners/HistoricalScanner.jsx` (345 lines)
**CSS:** `src/components/scanners/HistoricalScanner.css` (392 lines)

#### Layout & Structure
- Same base as LiveScanner
- **Criteria bar (`.hs-criteria`):** `background: var(--bg-secondary)`, date inputs + pattern select + scan button

#### Unique Elements
- **Scan button (`.hs-scan-btn`):** `background: var(--accent-highlight)`, `color: var(--bg-primary)`, `font-weight: 600`, hover `filter: brightness(1.15)`
- **Confidence bars:** 5-bar system (vs LiveScanner's 3), 10×7px each, color-graduated by level:
  - Bars 1-2: `var(--accent-warning)`
  - Bar 3: `var(--accent-info)`
  - Bars 4-5: `var(--accent-highlight)`
- **Pattern select:** All Patterns, Volume Breakout, Price Reversal, Momentum Shift, Mean Reversion, Gap Fill

#### Data Display
- **ROI:** Prefixed with +/-, one decimal, percent sign — e.g., "+5.2%"
- **Confidence:** Either bars (5-level) or fraction "3/5"

#### Data Flow
1. User sets criteria → Click Scan → `useHistoricalScan().scan()` → `dataFeed.getHistoricalScanResults()`
2. Results displayed, sortable; CSV export via client-side Blob

---

### AlertTrigger

**File:** `src/components/scanners/AlertTrigger.jsx` (480 lines)
**CSS:** `src/components/scanners/AlertTrigger.css` (429 lines)

#### Layout & Structure
- **Root:** `.alert-trigger` — full-height flex column
- **Panels (`.at-panels`):** Two equal-height panels (Rules + History), separated by `2px solid var(--border-color)`
- **Settings overlay:** Modal with `var(--bg-overlay)` backdrop

#### Rule Types
| Type | Parameters |
|------|-----------|
| `price_crosses` | Price threshold |
| `pct_change` | % threshold, Window (seconds) |
| `volume_spike` | Multiplier, Window (seconds) |

#### Alert State Row Indicators (CSS-defined)
| State | Visual |
|-------|--------|
| `.at-row--triggered` | `border-left: 2px solid var(--accent-win)` |
| `.at-row--pending` | `border-left: 2px solid var(--accent-warning)` |
| `.at-row--expired` | `border-left: 2px solid var(--accent-neutral)`, `opacity: 0.65` |

**Note:** These classes and `.at-status-badge` variants are defined in CSS but **never applied in JSX** — dead CSS.

#### Flash Animation
- `.at-row-flash .at-td`: `at-flash` 1.2s ease-out, from `color-mix(var(--accent-warning) 35%, transparent)` to transparent

#### Data Flow
1. Component calls [alertService](#alertservicejs).initialize() on mount
2. CRUD operations via alertService.addRule/toggleRule/removeRule
3. Alert evaluation happens in [alertEngine.worker](#alertengineworkerjs)

---

### MarketClock

**File:** `src/components/scanners/MarketClock.jsx` (119 lines)
**CSS:** `src/components/scanners/MarketClock.css` (192 lines)

#### Layout
- **Root:** `.market-clock` — full-height flex column, `position: relative`, `background: var(--bg-primary)`
- **Time display:** Inline `fontSize` from settings (16-64px range), `font-weight: 600`, `letter-spacing: 2px`
- **Settings button:** Absolute top-right, opacity 0 by default, appears on hover

#### Market Status Indicators (CSS-defined, **never rendered in JSX**)
| Status | Color | Animation |
|--------|-------|-----------|
| `.mc-status--open` | `var(--accent-buy)` | `glow-pulse` 1.5s |
| `.mc-status--closed` | `var(--accent-sell)` | No animation |
| `.mc-status--pre/post` | `var(--accent-warning)` | `glow-pulse` 2s |

#### Clock Tick Mechanism
- **With milliseconds:** `requestAnimationFrame` loop
- **Without milliseconds:** `setInterval` at 1000ms

---

### MarketClockSettings

**File:** `src/components/scanners/MarketClockSettings.jsx` (218 lines)

#### CSS Injection Pattern (Non-Standard)
**WARNING:** Styles injected via `document.createElement('style')` with hardcoded px values:
- `.mcs-panel`: `border-radius: 6px`, `width: 260px`
- `.mcs-header`: `padding: 10px 12px`, `font-size: 13px`
- `.mcs-body`: `padding: 10px 12px`, `gap: 10px`
- `.mcs-row`: `font-size: 12px`
- `.mcs-btn-save`: `color: #fff` (hardcoded, not `var(--bg-primary)`)

#### Settings
| Setting | Input | Default |
|---------|-------|---------|
| Timezone | Select (Local/UTC) | 'local' |
| Milliseconds | Checkbox | false |
| Show Date | Checkbox | false |
| Font Size | Range slider (16-64) | 32 |

---

## 8. Services and Data Flow

### alertService.js

**File:** `src/services/alertService.js` (323 lines)

#### Public API
| Function | Description |
|----------|-------------|
| `initialize()` | Load rules/history, start worker, sync ticker subscriptions |
| `destroy()` | Unsubscribe all tickers, terminate worker |
| `getRules()` / `addRule()` / `updateRule()` / `removeRule()` / `toggleRule()` | Rule CRUD |
| `getHistory()` / `clearHistory()` | Alert history management |
| `onAlert(callback)` | Subscribe to new alerts → returns unsubscribe |
| `onRulesChange(callback)` | Subscribe to rule changes → returns unsubscribe |

#### Data Flow
```
dataFeed.subscribeToTicker(ticker) → tick data
    ↓ postMessage
alertEngine.worker.js (evaluates rules against ticks)
    ↓ postMessage back
alertService.handleWorkerMessage → history + notify listeners
    ↓
AlertTrigger component (via onAlert/onRulesChange)
```

#### State
- Rules: `localStorage('kalshi_alert_rules')` — capped at 200 history entries
- Listeners: `Set<callback>` for alerts and rules changes

---

### alertEngine.worker.js

**File:** `src/services/alertEngine.worker.js` (253 lines)

- **Web Worker** running in separate thread
- Uses **Float64Array circular buffers** (capacity 256) for per-ticker price/volume history
- Evaluates rules on each tick, fires alerts with **30s cooldown** per rule

#### Evaluators
- **price_crosses:** Current vs previous price against threshold (above/below/either)
- **pct_change:** Current vs reference price (lookback ticks)
- **volume_spike:** Latest volume vs rolling average (window ticks)

---

### analyticsService.js

**File:** `src/services/analyticsService.js` (318 lines)

#### Analytics Snapshot Shape
```js
{ winRate, totalPnL, expectedValue, kellyFraction, omegaRatio, sharpeRatio,
  maxDrawdown, profitFactor, categoryAttribution, equityCurve, dailyPnL,
  markToMarket, tradeCount, timestamp }
```

#### Data Flow
```
kalshiApi.getFills() → cache in localStorage (5min TTL)
    ↓ normalize
normalizeFill() → { tradeId, ticker, category, side, action, priceCents, count, pnlCents, timestamp }
    ↓ P&L computation
computePnLFromFills() → FIFO buy/sell matching per ticker+side
    ↓
analyticsCalc.* functions → metrics
```

---

### analyticsCalc.js

**File:** `src/services/analyticsCalc.js` (275 lines)

Pure functions (no side effects). All prices in **cents** (1-99 for Kalshi binary contracts).

| Function | Output |
|----------|--------|
| `winRate(trades)` | 0-1 fraction |
| `totalPnL(trades)` | cents sum |
| `expectedValue(trades)` | cents per trade |
| `kellyFraction(trades)` | 0-1 (clamped) |
| `omegaRatio(trades)` | gains/losses ratio |
| `sharpeRatio(trades)` | annualized |
| `maxDrawdown(trades)` | { maxDrawdown, maxDrawdownPct, peakTs, troughTs } |
| `profitFactor(trades)` | grossProfit / grossLoss |
| `categoryAttribution(trades)` | { [cat]: { pnl, count, winRate } } |
| `equityCurve(trades)` | [{ timestamp, equity }] |
| `dailyPnL(trades)` | [{ date, pnl, count }] |
| `markToMarket(positions, prices)` | { totalMtm, positions } |

---

### omsEngine.js

**File:** `src/services/omsEngine.js` (465 lines)

#### Order State Machine (FSM)
```
PENDING → SUBMITTED → OPEN → PARTIAL → FILLED (terminal)
                   ↘         ↘         ↘
                    → REJECTED  → CANCELLED (terminal)
```

#### Order Shape
```js
{ id, clientOrderId, ticker, side, action, type, price, count,
  filledCount, remainingCount, avgFillPrice, status, fills: [],
  createdAt, updatedAt, submittedAt, filledAt, cancelledAt, rejectedAt, rejectReason }
```

#### Position Shape
```js
{ ticker, side, contracts, avgCost, realized, totalCost, updatedAt }
```

#### Events Emitted
`order:created`, `order:updated`, `order:{status}`, `fill`, `position:updated`, `state:imported`, `state:reset`

---

### omsService.js

**File:** `src/services/omsService.js` (434 lines)

```
omsService.js (API bridge + persistence + WS)
    ↓ delegates to
omsEngine.js (pure state machine)
    ↓ persists via
localStorage('kalshi_oms_state')
```

#### Order Submission Flow
1. `createOrder()` in engine (PENDING)
2. Build API payload
3. `kalshiApi.createOrder()` call
4. `markSubmitted()` with exchange ID
5. Process immediate status
6. On failure: `markRejected()`

**Note:** Initializes on import (module-level `initialize()` call) — eager load even when unused.

---

### dataFeed.js

**File:** `src/services/dataFeed.js` (717 lines)

Unified adapter between Kalshi real data and mock data.

#### Subscriptions
| Function | Mock Mode | Real Mode |
|----------|-----------|-----------|
| `subscribeToTicker(ticker, cb)` | Mock stream | WS orderbook + ticker channels |
| `subscribeToMarketRace(cb)` | Mock data | REST polling every 5s |
| `subscribeToScanner(cb)` | Mock data | WS lifecycle events |
| `subscribeToOHLCV(ticker, tf, cb)` | Mock if available | REST candles + WS trade stream |
| `subscribeToTimeSales(ticker, cb)` | Mock data | WS trade channel |
| `subscribeToPortfolio(cb)` | Empty/mock | REST polling 5s + WS triggers |

#### Orderbook State Machine
```
WS orderbook_snapshot → clear YES/NO maps, populate
WS orderbook_delta → update/delete price level
    ↓
buildSyntheticDom(ticker) → { bids: [YES bids desc], asks: [derived from NO bids, asc] }
```

---

### hotkeyStore.js

**File:** `src/services/hotkeyStore.js` (336 lines)

localStorage-backed keybinding manager with profile support. Key: `kalshi_hotkeys`.

#### Default Bindings
| Key | Script | Label | Category |
|-----|--------|-------|----------|
| `Ctrl+B` | `Buy=Route:LIMIT Price+0.00 Share=1 TIF=DAY` | Quick Buy | trading |
| `Ctrl+S` | `Sell=Route:LIMIT Price+0.00 Share=Pos TIF=DAY` | Quick Sell | trading |
| `Escape` | `CXL` | Cancel All | trading |
| `F5` | `Focus=Montage` | Focus Montage | navigation |

#### Key Normalization
Modifier order: Ctrl → Alt → Shift → Meta. Single characters uppercased. Canonical form: `"Ctrl+Shift+B"`.

---

### hotkeyLanguage.js

**File:** `src/services/hotkeyLanguage.js` (361 lines)

DAS Trader-inspired scripting language.

#### Commands
| Command | Description |
|---------|-------------|
| `Buy`/`Sell` | Place order with Route, Price, Share, TIF, Side parameters |
| `CXL`/`CXLBUY`/`CXLSELL` | Cancel orders |
| `Focus` | Focus window |
| `SwitchTicker` | Change active ticker |

#### Price Expressions
Market keywords (`Bid`, `Ask`, `Last`, `Mid`), offsets (`Ask+0.05`), or fixed numeric.

#### Share Expressions
Fixed, `Pos`/`Pos*0.5`, `BP*0.1`, `MaxPos` (hardcoded 100).

---

### settingsStore.js

**File:** `src/services/settingsStore.js` (131 lines)

#### Settings Schema
```js
{ connection: { apiKey, paperMode, wsReconnectInterval, wsMaxRetries },
  appearance: { theme, accentColor, fontFamily, fontSize, windowOpacity },
  trading: { defaultOrderSize, confirmOrders, soundAlerts, autoCancelOnDisconnect },
  colorCoordination: { linkingEnabled },
  windows: { snapDistance, mergeBehavior, savedLayouts },
  notifications: { desktopNotifications, soundAlerts, notifyOnFill, notifyOnCancel, notifyOnConnection, notifyOnError } }
```

Deep merge on load — new keys always exist.

---

### linkBus.js

**File:** `src/services/linkBus.js` (166 lines)

#### Color Link System
**8 Link Colors:** red, green, blue, yellow, purple, orange, cyan, white (with hex values)

#### Public API
| Function | Description |
|----------|-------------|
| `setColorGroup(windowId, colorId)` | Assign window to color group |
| `subscribeToLink(colorId, cb, windowId?)` | Subscribe to market changes |
| `emitLinkedMarket(windowId, ticker)` | Emit ticker change to group (except source) |
| `subscribeToDrag/emitDragDelta()` | Synchronized window dragging |

#### Emit Flow
1. Source window calls `emitLinkedMarket(windowId, ticker)`
2. Lookup color group → find all subscribers → call each with `{ ticker, sourceWindowId, colorId, groupWindows }`

**Note:** Uses subscriber array (not Set) — no duplicate prevention.

---

## 9. Hooks

### useKalshiData.js

**File:** `src/hooks/useKalshiData.js` (297 lines)

8 hooks, all follow subscribe-on-mount/unsubscribe-on-unmount pattern:

| Hook | Returns | Data Source |
|------|---------|-------------|
| `useTickerData(ticker)` | `{ data, error }` | `dataFeed.subscribeToTicker` |
| `useMarketRace()` | `{ racers, error }` | `dataFeed.subscribeToMarketRace` |
| `useScannerAlerts(maxAlerts?)` | `{ alerts, clearAlerts, error }` | `dataFeed.subscribeToScanner` |
| `useOHLCV(ticker, timeframe)` | `{ candles, currentCandle, error }` | `dataFeed.subscribeToOHLCV` |
| `useKalshiConnection()` | `{ connected, initialize, disconnect }` | `dataFeed.onConnectionChange` |
| `usePortfolio(refreshInterval?)` | `{ balance, positions, orders, fills, refresh }` | REST polling + WS |
| `useOrderEntry()` | `{ submitOrder, cancelOrder, lastResult, submitting, error }` | `dataFeed.placeOrder` |
| `useHistoricalScan()` | `{ results, scanning, error, scan }` | `dataFeed.getHistoricalScanResults` |

---

### useGridCustomization.js

**File:** `src/hooks/useGridCustomization.js` (260 lines)

Used by all table-based components for column visibility, drag-reorder, resize, font size, row height, bg/text color, and conditional formatting rules.

#### State Shape
```js
{ columns: [{ key, label, visible, width, align?, numeric? }],
  fontSize: 'small' | 'medium' | 'large', rowHeight: number (default 24),
  bgColor: string, textColor: string,
  colorRules: [{ id, column, operator, value, bgColor, textColor }] }
```

Persistence: `localStorage('gridCustom_${toolId}')`, debounced 300ms save.

---

### useHotkeyDispatch.js

**File:** `src/hooks/useHotkeyDispatch.js` (187 lines)

Global keydown listener on `document`. Skips when focused on INPUT/TEXTAREA/contentEditable.

#### Execution Pipeline
```
KeyboardEvent → normalizeKeyCombo → findBindingByKey → parseHotkeyScript → executeAction
```

**Note:** `MaxPos` is hardcoded to 100 — risk settings integration missing.

---

## 10. Global Settings Panel

**Files:** `src/components/SettingsPanel.jsx`, `src/components/SettingsPanel.css`

#### Layout
- `.settings-overlay`: fixed inset 0, flex center, z-index 10000
- `.settings-panel`: width 620px, max-height 80vh, flex column, `var(--shadow-lg)`
- `.settings-content`: flex row (sidebar + body)
- `.settings-sidebar`: width 160px

#### Sections
| Tab | Fields |
|-----|--------|
| Connection | API Key (password), Paper mode, WebSocket URL, Reconnect interval, Max retries |
| Appearance | Theme, Accent color, Font family, Font size, Window opacity |
| Trading | Default order size, Confirm orders, Sound alerts, Auto-cancel on disconnect |
| Color Linking | Enable linking, Link group colors (display only) |
| Windows | Snap distance, Merge behavior |
| Notifications | Desktop notifications, Sound alerts, Notify on: fills/cancels/connection/errors |

#### Toggle Switch Dimensions
- Width: 32px, Height: 18px, border-radius: 9px
- Knob: 14px × 14px, translateX(14px) when on

---

## 11. GridSettingsPanel

**Files:** `src/components/GridSettingsPanel.jsx`, `src/components/GridSettingsPanel.css`

Reusable settings component embedded in most table-based component settings panels.

#### Interactive Elements
1. Column list with drag-to-reorder (HTML5 drag)
2. Column visibility checkboxes
3. Reset column order button
4. Font size select (Small/Medium/Large)
5. Row height slider (18-40px)
6. Background/Text color pickers with clear buttons
7. Conditional formatting rules: column select, operator select, value input, bg/text colors, remove
8. Add Rule button

---

## 12. HotkeyManager

**Files:** `src/components/HotkeyManager.jsx`, `src/components/HotkeyManager.css`

#### Layout
- Two-column: bindings list (260px, left) + editor (right)
- `.hk-body`: flex row, flex 1, min-height 0

#### Colors
| Element | Value |
|---------|-------|
| `.hk-btn--accent` | bg `var(--accent-highlight)`, text `var(--bg-primary)` |
| `.hk-error` | bg `color-mix(var(--accent-sell) 15%, transparent)`, text `var(--accent-sell)` |
| `.hk-binding-row--selected` | bg `color-mix(var(--accent-highlight) 15%, transparent)` |
| `.hk-validation--ok` | `var(--accent-buy)` |
| `.hk-validation--err` | `var(--accent-sell)` |
| `.hk-warning` | `var(--accent-warning)` |

#### Interactive Elements
1. Profile selector + Save As / Export / Import
2. Bindings list with selection + active checkbox + delete
3. Key combo capture input
4. Script textarea with real-time validation
5. Category select (trading, navigation, scanner, custom)
6. Collapsible Command Reference help panel

---

## 13. Workflow Analysis per Tool

| Tool | Data Source | Refresh Method | User Actions |
|------|-----------|----------------|--------------|
| **OrderBook** | [omsService](#omsservicejs) | Auto-refresh interval (2s) + WS events | Cancel orders, sort, configure columns |
| **Montage** | [useTickerData](#usekalshidatajs), [useOrderEntry](#usekalshidatajs) | Real-time subscription | Search ticker, place orders (BUY YES/NO), configure |
| **PriceLadder** | [useTickerData](#usekalshidatajs) | Real-time subscription | Click-to-trade, cancel order tags, recenter |
| **Positions** | `generateMockPositions()` (local mock) | Manual refresh | Sort, select row → LinkBus emit |
| **TradeLog** | `generateMockTradelog()` (local mock) | Manual refresh | Filter (All/Open/Closed), CSV export, sort |
| **EventLog** | `getStartupEntries()` + simulated events | Continuous generation | Level filter, clear, export, auto-scroll |
| **NewsChat** | `generateNewsItems()` + [useMarketSearch](#usekalshidatajs) | Auto-refresh 30s | Search/filter ticker |
| **Accounts** | `generateMockAccounts()` (local mock) | Manual refresh | Sort, configure |
| **Chart** | [dataFeed](#datafeedjs).subscribeToOHLCV | Real-time subscription | Change timeframe/type, toggle overlay, settings |
| **TimeSale** | `mockData.subscribeToTimeSales` (direct!) | Real-time subscription | Clear, configure |
| **MarketViewer** | [useTickerData](#usekalshidatajs), [useMarketSearch](#usekalshidatajs) | Real-time subscription | Search/select ticker, LinkBus |
| **LiveScanner** | `mockData.subscribeToScanner` (direct!) | Real-time subscription | Filter type, pause/resume, clear, sort |
| **HistoricalScanner** | [dataFeed](#datafeedjs).getHistoricalScanResults | On-demand (Scan button) | Set criteria, scan, sort, CSV export |
| **AlertTrigger** | [alertService](#alertservicejs) + [alertEngine.worker](#alertengineworkerjs) | Real-time (Web Worker) | Add/toggle/delete rules, clear history |
| **MarketClock** | `Date` object | requestAnimationFrame or setInterval | Configure timezone, ms, date, font size |

---

## 14. Interactive States Catalog

### Hover States
| Component | Element | Normal | Hover |
|-----------|---------|--------|-------|
| All tables | Row | transparent/`--bg-row-alt` | `var(--bg-hover)` |
| All buttons | Standard | `var(--bg-tertiary)` | `var(--bg-hover)` + `var(--text-primary)` |
| Window | Close btn | `var(--text-muted)` | bg `var(--accent-sell)`, text `var(--text-primary)` |
| Window | Color chip | normal | `scale(1.2)` + `var(--shadow-chip)` |
| Menu | Item | `var(--text-secondary)` | bg `var(--bg-hover)`, text `var(--text-primary)` |
| Montage | BUY buttons | normal | `opacity: 0.85` |
| PriceLadder | Bid cell | transparent | `color-mix(var(--accent-win) 8%, transparent)` |
| PriceLadder | Ask cell | transparent | `color-mix(var(--accent-loss) 8%, transparent)` |
| LiveScanner | Ticker link | normal | `filter: brightness(1.2)`, `text-decoration: underline` |
| NewsChat | Filter badge | accent text | text/border `var(--accent-loss)` (red = removable) |
| OrderBook | Cancel btn | `var(--accent-sell)` border | bg fills `var(--accent-sell)`, text → `var(--bg-primary)` |

### Active/Pressed States
| Component | Element | Active State |
|-----------|---------|-------------|
| Menu | Item | bg `var(--bg-active)`, text `var(--text-heading)` |
| Montage | BUY buttons | `transform: scale(0.97)` |
| Filter buttons | Active filter | bg `var(--accent-highlight)`, text `var(--bg-primary)` |
| TitleBar | Close btn | bg `var(--titlebar-close-active)` (#bf0f1d) |

### Focus States
| Component | Element | Focus State |
|-----------|---------|------------|
| Window | Container | `border-color: var(--accent-highlight)` |
| All inputs | Input/Select | `border-color: var(--border-focus)` (#d4a853) |
| HotkeyManager | Key input (capturing) | `border-color + box-shadow: var(--accent-highlight)` |

### Flash Animations
| Component | Animation | Duration | Color |
|-----------|-----------|----------|-------|
| OrderBook | `ob-flash` | 0.6s | `var(--accent-highlight) 30%` |
| PriceLadder | `pl-flash-green/red` | 0.3s | `var(--accent-win/loss) 20%` |
| Positions | `pos-flash` | 0.6s | `var(--accent-warning) 25%` |
| AlertTrigger | `at-flash` | 1.2s | `var(--accent-warning) 35%` |
| LiveScanner | `ls-flash-update` | 0.6s | `var(--flash-win-bg)` |
| LiveScanner | `ls-flash-new` | 0.8s | `rgba(212,168,83,0.18)` |
| Global | `flash-green` | 0.4s | `var(--flash-win-bg)` |
| Global | `flash-red` | 0.4s | `var(--flash-loss-bg)` |

---

## 15. Data Display Patterns

### Price Formatting
| Component | Format | Example |
|-----------|--------|---------|
| OrderBook | `formatCents(cents)` → `(cents/100).toFixed(2)` | "0.65" |
| Montage | `{price}c` (integer cents) | "65c" |
| PriceLadder | Integer 1-99 | "65" |
| TimeSale | `formatPrice(price, useTwo)` → `"X.XX¢"` or `"X¢"` | "65.00¢" |
| Positions/TradeLog | `$` + `.toFixed(2)` | "$0.65" |
| AlertTrigger | `.toFixed(2)` | "0.65" |

### P&L Formatting
| Component | Format | Positive Color | Negative Color |
|-----------|--------|---------------|----------------|
| OrderBook | `formatPnl(cents)` → `+$X.XX` / `-$X.XX` | `var(--accent-win)` | `var(--accent-sell)` |
| Positions | `$X.XX` | `var(--accent-buy)` | `var(--accent-sell)` |
| TradeLog | `$X.XX` | `var(--accent-buy)` | `var(--accent-sell)` |
| Accounts | `$X.XX` (configurable precision) | `.text-win` | `.text-loss` |

### Time Formatting
| Component | Format | Example |
|-----------|--------|---------|
| OrderBook | `HH:MM:SS` (24h) | "14:35:22" |
| EventLog | `HH:MM:SS.mmm` (24h + ms) | "14:35:22.456" |
| NewsChat | `HH:MM` (locale) | "14:35" |
| TimeSale | `HH:MM:SS` or `HH:MM:SS.mmm` (configurable) | "14:35:22" |
| MarketClock | `HH:MM:SS` + optional `.XXX00` | "14:35:22.456" |
| HistoricalScanner | `toLocaleDateString('en-US')` | "Mar 6, 2026" |
| AlertTrigger | `toLocaleTimeString([], {h,m,s})` | "14:35:22" |

---

## 16. Cross-Component Patterns

### Common UI Patterns

1. **Table pattern:** Sticky thead (`var(--bg-secondary)` or `var(--bg-tertiary)`), `var(--spacing-xs) var(--spacing-sm)` cell padding, `:nth-child(even)` with `var(--bg-row-alt)`, row hover → `var(--bg-hover)`, header border `var(--border-color)`, row border `var(--border-subtle)`

2. **Button pattern:** `var(--bg-tertiary)` bg, `var(--border-subtle)` border, `var(--radius-sm)`, hover → `var(--bg-hover)` + `var(--text-primary)`

3. **Input pattern:** `var(--bg-input)` bg, `var(--border-subtle)` border, `var(--radius-sm)`, `var(--font-mono)`, focus → `border-color: var(--border-focus)`, outline none

4. **Settings panel pattern:** `var(--bg-tertiary)` bg, `border-bottom: 1px solid var(--border-color)`, flex column with `gap: var(--spacing-xs)`

5. **Flash animation pattern:** `color-mix(in srgb, var(--accent-*) N%, transparent)` → transparent

6. **Overlay/modal pattern:** `position: absolute`, `inset: 0`, `background: var(--bg-overlay)`, centered panel with `var(--shadow-lg)`

### State Management Patterns

1. **localStorage persistence:** All services use localStorage with try/catch. Pattern: lazy-load, persist on mutation, notify listeners.

2. **Listener pattern:** `Set<callback>` with `subscribe() → unsubscribe` return value. Used across [hotkeyStore](#hotkeystorejs), [settingsStore](#settingsstorejs), [alertService](#alertservicejs), [omsEngine](#omsenginejs), [linkBus](#linkbusjs).

3. **Service initialization:** Module-level `load()` or `initialize()` on import. Components call service functions directly (no React context).

4. **Data flow:** [dataFeed.js](#datafeedjs) → [hooks](#9-hooks) → components. Services are singletons via module scope.

### LinkBus Integration
- **Publishers:** Montage, PriceLadder, Chart, TimeSale, Positions, TradeLog (emit on ticker change/row click)
- **Subscribers:** All components with ticker context
- **Group drag:** Linked windows move together via `subscribeToDrag`/`emitDragDelta`

### localStorage Key Map
| Component | Key Pattern |
|-----------|------------|
| OrderBook | `order-book-settings-{windowId}` |
| Montage | `kalshi_montage_settings` |
| PriceLadder | `price-ladder-settings-{windowId}` |
| Positions | `positions-settings-{windowId}` |
| TradeLog | `trade-log-settings-{windowId}` |
| EventLog | `event-log-settings-{windowId}` |
| Accounts | `accounts-settings-{windowId}` |
| Chart | `chart_settings_{windowId}` |
| TimeSale | `timesale_settings_{windowId}` |
| LiveScanner | `live-scanner-settings-${windowId}` |
| MarketClock | `market-clock-settings-${windowId}` |
| Grid customization | `gridCustom_${toolId}` |
| Settings | `kalshi_settings` |
| Hotkeys | `kalshi_hotkeys` |
| Alert rules | `kalshi_alert_rules` |
| Alert history | `kalshi_alert_history` |
| OMS state | `kalshi_oms_state` |
| Analytics cache | `kalshi_analytics_fills`, `kalshi_analytics_cache_ts` |
| Link groups | `kalshi_link_groups`, `kalshi_linking_enabled` |

### Data Sources
| Component | Data Source | Via |
|-----------|-----------|-----|
| OrderBook | omsService | Direct import |
| Montage | dataFeed | useTickerData, useOrderEntry, useMarketSearch hooks |
| PriceLadder | dataFeed | useTickerData hook |
| Positions | Local mock | `generateMockPositions()` |
| TradeLog | Local mock | `generateMockTradelog()` |
| EventLog | Local mock | `getStartupEntries()` |
| NewsChat | Local mock + dataFeed | `generateNewsItems()` + useMarketSearch |
| Accounts | Local mock | `generateMockAccounts()` |
| Chart | dataFeed | `subscribeToOHLCV` |
| TimeSale | **mockData** (direct!) | `subscribeToTimeSales` — bypasses dataFeed |
| LiveScanner | **mockData** (direct!) | `subscribeToScanner` — bypasses dataFeed |
| HistoricalScanner | dataFeed | `getHistoricalScanResults` |
| AlertTrigger | alertService | `onAlert`, `onRulesChange` |
| MarketClock | Browser Date API | Direct |

### P&L Color Scoping
Components scope P&L colors to avoid conflicts:
- `.positions .text-win` → `var(--accent-buy)`
- `.tradelog .text-win` → `var(--accent-buy)`
- `.montage .text-win` → `var(--accent-buy)`
- OrderBook uses un-scoped `.text-win` → `var(--accent-win)` (same value, different semantic token)

### Global CSS Utility Classes (index.css)
| Class | Effect |
|-------|--------|
| `.mono` | `font-family: var(--font-mono); font-variant-numeric: tabular-nums` |
| `.text-win` | `color: var(--accent-win)` |
| `.text-loss` | `color: var(--accent-loss)` |
| `.text-muted` | `color: var(--text-muted)` |
| `.text-label` | `color: var(--text-label)` |
| `.text-accent` | `color: var(--text-accent)` |
| `.flash-up` | `animation: flash-green 0.4s ease-out` |
| `.flash-down` | `animation: flash-red 0.4s ease-out` |

### Scrollbar Styling (Global)
- Width/height: 5px
- Track: `var(--scrollbar-track)` → `var(--bg-primary)`
- Thumb: `var(--scrollbar-thumb)` with `--scrollbar-thumb-hover`
- Corner: `var(--bg-primary)`, thumb border-radius: 3px

### Keyframe Animations (index.css)
| Animation | Effect |
|-----------|--------|
| `flash-green` | bg from `--flash-win-bg` to transparent |
| `flash-red` | bg from `--flash-loss-bg` to transparent |
| `glow-pulse` | opacity 0.6 → 1 → 0.6 |

### Z-Index Stack (Full Application)
| z-index | Element |
|---------|---------|
| 1 | `.resize-handle` |
| 20 | Settings companion overlays |
| 100 | `.mv-search-results` |
| 1000 | `.window-color-picker` |
| 10000 | `.settings-overlay` |
| 10001 | `.menu-bar` |
| 10002 | `.menu-dropdown` |
| 99999 | `.window--pinned` (inline) |
| 100000 | `.window-context-menu` |
| dynamic | `.window` (increments on focus) |

### Transition Consistency
All components consistently use `var(--transition-fast)` (80ms) for hover effects and `var(--transition-normal)` (150ms) for state changes. No raw transition values found outside the variable system in component CSS.

---

## 17. Known Issues and Pain Points

### Missing CSS Definitions
1. **Window tab bar** — `.window-tab-bar`, `.window-tab`, `.window-tab--active`, `.window-tab-label`, `.window-tab-detach` rendered in JSX but no CSS rules. Merged/tabbed windows are unstyled.
2. **Window merge target** — `.window--merge-target` class added during drag but no CSS rule. No visual feedback for merge targets.
3. **Accounts.jsx has no CSS file** — all `acct-*` classes (`acct-header-bar`, `acct-table`, `acct-th`, `acct-td`, `acct-row`, etc.) are undefined.

### Hardcoded Values (Not Using Design Tokens)
4. **PopoutWindow body** — `#121212` bg and `#e0e0e0` text don't match `--bg-primary`/`--text-primary`.
5. **MarketViewer `.mv-price-value`** — `font-size: 20px` hardcoded.
6. **TitleBar height** — `32px` hardcoded in CSS. SnapManager hardcodes `TITLEBAR_HEIGHT = 32` (refers to Electron titlebar, not window titlebar 22px).
7. **Chart canvas uses hardcoded hex** — `#121212`, `#00c853`, `#ff1744` diverge from design tokens.
8. **All Settings Companion panels** — hardcoded px (`10px 12px`, `13px`, `6px`, `3px`) instead of design tokens.
9. **MarketClockSettings** — inline `<style>` injection with hardcoded px and `#fff`.
10. **Chart internal font** — `'Roboto Mono'` at `11px` hardcoded in lightweight-charts config.
11. **TimeSale FONT_SIZE_MAP** — 10/11/13px inline, not using token system.

### Dead CSS (Defined But Never Applied)
12. **AlertTrigger row states** — `.at-row--triggered`, `.at-row--pending`, `.at-row--expired` and `.at-status-badge` variants in CSS, never applied in JSX.
13. **MarketClock market status** — `.mc-status--open/closed/pre/post` with glow animations fully styled but JSX never renders status info.

### CSS Variables Defined But Unused
14. `--bg-surface`, `--bg-elevated` — defined in `:root`, unused in any CSS.
15. `--border-active` — defined, unused.
16. `--context-menu-bg/border/shadow` — defined, but components use direct var references instead.
17. `--shadow-glow-highlight`, `--shadow-glow-info` — defined, unused anywhere.
18. All `--*-width`/`--*-height` component sizing vars — CSS-defined but JS `TYPE_SIZES` used instead.

### Data Flow Issues
19. **LiveScanner imports mockData directly** — bypasses dataFeed adapter, will never use real data.
20. **TimeSale imports mockData directly** — same issue as LiveScanner.
21. **MaxPos hardcoded to 100** in useHotkeyDispatch.js — risk settings integration missing.
22. **omsService initializes on import** — eager load even when unused.
23. **analyticsService fetches settlements but just re-returns fills** — no added value.

### UI Inconsistencies
24. **OrderBook uses `var(--bg-secondary)` for thead** while Positions/TradeLog/Accounts use `var(--bg-tertiary)`.
25. **Montage flash has no CSS keyframes** — relies on global index.css animations via class toggle.
26. **MontageSettings lacks GridSettingsPanel** — only trade settings panel without it.
27. **P&L token inconsistency** — OrderBook uses `--accent-win`/`--accent-sell` while scoped components use `--accent-buy`/`--accent-sell` (same values, different semantics).

### Architecture Observations
28. **All services use module-level singletons** — no dependency injection, harder to test.
29. **alertEngine.worker.js circular buffers fixed at 256** — not configurable.
30. **linkBus uses subscriber array, not Set** — no duplicate prevention.
31. **No loading states for HistoricalScanner** — scan button shows text but no spinner.
32. **No error states** — scanner components don't display error messages from failed service calls.
33. **AlertTrigger settings only contains GridSettingsPanel** — `flashOnAlert` setting never exposed in UI.
