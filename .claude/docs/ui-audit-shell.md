# UI Audit: Shell, Global Layout, Color Palette & Typography

> Generated 2026-03-06 by worker-4 (Opus)
> Covers: index.css, Shell, WindowManager, Window, PopoutWindow, SnapManager, TitleBar, MenuBar, MarketViewer, SettingsPanel, GridSettingsPanel, HotkeyManager

---

## Table of Contents
1. [Complete Color Palette Inventory](#1-complete-color-palette-inventory)
2. [Complete Typography Inventory](#2-complete-typography-inventory)
3. [Global Spacing System](#3-global-spacing-system)
4. [Component: Shell](#4-shell)
5. [Component: WindowManager](#5-windowmanager)
6. [Component: Window](#6-window)
7. [Component: PopoutWindow](#7-popoutwindow)
8. [Component: SnapManager](#8-snapmanager)
9. [Component: TitleBar](#9-titlebar)
10. [Component: MenuBar](#10-menubar)
11. [Component: MarketViewer](#11-marketviewer)
12. [Component: SettingsPanel](#12-settingspanel)
13. [Component: GridSettingsPanel](#13-gridsettingspanel)
14. [Component: HotkeyManager](#14-hotkeymanager)
15. [Cross-Component Issues & Observations](#15-cross-component-issues--observations)

---

## 1. Complete Color Palette Inventory

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
| Variable | Value | Description |
|----------|-------|-------------|
| `--bg-surface` | `#101520` | Surface layer |
| `--bg-elevated` | `#1a2332` | Elevated surface |
| `--bg-overlay` | `rgba(2, 4, 8, 0.82)` | Overlay backdrop |

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
| `--accent-buy` | `#3ecf8e` | Buy side (same as win) |
| `--accent-sell` | `#e05c5c` | Sell side (same as loss) |
| `--accent-warning` | `#e5952e` | Orange warning |
| `--accent-info` | `#5490d4` | Blue informational |
| `--accent-neutral` | `#656e80` | Neutral grey |

### Borders
| Variable | Value | Description |
|----------|-------|-------------|
| `--border-color` | `#1a2233` | Standard border |
| `--border-subtle` | `#111827` | Subtle/thin border |
| `--border-focus` | `#d4a853` | Focus ring (gold) |
| `--border-active` | `#2a3a55` | Active state border |

### Shadows
| Variable | Value |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.45), 0 0 1px rgba(0,10,30,0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,5,20,0.3)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,5,20,0.4)` |
| `--shadow-chip` | `0 1px 4px rgba(0,0,0,0.5)` |
| `--overlay-bg` | `rgba(2, 4, 8, 0.8)` |

### Glow Effects
| Variable | Value |
|----------|-------|
| `--shadow-glow-win` | `0 0 12px rgba(62,207,142,0.3)` |
| `--shadow-glow-loss` | `0 0 12px rgba(224,92,92,0.3)` |
| `--shadow-glow-highlight` | `0 0 12px rgba(212,168,83,0.25)` |
| `--shadow-glow-info` | `0 0 10px rgba(84,144,212,0.2)` |

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
| Variable | Value |
|----------|-------|
| `--context-menu-bg` | `var(--bg-secondary)` |
| `--context-menu-border` | `var(--border-color)` |
| `--context-menu-shadow` | `var(--shadow-lg)` |

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

---

## 2. Complete Typography Inventory

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

### Font Size Usage Across All Audited Components

| Component / Class | Size | Family | Weight | Line-Height | Letter-Spacing |
|-------------------|------|--------|--------|-------------|----------------|
| **Body** | `--font-size-md` (11.5px) | `--font-sans` | normal | 1.4 | 0.01em |
| **TitleBar .titlebar-title** | `--font-size-sm` (10.5px) | `--font-sans` | 500 | — | 0.5px |
| **TitleBar .titlebar-btn** | — | — | — | — | — |
| **MenuBar .menu-bar** | `--font-size-sm` (10.5px) | inherited (sans) | — | — | — |
| **MenuBar .menu-item** | inherited (10.5px) | inherited | — | — | 0.5px |
| **MenuBar .menu-dropdown-item** | `--font-size-sm` (10.5px) | inherited | — | — | — |
| **Window .window-title** | `--font-size-sm` (10.5px) | `--font-sans` | — | — | — |
| **Window .window-context-menu** | `--font-size-md` (11.5px) | inherited | — | — | — |
| **Window .window-color-unlink** | `--font-size-xs` (9.5px) | inherited | — | — | — |
| **Window .window-placeholder** | `--font-size-lg` (12.5px) | inherited | — | — | — |
| **Window .window-pin-icon** | `--font-size-xs` (9.5px) | inherited | — | — | — |
| **MarketViewer .market-viewer** | `--font-size-xs` (9.5px) | `--font-mono` | — | — | — |
| **MarketViewer .mv-ticker-select** | `--font-size-xs` (9.5px) | `--font-mono` | — | — | — |
| **MarketViewer .mv-ticker-name** | `--font-size-lg` (12.5px) | — | 700 | — | — |
| **MarketViewer .mv-last-trade** | `--font-size-sm` (10.5px) | — | — | — | — |
| **MarketViewer .mv-price-label** | `--font-size-xs` (9.5px) | — | — | — | 1px |
| **MarketViewer .mv-price-value** | **20px** (hardcoded) | `--font-mono` | 700 | — | — |
| **MarketViewer .mv-depth-title** | `--font-size-xs` (9.5px) | — | — | — | 1px |
| **MarketViewer .mv-depth-table** | `--font-size-sm` (10.5px) | — | — | — | — |
| **MarketViewer .mv-depth-table th** | `--font-size-xs` (9.5px) | — | 400 | — | — |
| **MarketViewer .mv-depth-table td** | — | `--font-mono` | — | — | — |
| **MarketViewer .mv-loading** | `--font-size-md` (11.5px) | — | — | — | — |
| **MarketViewer .mv-search-input** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **MarketViewer .mv-search-item** | `--font-size-md` (11.5px) | — | — | — | — |
| **MarketViewer .mv-search-ticker** | — | — | 600 | — | — |
| **SettingsPanel .settings-title** | `--font-size-lg` (12.5px) | — | 600 | — | — |
| **SettingsPanel .settings-section-title** | `--font-size-xs` (9.5px) | — | 600 | — | 0.5px |
| **SettingsPanel .settings-tab** | `--font-size-md` (11.5px) | — | — | — | — |
| **SettingsPanel .settings-tab--active** | — | — | 500 | — | — |
| **SettingsPanel .settings-label** | `--font-size-md` (11.5px) | — | — | — | — |
| **SettingsPanel .settings-desc** | `--font-size-sm` (10.5px) | — | — | — | — |
| **SettingsPanel .settings-sub-header** | `--font-size-sm` (10.5px) | — | 600 | — | 0.5px |
| **SettingsPanel .settings-number** | `--font-size-md` (11.5px) | — | — | — | — |
| **SettingsPanel .settings-select** | `--font-size-md` (11.5px) | — | — | — | — |
| **SettingsPanel .settings-text-input** | `--font-size-md` (11.5px) | — | — | — | — |
| **SettingsPanel .settings-slider-value** | `--font-size-xs` (9.5px) | — | — | — | — |
| **SettingsPanel .settings-muted** | `--font-size-md` (11.5px) | — | — | — | — |
| **GridSettingsPanel .gs-section-title** | `--font-size-xs` (9.5px) | — | 600 | — | 0.5px |
| **GridSettingsPanel .gs-column-label** | `--font-size-md` (11.5px) | — | — | — | — |
| **GridSettingsPanel .gs-label** | `--font-size-md` (11.5px) | — | — | — | — |
| **GridSettingsPanel .gs-select** | `--font-size-md` (11.5px) | — | — | — | — |
| **GridSettingsPanel .gs-slider-value** | `--font-size-xs` (9.5px) | — | — | — | — |
| **GridSettingsPanel .gs-clear-color** | `--font-size-lg` (12.5px) | — | — | 1 | — |
| **GridSettingsPanel .gs-empty-rules** | `--font-size-sm` (10.5px) | — | — | — | — |
| **GridSettingsPanel .gs-rule-value** | `--font-size-md` (11.5px) | — | — | — | — |
| **GridSettingsPanel .gs-add-rule-btn** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-profile-select** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-btn** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-error** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk-bindings-title** | `--font-size-sm` (10.5px) | — | 600 | — | 0.05em |
| **HotkeyManager .hk-binding-key** | `--font-size-sm` (10.5px) | — | 600 | — | — |
| **HotkeyManager .hk-binding-label** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk-binding-delete** | `--font-size-xl` (14px) | — | — | 1 | — |
| **HotkeyManager .hk-empty** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk-editor-title** | `--font-size-sm` (10.5px) | — | 600 | — | 0.05em |
| **HotkeyManager .hk-field-label** | `--font-size-xs` (9.5px) | — | — | — | 0.05em |
| **HotkeyManager .hk-key-input** | `--font-size-md` (11.5px) | `--font-mono` | 600 | — | — |
| **HotkeyManager .hk-text-input** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-script-input** | `--font-size-md` (11.5px) | `--font-mono` | — | 1.4 | — |
| **HotkeyManager .hk-validation** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk-warning** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk-category-select** | `--font-size-md` (11.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-save-btn** | `--font-size-md` (11.5px) | — | — | — | — |
| **HotkeyManager .hk-help-header** | `--font-size-sm` (10.5px) | — | 600 | — | 0.05em |
| **HotkeyManager .hk-help-toggle** | `--font-size-xs` (9.5px) | — | — | — | — |
| **HotkeyManager .hk-help-section-title** | `--font-size-sm` (10.5px) | — | 600 | — | 0.05em |
| **HotkeyManager .hk-help-cmd-name** | `--font-size-md` (11.5px) | — | 600 | — | — |
| **HotkeyManager .hk-help-cmd-syntax** | `--font-size-sm` (10.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-help-cmd-desc** | `--font-size-sm` (10.5px) | — | — | — | — |
| **HotkeyManager .hk-help-example** | `--font-size-xs` (9.5px) | `--font-mono` | — | — | — |
| **HotkeyManager .hk-help-var-name** | `--font-size-sm` (10.5px) | — | 600 | — | — |
| **HotkeyManager .hk-help-var-desc** | `--font-size-sm` (10.5px) | — | — | — | — |

### Hardcoded Font Sizes (Non-Variable)
| Location | Size | Notes |
|----------|------|-------|
| MarketViewer `.mv-price-value` | `20px` | Only hardcoded size in audited files |

### Font Weight Summary
- **400**: table headers (`.mv-depth-table th`)
- **500**: titlebar title, active settings tab
- **600**: section titles, binding keys, editor titles, headings, search ticker, settings title
- **700**: ticker name, price values

---

## 3. Global Spacing System

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

## 4. Shell

**Files:** `src/components/Shell.jsx`, `src/components/Shell.css`

### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.shell-workspace` | background | `var(--bg-primary)` (#060910) |

### Layout
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

### Stacking
- Shell is the root flex container — no z-index.
- MenuBar and WindowManager sit inside this flexbox.

### Interactive Elements
- None directly. Shell is a container.

### Workflow
1. Shell renders: `<MenuBar>` (fixed height top bar), `<div.shell-workspace>` (flexible area for windows), and `<SettingsPanel>` (modal overlay).
2. User opens windows from MenuBar → dispatches to `windowReducer`.
3. Reducer supports: OPEN_WINDOW, CLOSE_WINDOW, FOCUS_WINDOW, MERGE_WINDOWS, SET_ACTIVE_TAB, DETACH_TAB, POP_OUT_WINDOW, POP_IN_WINDOW.
4. `useHotkeyDispatch` hook provides keyboard navigation.
5. Custom events (`open-window`) allow child components to open windows.

### JS Constants (Shell.jsx)
- `DEFAULT_WIDTH`: 400, `DEFAULT_HEIGHT`: 300
- `INITIAL_X`: 50, `INITIAL_Y`: 10
- `TYPE_SIZES`: Per-type default sizes (mirrors CSS vars)

---

## 5. WindowManager

**File:** `src/components/WindowManager.jsx`

### Layout / Rendering
- No CSS file — renders directly into parent `.shell-workspace`.
- Maps over `windows` object, rendering either `<Window>` or `<PopoutWindow>` per entry.
- Uses `COMPONENT_REGISTRY` map to resolve `win.type` → React component.

### Component Registry
```
login → Placeholder, montage → Montage, price-ladder → PriceLadder,
accounts → Accounts, positions → Positions, trade-log → TradeLog,
event-log → EventLog, order-book → OrderBook, chart → Chart,
time-sale → TimeSale, market-viewer → MarketViewer, news-chat → NewsChat,
live-scanner → LiveScanner, historical-scanner → HistoricalScanner,
alert-trigger → AlertTrigger, market-clock → MarketClock,
hotkey-config → HotkeyManager
```

### Placeholder Component
- Inline `<div className="window-placeholder">` with centered text.
- Styled in Window.css: center-aligned, `--font-size-lg`, `--text-muted`.

### Workflow
- Receives `windows`, `onClose`, `onFocus`, `onMerge`, `onSetActiveTab`, `onDetachTab`, `onPopOut`, `onPopIn`.
- Iterates windows, resolves component, passes `title`, `windowId`, `type`, and optional `ticker`.
- Popped-out windows render via `<PopoutWindow>` portal; inline windows via `<Window>`.

---

## 6. Window

**Files:** `src/components/Window.jsx`, `src/components/Window.css`

### Colors
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

### Fonts
| Element | Size | Family | Weight |
|---------|------|--------|--------|
| `.window-title` | `--font-size-sm` | `--font-sans` | normal |
| `.window-color-unlink` | `--font-size-xs` | — | — |
| `.window-context-menu` | `--font-size-md` | — | — |
| `.window-placeholder` | `--font-size-lg` | — | — |
| `.window-pin-icon` | `--font-size-xs` | — | — |

### Padding / Margin / Gap
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

### Border / Border-Radius
| Element | border-radius |
|---------|---------------|
| `.window` | `var(--radius-md)` (3px) |
| `.window-close-btn` | `var(--radius-sm)` (2px) |
| `.window-color-chip` | `var(--radius-sm)` (2px) |
| `.window-color-picker` | `var(--radius-sm)` (2px) |
| `.window-color-swatch` | `50%` (circle) |
| `.window-context-menu` | `var(--radius-sm)` (2px) |

### Shadows
| Element | Shadow |
|---------|--------|
| `.window` | `var(--shadow-sm)` |
| `.window-color-chip:hover` | `var(--shadow-chip)` |
| `.window-color-swatch:hover` | `var(--shadow-chip)` |
| `.window-color-swatch--active` | `var(--shadow-chip)` |
| `.window-color-picker` | `var(--shadow-md)` |
| `.window-context-menu` | `var(--shadow-md)` |

### Hover/Active/Focus States
- `.window:focus-within` → gold border
- `.window-close-btn:hover` → red background (#e05c5c)
- `.window-color-chip:hover` → scale(1.2) + shadow
- `.window-color-swatch:hover` → scale(1.2) + shadow
- `.window-context-item:hover` → bg-hover + text-primary
- `.window-context-item--disabled:hover` → transparent bg, text-muted (no change)
- `.window-color-unlink:hover` → text-primary

### Layout
- `.window`: `position: absolute`, `display: flex`, `flex-direction: column`, overflow hidden
- `.window-titlebar`: `display: flex`, `align-items: center`, `height: var(--window-titlebar-height)` (22px), `flex-shrink: 0`
- `.window-body`: `flex: 1`, `overflow: auto`

### Z-Ordering
| Element | z-index |
|---------|---------|
| `.window` | dynamic from `zIndex` prop (increments on focus) |
| `.window--pinned` | `99999` (inline style) |
| `.resize-handle` | `1` |
| `.window-color-picker` | `1000` |
| `.window-context-menu` | `100000` |

### Resize Handles
- 8 handles: n, s, e, w, ne, nw, se, sw
- Edge handles: `--resize-handle-size` (4px) thick, inset -3px
- Corner handles: 10px × 10px, positioned at corners with -3px inset
- Cursors: n-resize, s-resize, e-resize, w-resize, ne-resize, nw-resize, se-resize, sw-resize

### Drag/Resize Behavior
- **Drag**: mousedown on titlebar → mousemove calculates delta → applies snap via SnapManager → updates DOM directly (posRef, not state) → re-renders on mouseup
- **Resize**: mousedown on handle → mousemove adjusts size with min constraints → updates SnapManager → DOM direct manipulation → re-renders on mouseup
- **Group drag**: If window has color link, emits drag deltas to other linked windows via linkBus
- **Merge detection**: During drag, checks if center-top overlaps another window's titlebar area → highlights target with `.window--merge-target` class → on drop, calls `onMerge(sourceId, targetId)`

### Interactive Elements
1. **Color chip** (titlebar left) — click: toggle color picker; shift+click: cycle colors
2. **Color picker dropdown** — swatches + "Unlink" button
3. **Close button** (titlebar right) — X icon from lucide-react
4. **Tab bar** (below titlebar, for merged windows) — tab labels + detach (×) buttons
5. **Context menu** (right-click titlebar) — Pop Out, Pin to Top, Hide Title Bar, Settings
6. **Resize handles** (8 edges/corners)
7. **Double-click titlebar** → pop out window

### Missing CSS (Bug)
The following classes are referenced in JSX but have **no CSS rules** in Window.css:
- `.window-tab-bar`
- `.window-tab`
- `.window-tab--active`
- `.window-tab-label`
- `.window-tab-detach`
- `.window--merge-target`

These will render without styling.

---

## 7. PopoutWindow

**File:** `src/components/PopoutWindow.jsx`

### Colors (Inline Styles)
| Element | Property | Value |
|---------|----------|-------|
| `w.document.body` | backgroundColor | `#121212` (hardcoded) |
| `w.document.body` | color | `#e0e0e0` (hardcoded) |
| `#popout-root div` | background | `var(--bg-secondary)` |

### Fonts (Inline Styles)
| Element | fontFamily |
|---------|-----------|
| `w.document.body` | `'Inter', system-ui, sans-serif` (hardcoded) |

### Layout
- Opens `window.open()` with specified width/height, centered on screen
- Creates a `#popout-root` div: 100% width, 100vh height, flex column
- Body: margin 0, padding 0, overflow hidden

### Behavior
- Copies all `<style>` and `<link[rel=stylesheet]>` from parent
- Copies all CSS custom properties from `:root` computed style
- Registers in module-level `openPopouts` Set for cleanup on parent unload
- Calls `onClose` when popup is closed by user
- Renders children via `createPortal()`

### Issues
- `#121212` and `#e0e0e0` are hardcoded and don't match the design token system (`--bg-primary` is `#060910`, `--text-primary` is `#cdd1da`). The CSS variables are copied separately and applied to `#popout-root`, but the body styles differ.

---

## 8. SnapManager

**File:** `src/components/SnapManager.jsx`

### Constants
| Name | Value |
|------|-------|
| `DEFAULT_SNAP_DISTANCE` | `10` (pixels) |
| `TITLEBAR_HEIGHT` | `32` (pixels, used for merge detection and bottom-edge snap) |

### Data Structure
- Module-level `Map` registry: `id → { x, y, width, height }`

### API
| Function | Description |
|----------|-------------|
| `register(id, rect)` | Add window to registry |
| `unregister(id)` | Remove window from registry |
| `update(id, rect)` | Update window position/size |
| `getRect(id)` | Get window rect |
| `calculateSnap(id, x, y, w, h, snapDist)` | Returns snapped `{ x, y, didSnapX, didSnapY }` |
| `findMergeTarget(draggedId, dragX, dragY, dragWidth)` | Returns target window id if center-top overlaps |
| `findOpenPosition(width, height)` | Finds non-overlapping position for new window |

### Snap Logic
1. Screen edges: left (x=0), right (x+w=screenW), top (y=0), bottom (y+h=screenH-32)
2. Other windows: left↔right, right↔left, left↔left, right↔right (same for vertical)
3. Default snap distance: 10px

### Merge Detection
- Checks if dragged window's center-X is within target's X range AND dragged Y is within target's first 32px (titlebar area)

### Position Finding (`findOpenPosition`)
- Scans grid: step = max(width, 100) × max(height, 80)
- Tests for overlap with all registered windows
- Falls back to cascade: `(50 + offset, 10 + offset)` where offset = `(count % 10) * 30`

---

## 9. TitleBar

**Files:** `src/components/TitleBar.jsx`, `src/components/TitleBar.css`

### Colors
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

### Fonts
| Element | Size | Weight | Letter-Spacing |
|---------|------|--------|----------------|
| `.titlebar-title` | `--font-size-sm` (10.5px) | 500 | 0.5px |

### Padding / Margin
| Element | Property | Value |
|---------|----------|-------|
| `.titlebar-title` | padding-left | `var(--spacing-xl)` (14px) |

### Layout
| Property | Value |
|----------|-------|
| `.titlebar` display | `flex` |
| `.titlebar` align-items | `center` |
| `.titlebar` justify-content | `space-between` |
| `.titlebar` height | `32px` (hardcoded, not using a var) |
| `.titlebar` flex-shrink | `0` |
| `.titlebar-controls` display | `flex`, height 100% |
| `.titlebar-btn` width | `46px`, height 100%, border none, background transparent |

### Special Attributes
- `-webkit-app-region: drag` on `.titlebar` (Electron window drag)
- `-webkit-app-region: no-drag` on `.titlebar-controls`
- `user-select: none` on `.titlebar`

### Interactive Elements
1. Minimize button (`<Minus size={14} />`)
2. Maximize/Restore button (`<Square size={12}>` or `<Maximize2 size={14}>`)
3. Close button (`<X size={14}>`)

### Behavior
- Only renders if `window.electronAPI` exists (Electron only, hidden in browser)
- Tracks maximize state via `api.isMaximized()` and `api.onMaximizeChange()`

---

## 10. MenuBar

**Files:** `src/components/MenuBar.jsx`, `src/components/MenuBar.css`

### Colors
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

### Fonts
| Element | Size | Weight | Letter-Spacing | Text-Transform |
|---------|------|--------|----------------|----------------|
| `.menu-bar` | `--font-size-sm` (10.5px) | — | — | — |
| `.menu-item` | inherited | — | 0.5px | uppercase |
| `.menu-dropdown-item` | `--font-size-sm` (10.5px) | — | — | — |

### Padding / Margin / Gap
| Element | Property | Value |
|---------|----------|-------|
| `.menu-item` | padding | `0 var(--spacing-sm)` (0 4px) |
| `.menu-dropdown` | padding | `var(--spacing-xs) 0` (2px 0) |
| `.menu-dropdown-item` | padding | `var(--spacing-md) var(--spacing-lg)` (6px 10px) |

### Layout
| Element | Properties |
|---------|-----------|
| `.menu-bar` | flex, align-items center, height `var(--menu-bar-height)` (26px), position relative |
| `.menu-item` | position relative, height 100%, flex with center alignment |
| `.menu-dropdown` | position absolute, top 100%, left 0, min-width 170px |

### Z-Ordering
| Element | z-index |
|---------|---------|
| `.menu-bar` | `10001` |
| `.menu-dropdown` | `10002` |

### Shadows
| Element | Shadow |
|---------|--------|
| `.menu-dropdown` | `var(--shadow-md)` |

### Border-Radius
| Element | Radius |
|---------|--------|
| `.menu-dropdown` | `0` (sharp corners) |

### Interactive Elements
- Menu items: Login, Trade, Quotes, Scanners, Setup, Settings
- Login/Settings are direct actions (no dropdown)
- Trade/Quotes/Scanners/Setup have dropdown sub-items
- Hover-follow: when a menu is already open, hovering another opens that one

### Menu Structure
```
Login (action: login)
Trade → Montage, Price Ladder, Accounts, Positions, Trade Log, Event Log, Order Book
Quotes → Chart, Time/Sale, Market Viewer, News/Chat
Scanners → Live, Historical, Alert & Trigger, Market Clock
Setup → Hotkey Config
Settings (action: settings)
```

---

## 11. MarketViewer

**Files:** `src/components/MarketViewer.jsx`, `src/components/MarketViewer.css`

### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.market-viewer` | color | `var(--text-primary)` |
| `.mv-ticker-select` | background | `var(--bg-input)`, color `var(--text-primary)`, border `var(--border-color)` |
| `.mv-ticker-select:focus` | border-color | `var(--border-focus)` (#d4a853) |
| `.mv-ticker-name` | color | `var(--accent-info)` (#5490d4) |
| `.mv-last-trade` | color | `var(--text-secondary)` |
| `.mv-header-row` | border-bottom | `1px solid var(--border-color)` |
| `.mv-price-box` | background | `var(--bg-tertiary)`, border `1px solid var(--border-subtle)` |
| `.mv-price-label` | color | `var(--text-muted)` |
| `.mv-yes-price` | color | `var(--accent-buy)` (#3ecf8e) |
| `.mv-no-price` | color | `var(--accent-sell)` (#e05c5c) |
| `.mv-depth-title` | color | `var(--text-muted)`, border-bottom `var(--border-color)` |
| `.mv-depth-table th` | color | `var(--text-muted)` |
| `.mv-depth-table td` | color | `var(--text-secondary)` |
| `.mv-depth-table tr:nth-child(even)` | background | `var(--bg-row-alt)` |
| `.mv-depth-table tr:hover` | background | `var(--bg-hover)` |
| `.mv-bid-price` | color | `var(--accent-buy)` |
| `.mv-loading` | color | `var(--text-muted)` |
| `.mv-search-input` | background `var(--bg-input)`, color `var(--text-primary)`, border `var(--border-color)` |
| `.mv-search-input:focus` | border-color | `var(--border-focus)` |
| `.mv-search-results` | background `var(--bg-secondary)`, border `var(--border-color)` |
| `.mv-search-ticker` | color | `var(--accent-highlight)` (#d4a853) |
| `.mv-search-title` | color | `var(--text-muted)` |
| `.mv-search-item:hover` | background | `var(--bg-hover)` |

### Fonts
| Element | Size | Family |
|---------|------|--------|
| `.market-viewer` | `--font-size-xs` (9.5px) | `--font-mono` |
| `.mv-ticker-select` | `--font-size-xs` | `--font-mono` |
| `.mv-ticker-name` | `--font-size-lg` (12.5px), weight 700 | — |
| `.mv-last-trade` | `--font-size-sm` | — |
| `.mv-price-label` | `--font-size-xs` | — |
| `.mv-price-value` | **20px** (hardcoded), weight 700 | `--font-mono` |
| `.mv-depth-title` | `--font-size-xs` | — |
| `.mv-depth-table` | `--font-size-sm` | — |
| `.mv-depth-table th` | `--font-size-xs`, weight 400 | — |
| `.mv-depth-table td` | — | `--font-mono` |
| `.mv-loading` | `--font-size-md` | — |
| `.mv-search-input` | `--font-size-md` | `--font-mono` |
| `.mv-search-item` | `--font-size-md` | — |
| `.mv-search-ticker` | weight 600 | — |

### Padding / Margin / Gap
| Element | Property | Value |
|---------|----------|-------|
| `.market-viewer` | gap | `var(--spacing-sm)` (4px) |
| `.mv-ticker-bar` | gap | `var(--spacing-md)` (6px) |
| `.mv-ticker-select` | padding | `var(--spacing-xs) var(--spacing-md)` (2px 6px) |
| `.mv-header-row` | padding | `var(--spacing-xs) 0` |
| `.mv-price-box` | padding | `var(--spacing-sm)` (4px) |
| `.mv-price-label` | margin-bottom | `var(--spacing-xs)` |
| `.mv-prices` | gap | `var(--spacing-sm)` |
| `.mv-depth-title` | padding | `var(--spacing-xs) 0` |
| `.mv-depth-table th` | padding | `var(--spacing-xs)` |
| `.mv-depth-table td` | padding | `var(--spacing-xs)` |
| `.mv-search-input` | padding | `var(--spacing-sm) var(--spacing-md)` |
| `.mv-search-item` | padding | `var(--spacing-sm) var(--spacing-md)`, gap `var(--spacing-lg)` |

### Border-Radius
| Element | Radius |
|---------|--------|
| `.mv-ticker-select` | `var(--radius-sm)` (2px) |
| `.mv-price-box` | `var(--radius-sm)` |
| `.mv-search-input` | `var(--radius-md)` (3px) |
| `.mv-search-results` | `0 0 var(--radius-md) var(--radius-md)` |

### Shadows
| Element | Shadow |
|---------|--------|
| `.mv-search-results` | `var(--shadow-md)` |

### Z-Ordering
| Element | z-index |
|---------|---------|
| `.mv-search-results` | `100` |

### Layout
- `.market-viewer`: flex column, height 100%, font-mono base
- `.mv-ticker-bar`: flex row, center-aligned
- `.mv-prices`: flex row with equal-width boxes
- `.mv-depth-section`: flex 1, flex column, min-height 0 (scroll containment)
- `.mv-search-wrapper`: flex 1, position relative (for dropdown)

### Interactive Elements
1. Ticker select dropdown
2. Search input with auto-suggest dropdown
3. Table rows have hover state

### Behavior
- Subscribes to `useTickerData(ticker)` hook for real-time data
- Flash animation on price change (uses global `.flash-up` / `.flash-down` classes)
- Subscribes to linkBus for cross-window ticker sync
- Search with 300ms debounce via `useMarketSearch()`

---

## 12. SettingsPanel

**Files:** `src/components/SettingsPanel.jsx`, `src/components/SettingsPanel.css`

### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.settings-overlay` | background | `var(--overlay-bg)` (rgba(2,4,8,0.8)) |
| `.settings-panel` | background | `var(--bg-secondary)`, border `1px solid var(--border-color)` |
| `.settings-title` | color | `var(--text-heading)` |
| `.settings-close` | color | `var(--text-muted)` → hover: bg `var(--accent-sell)`, color `var(--text-primary)` |
| `.settings-reset-btn` | color | `var(--text-muted)` → hover: bg `var(--bg-hover)`, color `var(--text-primary)` |
| `.settings-sidebar` | border-right | `1px solid var(--border-color)` |
| `.settings-tab` | color | `var(--text-secondary)` |
| `.settings-tab:hover` | background | `var(--bg-hover)`, color `var(--text-primary)` |
| `.settings-tab--active` | background | `var(--bg-active)`, color `var(--accent-highlight)` |
| `.settings-section-title` | color | `var(--accent-highlight)` |
| `.settings-label` | color | `var(--text-secondary)` |
| `.settings-desc` | color | `var(--text-muted)` |
| `.settings-sub-header` | color | `var(--text-muted)` |
| `.settings-toggle` | background | `var(--bg-tertiary)` |
| `.settings-toggle--on` | background | `var(--accent-highlight)` (#d4a853) |
| `.settings-toggle-knob` | background | `var(--text-primary)` |
| `.settings-number` | background `var(--bg-input)`, border `var(--border-color)`, color `var(--text-primary)` |
| `.settings-number:focus` | border-color | `var(--border-focus)` |
| `.settings-select` | background `var(--bg-input)`, border `var(--border-color)`, color `var(--text-primary)` |
| `.settings-text-input` | background `var(--bg-input)`, border `var(--border-color)`, color `var(--text-primary)` |
| `.settings-eye-btn` | color `var(--text-muted)` → hover: `var(--text-primary)` |
| `.settings-color-picker` | border `1px solid var(--border-color)` |
| `.settings-slider` | accent-color `var(--accent-highlight)` |
| `.settings-slider-value` | color `var(--text-muted)` |
| `.settings-swatch` | border `1px solid var(--border-subtle)` |
| `.settings-muted` | color `var(--text-muted)` |

### Layout
| Element | Properties |
|---------|-----------|
| `.settings-overlay` | fixed inset 0, flex center, z-index 10000 |
| `.settings-panel` | width 620px, max-height 80vh, flex column |
| `.settings-content` | flex row, flex 1, overflow hidden |
| `.settings-sidebar` | width 160px, flex column, flex-shrink 0 |
| `.settings-body` | flex 1, padding `--spacing-lg`, overflow-y auto |
| `.settings-row` | flex, align-items center, justify-content space-between |

### Shadows
| Element | Shadow |
|---------|--------|
| `.settings-panel` | `var(--shadow-lg)` |

### Border-Radius
| Element | Radius |
|---------|--------|
| `.settings-panel` | `var(--radius-md)` (3px) |
| all inputs | `var(--radius-sm)` (2px) |

### Toggle Switch Dimensions
- Width: 32px, Height: 18px, border-radius: 9px
- Knob: 14px × 14px, top 2px, left 2px, border-radius 50%
- Knob on: translateX(14px)

### Interactive Elements
1. Tab sidebar navigation (6 tabs: Connection, Appearance, Trading, Color Linking, Windows, Notifications)
2. Toggle switches (paper mode, confirm orders, sound alerts, etc.)
3. Number inputs (reconnect interval, max retries, order size, snap distance, font size)
4. Select dropdowns (theme, font family, merge behavior)
5. Text inputs (API key, WS URL)
6. Password input with show/hide toggle
7. Color picker (accent color)
8. Range slider (window opacity)
9. Color swatches display (link group colors)
10. Reset to defaults button
11. Close button (X) and Escape key

### Workflow
- Opens as modal overlay via `isOpen` prop
- Loads settings from localStorage (`kalshi_settings`)
- Saves on every change (real-time persist)
- Escape key closes panel
- Click outside (on overlay) closes panel

### Sections
| Tab | Fields |
|-----|--------|
| Connection | API Key (password), Paper mode (toggle), WebSocket URL, Reconnect interval, Max retries |
| Appearance | Theme (select), Accent color (color picker), Font family (select), Font size (number), Window opacity (slider) |
| Trading | Default order size, Confirm orders, Sound alerts, Auto-cancel on disconnect |
| Color Linking | Enable linking (toggle), Link group colors (display only) |
| Windows | Snap distance (number), Merge behavior (select) |
| Notifications | Desktop notifications, Sound alerts, Notify on: fills/cancels/connection/errors |

---

## 13. GridSettingsPanel

**Files:** `src/components/GridSettingsPanel.jsx`, `src/components/GridSettingsPanel.css`

### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.gs-section-title` | color | `var(--accent-highlight)` |
| `.gs-column-item` | background | `var(--bg-tertiary)` |
| `.gs-column-item:hover` | background | `var(--bg-hover)` |
| `.gs-column-dragging` | opacity | `0.5` |
| `.gs-column-over` | border-top | `2px solid var(--accent-highlight)` |
| `.gs-drag-handle` | color | `var(--text-muted)` |
| `.gs-column-label` | color | `var(--text-secondary)` |
| `.gs-checkbox` | accent-color | `var(--accent-highlight)` |
| `.gs-label` | color | `var(--text-secondary)` |
| `.gs-select` | background `var(--bg-input)`, border `var(--border-color)`, color `var(--text-primary)` |
| `.gs-select:focus` | border-color | `var(--border-focus)` |
| `.gs-color-picker` | border `1px solid var(--border-color)` |
| `.gs-clear-color` | color `var(--text-muted)` → hover: `var(--accent-sell)` |
| `.gs-slider` | accent-color | `var(--accent-highlight)` |
| `.gs-slider-value` | color | `var(--text-muted)` |
| `.gs-reset-btn` | color `var(--text-muted)` → hover: bg `var(--bg-hover)`, color `var(--text-primary)` |
| `.gs-add-rule-btn` | bg `var(--bg-tertiary)`, border `var(--border-color)`, color `var(--accent-highlight)` |
| `.gs-add-rule-btn:hover` | background | `var(--bg-hover)` |
| `.gs-empty-rules` | color | `var(--text-muted)` |
| `.gs-rule-value` | background `var(--bg-input)`, border `var(--border-color)`, color `var(--text-primary)` |
| `.gs-rule-value:focus` | border-color | `var(--border-focus)` |
| `.gs-remove-rule` | color `var(--text-muted)` → hover: `var(--accent-sell)` |

### Fonts
| Element | Size |
|---------|------|
| `.gs-section-title` | `--font-size-xs`, weight 600 |
| `.gs-column-label` | `--font-size-md` |
| `.gs-label` | `--font-size-md` |
| `.gs-select` | `--font-size-md` |
| `.gs-slider-value` | `--font-size-xs` |
| `.gs-clear-color` | `--font-size-lg` |
| `.gs-empty-rules` | `--font-size-sm` |
| `.gs-rule-value` | `--font-size-md` |
| `.gs-add-rule-btn` | `--font-size-sm` |

### Layout
- `.grid-settings`: flex column, gap `--spacing-md`
- `.gs-section`: flex column, gap `--spacing-md`
- `.gs-column-list`: flex column, gap `--spacing-xs`, max-height 200px, overflow-y auto
- `.gs-column-item`: flex, align-items center, gap `--spacing-sm`
- `.gs-row`: flex, align-items center, justify-content space-between
- `.gs-rule`: flex, align-items center, gap `--spacing-md`, flex-wrap wrap

### Interactive Elements
1. Column list with drag-to-reorder (HTML5 drag)
2. Column visibility checkboxes
3. Reset column order button
4. Font size select (Small/Medium/Large)
5. Row height slider (18-40px)
6. Background color picker with clear button
7. Text color picker with clear button
8. Conditional formatting rules: column select, operator select, value input, bg color, text color, remove button
9. Add Rule button

### Color Picker Dimensions
- Standard: 28px × 22px
- Rule color: 24px × 20px

---

## 14. HotkeyManager

**Files:** `src/components/HotkeyManager.jsx`, `src/components/HotkeyManager.css`

### Colors
| Element | Property | Value |
|---------|----------|-------|
| `.hk` | color | `var(--text-primary)` |
| `.hk-profile-select` | background `var(--bg-input)`, color `var(--text-primary)`, border `var(--border-color)` |
| `.hk-btn` | background `var(--bg-tertiary)`, color `var(--text-muted)`, border `var(--border-color)` |
| `.hk-btn:hover` | color `var(--text-primary)`, background `var(--bg-hover)` |
| `.hk-btn--accent` | background `var(--accent-highlight)`, color `var(--bg-primary)`, border transparent |
| `.hk-btn--accent:hover` | opacity 0.85 |
| `.hk-btn--accent:disabled` | opacity 0.4 |
| `.hk-error` | background `color-mix(in srgb, var(--accent-sell) 15%, transparent)`, color `var(--accent-sell)` |
| `.hk-bindings` | border-right `1px solid var(--border-color)` |
| `.hk-bindings-title` | color `var(--text-heading)` |
| `.hk-binding-row:hover` | background `var(--bg-hover)` |
| `.hk-binding-row--selected` | background `color-mix(in srgb, var(--accent-highlight) 15%, transparent)` |
| `.hk-binding-key` | color `var(--accent-highlight)` |
| `.hk-binding-label` | color `var(--text-secondary)` |
| `.hk-binding-delete` | color `var(--text-muted)` → hover: `var(--accent-sell)` |
| `.hk-editor-title` | color `var(--text-heading)` |
| `.hk-field-label` | color `var(--text-muted)` |
| `.hk-key-input` | background `var(--bg-input)`, color `var(--text-primary)`, border `var(--border-color)` |
| `.hk-key-input:focus` / `--capturing` | border-color `var(--accent-highlight)`, box-shadow `0 0 0 1px var(--accent-highlight)` |
| `.hk-text-input` | background `var(--bg-input)`, color `var(--text-primary)` |
| `.hk-text-input:focus` | border-color `var(--accent-highlight)` |
| `.hk-script-input` | background `var(--bg-input)`, color `var(--text-primary)`, border `var(--border-color)` |
| `.hk-script-input:focus` | border-color `var(--accent-highlight)` |
| `.hk-validation--ok` | color `var(--accent-buy)` (#3ecf8e) |
| `.hk-validation--err` | color `var(--accent-sell)` (#e05c5c) |
| `.hk-warning` | color `var(--accent-warning)` (#e5952e) |
| `.hk-category-select` | background `var(--bg-input)`, color `var(--text-primary)` |
| `.hk-help-header` | color `var(--text-heading)` |
| `.hk-help-header:hover` | background `var(--bg-hover)` |
| `.hk-help-toggle` | color `var(--text-muted)` |
| `.hk-help-section-title` | color `var(--text-heading)` |
| `.hk-help-cmd` | border-left `2px solid var(--border-color)` |
| `.hk-help-cmd-name` | color `var(--accent-highlight)` |
| `.hk-help-cmd-syntax` | color `var(--text-muted)` |
| `.hk-help-cmd-desc` | color `var(--text-secondary)` |
| `.hk-help-example` | color `var(--text-muted)`, background `var(--bg-tertiary)` |
| `.hk-help-var-name` | color `var(--accent-highlight)` |
| `.hk-help-var-desc` | color `var(--text-secondary)` |
| `.hk-empty` | color `var(--text-muted)` |

### Layout
- `.hk`: flex column, height 100%, overflow hidden
- `.hk-profile-bar`: flex row, gap `--spacing-xs`, border-bottom, flex-shrink 0
- `.hk-body`: flex row, flex 1, min-height 0, overflow hidden
- `.hk-bindings`: width 260px, min-width 200px, flex column, border-right, flex-shrink 0
- `.hk-bindings-list`: flex 1, overflow-y auto
- `.hk-editor`: flex 1, flex column, padding `--spacing-sm`, gap `--spacing-xs`, overflow-y auto

### Animations
- `.hk-help-body`: `hk-slideDown` animation (max-height 0→260px, opacity 0→1)
- Max-height: 260px for help body

### Interactive Elements
1. Profile selector dropdown
2. Save As / Export / Import buttons
3. Hidden file input for import
4. Bindings list with selection + active checkbox + delete button
5. Key combo capture input (click to focus, press keys)
6. Label text input
7. Script textarea (with real-time validation)
8. Category select (trading, navigation, scanner, custom)
9. Save/Update button (accent, disabled when invalid)
10. Collapsible Command Reference help panel

### Behavior
- Two-column layout: bindings list (left), editor (right)
- Key capture mode: click input → "Press keys..." → captures normalized combo
- Real-time script validation via `validateScript()`
- Key conflict detection against existing bindings
- Profile management: save, load, export (download JSON), import (file upload)
- Help panel shows COMMAND_REFERENCE from hotkeyLanguage service

### Delete Button UX
- Hidden (opacity 0) by default, visible on row hover (opacity 1)
- Transitions with `--transition-fast`

---

## 15. Cross-Component Issues & Observations

### Missing CSS Definitions
1. **Window tab bar** — `.window-tab-bar`, `.window-tab`, `.window-tab--active`, `.window-tab-label`, `.window-tab-detach` are all rendered in `Window.jsx` but have **no CSS rules** in `Window.css`. Merged/tabbed windows will have unstyled tab bars.
2. **Window merge target** — `.window--merge-target` class is added dynamically during drag in `Window.jsx` but has no CSS rule. No visual feedback for merge targets.

### Hardcoded Values (Not Using Design Tokens)
1. **PopoutWindow body** — `backgroundColor: '#121212'` and `color: '#e0e0e0'` don't match `--bg-primary` (`#060910`) or `--text-primary` (`#cdd1da`)
2. **MarketViewer `.mv-price-value`** — `font-size: 20px` is the only hardcoded font size; should use a CSS variable
3. **TitleBar height** — `32px` hardcoded in CSS, no CSS variable defined. SnapManager also hardcodes `TITLEBAR_HEIGHT = 32`
4. **SnapManager TITLEBAR_HEIGHT** — `32` (for merge detection zone) doesn't match `--window-titlebar-height` (`22px`). The 32px refers to the Electron titlebar, not window titlebars

### CSS Variable Defined But Unused
- `--bg-surface`, `--bg-elevated` — defined in `:root` but not used in any of the audited CSS files
- `--border-active` — defined but not used in audited files
- `--context-menu-bg`, `--context-menu-border`, `--context-menu-shadow` — defined but actual context menus use direct var references instead
- `--shadow-glow-win`, `--shadow-glow-loss`, `--shadow-glow-highlight`, `--shadow-glow-info` — defined but not used
- All `--*-width` / `--*-height` component sizing vars — defined in CSS but sizing is done via JS `TYPE_SIZES` in Shell.jsx

### Z-Index Stack
| z-index | Element |
|---------|---------|
| 1 | `.resize-handle` |
| 100 | `.mv-search-results` |
| 1000 | `.window-color-picker` |
| 10000 | `.settings-overlay` |
| 10001 | `.menu-bar` |
| 10002 | `.menu-dropdown` |
| 99999 | `.window--pinned` (inline) |
| 100000 | `.window-context-menu` |
| dynamic | `.window` (increments on focus) |

**Potential issue:** A pinned window (99999) is lower than `.window-context-menu` (100000) which is correct. But the menu bar (10001) is higher than a pinned window's natural z-index but lower than 99999. The settings overlay (10000) is lower than the menu bar (10001) — clicking "Settings" in the menu bar could be covered by the menu bar's z-index if the overlay doesn't properly dismiss the menu first.

### Transition Consistency
All components consistently use `var(--transition-fast)` (80ms) for hover effects and `var(--transition-normal)` (150ms) for state changes. No raw transition values found outside the variable system in the audited files.

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

### Scrollbar Styling
- Width/height: 5px
- Track: `var(--scrollbar-track)` → `var(--bg-primary)`
- Thumb: `var(--scrollbar-thumb)` with `--scrollbar-thumb-hover`
- Corner: `var(--bg-primary)`
- Thumb border-radius: 3px

### Keyframe Animations (index.css)
| Animation | Effect |
|-----------|--------|
| `flash-green` | bg from `--flash-win-bg` to transparent |
| `flash-red` | bg from `--flash-loss-bg` to transparent |
| `glow-pulse` | opacity 0.6 → 1 → 0.6 (not used in audited files) |

### Keyframe Animations (Component CSS)
| Animation | File | Effect |
|-----------|------|--------|
| `hk-slideDown` | HotkeyManager.css | max-height 0→260px, opacity 0→1 |
