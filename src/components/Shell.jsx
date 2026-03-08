import React, { useReducer, useState, useCallback, useEffect } from 'react'
import MenuBar from './MenuBar'
import WindowManager from './WindowManager'
import SettingsPanel from './SettingsPanel'
import { findOpenPosition } from './SnapManager'
import { useHotkeyDispatch } from '../hooks/useHotkeyDispatch'
import './Shell.css'

const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 300
const INITIAL_X = 50
const INITIAL_Y = 10

// Per-type default sizes — mirrors CSS vars in index.css
const TYPE_SIZES = {
  login: { width: 360, height: 280 },
  montage: { width: 350, height: 400 },
  'price-ladder': { width: 280, height: 500 },
  accounts: { width: 500, height: 300 },
  positions: { width: 500, height: 300 },
  'trade-log': { width: 550, height: 350 },
  'event-log': { width: 500, height: 250 },
  chart: { width: 600, height: 400 },
  'time-sale': { width: 300, height: 400 },
  'market-viewer': { width: 350, height: 400 },
  'news-chat': { width: 400, height: 350 },
  'live-scanner': { width: 500, height: 350 },
  'historical-scanner': { width: 500, height: 350 },
  'alert-trigger': { width: 450, height: 350 },
  'market-clock': { width: 200, height: 100 },
  'hotkey-config': { width: 450, height: 400 },
}

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
        { id: target.id, type: target.type, title: target.title },
      ]
      const sourceTabs = source.tabs || [
        { id: source.id, type: source.type, title: source.title },
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

      // Direct window match
      if (state.windows[id]) {
        return {
          ...state,
          windows: {
            ...state.windows,
            [id]: { ...state.windows[id], ticker },
          },
        }
      }

      // Tab id → find owning window and update its ticker
      for (const [winId, win] of Object.entries(state.windows)) {
        if (win.tabs && win.tabs.some((tab) => tab.id === id)) {
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
      const idx = windowList.findIndex((w) => w.id === focused.id)
      const nextIdx = e.shiftKey
        ? (idx - 1 + windowList.length) % windowList.length
        : (idx + 1) % windowList.length
      focusWindow(windowList[nextIdx].id)
    }
    document.addEventListener('keydown', handleKeyNav)
    return () => document.removeEventListener('keydown', handleKeyNav)
  }, [state.windows, getFocusedWindow, focusWindow])

  // STUB: Layout persistence — save/restore window arrangement
  // SOURCE: Internal — serialize state.windows to localStorage
  // IMPLEMENT WHEN: Users request persistent layouts
  // STEPS:
  //   1. On window change (open/close/move/resize), debounce-save state.windows to localStorage
  //   2. On mount, check localStorage for saved layout and restore via OPEN_WINDOW dispatches
  //   3. Add "Save Layout" / "Load Layout" menu items to MenuBar
  //   4. Support named layouts (e.g. "Trading", "Analysis", "Monitoring")

  useHotkeyDispatch({ focusWindow, getFocusedWindow, windows: state.windows })

  return (
    <div className="shell">
      <MenuBar onOpenWindow={openWindow} onOpenSettings={openSettings} />
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
