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
      const win = {
        id,
        type: action.payload.type,
        title: action.payload.title,
        initialX: INITIAL_X + (count % 10) * CASCADE_OFFSET,
        initialY: INITIAL_Y + (count % 10) * CASCADE_OFFSET,
        initialWidth: sizes.width || DEFAULT_WIDTH,
        initialHeight: sizes.height || DEFAULT_HEIGHT,
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
    dispatch({ type: 'OPEN_WINDOW', payload: { type, title, ticker } })
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
