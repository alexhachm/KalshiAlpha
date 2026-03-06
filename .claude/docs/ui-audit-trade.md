# UI Audit: Trade & Quotes Components

> Generated 2026-03-06 by worker-2. Exhaustive audit of every trade and quotes component.

---

## Design Token Reference (from `src/index.css`)

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#060910` | Base background |
| `--bg-secondary` | `#0d1119` | Panels, headers, overlays |
| `--bg-tertiary` | `#151c28` | Inputs, buttons, badges |
| `--bg-hover` | `#1c2538` | Row/item hover |
| `--bg-input` | `#080c12` | Input fields |
| `--bg-row-alt` | `#0a0f17` | Alternating table rows |
| `--text-primary` | `#cdd1da` | Main text |
| `--text-heading` | `#e8ecf4` | Titles, emphasis |
| `--text-secondary` | `#7c8698` | Secondary info |
| `--text-muted` | `#4e5869` | Timestamps, labels |
| `--accent-win`/`--accent-buy` | `#3ecf8e` | Positive P&L, buy side |
| `--accent-loss`/`--accent-sell` | `#e05c5c` | Negative P&L, sell side |
| `--accent-highlight` | `#d4a853` | Active tabs, selections, links |
| `--accent-warning` | `#e5952e` | Warnings, pending status |
| `--accent-info` | `#5490d4` | Info level, open status |
| `--accent-neutral` | `#656e80` | Closed/inactive |
| `--border-color` | `#1a2233` | Primary borders |
| `--border-subtle` | `#111827` | Row separators |
| `--border-focus` | `#d4a853` | Focus rings |
| `--font-mono` | JetBrains Mono, SF Mono, Consolas | All data |
| `--font-sans` | Inter, system-ui | Settings labels |
| `--font-size-xs` | 9.5px | Small labels, timestamps |
| `--font-size-sm` | 10.5px | Tab labels, counts |
| `--font-size-md` | 11.5px | Default body |
| `--font-size-lg` | 12.5px | Icons, larger text |
| `--font-size-xl` | 14px | Chart labels |
| `--spacing-xs` | 2px | Tight padding |
| `--spacing-sm` | 4px | Standard padding |
| `--spacing-md` | 6px | Medium gaps |
| `--spacing-lg` | 10px | Generous spacing |
| `--spacing-xl` | 14px | Large spacing |
| `--radius-sm` | 2px | Small radius |
| `--radius-md` | 3px | Medium radius |
| `--radius-lg` | 5px | Large radius |
| `--transition-fast` | 80ms ease | Quick interactions |
| `--transition-normal` | 150ms ease | Standard transitions |

---

## 1. OrderBook (`OrderBook.jsx` + `OrderBook.css`)

### 1.1 Colors
- **Container text**: `var(--text-primary)` (#cdd1da)
- **Tab inactive**: `var(--text-muted)` (#4e5869)
- **Tab hover**: `var(--text-primary)`
- **Tab active**: `var(--accent-highlight)` (#d4a853), bottom border `var(--accent-highlight)`
- **Tab badge**: bg `var(--accent-highlight)`, text `var(--bg-primary)`, font-weight 700
- **Linked ticker label**: `var(--accent-highlight)`, weight 600
- **Settings button**: `var(--text-muted)`, hover `var(--text-primary)`, border transparent -> `var(--border-color)`
- **Table header (`.ob-th`)**: bg `var(--bg-secondary)`, text `var(--text-muted)`, border-bottom `var(--border-color)`
- **Row alternating**: `:nth-child(even)` bg `var(--bg-row-alt)`
- **Row hover**: `var(--bg-hover)`
- **Side YES**: `var(--accent-buy)` (#3ecf8e), weight 600
- **Side NO**: `var(--accent-sell)` (#e05c5c), weight 600
- **Status badges**:
  - pending: bg `color-mix(--accent-warning 20%, transparent)`, text `--accent-warning`
  - submitted: bg `color-mix(--accent-info 20%, transparent)`, text `--accent-info`
  - open: bg `color-mix(--accent-win 20%, transparent)`, text `--accent-win`
  - partial: bg `color-mix(--accent-warning 20%, transparent)`, text `--accent-warning`
  - filled: bg `color-mix(--text-muted 15%, transparent)`, text `--text-muted`
  - cancelled: bg `color-mix(--text-muted 10%, transparent)`, text `--text-muted`, opacity 0.7
  - rejected: bg `color-mix(--accent-sell 20%, transparent)`, text `--accent-sell`
- **Cancel button**: border `var(--accent-sell)`, text `--accent-sell`, hover bg `--accent-sell`, text `--bg-primary`
- **P&L positive**: `.text-win` = `var(--accent-win)`
- **P&L negative**: `.text-loss` = `var(--accent-sell)`
- **Time column**: `var(--text-muted)`, size `var(--font-size-xs)`
- **Empty state**: `var(--text-muted)`, size `var(--font-size-md)`
- **Flash animation**: from `color-mix(--accent-highlight 30%, transparent)` to transparent over 0.6s

### 1.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-sm)` (10.5px)
- **Font size classes**: `.ob--font-small` = xs (9.5px), medium = sm (10.5px), large = md (11.5px)
- **Tab label**: `var(--font-mono)`, `var(--font-size-xs)` (9.5px), weight 600
- **Tab badge**: `var(--font-size-xs)`, weight 700
- **Table header**: `var(--font-size-xs)`, weight 700, uppercase, letter-spacing 0.5px
- **Status badge**: `var(--font-size-xs)`, weight 700, uppercase, letter-spacing 0.3px
- **Cancel button**: `var(--font-mono)`, `var(--font-size-xs)`, weight 700, uppercase

### 1.3 Padding, Margin, Gap
- **Tab bar**: padding `0 var(--spacing-sm)`, height 28px
- **Tab items**: gap 0 (flush), padding `0 var(--spacing-sm)`, gap `var(--spacing-sm)` between label & badge
- **Tab badge**: padding `1px var(--spacing-sm)`, border-radius 8px
- **Tab actions area**: gap `var(--spacing-xs)`
- **Settings button**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Table header cell**: padding `var(--spacing-sm) var(--spacing-sm)` (4px 4px)
- **Table data cell**: padding `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- **Status badge**: padding `1px var(--spacing-md)`, border-radius 8px
- **Cancel button**: padding `1px var(--spacing-md)`, border-radius `var(--radius-md)` (3px)

### 1.4 Borders & Border-Radius
- **Tab bar bottom**: `1px solid var(--border-color)`
- **Tab active**: bottom border `2px solid var(--accent-highlight)`
- **Table header bottom**: `1px solid var(--border-color)`
- **Drag-over column**: `border-left: 2px solid var(--accent-highlight)`
- **Badge radius**: 8px (status badges, tab badge)
- **Cancel button radius**: `var(--radius-md)` (3px)
- **Settings button radius**: `var(--radius-sm)` (2px)

### 1.5 Hover/Active/Focus States
- **Tab hover**: color changes to `--text-primary`
- **Tab active**: color `--accent-highlight`, border-bottom `--accent-highlight`
- **Settings btn hover**: color `--text-primary`, border `--border-color`
- **Row hover**: bg `--bg-hover`
- **Cancel btn hover**: bg `--accent-sell`, color `--bg-primary`
- **Cancel btn disabled**: opacity 0.5, cursor not-allowed

### 1.6 Layout
- **Container**: flex column, height 100%
- **Tab bar**: flex row, space-between, center aligned, height 28px, flex-shrink 0
- **Panel**: flex 1, overflow auto, min-height 0
- **Table**: width 100%, border-collapse, table-layout fixed

### 1.7 Data Density
- **Row height**: 20px (CSS default; customizable via grid.rowHeight)
- **Column widths**: auto (from col.width or 'auto')

### 1.8 Data Display Formatting
- **Prices**: `formatCents(cents)` = `(cents / 100).toFixed(2)` — e.g. 67 cents -> "0.67"
- **P&L**: `formatPnl(cents)` = positive `+$X.XX`, negative `-$X.XX`
- **Time**: `formatTime(ts)` = `HH:MM:SS` (24hr)
- **Side**: `.toUpperCase()` — "YES" or "NO"
- **Status**: raw string from ORDER_STATUS enum
- **Filled count**: number, default 0

### 1.9 Interactive States
- **3 tabs**: Open Orders (with badge count), Fills, Positions
- **Settings gear**: opens overlay settings panel (OrderBookSettings)
- **Linked ticker**: shown when colorGroup link is active
- **Column drag-reorder**: drag headers to rearrange
- **Cancel button**: on each open order, disabled while cancelling

### 1.10 Workflow
- User views open orders, fills, or positions via tabs
- Orders filtered by linked ticker if color link active
- Gear icon opens settings overlay for refresh interval, max fills, flash, show cancelled
- Clicking cancel triggers async cancel via omsService
- Fills flash briefly (0.6s) on new fill if flashOnFill enabled
- Settings use GridSettingsPanel for column/row/appearance customization

---

## 2. Montage (`Montage.jsx` + `Montage.css`)

### 2.1 Colors
- **Container text**: `var(--text-primary)`
- **Ticker badge**: bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, border `var(--border-color)`
- **Search input**: bg `var(--bg-tertiary)`, text `var(--text-primary)`, border `var(--border-color)`, focus border `var(--border-focus)`
- **Search results dropdown**: bg `var(--bg-secondary)`, border `var(--border-color)`
- **Search item hover**: bg `var(--bg-hover)`
- **Search ticker text**: `var(--accent-highlight)`, weight 600
- **Search title text**: `var(--text-muted)`
- **Settings button**: bg `var(--bg-tertiary)`, text `var(--text-muted)`, border `var(--border-color)`
- **Book header labels**: `var(--text-heading)`, uppercase, letter-spacing 1px
- **Bid price**: `var(--accent-buy)`
- **Ask price**: `var(--accent-sell)`
- **Book size**: `var(--text-secondary)`
- **Book row hover**: bg `var(--bg-hover)`
- **Info strip**: bg `var(--bg-tertiary)`, text `var(--text-secondary)`
- **Order entry labels**: `var(--text-muted)`, uppercase
- **Input/select**: bg `var(--bg-input)`, text `var(--text-primary)`, border `var(--border-color)`, focus border `var(--border-focus)`
- **BUY YES button**: bg `var(--accent-buy)`, text `var(--text-heading)`
- **BUY NO button**: bg `var(--accent-sell)`, text `var(--text-heading)`
- **Cancel button**: bg `var(--bg-tertiary)`, text `var(--text-secondary)`, border `var(--border-color)`
- **Working orders cancel**: border `var(--border-color)`, text `var(--text-muted)`, hover text `var(--accent-sell)`, hover border `var(--accent-sell)`
- **Confirm dialog overlay**: `color-mix(--bg-primary 60%, transparent)`
- **Confirm dialog**: bg `var(--bg-secondary)`, border `var(--border-color)`, shadow `0 8px 24px color-mix(--bg-primary 50%, transparent)`
- **Error state**: text `var(--accent-sell)`, bg `color-mix(--accent-sell 8%, transparent)`
- **P&L .text-win**: `var(--accent-buy)` (within montage scope)
- **P&L .text-loss**: `var(--accent-sell)` (within montage scope)

### 2.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-md)` (11.5px)
- **Font size classes**: small = sm (10.5px), medium = md (11.5px), large = lg (12.5px)
- **Search input**: `var(--font-mono)`, `var(--font-size-md)`
- **Book header**: `var(--font-size-xs)`, uppercase, letter-spacing 1px
- **Book price**: weight 600
- **Info strip**: `var(--font-size-sm)`
- **Labels**: `var(--font-size-xs)`, uppercase, letter-spacing 0.5px
- **Buttons**: `var(--font-mono)`, `var(--font-size-md)`, weight 700
- **Working order header**: `var(--font-size-xs)`, uppercase, letter-spacing 1px
- **Working order rows**: `var(--font-size-sm)`
- **Confirm title**: `var(--font-size-md)`, weight 700
- **Confirm body**: `var(--font-size-md)`, line-height 1.5

### 2.3 Padding, Margin, Gap
- **Container gap**: `var(--spacing-xs)` (2px)
- **Ticker bar**: gap `var(--spacing-xs)`
- **Ticker badge**: padding `var(--spacing-sm) var(--spacing-md)` (4px 6px)
- **Search input**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Search results max-height**: 200px
- **Search item**: padding `var(--spacing-sm) var(--spacing-md)`, gap `var(--spacing-lg)`
- **Book gap**: `var(--spacing-xs)` between bid/ask sides
- **Book header**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Book row**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Info strip**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Order entry**: gap `var(--spacing-xs)`, padding `var(--spacing-xs) 0`
- **Order row**: gap `var(--spacing-sm)`
- **Buttons gap**: `var(--spacing-sm)`, padding-top `var(--spacing-xs)`
- **Button padding**: `var(--spacing-sm)`
- **Confirm dialog padding**: `var(--spacing-lg)`
- **Confirm dialog min-width**: 220px

### 2.4 Borders & Border-Radius
- **Ticker badge radius**: `var(--radius-md)` (3px)
- **Search input radius**: `var(--radius-sm)` (2px)
- **Search results bottom radius**: `0 0 var(--radius-md) var(--radius-md)`
- **Settings btn radius**: `var(--radius-sm)`
- **Book header border-bottom**: `1px solid var(--border-color)`
- **Info strip radius**: `var(--radius-sm)`
- **Order entry border-top**: `1px solid var(--border-color)`
- **Input/select radius**: `var(--radius-sm)`
- **Button radius**: `var(--radius-sm)`
- **Confirm dialog radius**: `var(--radius-md)`
- **Working orders border-top**: `1px solid var(--border-color)`

### 2.5 Hover/Active/Focus States
- **Search item hover**: bg `--bg-hover`
- **Book row hover**: bg `--bg-hover`
- **Settings btn hover**: text `--text-primary`
- **Button hover**: opacity 0.85
- **Button active**: transform scale(0.97)
- **Working order cancel hover**: text `--accent-sell`, border `--accent-sell`

### 2.6 Layout
- **Container**: flex column, height 100%, gap xs
- **Ticker bar**: flex row, center aligned
- **Book**: flex row, gap xs, flex-shrink 0; each side flex 1 column
- **Info strip**: flex row, space-between, center aligned
- **Order entry**: flex column, gap xs
- **Order row**: flex row, center aligned, gap sm
- **Buttons**: flex row, gap sm; each button flex 1
- **Working orders**: flex 1, min-height 0, overflow-y auto
- **Confirm overlay**: position absolute, inset 0, flex center

### 2.7 Data Density
- **Shares input width**: 60px
- **Price input width**: 60px
- **Book size min-width**: 40px
- **Depth**: configurable depthLevels (default 5)

### 2.8 Data Display Formatting
- **Prices**: `{level.price}c` — integer cents with "c" suffix
- **Last**: `{data.yes.price}c`
- **Volume**: `{data.lastTrade.size}` (raw number)
- **Side**: `YES`/`NO` string, colored by text-win/text-loss
- **Order confirm**: `"TYPE SIZE SIDE @ PRICEc"` then `"ticker | TIF"`

### 2.9 Interactive States
- **Market search**: debounced 300ms typeahead with dropdown
- **Click bid/ask level**: sets limit price in order entry
- **Order type**: limit/market toggle (select)
- **Time in force**: GTC/IOC toggle (select)
- **BUY YES / BUY NO**: place order buttons (with optional confirm dialog)
- **Working orders**: each has cancel button
- **Settings panel**: overlay with save/cancel

### 2.10 Workflow
1. Select market via search or dropdown
2. View Level II depth (bids left, asks right)
3. Click price to pre-fill limit price
4. Set size, type, TIF
5. Click BUY YES or BUY NO
6. Confirm dialog (if confirmBeforeSend enabled)
7. Working orders shown below with cancel capability
8. Color link bus: syncs ticker across linked windows

---

## 3. PriceLadder (`PriceLadder.jsx` + `PriceLadder.css`)

### 3.1 Colors
- **Container text**: `var(--text-primary)`
- **Ticker select**: bg `var(--bg-tertiary)`, border `var(--border-color)`, focus border `var(--border-focus)`
- **Settings/recenter buttons**: bg `var(--bg-tertiary)`, text `var(--text-muted)`, border `var(--border-color)`, hover text `var(--text-primary)`
- **Column headers**: text `var(--text-muted)`, border-bottom `var(--border-color)`
- **Drag-over**: bg `color-mix(--accent-highlight 12%, transparent)`, border-left `2px solid var(--accent-highlight)`
- **Row border-bottom**: `1px solid var(--border-subtle)`
- **Row hover**: bg `var(--bg-hover)`
- **Last trade row**: bg `color-mix(--accent-highlight 6%, transparent)`, border-top/bottom `1px solid var(--accent-highlight)`
- **Price column**: text `var(--text-secondary)`, weight 600
- **Price (ask side)**: `var(--accent-loss)`
- **Price (bid side)**: `var(--accent-win)`
- **Bid cell hover**: bg `color-mix(--accent-win 8%, transparent)`
- **Ask cell hover**: bg `color-mix(--accent-loss 8%, transparent)`
- **Volume column**: `var(--text-muted)`
- **Volume bar bid**: bg `var(--accent-win)`, opacity 0.12
- **Volume bar ask**: bg `var(--accent-loss)`, opacity 0.12
- **Order tag bid**: bg `color-mix(--accent-win 15%, transparent)`, text `var(--accent-win)`
- **Order tag ask**: bg `color-mix(--accent-loss 15%, transparent)`, text `var(--accent-loss)`
- **Order tag hover**: opacity 0.6, text-decoration line-through
- **Footer text**: `var(--text-secondary)`
- **Footer total bid**: `var(--accent-win)`
- **Footer total ask**: `var(--accent-loss)`
- **Flash up**: `color-mix(--accent-win 20%, transparent)` -> transparent (0.3s)
- **Flash down**: `color-mix(--accent-loss 20%, transparent)` -> transparent (0.3s)
- **Scrollbar track**: `var(--bg-primary)`
- **Scrollbar thumb**: `var(--border-color)`, hover `var(--text-muted)`

### 3.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-lg)` (12.5px)
- **Font size classes**: small = md (11.5px), medium = lg (12.5px), large = xl (14px)
- **Column headers**: `var(--font-size-sm)`, uppercase, letter-spacing 1px
- **Cell text**: `var(--font-size-md)` (11.5px)
- **Order tags**: `var(--font-size-xs)`, weight 600
- **Footer**: `var(--font-size-md)`
- **Size input**: `var(--font-mono)`, `var(--font-size-md)`

### 3.3 Padding, Margin, Gap
- **Ticker bar**: gap `var(--spacing-sm)`
- **Ticker select**: padding `var(--spacing-sm) var(--spacing-md)`
- **Buttons**: padding `var(--spacing-sm) var(--spacing-md)`
- **Column headers**: padding `var(--spacing-xs) 0`
- **Bid column**: padding-right `var(--spacing-sm)`
- **Ask column**: padding-left `var(--spacing-sm)`
- **Order tags**: padding `0 var(--spacing-sm)`
- **Footer**: padding `var(--spacing-sm) var(--spacing-md)`, gap `var(--spacing-xs)` vertical
- **Footer row**: gap `var(--spacing-lg)`
- **Order cell**: gap `var(--spacing-xs)`

### 3.4 Borders & Border-Radius
- **Ticker select radius**: `var(--radius-md)`
- **Button radius**: `var(--radius-md)`
- **Row border-bottom**: `1px solid var(--border-subtle)`
- **Last trade row**: bordered top & bottom `1px solid var(--accent-highlight)`
- **Footer border-top**: `1px solid var(--border-color)`
- **Order tag radius**: `var(--radius-sm)`
- **Size input radius**: `var(--radius-md)`
- **Scrollbar thumb radius**: `var(--radius-md)`
- **Scrollbar width**: 6px

### 3.5 Hover/Active/Focus States
- **Settings/recenter btn hover**: text `--text-primary`
- **Row hover**: bg `--bg-hover`
- **Bid cell hover**: green tint bg
- **Ask cell hover**: red tint bg
- **Order tag hover**: opacity 0.6 + line-through (cancel hint)

### 3.6 Layout
- **Container**: flex column, height 100%, user-select none
- **Ticker bar**: flex row, center aligned, flex-shrink 0
- **Header row**: flex row, flex-shrink 0
- **Ladder scroll**: flex 1, overflow-y auto, min-height 0
- **Each row**: flex row, center aligned, height 18px
- **Bid/ask cells**: flex 1, position relative (for volume bars)
- **Price cell**: width 42px, center aligned
- **Volume cell**: width 48px, center aligned
- **Orders cell**: width 56px, flex, center aligned, gap xs
- **Footer**: flex-shrink 0, flex column

### 3.7 Data Density
- **Row height**: 18px (CSS), customizable via grid.rowHeight
- **Price range**: 1-99 (full Kalshi probability range)
- **Price cell width**: 42px fixed
- **Volume cell width**: 48px fixed
- **Orders cell width**: 56px fixed

### 3.8 Data Display Formatting
- **Price**: integer (1-99), no suffix in ladder cells
- **Size**: raw number
- **Last price**: `{lastPrice}c` with "c" suffix in footer
- **Spread**: integer
- **Total bid/ask**: sum of all sizes

### 3.9 Interactive States
- **Ticker select**: dropdown with all TICKERS
- **Recenter button**: scrolls to last trade price
- **Click bid cell**: places limit buy order (if clickAction = 'limit')
- **Click ask cell**: places limit sell order
- **Click order tag**: cancels working order (with visual strikethrough hint)
- **Size input**: in footer, sets order size
- **Settings overlay**: PriceLadderSettings

### 3.10 Workflow
1. Select ticker from dropdown (or via color link)
2. View full 1-99 price ladder with bid/ask depth
3. Scroll to find price level (auto-centers on last trade)
4. Click bid/ask to place limit orders
5. Working orders shown inline as colored tags
6. Click tag to cancel
7. Footer shows last price, spread, size input, total bid/ask

---

## 4. Positions (`Positions.jsx` + `Positions.css`)

### 4.1 Colors
- **Container text**: `var(--text-primary)`
- **Title**: `var(--text-heading)`, weight 700, uppercase
- **Count**: `var(--text-muted)`, `var(--font-size-xs)`
- **Settings btn**: bg `var(--bg-tertiary)`, text `var(--text-muted)`, border `var(--border-color)`, hover text `var(--text-primary)`
- **Table header**: bg `var(--bg-tertiary)`, text `var(--text-heading)`, weight 600
- **Sort arrow**: `var(--accent-highlight)`, 8px font
- **Table cell border-bottom**: `1px solid var(--border-subtle)`
- **Row alt**: bg `var(--bg-row-alt)` (on .pos-td via :nth-child)
- **Row hover**: bg `var(--bg-hover)` (on .pos-td)
- **Row selected**: bg `color-mix(--accent-highlight 10%, transparent)`
- **Market long**: text `var(--accent-buy)`, weight 600
- **Market short**: text `var(--accent-sell)`, weight 600
- **Type badge long**: bg `color-mix(--accent-buy 15%, transparent)`, text `var(--accent-buy)`
- **Type badge short**: bg `color-mix(--accent-sell 15%, transparent)`, text `var(--accent-sell)`
- **P&L .text-win**: `var(--accent-buy)` (scoped to .positions)
- **P&L .text-loss**: `var(--accent-sell)` (scoped to .positions)
- **Flash**: from `color-mix(--accent-warning 25%, transparent)` to transparent (0.6s)

### 4.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-md)` (11.5px)
- **Font size classes**: small = sm, medium = md, large = lg
- **Title**: `var(--font-size-sm)`, weight 700, uppercase, letter-spacing 0.5px
- **Table header**: `var(--font-size-xs)`, weight 600, uppercase, letter-spacing 0.5px
- **Type badge**: `var(--font-size-xs)`, weight 700, uppercase, letter-spacing 0.5px

### 4.3 Padding, Margin, Gap
- **Header bar**: padding `var(--spacing-xs) var(--spacing-sm)`, flex-shrink 0
- **Header right**: gap `var(--spacing-sm)`
- **Settings btn**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Table header**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Table cell**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Type badge**: padding `1px var(--spacing-xs)`
- **Empty state**: padding `var(--spacing-xl) var(--spacing-sm)`

### 4.4 Borders & Border-Radius
- **Header bar border-bottom**: `1px solid var(--border-color)`
- **Table header border-bottom**: `1px solid var(--border-color)`
- **Cell border-bottom**: `1px solid var(--border-subtle)`
- **Settings btn radius**: `var(--radius-sm)`
- **Type badge radius**: `var(--radius-sm)`

### 4.5 Hover/Active/Focus States
- **Header hover**: text `--text-primary`
- **Row hover**: bg `--bg-hover` on cells
- **Row selected**: bg tinted with `--accent-highlight`
- **Clickable rows**: cursor pointer

### 4.6 Layout
- **Container**: flex column, height 100%
- **Header bar**: flex row, space-between, center aligned, flex-shrink 0
- **Table wrap**: flex 1, min-height 0, overflow auto
- **Table**: width 100%, border-collapse, table-layout auto

### 4.7 Data Density
- **Row height**: customizable via grid.rowHeight
- **Columns**: Market, Account, Shares, Avg Cost, Realized, Unrealized, Type

### 4.8 Data Display Formatting
- **Unrealized**: `$X.XX` — formatted with toFixed(2), colored by sign
- **Avg Cost**: `$X.XX`
- **Shares**: integer
- **Type**: "Long" / "Short" in badge

### 4.9 Interactive States
- **Row click**: selects row, emits linked market to linkBus
- **Column header click**: toggles sort (asc/desc)
- **Column drag**: reorder columns
- **Settings gear**: opens PositionsSettings overlay

### 4.10 Workflow
1. View open positions in a sortable table
2. Click row to select & link to other windows
3. Click column header to sort
4. P&L values flash on change (0.6s amber)
5. Settings: sort by, direction, refresh interval, flash toggle

---

## 5. TradeLog (`TradeLog.jsx` + `TradeLog.css`)

### 5.1 Colors
- Same pattern as Positions with additions:
- **Title**: `var(--text-heading)`, weight 700, uppercase
- **CSV button**: bg `var(--bg-tertiary)`, text `var(--text-muted)`, `var(--font-size-xs)`, weight 600
- **Filter bar**: border-bottom `var(--border-color)`
- **Filter button inactive**: bg `var(--bg-tertiary)`, text `var(--text-muted)`, border `var(--border-color)`, hover text `var(--text-secondary)`
- **Filter button active**: bg `var(--accent-highlight)`, text `var(--bg-primary)`, border `var(--accent-highlight)`
- **Badge long**: bg `color-mix(--accent-buy 15%, transparent)`, text `var(--accent-buy)`
- **Badge short**: bg `color-mix(--accent-sell 15%, transparent)`, text `var(--accent-sell)`
- **Badge open**: bg `color-mix(--accent-info 15%, transparent)`, text `var(--accent-info)`
- **Badge closed**: bg `color-mix(--accent-neutral 15%, transparent)`, text `var(--accent-neutral)`
- **Date column**: text `var(--text-muted)`, `var(--font-size-xs)`
- **P&L .text-win/loss**: scoped `var(--accent-buy)` / `var(--accent-sell)`
- **Flash**: same as Positions (amber 0.6s)

### 5.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-md)`
- **Font size classes**: small = sm, medium = md, large = lg
- **Filter buttons**: `var(--font-mono)`, `var(--font-size-xs)`, weight 600, uppercase, letter-spacing 0.5px
- **Badges**: `var(--font-size-xs)`, weight 700, uppercase, letter-spacing 0.5px
- **CSV button**: `var(--font-mono)`, `var(--font-size-xs)`, weight 600

### 5.3 Padding, Margin, Gap
- Same as Positions header pattern
- **Filter bar**: gap `var(--spacing-xs)`, padding `var(--spacing-xs) var(--spacing-sm)`
- **Filter button**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Badges**: padding `1px var(--spacing-sm)`

### 5.4 Borders & Border-Radius
- Same as Positions
- **Filter button radius**: `var(--radius-sm)`
- **Badge radius**: `var(--radius-sm)`
- **Filter bar border-bottom**: `1px solid var(--border-color)`

### 5.5 Additional Columns vs Positions
- **Added**: Status, Date columns
- **Date column**: `var(--text-muted)`, `var(--font-size-xs)`

### 5.6 Data Display Formatting
- **Unrealized**: `$X.XX` (open only) or em-dash for closed
- **Realized**: `$X.XX` (closed only) or em-dash for open
- **Date**: `YYYY-MM-DD` format (ISO slice)
- **Status**: "Open" / "Closed" badge
- **Type**: "Long" / "Short" badge

### 5.7 Interactive States
- **Filter tabs**: All, Open, Closed (with counts)
- **CSV export**: generates and downloads CSV
- **Row click**: select + emit linked market
- **Column sort**: click header
- **Settings**: sort, filter, date range, refresh, flash

### 5.8 Workflow
1. Filter by All/Open/Closed
2. Sort by any column
3. Click row to link
4. Export CSV
5. Settings for date range, sort, refresh interval

---

## 6. EventLog (`EventLog.jsx` + `EventLog.css`)

### 6.1 Colors
- **Container text**: `var(--text-primary)`
- **Toolbar**: border-bottom `var(--border-color)`
- **Level select**: bg `var(--bg-input)`, text `var(--text-primary)`, border `var(--border-color)`, focus border `var(--border-focus)`
- **Count**: `var(--text-muted)`, `var(--font-size-xs)`
- **Tool buttons**: bg none, border transparent, text `var(--text-muted)`, hover text `var(--text-primary)` + border `var(--border-color)`
- **Entry alternating**: bg `var(--bg-row-alt)`
- **Entry hover**: bg `var(--bg-hover)`
- **Entry error**: bg `color-mix(--accent-sell 6%, transparent)`
- **Entry warn**: bg `color-mix(--accent-warning 4%, transparent)`
- **Time**: `var(--text-muted)`, `var(--font-size-xs)`
- **Level badge**: weight 700, `var(--font-size-xs)`, min-width 38px
  - info: `var(--accent-info)`
  - warn: `var(--accent-warning)`
  - error: `var(--accent-sell)`
- **Source**: `var(--accent-highlight)`, `var(--font-size-xs)`
- **Message**: `var(--text-primary)` (default), error `var(--accent-sell)`, warn `var(--accent-warning)`

### 6.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-sm)` (10.5px)
- **Font size classes**: small = xs (9.5px), medium = sm (10.5px), large = md (11.5px)
- **Level select**: `var(--font-mono)`, `var(--font-size-sm)`
- **Tool buttons**: `var(--font-size-lg)`

### 6.3 Padding, Margin, Gap
- **Toolbar**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Toolbar left**: gap `var(--spacing-sm)`
- **Toolbar right**: gap `var(--spacing-xs)`
- **Tool buttons**: padding `var(--spacing-xs) var(--spacing-sm)`
- **Entries container**: padding `var(--spacing-xs) 0`
- **Entry**: padding `1px var(--spacing-sm)`, gap `var(--spacing-sm)`, line-height 1.6

### 6.4 Borders & Border-Radius
- **Toolbar border-bottom**: `1px solid var(--border-color)`
- **Level select radius**: `var(--radius-sm)`
- **Tool button radius**: `var(--radius-sm)`

### 6.5 Layout
- **Container**: flex column, height 100%
- **Toolbar**: flex row, space-between, center, flex-shrink 0
- **Entries**: flex 1, overflow-y auto, min-height 0
- **Entry**: flex row, baseline aligned

### 6.6 Data Display Formatting
- **Time**: `HH:MM:SS.mmm` (24hr with milliseconds)
- **Level**: uppercase (`INFO`, `WARN`, `ERROR`)
- **Source**: `[SOURCE]` in brackets

### 6.7 Interactive States
- **Level filter dropdown**: All/Info+/Warn+/Error
- **Clear log button**: unicode eraser
- **Export button**: unicode download arrow
- **Settings gear**: opens EventLogSettings
- **Scroll behavior**: auto-scroll to bottom on new entries; scroll away to pause, double-click to resume

### 6.8 Workflow
1. System events stream in real-time (simulated 3-7s interval)
2. Filter by log level
3. Clear or export log
4. Auto-scroll with pause/resume on scroll
5. Settings: log level, max lines, auto-scroll toggle

---

## 7. NewsChat (`NewsChat.jsx` + `NewsChat.css`)

### 7.1 Colors
- **Container text**: `var(--text-primary)`
- **Filter badge**: bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, border `var(--border-color)`, hover border/text `var(--accent-loss)`
- **Search input**: bg `var(--bg-tertiary)`, text `var(--text-primary)`, border `var(--border-color)`, focus border `var(--border-focus)`
- **Search results**: bg `var(--bg-secondary)`, border `var(--border-color)`, z-index 100
- **Search item hover**: bg `var(--bg-hover)`
- **Search ticker**: `var(--accent-highlight)`, weight 600
- **Search title**: `var(--text-muted)`
- **News item time**: `var(--text-muted)`, `var(--font-size-sm)`, min-width 40px
- **Ticker badge**: bg `var(--bg-tertiary)`, text `var(--accent-highlight)`, `var(--font-size-sm)`, weight 600
- **Headline**: `var(--text-secondary)`
- **Item border-bottom**: `1px solid var(--border-subtle)`
- **Item hover**: bg `var(--bg-hover)`
- **Empty state**: `var(--text-muted)`, italic

### 7.2 Fonts
- **Container**: `var(--font-mono)`, `var(--font-size-lg)` (12.5px)
- **Filter badge**: `var(--font-size-md)`, weight 600
- **Search input**: `var(--font-mono)`, `var(--font-size-md)`
- **News items**: `var(--font-size-md)`, line-height 1.4

### 7.3 Padding, Margin, Gap
- **Search bar**: gap `var(--spacing-sm)`, padding-bottom `var(--spacing-sm)`
- **Filter badge**: padding `var(--spacing-sm) var(--spacing-md)`
- **Search input**: padding `var(--spacing-sm) var(--spacing-md)`
- **Search results max-height**: 200px
- **Search item**: padding `var(--spacing-sm) var(--spacing-md)`, gap `var(--spacing-lg)`
- **News item**: padding `var(--spacing-sm) var(--spacing-xs)`, gap `var(--spacing-md)`
- **Feed**: padding-top `var(--spacing-sm)`
- **Ticker badge**: padding `0 var(--spacing-sm)`

### 7.4 Borders & Border-Radius
- **Search bar border-bottom**: `1px solid var(--border-color)`
- **Filter badge radius**: `var(--radius-md)`
- **Search input radius**: `var(--radius-md)`
- **Search results bottom radius**: `0 0 var(--radius-md) var(--radius-md)`
- **Ticker badge radius**: `var(--radius-sm)`
- **Item border-bottom**: `1px solid var(--border-subtle)`

### 7.5 Layout
- **Container**: flex column, height 100%
- **Search bar**: flex row, center aligned
- **Feed**: flex 1, min-height 0, overflow-y auto
- **Item**: flex row, baseline aligned

### 7.6 Data Display Formatting
- **Time**: `toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })` (e.g. "02:45 PM")
- **Ticker**: raw string in badge
- **Headline**: plain text

### 7.7 Interactive States
- **Market search**: debounced typeahead with dropdown
- **Filter badge**: click to clear filter (shows x)
- **Filter badge hover**: border/text turn loss-red

### 7.8 Workflow
1. Optionally filter by market via search
2. Scroll through news feed (sorted newest first)
3. Auto-refreshes every 30 seconds
4. No settings panel (no Settings companion)

---

## 8. Accounts (`Accounts.jsx` — no dedicated CSS file)

### 8.1 Colors
- Uses inline class names prefixed `acct-`; CSS injected via AccountsSettings inline styles
- **Title**: same pattern as Positions/TradeLog
- **Type column**:
  - Paper: `acct-type-paper` class (no CSS found — likely unstyled or handled by getRowStyle)
  - Live: `acct-type-live` class
- **P&L .text-win/loss**: follows same `--accent-buy`/`--accent-sell` pattern
- **Totals row**: `acct-totals-row` class, values in `<strong>` tags

### 8.2 Fonts
- **Container**: `var(--font-mono)`, grid.fontSize-based class
- **Font size classes**: `acct--font-small/medium/large`

### 8.3 Data Display Formatting
- **Numeric values**: `$X.XX` format via `formatValue(val, settings.decimalPrecision)` (configurable 0-4 decimals)
- **Totals row**: all numeric columns summed

### 8.4 Columns
- Account #, Type, Realized P&L, Unrealized P&L, Init Equity, Tickets, Shares

### 8.5 Interactive States
- **Column sort**: click header to sort
- **Column drag**: reorder
- **Settings gear**: AccountsSettings overlay (decimal precision, refresh interval)

### 8.6 Workflow
1. View account overview with 2 mock accounts
2. Totals row at bottom
3. Sort by any column
4. Settings for decimal precision and refresh interval

---

## 9. Chart (`Chart.jsx` + `Chart.css`)

### 9.1 Colors
- **Container**: bg `var(--bg-primary)`
- **Toolbar**: bg `var(--bg-secondary)`, border-bottom `var(--border-color)`, min-height 30px
- **Ticker select**: bg `var(--bg-tertiary)`, text `var(--text-primary)`, border `var(--border-color)`
- **Timeframe button inactive**: bg transparent, text `var(--text-secondary)`, border transparent
- **Timeframe button hover**: text `var(--text-primary)`, bg `var(--bg-tertiary)`
- **Timeframe button active**: text `var(--accent-highlight)`, border `var(--accent-highlight)`, bg `color-mix(--accent-highlight 10%, transparent)`
- **Chart type buttons**: same pattern as timeframe
- **Settings button**: bg transparent, text `var(--text-secondary)`, hover text `var(--text-primary)`
- **OHLC bar**: bg `var(--bg-primary)`, text `var(--text-secondary)`, border-bottom `var(--border-color)`
- **OHLC values**: text `var(--text-primary)`, weight 500
- **Change positive**: `.text-win` (not scoped — uses global)
- **Change negative**: `.text-loss`
- **Overlay legend**: bg `var(--bg-primary)`, text `var(--text-secondary)`, border-bottom `var(--border-color)`
- **Overlay swatch**: inline backgroundColor from OVERLAY_COLORS array

#### Chart Internal (lightweight-charts):
- **Background**: `#121212` (hardcoded)
- **Text**: `#a0a0a0` (hardcoded)
- **Font**: `'Roboto Mono', 'SF Mono', Consolas, monospace` (hardcoded)
- **Font size**: 11 (hardcoded)
- **Grid lines**: `#1e1e1e` (hardcoded, dotted)
- **Crosshair**: `#555` (hardcoded, dashed)
- **Crosshair label bg**: `#2a2a2a` (hardcoded)
- **Price/time scale border**: `#333` (hardcoded)
- **Candle up**: `#00c853` (default, user configurable)
- **Candle down**: `#ff1744` (default, user configurable)
- **Line color**: `#00d2ff` (hardcoded)
- **Area**: top `rgba(0, 210, 255, 0.4)`, bottom transparent, line `#00d2ff`
- **Volume up**: `rgba(0, 200, 83, 0.3)` (hardcoded)
- **Volume down**: `rgba(255, 23, 68, 0.3)` (hardcoded)
- **Volume default**: `#555` (hardcoded)
- **Overlay line colors**: `['#00d2ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#a855f7', '#ff8c42', '#4ecdc4', '#f472b6']`

### 9.2 Fonts
- **Toolbar buttons**: `var(--font-mono)`, `var(--font-size-sm)`
- **Ticker select**: `var(--font-mono)`, `var(--font-size-md)`
- **OHLC bar**: `var(--font-mono)`, `var(--font-size-sm)`
- **Overlay legend**: `var(--font-mono)`, `var(--font-size-sm)`
- **Chart internal**: 11px Roboto Mono (hardcoded)

### 9.3 Padding, Margin, Gap
- **Toolbar**: padding `var(--spacing-sm) var(--spacing-lg)`, gap `var(--spacing-md)`
- **Timeframe buttons**: gap `var(--spacing-xs)`, padding `var(--spacing-xs) var(--spacing-md)`
- **Chart type buttons**: gap `var(--spacing-xs)`, margin-left auto
- **OHLC bar**: padding `var(--spacing-xs) var(--spacing-lg)`, gap `var(--spacing-lg)`
- **Overlay legend**: padding `var(--spacing-xs) var(--spacing-lg)`, gap `var(--spacing-lg)` (flex-wrap)
- **Overlay legend item**: gap `var(--spacing-sm)`
- **Overlay swatch**: 12px wide, 3px tall, radius 1px
- **Settings panel**: top 36px, right 8px, width 200px, radius `var(--radius-lg)`, shadow `var(--shadow-lg)`
- **Settings body/header**: padding `var(--spacing-lg)`

### 9.4 Borders & Border-Radius
- **Toolbar border-bottom**: `1px solid var(--border-color)`
- **Ticker select radius**: `var(--radius-md)`
- **Timeframe/type button radius**: `var(--radius-md)`
- **OHLC bar border-bottom**: `1px solid var(--border-color)`
- **Settings panel radius**: `var(--radius-lg)` (5px)
- **Color input radius**: `var(--radius-md)`

### 9.5 Layout
- **Container**: flex column, height 100%, overflow hidden
- **Toolbar**: flex row, center aligned, flex-shrink 0
- **Type buttons**: margin-left auto (pushed right)
- **Canvas container**: flex 1, min-height 0
- **Settings panel**: position absolute, top-right

### 9.6 Data Display Formatting
- **OHLC**: `O {open} H {high} L {low} C {close} +/-change (pct%)`
- **Overlay**: `+/-value.XX%` per ticker
- **Timeframes**: 1m, 5m, 15m, 1h, 4h, 1D
- **Chart types**: Candle, Line, Area, Overlay

### 9.7 Interactive States
- **Ticker select**: dropdown
- **Timeframe buttons**: 6 options, active highlighted
- **Chart type buttons**: Candle/Line/Area + Overlay toggle
- **Crosshair**: shows OHLC data on hover (or overlay % values)
- **Settings panel**: grid lines, volume, crosshair style, up/down colors, overlay mode with ticker checkboxes
- **Disabled buttons**: chart type buttons disabled when overlay mode active (opacity 0.4)

### 9.8 Workflow
1. Select ticker
2. Choose timeframe (1m to 1D)
3. Choose chart type or enable overlay mode
4. Crosshair shows OHLC or % comparison
5. Settings panel for grid, volume, crosshair, colors, overlay tickers
6. Real-time streaming updates via subscribeToOHLCV

---

## 10. ChartSettings (`ChartSettings.jsx`)

### 10.1 Structure
- Renders inside `.chart-settings-panel` (CSS defined in Chart.css)
- **Header**: title "Chart Settings" + close button
- **Settings rows**: Grid Lines (checkbox), Volume (checkbox, disabled in overlay), Crosshair (select: Normal/Magnet), Up Color (color picker), Down Color (color picker), Overlay Mode (checkbox)
- **Overlay tickers**: list of checkboxes when overlay mode enabled, labeled "Compare Markets"

### 10.2 Colors
- Uses Chart.css classes
- **Color inputs**: width 24px, height 20px, border `var(--border-color)`, radius `var(--radius-md)`
- **Checkboxes**: accent-color `var(--accent-highlight)`
- **Overlay ticker labels**: `var(--font-size-md)`, `var(--text-secondary)`
- **Section label**: `var(--font-size-sm)`, `var(--text-muted)`, uppercase, letter-spacing 0.5px

### 10.3 Interactive States
- All controls are live-updating (no save/cancel — direct `onUpdate` calls)
- Volume checkbox disabled when overlay mode is on

---

## 11. TimeSale (`TimeSale.jsx` + `TimeSale.css`)

### 11.1 Colors
- **Container**: bg `var(--bg-primary)`
- **Toolbar**: bg `var(--bg-secondary)`, border-bottom `var(--border-color)`
- **Ticker select**: bg `var(--bg-tertiary)`, text `var(--text-primary)`, border `var(--border-color)`
- **Trade count**: `var(--text-muted)`, `var(--font-size-sm)`
- **Tool buttons**: bg transparent, text `var(--text-secondary)`, hover text `var(--text-primary)` + bg `var(--bg-tertiary)`
- **Active button**: text `var(--accent-highlight)`
- **Column header**: bg `var(--bg-secondary)`, text `var(--text-muted)`, weight 600, border-bottom `var(--border-color)`
- **Drag-over header**: border-left `2px solid var(--accent-info)`
- **Row buy**: text `var(--accent-win)`
- **Row sell**: text `var(--accent-loss)`
- **Row large**: weight 600
- **Row hover**: bg `var(--bg-tertiary)`
- **Row border-bottom**: `1px solid var(--border-subtle)`
- **Settings panel**: bg `var(--bg-secondary)`, border `var(--border-color)`, radius `var(--radius-lg)`, shadow `var(--shadow-lg)`
- **Settings input number**: bg `var(--bg-tertiary)`, text `var(--text-primary)`, border `var(--border-color)`, radius `var(--radius-md)`
- **Settings checkbox**: accent-color `var(--accent-highlight)`
- **Settings divider**: border-top `1px solid var(--border-color)`

### 11.2 Fonts
- **Container**: `var(--font-mono)`
- **Font size**: controlled via `FONT_SIZE_MAP` — small: 10px, medium: 11px, large: 13px (hardcoded px, not design tokens)
- **Toolbar ticker**: `var(--font-mono)`, `var(--font-size-md)`
- **Header**: `var(--font-mono)`, `var(--font-size-sm)`, weight 600
- **Settings rows**: `var(--font-size-md)`
- **Settings inputs**: `var(--font-size-sm)`, `var(--font-mono)`

### 11.3 Padding, Margin, Gap
- **Toolbar**: padding `1px var(--spacing-xs)`, gap `var(--spacing-xs)`
- **Ticker select**: padding `var(--spacing-xs) var(--spacing-md)`
- **Tool buttons**: padding `var(--spacing-xs) var(--spacing-sm)`, radius `var(--radius-md)`
- **Column header**: padding `1px var(--spacing-xs)`
- **Row**: padding `0 var(--spacing-xs)`, line-height 1.2
- **Settings panel**: top 36px, right 8px, width 200px
- **Settings header**: padding `var(--spacing-md) var(--spacing-lg)`
- **Settings body**: padding `var(--spacing-lg)`
- **Settings rows**: padding `var(--spacing-sm) 0`
- **Settings input width**: 55px

### 11.4 Column Widths
- **Time**: flex 1 (fills remaining)
- **Price**: flex `0 1 40px`
- **Size (Qty)**: flex `0 1 32px`
- **Side (Exchange)**: flex `0 1 30px`

### 11.5 Borders & Border-Radius
- **Toolbar border-bottom**: `1px solid var(--border-color)`
- **Header border-bottom**: `1px solid var(--border-color)`
- **Row border-bottom**: `1px solid var(--border-subtle)`
- **Ticker select radius**: `var(--radius-md)`
- **Settings panel radius**: `var(--radius-lg)`

### 11.6 Data Display Formatting
- **Time**: `HH:MM:SS` or `HH:MM:SS.mmm` (configurable hideMilliseconds)
- **Price**: `XX.XX¢` or `XX¢` (configurable priceDecimals)
- **Size**: raw or `X.Xk` (configurable abbreviateSize)
- **Side**: "BUY" / "SELL"

### 11.7 Interactive States
- **Ticker select**: dropdown
- **Clear button**: unicode X
- **Settings gear**: opens settings panel
- **Scroll**: auto-scroll on new trades, scroll away to pause, double-click to resume
- **Column drag**: reorder

### 11.8 Workflow
1. Select ticker
2. Trades stream in real-time from mockData
3. Color-coded by side (green buy, red sell)
4. Large trades bolded
5. Settings for max rows, size filter, large threshold, time format, price format, size format

---

## Settings Panels Summary (All *Settings.jsx)

All settings panels share a common pattern:

### Shared Pattern
- **Overlay**: `position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 20`
- **Panel**: bg `var(--bg-secondary)`, border `1px solid var(--border-color)`, radius 6px, width 280-320px, max-height 90%, shadow `0 8px 24px rgba(0,0,0,0.5)`
- **Header**: padding `10px 12px`, font 13px weight 700, text `var(--text-primary)`, border-bottom `var(--border-color)`
- **Close button**: text `var(--text-muted)`, font 18px, hover `var(--text-primary)`
- **Body**: padding `10px 12px`, flex column, gap 8-10px
- **Row**: flex space-between center, font 12px, text `var(--text-secondary)`
- **Labels**: font `var(--font-sans)` (Inter)
- **Number inputs**: width 80-100px, bg `var(--bg-tertiary)`, border `var(--border-color)`, radius 3px, padding `3px 6px`, font `var(--font-mono)` 12px, focus border `var(--accent-highlight)`
- **Selects**: same styling as number inputs
- **Checkboxes**: accent-color `var(--accent-highlight)`, 16x16px
- **Footer**: padding `10px 12px`, border-top `var(--border-color)`, gap 8px
- **Save button**: bg `var(--accent-win)`, text `#000`, radius 3px, font mono 12px weight 700
- **Cancel button**: bg `var(--bg-tertiary)`, text `var(--text-secondary)`, border `var(--border-color)`

### Notable: Hardcoded values in settings panels
- All settings panels use inline CSS via `document.createElement('style')` appended to `<head>`
- Padding values: `10px`, `12px` (hardcoded px, not design tokens)
- Border-radius: `6px`, `3px` (hardcoded, not `var(--radius-*)`)
- Gap: `8px`, `10px` (hardcoded, not `var(--spacing-*)`)
- Font sizes: `12px`, `13px`, `18px` (hardcoded, not `var(--font-size-*)`)
- Shadow: `0 8px 24px rgba(0,0,0,0.5)` (hardcoded, not `var(--shadow-lg)`)
- Overlay background: `rgba(0,0,0,0.6)` (hardcoded, not `var(--overlay-bg)`)
- These should ideally be migrated to use design tokens for consistency

### Unique Settings per Component
| Component | Settings |
|---|---|
| **MontageSettings** | defaultOrderSize, confirmBeforeSend, soundAlerts, depthLevels, flashDuration, fontSize, showWorkingOrders |
| **OrderBookSettings** | GridSettingsPanel + refreshInterval, maxFills, flashOnFill, showCancelled |
| **PriceLadderSettings** | GridSettingsPanel + visibleLevels, centerOnTrade, flashDuration, showVolumeBars, showWorkingOrders, clickAction, defaultSize |
| **PositionsSettings** | GridSettingsPanel + sortBy, sortDirection, refreshInterval, flashOnChange |
| **TradeLogSettings** | GridSettingsPanel + filter, dateRange, sortBy, sortDirection, refreshInterval, flashOnChange |
| **EventLogSettings** | GridSettingsPanel + logLevel, maxLines, autoScroll |
| **AccountsSettings** | GridSettingsPanel + decimalPrecision, refreshInterval |
| **ChartSettings** | showGrid, showVolume, crosshairStyle, upColor, downColor, overlayMode, overlayTickers (live updates — no save/cancel) |
| **TimeSale** | inline in TimeSale.jsx + GridSettingsPanel: maxRows, sizeFilter, largeSizeThreshold, hideMilliseconds, priceDecimals, abbreviateSize |

---

## Cross-Component Patterns

### Common Table Pattern
All table-based components (OrderBook, Positions, TradeLog, Accounts) share:
- Sticky `<thead>` with `position: sticky; top: 0`
- Header bg: `var(--bg-secondary)` or `var(--bg-tertiary)`
- Header: uppercase, `var(--font-size-xs)`, weight 600-700, letter-spacing 0.5px
- Cell padding: `var(--spacing-xs) var(--spacing-sm)` (2px 4px)
- Row alternating: `:nth-child(even)` bg `var(--bg-row-alt)`
- Row hover: bg `var(--bg-hover)`
- Column drag-reorder via `useGridCustomization`
- Sort arrows: `var(--accent-highlight)`, 8px font

### Common Flash Animation Pattern
- Duration: 0.6s (OrderBook fills, Positions, TradeLog)
- PriceLadder: 0.3s
- Color: `color-mix(in srgb, var(--accent-*) N%, transparent)` -> transparent
- OrderBook fills: `--accent-highlight 30%`
- Positions/TradeLog: `--accent-warning 25%`
- PriceLadder up: `--accent-win 20%`, down: `--accent-loss 20%`

### P&L Color Convention
- Positive: `.text-win` = `var(--accent-win)` (#3ecf8e) / `var(--accent-buy)` in trade scope
- Negative: `.text-loss` = `var(--accent-sell)` (#e05c5c)
- Montage, Positions, TradeLog scope their `.text-win/.text-loss` to `var(--accent-buy)/var(--accent-sell)` within their container class
- OrderBook uses unscoped `.text-win/.text-loss` referencing `var(--accent-win)/var(--accent-sell)`

### Side Color Convention
- YES / BUY / Long: `var(--accent-buy)` (#3ecf8e) green
- NO / SELL / Short: `var(--accent-sell)` (#e05c5c) red

### Common Settings Panel Pattern
- Overlay: full-screen dark backdrop, centered panel
- Panel: `var(--bg-secondary)`, 280-320px wide, 6px radius
- Header-body-footer structure
- Save + Cancel buttons
- GridSettingsPanel embedded (where applicable)
- Inline CSS injected once via `document.head.appendChild`

### Hardcoded Values Requiring Token Migration
1. **Chart.jsx** lightweight-charts config: `#121212`, `#a0a0a0`, `#1e1e1e`, `#555`, `#2a2a2a`, `#333`, `#00c853`, `#ff1744`, `#00d2ff`, `rgba(0, 200, 83, 0.3)`, `rgba(255, 23, 68, 0.3)`
2. **TimeSale.jsx** `FONT_SIZE_MAP`: `10`, `11`, `13` (px, not tokens)
3. **All Settings panels**: padding `10px 12px`, radius `6px`/`3px`, gap `8px`/`10px`, font `12px`/`13px`, overlay `rgba(0,0,0,0.6)`, shadow `rgba(0,0,0,0.5)`
4. **Chart OVERLAY_COLORS**: hardcoded hex array

---

## Component Default Dimensions (from index.css)

| Component | Width | Height |
|---|---|---|
| Montage | 350px | 400px |
| PriceLadder | 280px | 500px |
| Chart | 600px | 400px |
| TimeSale | 300px | 400px |
| EventLog | 500px | 250px |
| Accounts | 500px | 300px |
| Positions | 500px | 300px |
| TradeLog | 550px | 350px |
| NewsChat | 400px | 350px |
