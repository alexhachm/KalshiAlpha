import React from 'react'
import Window from './Window'
import PopoutWindow from './PopoutWindow'
import MarketViewer from './MarketViewer'
import './Window.css'

// Placeholder component used for all windows that don't have a real implementation yet
function Placeholder({ title }) {
  return (
    <div className="window-placeholder">
      <span>{title} (Coming Soon)</span>
    </div>
  )
}

// Component registry — maps window type strings to React components.
// Domain workers will replace Placeholder entries with real implementations.
const COMPONENT_REGISTRY = {
  // Login
  login: Placeholder,
  // Trade
  montage: Placeholder,
  'price-ladder': Placeholder,
  accounts: Placeholder,
  positions: Placeholder,
  'trade-log': Placeholder,
  'event-log': Placeholder,
  // Quotes
  chart: Placeholder,
  'time-sale': Placeholder,
  'market-viewer': MarketViewer,
  'news-chat': Placeholder,
  // Scanners
  'live-scanner': Placeholder,
  'historical-scanner': Placeholder,
  'alert-trigger': Placeholder,
  'market-clock': Placeholder,
  // Setup
  'hotkey-config': Placeholder,
}

function WindowManager({
  windows,
  onClose,
  onFocus,
  onMerge,
  onSetActiveTab,
  onDetachTab,
  onPopOut,
  onPopIn,
}) {
  return (
    <>
      {Object.values(windows).map((win) => {
        const activeType = win.tabs
          ? win.tabs[win.activeTabIndex || 0]?.type || win.type
          : win.type
        const Component = COMPONENT_REGISTRY[activeType] || Placeholder

        // Popped-out window — render in browser popup via PopoutWindow
        if (win.poppedOut) {
          return (
            <PopoutWindow
              key={win.id}
              title={win.title}
              width={win.initialWidth}
              height={win.initialHeight}
              onClose={() => onPopIn && onPopIn(win.id)}
            >
              <div className="popout-header">
                <span className="popout-title">{win.title}</span>
                <button
                  className="popout-btn"
                  onClick={() => onPopIn && onPopIn(win.id)}
                >
                  Pop In
                </button>
              </div>
              <div className="popout-body">
                <Component
                  title={win.title}
                  windowId={win.id}
                  type={activeType}
                />
              </div>
            </PopoutWindow>
          )
        }

        // Normal in-shell window
        return (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            type={win.type}
            initialX={win.initialX}
            initialY={win.initialY}
            initialWidth={win.initialWidth}
            initialHeight={win.initialHeight}
            zIndex={win.zIndex}
            onClose={onClose}
            onFocus={onFocus}
            onPopOut={onPopOut}
            onMerge={onMerge}
            tabs={win.tabs}
            activeTabIndex={win.activeTabIndex}
            onSetActiveTab={onSetActiveTab}
            onDetachTab={onDetachTab}
          >
            <Component
              title={win.title}
              windowId={win.id}
              type={activeType}
            />
          </Window>
        )
      })}
    </>
  )
}

export default WindowManager
