import React from 'react'
import Window from './Window'

function WindowManager({ windows, onClose, onFocus }) {
  return (
    <>
      {Object.values(windows).map((win) => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          initialX={win.initialX}
          initialY={win.initialY}
          initialWidth={win.initialWidth}
          initialHeight={win.initialHeight}
          zIndex={win.zIndex}
          onClose={onClose}
          onFocus={onFocus}
        >
          <div className="window-placeholder">
            <span>{win.title}</span>
          </div>
        </Window>
      ))}
    </>
  )
}

export default WindowManager
