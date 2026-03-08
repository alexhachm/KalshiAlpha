import React from 'react'
import Window from './Window'
import PopoutWindow from './PopoutWindow'
import MarketViewer from './MarketViewer'
// Trade
import Montage from './trade/Montage'
import NewsChat from './trade/NewsChat'
import PriceLadder from './trade/PriceLadder'
import Accounts from './trade/Accounts'
import Positions from './trade/Positions'
import TradeLog from './trade/TradeLog'
import EventLog from './trade/EventLog'
import OrderBook from './trade/OrderBook'
import ChangesTab from './trade/ChangesTab'
// Quotes
import Chart from './quotes/Chart'
import TimeSale from './quotes/TimeSale'
// Scanners
import LiveScanner from './scanners/LiveScanner'
import HistoricalScanner from './scanners/HistoricalScanner'
import MarketClock from './scanners/MarketClock'
import AlertTrigger from './scanners/AlertTrigger'
import HotkeyManager from './HotkeyManager'

// Placeholder component for windows without a real implementation yet
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
  'order-book': OrderBook,
  changes: ChangesTab,
  // Quotes
  chart: Chart,
  'time-sale': TimeSale,
  'market-viewer': MarketViewer,
  'news-chat': NewsChat,
  // Scanners
  'live-scanner': LiveScanner,
  'historical-scanner': HistoricalScanner,
  'alert-trigger': AlertTrigger,
  'market-clock': MarketClock,
  // Setup
  'hotkey-config': HotkeyManager,
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
          windowId: win.tabs?.[win.activeTabIndex]?.id ?? win.id,
          hostWindowId: win.id,
          type: win.type,
        }
        // Pass ticker context if the window was opened with one
        if (win.ticker) componentProps.ticker = win.ticker

        // Popped-out windows render in a separate browser window via portal
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
            onPopOut={onPopOut}
            onMerge={onMerge}
            tabs={win.tabs}
            activeTabIndex={win.activeTabIndex}
            onSetActiveTab={onSetActiveTab}
            onDetachTab={onDetachTab}
            {...(win.type === 'time-sale' ? { minWidth: 50, minHeight: 30 } : {})}
          >
            <Component {...componentProps} />
          </Window>
        )
      })}
    </>
  )
}

export default WindowManager
