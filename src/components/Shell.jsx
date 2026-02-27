import React, { useReducer, useState, useCallback, useEffect } from 'react'
import MenuBar from './MenuBar'
import WindowManager from './WindowManager'
import SettingsPanel from './SettingsPanel'
import './Shell.css'

const CASCADE_OFFSET = 30
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

function windowReducer(state, action) {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const id = state.nextId
      const count = Object.keys(state.windows).length
      const sizes = TYPE_SIZES[action.payload.type] || {}
      const w = sizes.width || DEFAULT_WIDTH
      const h = sizes.height || DEFAULT_HEIGHT

      // Tile: compute grid from viewport, place in first sequential cell
      const vw = action.payload.vw || window.innerWidth
      const vh = action.payload.vh || window.innerHeight
      const cols = Math.max(1, Math.floor(vw / DEFAULT_WIDTH))
      const rows = Math.max(1, Math.floor(vh / DEFAULT_HEIGHT))
      const totalCells = cols * rows

      let x, y
      if (count < totalCells) {
        const col = count % cols
        const row = Math.floor(count / cols)
        x = col * DEFAULT_WIDTH
        y = row * DEFAULT_HEIGHT
      } else {
        // Fallback to cascade when grid is full
        x = INITIAL_X + (count % 10) * CASCADE_OFFSET
        y = INITIAL_Y + (count % 10) * CASCADE_OFFSET
      }

      const win = {
        id,
        type: action.payload.type,
        title: action.payload.title,
        initialX: x,
        initialY: y,
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
    default:
      return state
  }
}

const initialState = {
  windows: {},
  nextId: 1,
  nextZ: 1,
}

function Shell() {
  const [state, dispatch] = useReducer(windowReducer, initialState)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const openWindow = useCallback((type, title, ticker) => {
    dispatch({ type: 'OPEN_WINDOW', payload: { type, title, ticker, vw: window.innerWidth, vh: window.innerHeight } })
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

  const closeWindow = (id) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: { id } })
  }

  const focusWindow = (id) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { id } })
  }

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

  return (
    <div className="shell">
      <MenuBar onOpenWindow={openWindow} onOpenSettings={openSettings} />
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
      />
    </div>
  )
}

export default Shell
