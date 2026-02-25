import React, { useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import './Window.css'

const MIN_WIDTH = 200
const MIN_HEIGHT = 150

function Window({
  id,
  title,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  zIndex,
  onClose,
  onFocus,
  children,
}) {
  const windowRef = useRef(null)
  const posRef = useRef({ x: initialX, y: initialY })
  const sizeRef = useRef({ width: initialWidth, height: initialHeight })
  const [, rerender] = useState(0)

  const handleMouseDown = () => {
    onFocus(id)
  }

  const handleTitleBarMouseDown = useCallback(
    (e) => {
      if (e.target.closest('.window-controls')) return
      e.preventDefault()
      onFocus(id)

      const startX = e.clientX
      const startY = e.clientY
      const origX = posRef.current.x
      const origY = posRef.current.y

      const onMove = (e) => {
        const newX = origX + (e.clientX - startX)
        const newY = Math.max(0, origY + (e.clientY - startY))
        posRef.current = { x: newX, y: newY }
        if (windowRef.current) {
          windowRef.current.style.left = newX + 'px'
          windowRef.current.style.top = newY + 'px'
        }
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        rerender((n) => n + 1)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [id, onFocus]
  )

  const handleResizeMouseDown = useCallback(
    (e, direction) => {
      e.preventDefault()
      e.stopPropagation()
      onFocus(id)

      const startX = e.clientX
      const startY = e.clientY
      const origPos = { ...posRef.current }
      const origSize = { ...sizeRef.current }

      const onMove = (e) => {
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        let { x, y } = origPos
        let { width, height } = origSize

        if (direction.includes('e')) {
          width = Math.max(MIN_WIDTH, origSize.width + dx)
        }
        if (direction.includes('s')) {
          height = Math.max(MIN_HEIGHT, origSize.height + dy)
        }
        if (direction.includes('w')) {
          const newWidth = Math.max(MIN_WIDTH, origSize.width - dx)
          x = origPos.x + origSize.width - newWidth
          width = newWidth
        }
        if (direction.includes('n')) {
          const newHeight = Math.max(MIN_HEIGHT, origSize.height - dy)
          y = Math.max(0, origPos.y + origSize.height - newHeight)
          height = newHeight
        }

        posRef.current = { x, y }
        sizeRef.current = { width, height }

        if (windowRef.current) {
          windowRef.current.style.left = x + 'px'
          windowRef.current.style.top = y + 'px'
          windowRef.current.style.width = width + 'px'
          windowRef.current.style.height = height + 'px'
        }
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        rerender((n) => n + 1)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [id, onFocus]
  )

  return (
    <div
      ref={windowRef}
      className="window"
      style={{
        left: posRef.current.x,
        top: posRef.current.y,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
        zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-titlebar" onMouseDown={handleTitleBarMouseDown}>
        <div className="window-color-chip-slot" />
        <span className="window-title">{title}</span>
        <div className="window-controls">
          <button
            className="window-close-btn"
            onClick={() => onClose(id)}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="window-body">{children}</div>
      {/* Resize handles: edges */}
      <div
        className="resize-handle resize-n"
        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
      />
      <div
        className="resize-handle resize-s"
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
      />
      <div
        className="resize-handle resize-e"
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
      />
      <div
        className="resize-handle resize-w"
        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
      />
      {/* Resize handles: corners */}
      <div
        className="resize-handle resize-ne"
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
      />
      <div
        className="resize-handle resize-nw"
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
      />
      <div
        className="resize-handle resize-se"
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />
      <div
        className="resize-handle resize-sw"
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
      />
    </div>
  )
}

export default React.memo(Window)
