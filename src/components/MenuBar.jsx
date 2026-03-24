import React, { useState, useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { getMenuConfig } from '../config/toolManifest'
import { getFocusBindingMap, subscribe as subscribeHotkeys } from '../services/hotkeyStore'
import './MenuBar.css'

const MENU_CONFIG = getMenuConfig()

function MenuBar({ onOpenWindow, onOpenSettings, onSaveLayout, onLoadLayout }) {
  const [activeMenu, setActiveMenu] = useState(null)
  const [focusedItem, setFocusedItem] = useState(-1)
  const [focusedTrigger, setFocusedTrigger] = useState(-1)
  const [focusBindingMap, setFocusBindingMap] = useState(() => getFocusBindingMap())
  const menuBarRef = useRef(null)
  const triggerRefs = useRef([])
  const itemRefs = useRef([])
  const prevFocusRef = useRef(null)

  // Keep shortcut badges in sync with the live hotkey store
  useEffect(() => {
    return subscribeHotkeys(() => setFocusBindingMap(getFocusBindingMap()))
  }, [])

  // Focus the active trigger element when focusedTrigger changes
  useEffect(() => {
    if (focusedTrigger >= 0 && triggerRefs.current[focusedTrigger]) {
      triggerRefs.current[focusedTrigger].focus()
    }
  }, [focusedTrigger])

  // Focus the active dropdown item when focusedItem changes
  useEffect(() => {
    if (focusedItem >= 0 && itemRefs.current[focusedItem]) {
      itemRefs.current[focusedItem].focus()
    }
  }, [focusedItem])

  // Reset itemRefs when activeMenu changes
  useEffect(() => {
    itemRefs.current = []
  }, [activeMenu])

  // Close dropdown on outside click
  useEffect(() => {
    if (activeMenu === null) return
    setFocusedItem(-1)
    const handleClickOutside = (e) => {
      if (!menuBarRef.current?.contains(e.target)) {
        setActiveMenu(null)
        setFocusedTrigger(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  // Global Alt / F10 handler to enter the menubar
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'F10' || (e.key === 'Alt' && !e.ctrlKey && !e.shiftKey && !e.metaKey)) {
        // Only activate on keyup for Alt (to avoid interfering with Alt+combos)
        // For F10, activate immediately
        if (e.key === 'F10') {
          e.preventDefault()
          prevFocusRef.current = document.activeElement
          setFocusedTrigger(0)
        }
      }
    }

    const handleGlobalKeyUp = (e) => {
      if (e.key === 'Alt' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        // If menubar is already focused, Alt exits it
        if (focusedTrigger >= 0 && activeMenu === null) {
          exitMenubar()
          return
        }
        // Only enter if we're not already in the menubar with a menu open
        if (activeMenu !== null) {
          setActiveMenu(null)
          setFocusedTrigger(-1)
          restoreFocus()
          return
        }
        e.preventDefault()
        prevFocusRef.current = document.activeElement
        setFocusedTrigger(0)
      }
    }

    document.addEventListener('keydown', handleGlobalKey)
    document.addEventListener('keyup', handleGlobalKeyUp)
    return () => {
      document.removeEventListener('keydown', handleGlobalKey)
      document.removeEventListener('keyup', handleGlobalKeyUp)
    }
  }, [focusedTrigger, activeMenu, exitMenubar])

  const restoreFocus = useCallback(() => {
    if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
      prevFocusRef.current.focus()
      prevFocusRef.current = null
    }
  }, [])

  const exitMenubar = useCallback(() => {
    setActiveMenu(null)
    setFocusedTrigger(-1)
    restoreFocus()
  }, [restoreFocus])

  // Find next/prev trigger index (wrapping)
  const getNextTrigger = useCallback((current, direction) => {
    const len = MENU_CONFIG.length
    let next = ((current + direction) % len + len) % len
    return next
  }, [])

  // Find next/prev trigger with submenu (skipping action-only items), for open-menu arrow nav
  const getNextSubmenuTrigger = useCallback((current, direction) => {
    const len = MENU_CONFIG.length
    let next = ((current + direction) % len + len) % len
    let attempts = 0
    while (MENU_CONFIG[next].action && attempts < len) {
      next = ((next + direction) % len + len) % len
      attempts++
    }
    return attempts < len ? next : current
  }, [])

  // Keyboard handler for trigger-level navigation (closed menubar state)
  const handleTriggerKeyDown = useCallback(
    (e, index) => {
      const menu = MENU_CONFIG[index]

      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault()
          const next = getNextTrigger(index, 1)
          setFocusedTrigger(next)
          if (activeMenu !== null) {
            // If a dropdown is open, open the new one (or close if action item)
            if (MENU_CONFIG[next].items) {
              setActiveMenu(next)
            } else {
              setActiveMenu(null)
            }
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const next = getNextTrigger(index, -1)
          setFocusedTrigger(next)
          if (activeMenu !== null) {
            if (MENU_CONFIG[next].items) {
              setActiveMenu(next)
            } else {
              setActiveMenu(null)
            }
          }
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          if (menu.items) {
            setActiveMenu(index)
            setFocusedTrigger(index)
            // focusedItem will be set to 0 after dropdown renders
            setTimeout(() => setFocusedItem(0), 0)
          }
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          if (menu.action) {
            // Action items: execute and exit menubar
            if (menu.action === 'settings' && onOpenSettings) {
              onOpenSettings()
            } else {
              onOpenWindow(menu.action, menu.label)
            }
            exitMenubar()
          } else if (menu.items) {
            if (activeMenu === index) {
              // Toggle close
              setActiveMenu(null)
            } else {
              setActiveMenu(index)
              setTimeout(() => setFocusedItem(0), 0)
            }
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          if (activeMenu !== null) {
            // Close dropdown, keep focus on trigger
            setActiveMenu(null)
            setFocusedItem(-1)
          } else {
            // Exit menubar entirely
            exitMenubar()
          }
          break
        }
        case 'Tab': {
          // Let Tab exit the menubar naturally
          setActiveMenu(null)
          setFocusedTrigger(-1)
          prevFocusRef.current = null
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedTrigger(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedTrigger(MENU_CONFIG.length - 1)
          break
        }
        default:
          break
      }
    },
    [activeMenu, exitMenubar, getNextTrigger, onOpenSettings, onOpenWindow]
  )

  // Keyboard handler for dropdown item navigation
  const handleItemKeyDown = useCallback(
    (e, menu, itemIdx) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setFocusedItem((prev) => Math.min(prev + 1, menu.items.length - 1))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          if (itemIdx === 0) {
            // Move focus back to the trigger
            setFocusedItem(-1)
            if (focusedTrigger >= 0) {
              triggerRefs.current[focusedTrigger]?.focus()
            }
          } else {
            setFocusedItem((prev) => Math.max(prev - 1, 0))
          }
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const next = getNextSubmenuTrigger(focusedTrigger, 1)
          setFocusedTrigger(next)
          if (MENU_CONFIG[next].items) {
            setActiveMenu(next)
            setTimeout(() => setFocusedItem(0), 0)
          } else {
            setActiveMenu(null)
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const next = getNextSubmenuTrigger(focusedTrigger, -1)
          setFocusedTrigger(next)
          if (MENU_CONFIG[next].items) {
            setActiveMenu(next)
            setTimeout(() => setFocusedItem(0), 0)
          } else {
            setActiveMenu(null)
          }
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          onOpenWindow(menu.items[itemIdx].type, menu.items[itemIdx].label)
          exitMenubar()
          break
        }
        case 'Escape': {
          e.preventDefault()
          setActiveMenu(null)
          setFocusedItem(-1)
          // Return focus to the trigger
          if (focusedTrigger >= 0) {
            triggerRefs.current[focusedTrigger]?.focus()
          }
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedItem(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedItem(menu.items.length - 1)
          break
        }
        case 'Tab': {
          // Exit the menubar on Tab
          setActiveMenu(null)
          setFocusedTrigger(-1)
          prevFocusRef.current = null
          break
        }
        default:
          break
      }
    },
    [focusedTrigger, exitMenubar, getNextSubmenuTrigger, onOpenWindow]
  )

  const handleMenuClick = (index) => {
    const menu = MENU_CONFIG[index]
    if (menu.action) {
      if (menu.action === 'settings' && onOpenSettings) {
        onOpenSettings()
      } else {
        onOpenWindow(menu.action, menu.label)
      }
      setActiveMenu(null)
      setFocusedTrigger(-1)
      return
    }
    setActiveMenu((prev) => (prev === index ? null : index))
    setFocusedTrigger(index)
  }

  const handleMenuHover = (index) => {
    if (activeMenu !== null) {
      const menu = MENU_CONFIG[index]
      if (menu.action) return
      setActiveMenu(index)
      setFocusedTrigger(index)
    }
  }

  const handleItemClick = (item) => {
    onOpenWindow(item.type, item.label)
    setActiveMenu(null)
    setFocusedTrigger(-1)
  }

  return (
    <div className="menu-bar" ref={menuBarRef} role="menubar" aria-label="Application menu">
      {MENU_CONFIG.map((menu, index) => (
        <div
          key={menu.label}
          ref={(el) => (triggerRefs.current[index] = el)}
          className={clsx(
            'menu-item',
            activeMenu === index && 'menu-item--active',
            focusedTrigger === index && activeMenu === null && 'menu-item--focused'
          )}
          role="menuitem"
          tabIndex={focusedTrigger === index ? 0 : -1}
          aria-haspopup={menu.items ? 'true' : undefined}
          aria-expanded={menu.items ? activeMenu === index : undefined}
          onClick={() => handleMenuClick(index)}
          onMouseEnter={() => handleMenuHover(index)}
          onKeyDown={(e) => handleTriggerKeyDown(e, index)}
        >
          {menu.label}
          {activeMenu === index && menu.items && (
            <div className="menu-dropdown" role="menu" aria-label={menu.label}>
              {menu.items.map((item, itemIdx) => (
                <div
                  key={item.type}
                  ref={(el) => (itemRefs.current[itemIdx] = el)}
                  className={clsx(
                    'menu-dropdown-item',
                    focusedItem === itemIdx && 'menu-dropdown-item--focused'
                  )}
                  role="menuitem"
                  tabIndex={focusedItem === itemIdx ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleItemClick(item)
                  }}
                  onMouseEnter={() => setFocusedItem(itemIdx)}
                  onKeyDown={(e) => handleItemKeyDown(e, menu, itemIdx)}
                >
                  <span className="menu-dropdown-label">{item.label}</span>
                  {item.focusTarget && focusBindingMap[item.focusTarget] && (
                    <span className="menu-dropdown-shortcut">{focusBindingMap[item.focusTarget]}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {(onSaveLayout || onLoadLayout) && (
        <div
          className={clsx('menu-item', activeMenu === 'layout' && 'menu-item--active')}
          role="menuitem"
          tabIndex={-1}
          aria-haspopup="true"
          aria-expanded={activeMenu === 'layout'}
          onClick={() => setActiveMenu((prev) => (prev === 'layout' ? null : 'layout'))}
          onMouseEnter={() => { if (activeMenu !== null) setActiveMenu('layout') }}
        >
          Layout
          {activeMenu === 'layout' && (
            <div className="menu-dropdown" role="menu" aria-label="Layout">
              {onSaveLayout && (
                <div
                  className="menu-dropdown-item"
                  role="menuitem"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSaveLayout()
                    setActiveMenu(null)
                    setFocusedTrigger(-1)
                  }}
                >
                  <span className="menu-dropdown-label">Save Layout</span>
                </div>
              )}
              {onLoadLayout && (
                <div
                  className="menu-dropdown-item"
                  role="menuitem"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLoadLayout()
                    setActiveMenu(null)
                    setFocusedTrigger(-1)
                  }}
                >
                  <span className="menu-dropdown-label">Load Layout</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MenuBar
