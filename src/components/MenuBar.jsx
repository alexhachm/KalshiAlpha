import React, { useState, useRef, useEffect, useCallback } from 'react'
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
      { label: 'Montage', type: 'montage' },
      { label: 'Price Ladder', type: 'price-ladder' },
      { label: 'Accounts', type: 'accounts' },
      { label: 'Positions', type: 'positions' },
      { label: 'Trade Log', type: 'trade-log' },
      { label: 'Event Log', type: 'event-log' },
      { label: 'Order Book', type: 'order-book' },
      { label: 'Changes', type: 'changes' },
    ],
  },
  {
    label: 'Quotes',
    items: [
      { label: 'Chart', type: 'chart' },
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
  const [focusedItem, setFocusedItem] = useState(-1)
  const menuBarRef = useRef(null)

  useEffect(() => {
    if (activeMenu === null) return
    setFocusedItem(-1)
    const handleClickOutside = (e) => {
      if (!menuBarRef.current?.contains(e.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  // Escape to close dropdown + arrow key navigation
  useEffect(() => {
    if (activeMenu === null) return
    const menu = MENU_CONFIG[activeMenu]
    if (!menu?.items) return

    const handleKey = (e) => {
      switch (e.key) {
        case 'Escape':
          setActiveMenu(null)
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedItem((prev) => Math.min(prev + 1, menu.items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedItem((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          if (focusedItem >= 0 && focusedItem < menu.items.length) {
            onOpenWindow(menu.items[focusedItem].type, menu.items[focusedItem].label)
            setActiveMenu(null)
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          setActiveMenu((prev) => {
            let next = prev - 1
            while (next >= 0 && MENU_CONFIG[next].action) next--
            return next >= 0 ? next : prev
          })
          break
        case 'ArrowRight':
          e.preventDefault()
          setActiveMenu((prev) => {
            let next = prev + 1
            while (next < MENU_CONFIG.length && MENU_CONFIG[next].action) next++
            return next < MENU_CONFIG.length ? next : prev
          })
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activeMenu, focusedItem, onOpenWindow])

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
            <div className="menu-dropdown" role="menu">
              {menu.items.map((item, itemIdx) => (
                <div
                  key={item.type}
                  className={clsx('menu-dropdown-item', focusedItem === itemIdx && 'menu-dropdown-item--focused')}
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleItemClick(item)
                  }}
                  onMouseEnter={() => setFocusedItem(itemIdx)}
                >
                  <span className="menu-dropdown-label">{item.label}</span>
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
