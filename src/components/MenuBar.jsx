import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import './MenuBar.css'

const MENU_CONFIG = [
  {
    label: 'Login',
    action: 'login',
  },
  {
    label: 'Trade',
    items: [
      { label: 'Montage', type: 'montage', shortcut: 'Ctrl+M' },
      { label: 'Price Ladder', type: 'price-ladder', shortcut: 'Ctrl+L' },
      { label: 'Accounts', type: 'accounts' },
      { label: 'Positions', type: 'positions', shortcut: 'Ctrl+P' },
      { label: 'Trade Log', type: 'trade-log' },
      { label: 'Event Log', type: 'event-log' },
      { label: 'Order Book', type: 'order-book' },
      { label: 'Changes', type: 'changes' },
    ],
  },
  {
    label: 'Quotes',
    items: [
      { label: 'Chart', type: 'chart', shortcut: 'Ctrl+K' },
      { label: 'Time/Sale', type: 'time-sale' },
      { label: 'Market Viewer', type: 'market-viewer' },
      { label: 'News/Chat', type: 'news-chat' },
    ],
  },
  {
    label: 'Scanners',
    items: [
      { label: 'Live', type: 'live-scanner' },
      { label: 'Historical', type: 'historical-scanner' },
      { label: 'Alert & Trigger', type: 'alert-trigger' },
      { label: 'Market Clock', type: 'market-clock' },
    ],
  },
  {
    label: 'Setup',
    items: [{ label: 'Hotkey Config', type: 'hotkey-config' }],
  },
  {
    label: 'Settings',
    action: 'settings',
  },
]

function MenuBar({ onOpenWindow, onOpenSettings }) {
  const [activeMenu, setActiveMenu] = useState(null)
  const menuBarRef = useRef(null)

  useEffect(() => {
    if (activeMenu === null) return
    const handleClickOutside = (e) => {
      if (!menuBarRef.current?.contains(e.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  const handleMenuClick = (index) => {
    const menu = MENU_CONFIG[index]
    if (menu.action) {
      if (menu.action === 'settings' && onOpenSettings) {
        onOpenSettings()
      } else {
        onOpenWindow(menu.action, menu.label)
      }
      setActiveMenu(null)
      return
    }
    setActiveMenu((prev) => (prev === index ? null : index))
  }

  const handleMenuHover = (index) => {
    if (activeMenu !== null) {
      const menu = MENU_CONFIG[index]
      if (menu.action) return
      setActiveMenu(index)
    }
  }

  const handleItemClick = (item) => {
    onOpenWindow(item.type, item.label)
    setActiveMenu(null)
  }

  return (
    <div className="menu-bar" ref={menuBarRef}>
      {MENU_CONFIG.map((menu, index) => (
        <div
          key={menu.label}
          className={clsx('menu-item', activeMenu === index && 'menu-item--active')}
          onClick={() => handleMenuClick(index)}
          onMouseEnter={() => handleMenuHover(index)}
        >
          {menu.label}
          {activeMenu === index && menu.items && (
            <div className="menu-dropdown">
              {menu.items.map((item) => (
                <div
                  key={item.type}
                  className="menu-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleItemClick(item)
                  }}
                >
                  <span className="menu-dropdown-label">{item.label}</span>
                  {item.shortcut && (
                    <span className="menu-dropdown-shortcut">{item.shortcut}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MenuBar
