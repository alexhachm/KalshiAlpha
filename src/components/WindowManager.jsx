import React from 'react'
import Window from './Window'
import MarketViewer from './MarketViewer'

function renderWindowContent(win) {
  switch (win.type) {
    case 'market-viewer':
      return <MarketViewer windowId={win.id} />
    default:
      return (
        <div className="window-placeholder">
          <span>{win.title}</span>
        </div>
      )
  }
}

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
          {renderWindowContent(win)}
        </Window>
      ))}
    </>
  )
}

export default WindowManager
