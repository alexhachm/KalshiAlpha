// Color Link Event Bus — pub/sub for color-group window linking
// Module-level singleton: import { emitLinkedMarket, subscribeToLink, ... } from './linkBus'
//
// linkingEnabled state is owned by settingsStore.colorCoordination.linkingEnabled.
// This module reads/writes through settingsStore and keeps a runtime cache in sync
// via a settingsStore subscriber so resets propagate automatically.

import { get as getSettings, update as updateSettings, subscribe as subscribeSettings } from './settingsStore'

const LINK_COLORS = [
  { id: 'red', hex: '#ff4444' },
  { id: 'green', hex: '#00ff00' },
  { id: 'blue', hex: '#4488ff' },
  { id: 'yellow', hex: '#ffcc00' },
  { id: 'purple', hex: '#cc44ff' },
  { id: 'orange', hex: '#ff8800' },
  { id: 'cyan', hex: '#00d2ff' },
  { id: 'white', hex: '#ffffff' },
];

const LS_KEY_GROUPS = 'kalshi_link_groups';
const LS_KEY_ENABLED_LEGACY = 'kalshi_linking_enabled';

// State: windowId -> colorId
let windowGroups = {};

// Subscribers: colorId -> Array<{callback, windowId}>
const subscribers = {};

// Runtime cache — kept in sync with settingsStore via subscriber
let linkingEnabled = true;

// --- Persistence ---

function loadLinkState() {
  try {
    const raw = localStorage.getItem(LS_KEY_GROUPS);
    if (raw) windowGroups = JSON.parse(raw);
  } catch {
    windowGroups = {};
  }

  // Migrate legacy localStorage key → settingsStore (backward compat)
  try {
    const legacyRaw = localStorage.getItem(LS_KEY_ENABLED_LEGACY);
    if (legacyRaw !== null) {
      const legacyValue = JSON.parse(legacyRaw);
      // Apply legacy value to settingsStore so existing user preference is preserved
      updateSettings('colorCoordination', 'linkingEnabled', !!legacyValue);
      localStorage.removeItem(LS_KEY_ENABLED_LEGACY);
    }
  } catch {
    localStorage.removeItem(LS_KEY_ENABLED_LEGACY);
  }

  // Read authoritative value from settingsStore
  linkingEnabled = !!getSettings().colorCoordination.linkingEnabled;
}

function saveLinkState() {
  try {
    localStorage.setItem(LS_KEY_GROUPS, JSON.stringify(windowGroups));
    // linkingEnabled is persisted by settingsStore — not duplicated here
  } catch {
    // localStorage may be unavailable (SSR, quota exceeded)
  }
}

// --- Color Group Management ---

function setColorGroup(windowId, colorId) {
  const previous = windowGroups[windowId] || null;
  windowGroups[windowId] = colorId;
  saveLinkState();
  emitGroupChange(windowId, colorId, previous);
}

function removeFromGroup(windowId) {
  const previous = windowGroups[windowId] || null;
  delete windowGroups[windowId];
  saveLinkState();
  emitGroupChange(windowId, null, previous);
}

function getColorGroup(windowId) {
  return windowGroups[windowId] || null;
}

function getWindowsInGroup(colorId) {
  return Object.keys(windowGroups).filter((wid) => windowGroups[wid] === colorId);
}

// --- Pub/Sub ---

function subscribeToLink(colorId, callback, windowId = null) {
  if (!subscribers[colorId]) subscribers[colorId] = [];
  subscribers[colorId].push({ callback, windowId });
}

function unsubscribeFromLink(colorId, callback) {
  if (subscribers[colorId]) {
    subscribers[colorId] = subscribers[colorId].filter((s) => s.callback !== callback);
    if (subscribers[colorId].length === 0) delete subscribers[colorId];
  }
}

function emitLinkedMarket(windowId, ticker) {
  if (!linkingEnabled) return;

  const colorId = windowGroups[windowId];
  if (!colorId) return;

  const subs = subscribers[colorId];
  if (!subs) return;

  const groupWindows = getWindowsInGroup(colorId).filter((wid) => wid !== windowId);

  subs.forEach((sub) => {
    // Skip emitter's own subscribers
    if (sub.windowId && sub.windowId === windowId) return;
    try {
      sub.callback({ ticker, sourceWindowId: windowId, colorId, groupWindows });
    } catch {
      // Don't let one bad subscriber break others
    }
  });
}

// --- Group-change signaling ---
// Flat array of callbacks — notified whenever a window's color group changes
const groupChangeSubscribers = [];

function subscribeToGroupChanges(callback) {
  groupChangeSubscribers.push(callback);
}

function unsubscribeToGroupChanges(callback) {
  const idx = groupChangeSubscribers.indexOf(callback);
  if (idx !== -1) groupChangeSubscribers.splice(idx, 1);
}

function emitGroupChange(windowId, colorId, previousColorId) {
  const detail = { windowId, colorId, previousColorId };
  groupChangeSubscribers.forEach((cb) => {
    try { cb(detail); } catch { /* isolate subscriber errors */ }
  });
}

// --- Drag sync (group drag) ---
// colorId -> Array<{ windowId, callback }>
const dragSubscribers = {};

function subscribeToDrag(colorId, windowId, callback) {
  if (!dragSubscribers[colorId]) dragSubscribers[colorId] = [];
  // Replace existing subscription for this windowId
  dragSubscribers[colorId] = dragSubscribers[colorId].filter((s) => s.windowId !== windowId);
  dragSubscribers[colorId].push({ windowId, callback });
}

function unsubscribeDrag(colorId, windowId) {
  if (!dragSubscribers[colorId]) return;
  dragSubscribers[colorId] = dragSubscribers[colorId].filter((s) => s.windowId !== windowId);
  if (dragSubscribers[colorId].length === 0) delete dragSubscribers[colorId];
}

function emitDragDelta(colorId, sourceWindowId, dx, dy) {
  const subs = dragSubscribers[colorId];
  if (!subs) return;
  subs.forEach((sub) => {
    if (sub.windowId !== sourceWindowId) {
      try { sub.callback(dx, dy) } catch {}
    }
  });
}

// --- Reset (called by settings "Reset to defaults") ---

function resetLinkState() {
  windowGroups = {};
  saveLinkState();
  // Re-sync runtime cache from settingsStore (subscriber also handles this,
  // but explicit read ensures deterministic state when called after settingsStore.reset())
  linkingEnabled = !!getSettings().colorCoordination.linkingEnabled;
}

// --- Enable/Disable ---

function setLinkingEnabled(enabled) {
  linkingEnabled = !!enabled;
  // Write through to settingsStore (authoritative persistence)
  updateSettings('colorCoordination', 'linkingEnabled', linkingEnabled);
}

function isLinkingEnabled() {
  return linkingEnabled;
}

// --- Init ---
loadLinkState();

// Keep runtime linkingEnabled in sync with settingsStore (handles reset, external updates)
subscribeSettings((settings) => {
  linkingEnabled = !!settings.colorCoordination.linkingEnabled;
});

export {
  LINK_COLORS,
  setColorGroup,
  removeFromGroup,
  getColorGroup,
  getWindowsInGroup,
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  subscribeToGroupChanges,
  unsubscribeToGroupChanges,
  emitGroupChange,
  subscribeToDrag,
  unsubscribeDrag,
  emitDragDelta,
  loadLinkState,
  saveLinkState,
  resetLinkState,
  setLinkingEnabled,
  isLinkingEnabled,
};
