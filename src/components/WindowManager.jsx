import React from 'react'
import Window from './Window'
import PopoutWindow from './PopoutWindow'
import MarketViewer from './MarketViewer'
import LiveScanner from './scanners/LiveScanner'
import HistoricalScanner from './scanners/HistoricalScanner'

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
  'live-scanner': LiveScanner,
  'historical-scanner': HistoricalScanner,
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
        const Component = COMPONENT_REGISTRY[win.type] || Placeholder
        const componentProps = {
          title: win.title,
          windowId: win.id,
          type: win.type,
        }
        // Pass ticker context if the window was opened with one
        if (win.ticker) componentProps.ticker = win.ticker

        if (win.poppedOut) {
          return (
            <PopoutWindow
              key={win.id}
              title={win.title}
              width={win.initialWidth}
              height={win.initialHeight}
              onClose={() => onPopIn(win.id)}
            >
              <Component {...componentProps} />
            </PopoutWindow>
          )
        }

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
            onMerge={onMerge}
            onPopOut={onPopOut}
            tabs={win.tabs}
            activeTabIndex={win.activeTabIndex}
            onSetActiveTab={onSetActiveTab}
            onDetachTab={onDetachTab}
          >
            <Component {...componentProps} />
          </Window>
        )
      })}
    </>
  )
}

export default WindowManager
