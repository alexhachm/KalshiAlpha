import React from 'react'
import Window from './Window'
import MarketViewer from './MarketViewer'
import LiveScanner from './scanners/LiveScanner'
import Chart from './quotes/Chart'
import Montage from './trade/Montage'
import HistoricalScanner from './scanners/HistoricalScanner'
import MarketClock from './scanners/MarketClock'

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
  montage: Montage,
  'price-ladder': Placeholder,
  accounts: Placeholder,
  positions: Placeholder,
  'trade-log': Placeholder,
  'event-log': Placeholder,
  // Quotes
  chart: Chart,
  'time-sale': Placeholder,
  'market-viewer': MarketViewer,
  'news-chat': Placeholder,
  // Scanners
  'live-scanner': LiveScanner,
  'historical-scanner': HistoricalScanner,
  'alert-trigger': Placeholder,
  'market-clock': MarketClock,
  // Setup
  'hotkey-config': Placeholder,
}

function WindowManager({ windows, onClose, onFocus }) {
  return (
    <>
      {Object.values(windows).map((win) => {
        const Component = COMPONENT_REGISTRY[win.type] || Placeholder
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
          >
            <Component title={win.title} windowId={win.id} type={win.type} />
          </Window>
        )
      })}
    </>
  )
}

export default WindowManager
