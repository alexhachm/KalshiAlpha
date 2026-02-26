import React, { useState, useEffect, useCallback } from 'react'
import { Minus, Square, Maximize2, X } from 'lucide-react'
import './TitleBar.css'

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const api = window.electronAPI

  useEffect(() => {
    if (!api) return

    api.isMaximized().then(setIsMaximized)
    const unsubscribe = api.onMaximizeChange(setIsMaximized)
    return unsubscribe
  }, [api])

  const handleMinimize = useCallback(() => api?.minimize(), [api])
  const handleMaximize = useCallback(() => api?.maximize(), [api])
  const handleClose = useCallback(() => api?.close(), [api])

  if (!api) return null

  return (
    <div className="titlebar">
      <div className="titlebar-title">Kalshi Alpha</div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn--minimize"
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="titlebar-btn titlebar-btn--maximize"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Square size={12} /> : <Maximize2 size={14} />}
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default React.memo(TitleBar)
