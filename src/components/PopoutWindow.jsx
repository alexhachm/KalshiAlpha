import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * PopoutWindow — renders children into a detached browser window via portal.
 * Copies parent page styles so components look identical.
 * Calls onClose when the popup is closed by the user.
 */
function PopoutWindow({ title, width = 600, height = 400, onClose, children }) {
  const [container, setContainer] = useState(null)
  const popoutRef = useRef(null)
  const closedByEffect = useRef(false)

  useEffect(() => {
    const left = (window.screen.availWidth - width) / 2 + (window.screen.availLeft || 0)
    const top = (window.screen.availHeight - height) / 2 + (window.screen.availTop || 0)

    const w = window.open(
      '',
      '',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no`
    )

    if (!w) {
      // Popup blocked by browser
      onClose()
      return
    }

    popoutRef.current = w
    w.document.title = title || 'KalshiAlpha'

    // Copy all stylesheets from the parent document
    Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach((node) => {
      w.document.head.appendChild(node.cloneNode(true))
    })

    // Copy CSS custom properties from :root
    const rootStyles = getComputedStyle(document.documentElement)
    const cssVars = []
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i]
      if (prop.startsWith('--')) {
        cssVars.push(`${prop}: ${rootStyles.getPropertyValue(prop)};`)
      }
    }
    if (cssVars.length > 0) {
      const varStyle = w.document.createElement('style')
      varStyle.textContent = `:root { ${cssVars.join(' ')} }`
      w.document.head.appendChild(varStyle)
    }

    // Body styles
    w.document.body.style.margin = '0'
    w.document.body.style.padding = '0'
    w.document.body.style.backgroundColor = '#121212'
    w.document.body.style.color = '#e0e0e0'
    w.document.body.style.fontFamily = "'Inter', system-ui, sans-serif"
    w.document.body.style.overflow = 'hidden'

    // Create mount point
    const div = w.document.createElement('div')
    div.id = 'popout-root'
    div.style.width = '100%'
    div.style.height = '100vh'
    div.style.display = 'flex'
    div.style.flexDirection = 'column'
    div.style.background = 'var(--bg-secondary)'
    w.document.body.appendChild(div)

    setContainer(div)

    // Handle popup close by user
    const handleUnload = () => {
      if (!closedByEffect.current) {
        onClose()
      }
    }
    w.addEventListener('beforeunload', handleUnload)

    return () => {
      closedByEffect.current = true
      if (popoutRef.current && !popoutRef.current.closed) {
        popoutRef.current.close()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!container) return null
  return createPortal(children, container)
}

export default PopoutWindow
