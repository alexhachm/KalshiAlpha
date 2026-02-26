import React from 'react'
import Window from './Window'
import MarketViewer from './MarketViewer'
import Chart from './quotes/Chart'
import TimeSale from './quotes/TimeSale'
import Montage from './trade/Montage'
import PriceLadder from './trade/PriceLadder'
import Accounts from './trade/Accounts'
import Positions from './trade/Positions'
import TradeLog from './trade/TradeLog'
import EventLog from './trade/EventLog'
import LiveScanner from './scanners/LiveScanner'
import HistoricalScanner from './scanners/HistoricalScanner'
import MarketClock from './scanners/MarketClock'

// Placeholder for windows without a real implementation yet:
// login, news-chat, alert-trigger, hotkey-config
function Placeholder({ title }) {
  return (
    <div className="window-placeholder">
      <span>{title} (Coming Soon)</span>
    </div>
  )
}

// Component registry — maps window type strings to React components.
const COMPONENT_REGISTRY = {
  // Login
  login: Placeholder,
  // Trade
  montage: Montage,
  'price-ladder': PriceLadder,
  accounts: Accounts,
  positions: Positions,
  'trade-log': TradeLog,
  'event-log': EventLog,
  // Quotes
  chart: Chart,
  'time-sale': TimeSale,
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
