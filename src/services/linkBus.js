// Color Link Event Bus — pub/sub for color-group window linking
// Module-level singleton: import { emitLinkedMarket, subscribeToLink, ... } from './linkBus'

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
const LS_KEY_ENABLED = 'kalshi_linking_enabled';

// State: windowId -> colorId
let windowGroups = {};

// Subscribers: colorId -> Array<{callback, windowId}>
const subscribers = {};

// Global enable/disable
let linkingEnabled = true;

// --- Persistence ---

function loadLinkState() {
  try {
    const raw = localStorage.getItem(LS_KEY_GROUPS);
    if (raw) windowGroups = JSON.parse(raw);
  } catch {
    windowGroups = {};
  }
  try {
    const raw = localStorage.getItem(LS_KEY_ENABLED);
    if (raw !== null) linkingEnabled = JSON.parse(raw);
  } catch {
    linkingEnabled = true;
  }
}

function saveLinkState() {
  try {
    localStorage.setItem(LS_KEY_GROUPS, JSON.stringify(windowGroups));
    localStorage.setItem(LS_KEY_ENABLED, JSON.stringify(linkingEnabled));
  } catch {
    // localStorage may be unavailable (SSR, quota exceeded)
  }
}

// --- Color Group Management ---

function setColorGroup(windowId, colorId) {
  windowGroups[windowId] = colorId;
  saveLinkState();
}

function removeFromGroup(windowId) {
  delete windowGroups[windowId];
  saveLinkState();
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

// --- Enable/Disable ---

function setLinkingEnabled(enabled) {
  linkingEnabled = !!enabled;
  saveLinkState();
}

function isLinkingEnabled() {
  return linkingEnabled;
}

// --- Init ---
loadLinkState();

export {
  LINK_COLORS,
  setColorGroup,
  removeFromGroup,
  getColorGroup,
  getWindowsInGroup,
  subscribeToLink,
  unsubscribeFromLink,
  emitLinkedMarket,
  subscribeToDrag,
  unsubscribeDrag,
  emitDragDelta,
  loadLinkState,
  saveLinkState,
  setLinkingEnabled,
  isLinkingEnabled,
};
