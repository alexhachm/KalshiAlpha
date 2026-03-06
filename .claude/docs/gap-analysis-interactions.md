# Gap Analysis: Interactive Patterns

> Generated 2026-03-06 by worker-4 (Opus). Covers context menus, table features, keyboard navigation, and interaction CSS foundations.

---

## 1. Right-Click Context Menus

**Current state:**
- Design tokens exist: `--context-menu-bg`, `--context-menu-border`, `--context-menu-shadow` (in `:root`)
- Window.css has a working context menu (`.window-context-menu`, `.window-context-item`, `.window-context-separator`)
- Some components reference right-click for settings toggle (Chart, TimeSale, Montage) but only at comment level — no menu UI

**Gap:**
- No generic/reusable context menu CSS classes for use across components
- Window context menu uses `--bg-secondary`/`--border-color`/`--shadow-md` directly instead of the context menu tokens
- Missing: keyboard shortcut hint styling, submenu indicator, icon slot, danger/destructive item variant

**Recommendation:** Add generic `.context-menu` classes in index.css using the existing tokens. Components can adopt without per-component duplication.

---

## 2. Column Resizing in Data Tables

**Current state:**
- No resize handles exist anywhere
- All tables use `table-layout: fixed` (OrderBook, scanners) or `table-layout: auto` (Positions)
- `useGridCustomization` hook handles column visibility/reorder but NOT resize

**Gap:**
- No CSS for column resize handles
- No `resize: horizontal` or drag-handle styling on `<th>` elements

**Recommendation:** Add `.th-resizable` with a pseudo-element resize handle. CSS-only — JS resize logic is separate scope.

---

## 3. Drag-to-Reorder Panels/Windows

**Current state:**
- Window drag is handled by WindowManager (JS-based, positions via `top`/`left`)
- Column drag-to-reorder exists via `useGridCustomization` with `.drag-over` class per component

**Gap:**
- No generic drag-over/drop-target CSS utilities
- Panel/window reorder is JS-only with no CSS transition feedback

**Recommendation:** Out of scope for CSS foundation — drag logic is JS-owned. Add generic `.drag-over` utility class.

---

## 4. Multi-Select Rows in Tables

**Current state:**
- Positions has `.pos-row-selected` (single select, emits to LinkBus)
- No other component has row selection CSS
- No multi-select (shift-click, ctrl-click) patterns exist

**Gap:**
- Missing generic `.row-selected`, `.row-multi-selected` classes
- No range-select highlight CSS

**Recommendation:** Add generic row selection utilities in index.css.

---

## 5. Copy-to-Clipboard on Data Cells

**Current state:**
- No copy functionality or CSS feedback exists
- No clipboard CSS indicators (checkmark flash, tooltip "Copied!")

**Gap:**
- No `.cell-copyable` cursor/hover feedback
- No copy success animation

**Recommendation:** Add `.cell-copyable` with `cursor: copy` on hover and a subtle highlight.

---

## 6. Keyboard-First Navigation

**Current state:**
- No `:focus-visible` styles defined anywhere in the codebase
- Default browser focus outlines are likely suppressed by `outline: none` on inputs
- No tab-order management CSS
- No arrow-key navigation indicators for tables

**Gap:**
- Critical accessibility gap — keyboard users have no visual focus indicator
- No `.focus-within` container highlights
- No skip-link or landmark navigation CSS

**Recommendation:** Add comprehensive `:focus-visible` styling globally. Add `.focusable-row` for table keyboard nav.

---

## 7. Focus Management (Focus Rings, Focus-Within)

**Current state:**
- Only `var(--border-focus)` token exists (#d4a853 = accent-highlight)
- Used on input `:focus` in scanners — changes `border-color` only
- No focus ring (outline) visible on buttons, tabs, or other interactive elements

**Gap:**
- Missing `:focus-visible` on all interactive elements (buttons, tabs, links)
- No `.focus-within` parent highlighting for form groups or panels

**Recommendation:** Global `:focus-visible` rule with `outline` using `--border-focus`. Add `focus-within` for grouped controls.

---

## 8. Scrolling Behavior in Data Tables

**Current state:**
- Sticky headers already implemented per-component:
  - OrderBook: `.ob-th { position: sticky; top: 0; z-index: 1 }`
  - Positions: `.pos-th { position: sticky; top: 0 }`
  - LiveScanner: `.ls-table thead { position: sticky; top: 0; z-index: 1 }`
  - HistoricalScanner: `.hs-table thead { position: sticky; top: 0; z-index: 1 }`
- No virtual scroll CSS (handled by JS if needed)
- Custom scrollbars styled globally (5px thin, dark track)

**Gap:**
- No generic sticky header utility class
- Inconsistent z-index on sticky headers (some have `z-index: 1`, some don't)
- No scroll-shadow indicators at top/bottom of scrollable areas

**Recommendation:** Add generic `.sticky-header` utility. Add scroll shadow for overflowed tables.

---

## 9. Sort Indicator CSS

**Current state:**
- LiveScanner: `.ls-th--sorted { color: var(--accent-highlight) }` + `.ls-sort-arrow`
- HistoricalScanner: `.hs-th--sorted` + `.hs-sort-arrow`
- Positions: `.pos-sort-arrow { font-size: 8px; color: var(--accent-highlight) }`
- OrderBook: No sort indicators (not sortable)

**Gap:**
- No generic sort indicator — each component defines its own
- No CSS-only up/down arrow indicators (all use inline text/unicode)

**Recommendation:** Add generic `.th-sortable`, `.th-sorted-asc`, `.th-sorted-desc` with CSS `::after` arrows.

---

## Implementation Plan (CSS additions to index.css)

1. **Context menu** — Generic `.context-menu` using existing tokens
2. **Sort indicators** — `.th-sortable`, `.th-sorted-asc`, `.th-sorted-desc`
3. **Row selection** — `.row-selected`, `.row-multi-selected`
4. **Focus-visible** — Global `:focus-visible` rules
5. **Column resize handles** — `.th-resizable::after`
6. **Keyboard nav** — `.focusable-row:focus-visible`
7. **Copyable cells** — `.cell-copyable` hover state
8. **Scroll shadows** — `.scroll-shadow-top`, `.scroll-shadow-bottom`
