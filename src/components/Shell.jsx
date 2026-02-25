import React, { useReducer, useState, useCallback } from 'react'
import MenuBar from './MenuBar'
import WindowManager from './WindowManager'
import SettingsPanel from './SettingsPanel'
import './Shell.css'

const CASCADE_OFFSET = 30
const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 300
const INITIAL_X = 50
const INITIAL_Y = 10

function windowReducer(state, action) {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const id = state.nextId
      const count = Object.keys(state.windows).length
      return {
        ...state,
        windows: {
          ...state.windows,
          [id]: {
            id,
            type: action.payload.type,
            title: action.payload.title,
            initialX: INITIAL_X + (count % 10) * CASCADE_OFFSET,
            initialY: INITIAL_Y + (count % 10) * CASCADE_OFFSET,
            initialWidth: DEFAULT_WIDTH,
            initialHeight: DEFAULT_HEIGHT,
            zIndex: state.nextZ,
          },
        },
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

  const openWindow = (type, title) => {
    dispatch({ type: 'OPEN_WINDOW', payload: { type, title } })
  }

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
