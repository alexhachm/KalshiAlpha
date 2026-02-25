import React, { useReducer } from 'react'
import MenuBar from './MenuBar'
import WindowManager from './WindowManager'
import './Shell.css'

const CASCADE_OFFSET = 30
const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 300
const INITIAL_X = 50
const INITIAL_Y = 10

const WINDOW_SIZES = {
  'market-viewer': { width: 350, height: 400 },
}

function windowReducer(state, action) {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const id = state.nextId
      const count = Object.keys(state.windows).length
      const sizes = WINDOW_SIZES[action.payload.type] || {}
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
            initialWidth: sizes.width || DEFAULT_WIDTH,
            initialHeight: sizes.height || DEFAULT_HEIGHT,
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

  const openWindow = (type, title) => {
    dispatch({ type: 'OPEN_WINDOW', payload: { type, title } })
  }

  const closeWindow = (id) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: { id } })
  }

  const focusWindow = (id) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { id } })
  }

  return (
    <div className="shell">
      <MenuBar onOpenWindow={openWindow} />
      <div className="shell-workspace">
        <WindowManager
          windows={state.windows}
          onClose={closeWindow}
          onFocus={focusWindow}
        />
      </div>
    </div>
  )
}

export default Shell
