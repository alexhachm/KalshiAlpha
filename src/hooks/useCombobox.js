import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Shared combobox behavior for ticker search dropdowns.
 *
 * Provides:
 * - ArrowUp/ArrowDown active-option cycling (wraps around)
 * - Enter to select the active option
 * - Escape to close popup and blur input
 * - Outside-click / blur dismissal
 * - ARIA combobox/listbox/option attribute helpers
 *
 * @param {Object} opts
 * @param {string} opts.id           - Unique ID prefix for ARIA (e.g. "mv-search-{windowId}")
 * @param {Array}  opts.items        - Current result items (need .ticker at minimum)
 * @param {function} opts.onSelect   - Called with the selected item's ticker string
 * @param {number} [opts.minChars=2] - Minimum query length to show results
 */
export default function useCombobox({ id, items, onSelect, minChars = 2 }) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  const listboxId = `${id}-listbox`

  // Reset activeIndex when items change
  useEffect(() => {
    setActiveIndex(-1)
  }, [items])

  // Outside-click dismissal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Open the popup (called by consumer when query meets minChars)
  const open = useCallback(() => setIsOpen(true), [])

  // Close the popup
  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  // Keyboard handler — attach to onKeyDown of the input
  const handleKeyDown = useCallback(
    (e) => {
      const count = items.length

      if (e.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        return
      }

      if (!isOpen || count === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev < count - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : count - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < count) {
          onSelect(items[activeIndex].ticker)
          setIsOpen(false)
          setActiveIndex(-1)
        }
      }
    },
    [isOpen, items, activeIndex, onSelect]
  )

  // ARIA attributes for the <input> element
  const getInputProps = useCallback(
    () => ({
      role: 'combobox',
      'aria-expanded': isOpen,
      'aria-controls': listboxId,
      'aria-activedescendant':
        activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined,
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
    }),
    [isOpen, listboxId, id, activeIndex]
  )

  // ARIA attributes for the <div role="listbox"> container
  const getListboxProps = useCallback(
    () => ({
      role: 'listbox',
      id: listboxId,
    }),
    [listboxId]
  )

  // ARIA attributes for each option element
  const getOptionProps = useCallback(
    (index) => ({
      id: `${id}-option-${index}`,
      role: 'option',
      'aria-selected': index === activeIndex,
    }),
    [id, activeIndex]
  )

  return {
    activeIndex,
    isOpen,
    open,
    close,
    inputRef,
    wrapperRef,
    handleKeyDown,
    getInputProps,
    getListboxProps,
    getOptionProps,
  }
}
