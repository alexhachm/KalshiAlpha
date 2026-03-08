import { useRef, useEffect } from 'react'
import { trapFocus, getFocusableElements } from '../utils/dialogA11y'

/**
 * Hook for settings-dialog accessibility: Escape-to-close, focus trap,
 * initial focus on open, and focus restoration on close.
 *
 * Usage:
 *   const { dialogProps } = useDialogFocusTrap(isOpen, onClose, { ariaLabel: 'Settings' })
 *   return <div {...dialogProps}>{content}</div>
 *
 * @param {boolean} isOpen - Whether the dialog is currently open
 * @param {() => void} onClose - Callback to close the dialog
 * @param {object} [options]
 * @param {string} [options.ariaLabel] - Accessible label for the dialog
 * @param {string} [options.ariaLabelledBy] - ID of the element that labels the dialog
 * @param {'first'|'container'} [options.initialFocus='first'] - Where to place focus on open
 * @returns {{ dialogRef: React.RefObject, dialogProps: object }}
 */
export function useDialogFocusTrap(isOpen, onClose, options = {}) {
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement

    const dialog = dialogRef.current
    if (!dialog) return

    const { initialFocus = 'first' } = options
    if (initialFocus === 'first') {
      const focusable = getFocusableElements(dialog)
      if (focusable.length) {
        focusable[0].focus()
      } else {
        dialog.focus()
      }
    } else {
      dialog.focus()
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        trapFocus(e, dialog)
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  const dialogProps = {
    ref: dialogRef,
    role: 'dialog',
    'aria-modal': true,
    tabIndex: -1,
  }

  if (options.ariaLabel) dialogProps['aria-label'] = options.ariaLabel
  if (options.ariaLabelledBy) dialogProps['aria-labelledby'] = options.ariaLabelledBy

  return { dialogRef, dialogProps }
}
