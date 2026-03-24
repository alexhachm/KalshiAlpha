# State Management Layer

The app uses **module-level singletons** with localStorage persistence and pub/sub — no Redux, Zustand, or React Context. Each store is imported as a module and exposes functional APIs.

## settingsStore.js — Global Settings

**Key**: `kalshi_settings` in localStorage

### Architecture
- Singleton `_settings` object, lazy-loaded on first `load()` call (auto-called on import)
- Deep-merges saved settings with `DEFAULTS` so new keys always appear after upgrades
- `Set<Function>` listener pattern — `subscribe(fn)` returns unsubscribe function

### Sections & Defaults
| Section | Key Fields | Default |
|---------|-----------|---------|
| `connection` | apiKey, paperMode, wsUrl, wsReconnectInterval, wsMaxRetries | paperMode=true |
| `appearance` | theme, accentColor, fontFamily, fontSize, windowOpacity | dark, #00d2ff, Inter, 13, 100 |
| `trading` | defaultOrderSize, confirmOrders, soundAlerts, autoCancelOnDisconnect | 1, true, true, false |
| `colorCoordination` | linkingEnabled | true |
| `windows` | snapDistance, mergeBehavior, savedLayouts | 10, "tab", [] |
| `notifications` | desktopNotifications, soundAlerts, notifyOnFill/Cancel/Connection/Error | false, true, true, false, true, true |
| `scannerPresets` | live[], historical[] | [] each |

### API
- `get()` — full settings object
- `update(section, key, value)` — update single field
- `updateSection(section, partial)` — merge partial into section
- `subscribe(fn)` / `subscribeSection(section, fn)` — change listeners
- `reset()` — restore all defaults
- `getScannerPresets(type)` / `saveScannerPreset(type, name, filters)` / `deleteScannerPreset(type, name)`

### Appearance Runtime
- `initAppearanceRuntime()` — called once from `main.jsx`, applies CSS variables and subscribes to future changes
- `applyAppearanceSettings(appearance)` — sets theme class on `<html>`, applies 25+ CSS custom properties:
  - Theme colors (dark/light): 20+ variables (`--bg-primary`, `--text-primary`, `--border-color`, etc.)
  - Accent color → `--accent-highlight`, `--border-focus`
  - Font family → `--font-sans` (resolved from `FONT_STACKS` map)
  - Font size → scales 7 tokens relative to base 13px (`--font-size-xs` through `--font-size-data`)
  - Window opacity → `--window-opacity`
- Validates: theme (dark/light only), fontSize (10-20), windowOpacity (30-100), accentColor (CSS.supports check)

### Notable Implementation Details
- `deepMerge()` only merges keys that exist in defaults — unknown keys in saved data are silently dropped
- Silent catch on localStorage quota exceeded (no user notification)
- Font validation falls back to wrapping unknown fonts: `'fontName', system-ui, -apple-system, sans-serif`

---

## hotkeyStore.js — Keybinding Manager

**Key**: `kalshi_hotkeys` in localStorage

### Architecture
- Profile-based: `{ activeProfile: string, profiles: { [name]: { bindings, templates, createdAt } } }`
- Default profile: "Default" with 7 bindings (4 navigation, 3 trading) + 4 order templates
- Same singleton + Set<Function> listener pattern as settingsStore

### Binding Schema
```js
{ id: UUID, key: "Ctrl+B", script: "Buy=Route:LIMIT...", label: "Quick Buy", active: bool, category: "trading"|"navigation"|"scanner"|"custom" }
```

### Key Normalization
- `normalizeKeyCombo(event)` — converts KeyboardEvent to canonical string
- `_canonicalize(combo)` — sorts modifiers in fixed order: Ctrl > Alt > Shift > Meta, then key
- Key aliases: Space, arrow keys; single chars uppercased; F1-F12 passed through

### Conflict Detection
- `addBinding()` and `updateBinding()` check for existing active binding on same normalized key
- Throws error with conflicting binding's label for UI display

### Order Templates
- Per-profile array: `{ id, name, size, orderType: "limit"|"market", timeInForce: "gtc"|"ioc"|"day" }`
- 4 defaults: Scalp 1, Standard 10, Size 50, Max 100
- CRUD: `addTemplate()`, `updateTemplate()`, `removeTemplate()`, `findTemplateByName()`

### Profile Management
- `saveProfile(name)` — clones current profile's bindings/templates with new UUIDs
- `loadProfile(name)` — switches active profile
- `deleteProfile(name)` — cannot delete "Default", falls back to Default if deleting active
- `exportProfile(name)` / `importProfile(jsonString)` — JSON serialization with sanitization
  - Import validates: requires name + bindings array, sanitizes category to whitelist, validates orderType/timeInForce

### Config Guard
- `setConfigActive(true/false)` — suppresses hotkey dispatch while HotkeyManager UI is open
- `isConfigActive()` — checked by `useHotkeyDispatch` to avoid triggering trades during config

### Focus Binding Map
- `getFocusBindingMap()` — extracts `Focus=Target` bindings into `{ target: keyCombo }` map
- Used by MenuBar to display shortcut badges next to menu items

### Default Bindings
| Key | Script | Category |
|-----|--------|----------|
| Ctrl+B | Buy=Route:LIMIT Price=Price+0.00 Share=1 TIF=DAY | trading |
| Ctrl+S | Sell=Route:LIMIT Price=Price+0.00 Share=Pos TIF=DAY | trading |
| Escape | CXL | trading |
| Ctrl+M | Focus=Montage | navigation |
| Ctrl+L | Focus=PriceLadder | navigation |
| Ctrl+P | Focus=Positions | navigation |
| Ctrl+K | Focus=Chart | navigation |

---

## hotkeyLanguage.js — DSL Parser

DAS Trader-inspired scripting language for hotkey actions.

### Commands
| Command | Action | Parameters |
|---------|--------|-----------|
| Buy | BUY | Route, Price, Share, TIF, Side |
| Sell | SELL | Route, Price, Share, TIF, Side |
| CXL | CANCEL_ALL | (none) |
| CXLBUY | CANCEL_BUY | (none) |
| CXLSELL | CANCEL_SELL | (none) |
| Focus | FOCUS | target (montage, chart, positions, etc.) |
| SwitchTicker | SWITCH_TICKER | ticker |
| LoadTemplate | LOAD_TEMPLATE | name (supports spaces) |

### Price Expressions
- Market keywords: `Bid`, `Ask`, `Last`, `Mid` → resolved at execution time
- Offset: `Ask+0.05`, `Bid-0.10`, `Price+0.02`
- Fixed: numeric literal (e.g., `0.65`)

### Share Expressions
- Position: `Pos` (full position), `Pos*0.5` (fractional)
- Buying power: `BP*0.1`
- Max position: `MaxPos`
- Fixed: integer literal (e.g., `100`)

### Validation
- Routes: LIMIT, MARKET
- TIF: DAY, GTC, IOC
- Sides: YES, NO (Kalshi-specific)
- Focus targets: 10 window types
- `validateScript(str)` → `{ valid: bool, errors: string[] }`

### Token Parsing
- Space-delimited tokens
- Key=Value or Key:Value syntax
- First token can be compound: `Buy=Route:LIMIT`
- Remaining tokens are `Key=Value` pairs: `Price=Ask+0.05 Share=100 TIF=DAY`

---

## linkBus.js — Color Link Event Bus

### Architecture
- Module-level singleton with 3 subscriber registries (link, group-change, drag)
- Window-to-color mapping persisted in `kalshi_link_groups` localStorage key
- `linkingEnabled` state owned by settingsStore, cached locally with subscriber sync

### Color Groups
8 colors: red, green, blue, yellow, purple, orange, cyan, white (each with hex value)

### State
- `windowGroups: { [windowId]: colorId }` — which window is in which color group
- `subscribers: { [colorId]: Array<{callback, windowId}> }` — market change listeners
- `groupChangeSubscribers: Array<callback>` — notified on any group membership change
- `dragSubscribers: { [colorId]: Array<{windowId, callback}> }` — drag sync listeners

### Pub/Sub Channels
1. **Market linking** (`emitLinkedMarket(windowId, ticker)`)
   - When a window changes ticker, all other windows in the same color group receive the new ticker
   - Skips emitter's own subscribers (prevents infinite loops)
   - No-op if linking disabled or window not in any group

2. **Group changes** (`subscribeToGroupChanges(cb)`)
   - Fires when `setColorGroup()` or `removeFromGroup()` called
   - Payload: `{ windowId, colorId, previousColorId }`

3. **Drag synchronization** (`emitDragDelta(colorId, sourceWindowId, dx, dy)`)
   - When a window in a color group is dragged, emits delta to all other windows in group
   - Each window subscribes with its own ID to avoid self-moves
   - Replaces existing subscription for same windowId (prevents duplicates)

### Legacy Migration
- On load, migrates `kalshi_linking_enabled` localStorage key → settingsStore `colorCoordination.linkingEnabled`
- Removes legacy key after migration

### Reset
- `resetLinkState()` — clears all group assignments, re-reads linkingEnabled from settingsStore
