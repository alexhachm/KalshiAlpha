import React, { useReducer, useState, useCallback, useEffect } from 'react'
import MenuBar from './MenuBar'
import WindowManager from './WindowManager'
import SettingsPanel from './SettingsPanel'
import { findOpenPosition } from './SnapManager'
import { useHotkeyDispatch } from '../hooks/useHotkeyDispatch'
import { getTypeSizes } from '../config/toolManifest'
import './Shell.css'

const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 300
const INITIAL_X = 50
const INITIAL_Y = 10

const LAYOUT_STORAGE_KEY = 'kalshi-window-layout'
const LAYOUT_DEBOUNCE_MS = 500

// Per-type default sizes — sourced from canonical tool manifest
const TYPE_SIZES = getTypeSizes()

const CONNECTION_STATUS_LABELS = {
  mock: 'Mock Mode',
  connecting: 'Connecting',
  connected: 'Live',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
}

function windowReducer(state, action) {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const id = state.nextId
      const sizes = TYPE_SIZES[action.payload.type] || {}
      const w = sizes.width || DEFAULT_WIDTH
      const h = sizes.height || DEFAULT_HEIGHT

      // Use SnapManager to find an open position that avoids existing windows
      const pos = action.payload.position || { x: INITIAL_X, y: INITIAL_Y }

      const win = {
        id,
        settingsId: id,
        type: action.payload.type,
        title: action.payload.title,
        initialX: pos.x,
        initialY: pos.y,
        initialWidth: w,
        initialHeight: h,
        zIndex: state.nextZ,
      }
      // Attach ticker/context if provided (e.g. from Positions double-click)
      if (action.payload.ticker) win.ticker = action.payload.ticker
      return {
        ...state,
        windows: { ...state.windows, [id]: win },
        nextId: state.nextId + 1,
        nextZ: state.nextZ + 1,
      }
    }
    case 'CLOSE_WINDOW': {
      const { [action.payload.id]: _, ...rest } = state.windows
      return { ...state, windows: rest }
    }
    case 'FOCUS_WINDOW': {
      if (!state.windows[action.payload.id]) return state
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.id]: {
            ...state.windows[action.payload.id],
            zIndex: state.nextZ,
          },
        },
        nextZ: state.nextZ + 1,
      }
    }
    case 'MERGE_WINDOWS': {
      const { sourceId, targetId } = action.payload
      const source = state.windows[sourceId]
      const target = state.windows[targetId]
      if (!source || !target) return state

      // Build the tabs array for the merged window
      const targetTabs = target.tabs || [
        { id: target.id, settingsId: target.settingsId ?? target.id, type: target.type, title: target.title },
      ]
      const sourceTabs = source.tabs || [
        { id: source.id, settingsId: source.settingsId ?? source.id, type: source.type, title: source.title },
      ]
      const mergedTabs = [...targetTabs, ...sourceTabs]

      // Remove both originals, add merged window under the target's id
      const { [sourceId]: _s, [targetId]: _t, ...rest } = state.windows
      return {
        ...state,
        windows: {
          ...rest,
          [targetId]: {
            ...target,
            tabs: mergedTabs,
            activeTabIndex: 0,
            type: mergedTabs[0].type,
            title: mergedTabs[0].title,
            zIndex: state.nextZ,
          },
        },
        nextZ: state.nextZ + 1,
      }
    }
    case 'SET_ACTIVE_TAB': {
      const win = state.windows[action.payload.windowId]
      if (!win || !win.tabs) return state
      const tab = win.tabs[action.payload.tabIndex]
      if (!tab) return state
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.windowId]: {
            ...win,
            activeTabIndex: action.payload.tabIndex,
            type: tab.type,
            title: tab.title,
          },
        },
      }
    }
    case 'DETACH_TAB': {
      const win = state.windows[action.payload.windowId]
      if (!win || !win.tabs || win.tabs.length <= 1) return state
      const tabIdx = action.payload.tabIndex
      const tab = win.tabs[tabIdx]
      if (!tab) return state

      const remainingTabs = win.tabs.filter((_, i) => i !== tabIdx)
      const newActiveIdx = Math.min(
        win.activeTabIndex >= tabIdx ? Math.max(0, win.activeTabIndex - 1) : win.activeTabIndex,
        remainingTabs.length - 1
      )
      const activeTab = remainingTabs[newActiveIdx]

      // If only 1 tab remains, unwrap the tab group
      const updatedWin =
        remainingTabs.length === 1
          ? {
              ...win,
              tabs: undefined,
              activeTabIndex: undefined,
              settingsId: remainingTabs[0].settingsId ?? remainingTabs[0].id,
              type: remainingTabs[0].type,
              title: remainingTabs[0].title,
            }
          : {
              ...win,
              tabs: remainingTabs,
              activeTabIndex: newActiveIdx,
              type: activeTab.type,
              title: activeTab.title,
            }

      const newId = state.nextId
      const sizes = TYPE_SIZES[tab.type] || {}
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.windowId]: updatedWin,
          [newId]: {
            id: newId,
            settingsId: tab.settingsId ?? tab.id,
            type: tab.type,
            title: tab.title,
            initialX: win.initialX + 40,
            initialY: win.initialY + 40,
            initialWidth: sizes.width || DEFAULT_WIDTH,
            initialHeight: sizes.height || DEFAULT_HEIGHT,
            zIndex: state.nextZ,
          },
        },
        nextId: state.nextId + 1,
        nextZ: state.nextZ + 1,
      }
    }
    case 'POP_OUT_WINDOW': {
      const win = state.windows[action.payload.id]
      if (!win || win.poppedOut) return state
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.id]: { ...win, poppedOut: true },
        },
      }
    }
    case 'POP_IN_WINDOW': {
      const win = state.windows[action.payload.id]
      if (!win || !win.poppedOut) return state
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.id]: {
            ...win,
            poppedOut: false,
            zIndex: state.nextZ,
          },
        },
        nextZ: state.nextZ + 1,
      }
    }
    case 'UPDATE_WINDOW_TICKER': {
      const { id, ticker } = action.payload
      if (!id || !ticker) return state

      // Direct window key match
      if (state.windows[id]) {
        return {
          ...state,
          windows: {
            ...state.windows,
            [id]: { ...state.windows[id], ticker },
          },
        }
      }

      // settingsId or tab settingsId/id → find owning window
      for (const [winId, win] of Object.entries(state.windows)) {
        if (win.settingsId === id) {
          return {
            ...state,
            windows: {
              ...state.windows,
              [winId]: { ...win, ticker },
            },
          }
        }
        if (win.tabs && win.tabs.some((tab) => (tab.settingsId ?? tab.id) === id)) {
          return {
            ...state,
            windows: {
              ...state.windows,
              [winId]: { ...win, ticker },
            },
          }
        }
      }

      // Unknown id — no-op
      return state
    }
    case 'UPDATE_WINDOW_BOUNDS': {
      const { id, x, y, width, height } = action.payload
      if (!state.windows[id]) return state
      return {
        ...state,
        windows: {
          ...state.windows,
          [id]: {
            ...state.windows[id],
            initialX: x,
            initialY: y,
            initialWidth: width,
            initialHeight: height,
          },
        },
      }
    }
    case 'LOAD_LAYOUT': {
      const savedWindows = action.payload.windows
      if (!savedWindows || typeof savedWindows !== 'object') return state
      let { nextId, nextZ } = state
      const newWindows = {}
      for (const win of Object.values(savedWindows)) {
        if (!win.type) continue
        const id = nextId

        // For tabbed windows, remap each tab's settingsId to a fresh nextId-based id
        if (win.tabs && Array.isArray(win.tabs) && win.tabs.length > 1) {
          nextId++ // consume the window's own id slot
          const remappedTabs = win.tabs.map((tab) => {
            const tabSettingsId = nextId
            nextId++
            return { ...tab, id: tabSettingsId, settingsId: tabSettingsId }
          })
          const activeIdx = typeof win.activeTabIndex === 'number' ? win.activeTabIndex : 0
          const clampedIdx = Math.min(activeIdx, remappedTabs.length - 1)
          const activeTab = remappedTabs[clampedIdx]
          const sizes = TYPE_SIZES[activeTab.type] || {}
          const newWin = {
            id,
            settingsId: id,
            type: activeTab.type,
            title: activeTab.title || activeTab.type,
            tabs: remappedTabs,
            activeTabIndex: clampedIdx,
            initialX: win.initialX ?? INITIAL_X,
            initialY: win.initialY ?? INITIAL_Y,
            initialWidth: win.initialWidth || sizes.width || DEFAULT_WIDTH,
            initialHeight: win.initialHeight || sizes.height || DEFAULT_HEIGHT,
            zIndex: nextZ,
          }
          if (win.ticker) newWin.ticker = win.ticker
          newWindows[id] = newWin
        } else {
          const sizes = TYPE_SIZES[win.type] || {}
          const newWin = {
            id,
            settingsId: id,
            type: win.type,
            title: win.title || win.type,
            initialX: win.initialX ?? INITIAL_X,
            initialY: win.initialY ?? INITIAL_Y,
            initialWidth: win.initialWidth || sizes.width || DEFAULT_WIDTH,
            initialHeight: win.initialHeight || sizes.height || DEFAULT_HEIGHT,
            zIndex: nextZ,
          }
          if (win.ticker) newWin.ticker = win.ticker
          newWindows[id] = newWin
          nextId++
        }
        nextZ++
      }
      return { ...state, windows: newWindows, nextId, nextZ }
    }
    default:
      return state
  }
}

const initialState = {
  windows: {},
  nextId: 1,
  nextZ: 1,
}

function Shell({ connected = false, connectionStatus = 'mock' }) {
  const [state, dispatch] = useReducer(windowReducer, initialState)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const normalizedStatus = CONNECTION_STATUS_LABELS[connectionStatus] ? connectionStatus : 'disconnected'

  const statusClassName =
    normalizedStatus === 'connected'
      ? 'shell-status-dot--connected'
      : normalizedStatus === 'connecting' || normalizedStatus === 'reconnecting'
        ? 'shell-status-dot--connecting'
        : 'shell-status-dot--disconnected'

  const openWindow = useCallback((type, title, ticker) => {
    const sizes = TYPE_SIZES[type] || {}
    const w = sizes.width || DEFAULT_WIDTH
    const h = sizes.height || DEFAULT_HEIGHT
    const position = findOpenPosition(w, h)
    dispatch({ type: 'OPEN_WINDOW', payload: { type, title, ticker, position } })
  }, [])

  // Listen for 'open-window' custom events from child components
  // e.g. Positions can dispatch: window.dispatchEvent(new CustomEvent('open-window', { detail: { type: 'montage', title: 'Montage', ticker: 'TICKER' } }))
  useEffect(() => {
    const handler = (e) => {
      const { type, title, ticker } = e.detail || {}
      if (type) openWindow(type, title || type, ticker)
    }
    window.addEventListener('open-window', handler)
    return () => window.removeEventListener('open-window', handler)
  }, [openWindow])

  // Listen for 'window-ticker-update' custom events from mounted tools
  // e.g. a component can dispatch: window.dispatchEvent(new CustomEvent('window-ticker-update', { detail: { id: windowOrTabId, ticker: 'NEW-TICKER' } }))
  useEffect(() => {
    const handler = (e) => {
      const { id, ticker } = e.detail || {}
      if (id && ticker) {
        dispatch({ type: 'UPDATE_WINDOW_TICKER', payload: { id, ticker } })
      }
    }
    window.addEventListener('window-ticker-update', handler)
    return () => window.removeEventListener('window-ticker-update', handler)
  }, [])

  const closeWindow = useCallback((id) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: { id } })
  }, [])

  const focusWindow = useCallback((id) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { id } })
  }, [])

  const mergeWindows = useCallback((sourceId, targetId) => {
    dispatch({ type: 'MERGE_WINDOWS', payload: { sourceId, targetId } })
  }, [])

  const setActiveTab = useCallback((windowId, tabIndex) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: { windowId, tabIndex } })
  }, [])

  const detachTab = useCallback((windowId, tabIndex) => {
    dispatch({ type: 'DETACH_TAB', payload: { windowId, tabIndex } })
  }, [])

  const popOutWindow = useCallback((id) => {
    dispatch({ type: 'POP_OUT_WINDOW', payload: { id } })
  }, [])

  const popInWindow = useCallback((id) => {
    dispatch({ type: 'POP_IN_WINDOW', payload: { id } })
  }, [])

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const getFocusedWindow = useCallback(() => {
    // The window with the highest zIndex is considered focused
    let focused = null
    let maxZ = -1
    for (const win of Object.values(state.windows)) {
      if (win.zIndex > maxZ) {
        maxZ = win.zIndex
        focused = win
      }
    }
    return focused
  }, [state.windows])

  // Keyboard navigation: Ctrl+Tab / Ctrl+Shift+Tab to cycle between windows
  useEffect(() => {
    const handleKeyNav = (e) => {
      if (!e.ctrlKey || e.key !== 'Tab') return
      e.preventDefault()
      const windowList = Object.values(state.windows)
        .filter((w) => !w.poppedOut)
        .sort((a, b) => a.zIndex - b.zIndex)
      if (windowList.length < 2) return

      const focused = getFocusedWindow()
      if (!focused) return
      // idx may be -1 if the focused window is popped out (it's excluded from
      // windowList). Fall back to the highest-zIndex non-poppedOut window so
      // cycling is always deterministic and no arbitrary jumps occur.
      const idx = windowList.findIndex((w) => w.id === focused.id)
      const currentIdx = idx === -1 ? windowList.length - 1 : idx
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + windowList.length) % windowList.length
        : (currentIdx + 1) % windowList.length
      focusWindow(windowList[nextIdx].id)
    }
    document.addEventListener('keydown', handleKeyNav)
    return () => document.removeEventListener('keydown', handleKeyNav)
  }, [state.windows, getFocusedWindow, focusWindow])

  // Restore saved layout from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (!saved) return
      const windows = JSON.parse(saved)
      if (!windows || typeof windows !== 'object') return
      dispatch({ type: 'LOAD_LAYOUT', payload: { windows } })
    } catch (_) {
      // Corrupted storage — ignore
    }
  }, [])

  // Auto-save layout to localStorage on every window state change (debounced 500ms)
  useEffect(() => {
    if (Object.keys(state.windows).length === 0) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state.windows))
      } catch (_) {
        // Quota exceeded or private browsing — ignore
      }
    }, LAYOUT_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state.windows])

  // Listen for window-bounds-update events from Window components (drag/resize end)
  useEffect(() => {
    const handler = (e) => {
      const { id, x, y, width, height } = e.detail || {}
      if (id != null) {
        dispatch({ type: 'UPDATE_WINDOW_BOUNDS', payload: { id, x, y, width, height } })
      }
    }
    window.addEventListener('window-bounds-update', handler)
    return () => window.removeEventListener('window-bounds-update', handler)
  }, [])

  const saveLayout = useCallback(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state.windows))
    } catch (_) {}
  }, [state.windows])

  const loadLayout = useCallback(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (!saved) return
      const windows = JSON.parse(saved)
      if (!windows || typeof windows !== 'object') return
      dispatch({ type: 'LOAD_LAYOUT', payload: { windows } })
    } catch (_) {}
  }, [])

  useHotkeyDispatch({ focusWindow, getFocusedWindow, windows: state.windows })

  return (
    <div className="shell">
      <MenuBar onOpenWindow={openWindow} onOpenSettings={openSettings} onSaveLayout={saveLayout} onLoadLayout={loadLayout} />
      <div className="shell-account-bar">
        <div className="shell-account-bar-item">
          <span className={`shell-status-dot ${statusClassName}`} />
          <span className="shell-account-bar-label">Connection</span>
          <span className="shell-account-bar-value">
            {CONNECTION_STATUS_LABELS[normalizedStatus]}
            {normalizedStatus === 'connected' && !connected ? ' (syncing)' : ''}
          </span>
        </div>
      </div>
      <div className="shell-workspace">
        <WindowManager
          windows={state.windows}
          onClose={closeWindow}
          onFocus={focusWindow}
          onMerge={mergeWindows}
          onSetActiveTab={setActiveTab}
          onDetachTab={detachTab}
          onPopOut={popOutWindow}
          onPopIn={popInWindow}
        />
      </div>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        connectionStatus={normalizedStatus}
      />
    </div>
  )
}

export default Shell
