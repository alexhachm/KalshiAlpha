import React, { useEffect, useRef } from 'react'
import Shell from './components/Shell'
import TitleBar from './components/TitleBar'
import { subscribe as subscribeSettings, get as getSettings } from './services/settingsStore'
import { useKalshiConnection } from './hooks/useKalshiConnection'

function App() {
  const { connected, status, applyConnectionSettings } = useKalshiConnection()
  const lastConnectionSignatureRef = useRef('')

  useEffect(() => {
    let debounceTimer = null
    let isMounted = true

    const syncConnectionSettings = (settings) => {
      const connection = settings?.connection || {}
      const nextSignature = JSON.stringify(connection)
      if (nextSignature === lastConnectionSignatureRef.current) return

      lastConnectionSignatureRef.current = nextSignature
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (!isMounted) return
        applyConnectionSettings(connection).catch((err) => {
          console.error('[App] Failed to apply connection settings:', err)
        })
      }, 200)
    }

    syncConnectionSettings(getSettings())
    const unsubscribe = subscribeSettings(syncConnectionSettings)

    return () => {
      isMounted = false
      clearTimeout(debounceTimer)
      unsubscribe()
    }
  }, [applyConnectionSettings])

  return (
    <>
      <TitleBar />
      <Shell
        connected={connected}
        connectionStatus={status}
      />
    </>
  )
}

export default App
