# Visual Feedback Gap Analysis

> Generated 2026-03-06 by worker-2 (Opus). Research findings for visual feedback patterns.

---

## 1. Loading Skeletons

**Current state:** No skeleton/shimmer animations. PriceLadder and Montage have basic `.pl-loading` / `.mt-loading` classes (centered "Loading..." text). No skeleton-line or skeleton-block utility classes exist.

**Gap:** Every data panel (OrderBook, Positions, TradeLog, Accounts, TimeSale, Chart) lacks a skeleton loading state. Only basic text placeholders exist in 2 components.

**Implementation:** Add shimmer animation + `.skeleton-line` / `.skeleton-block` utility classes to `index.css`.

---

## 2. Empty States

**Current state:** OrderBook has `.ob-empty`, TimeSale has `.ts-empty` — both are minimal centered text. No icon placeholders, no visual hierarchy.

**Gap:** Empty states exist but are plain. Missing in Positions, TradeLog, Accounts, NewsChat. No icon or illustration placeholder pattern.

**Implementation:** Add `.empty-state` styling with icon placeholder support to `index.css`.

---

## 3. Error States

**Current state:** Montage has `.mt-error` (red text with subtle red background). EventLog colorizes ERROR entries. No generic reusable error state pattern.

**Gap:** No generic error banner/state class. Most components have no visual for API failures or disconnection.

**Implementation:** Add `.error-state` and `.error-banner` utility classes to `index.css`.

---

## 4. Toast / Notification System

**Current state:** None. No toast component, no notification CSS, no animation.

**Gap:** Complete absence. No way to show transient notifications (order fills, errors, connection changes).

**Implementation:** Add `.toast-container` and `.toast` CSS with slide-in/auto-dismiss animation to `index.css`.

---

## 5. Price Flash Animations

**Current state:**
- `index.css`: `.flash-up`/`.flash-down` (0.4s) — global utility
- `PriceLadder.css`: `.pl-flash-up`/`.pl-flash-down` (0.3s) — component-specific
- `OrderBook.css`: `.ob-row-flash` (0.6s, uses accent-highlight)
- `Positions.css`: `pos-flash` keyframe (0.6s, uses accent-warning)
- **Montage.css:** JS sets `.flash-up`/`.flash-down` classes but NO component-specific keyframes — relies on global `index.css` ones
- **TimeSale.css:** NO flash animations at all — new trades just appear

**Gap:** Montage relies on global flash (fine but could be enhanced). TimeSale completely lacks trade flash. Flash durations are inconsistent (0.3s–0.6s). No "price tick" micro-animation for inline price changes.

**Implementation:** Add flash keyframes to TimeSale.css. Enhance global flash with stronger initial opacity.

---

## 6. Bid/Ask Spread Visualization

**Current state:** PriceLadder shows spread as text in footer (`Spread: {value}`). No visual spread bar or highlighted gap between best bid/ask.

**Gap:** No visual spread indicator. The gap between best bid and best ask rows is not visually highlighted.

**Implementation:** Add `.pl-spread-row` styling to PriceLadder.css for visual spread gap emphasis.

---

## 7. Volume Bars

**Current state:** PriceLadder already has `.pl-volume-bar`, `.pl-volume-bid`, `.pl-volume-ask` with positional backgrounds at 12% opacity. Well-implemented.

**Gap:** None for PriceLadder. OrderBook and TimeSale don't have volume visualization, but this is less critical for those components.

**Implementation:** No changes needed — PriceLadder implementation is solid.

---

## 8. Connection Status Indicator

**Current state:** No connection indicator exists in CSS. EventLog logs connection events as text entries.

**Gap:** No visual indicator showing WebSocket connection state (connected/disconnected/reconnecting).

**Implementation:** Add `.connection-indicator` with pulsing dot animation and state variants to `index.css`.

---

## 9. Latency Indicator

**Current state:** None.

**Gap:** No latency display. Lower priority than connection status.

**Implementation:** Add `.latency-indicator` with color thresholds to `index.css`.

---

## Implementation Priority (by value)

1. Loading skeleton CSS (high value — every panel benefits)
2. Toast notification CSS (high value — missing entirely)
3. Connection status indicator (high value — critical for trading)
4. Price flash enhancements (medium — TimeSale missing entirely)
5. Empty state styling (medium — existing but minimal)
6. Spread visualization (low — PriceLadder footer text is adequate)
