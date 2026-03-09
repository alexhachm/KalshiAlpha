import React, { useEffect, useRef } from 'react'
import Shell from './components/Shell'
import TitleBar from './components/TitleBar'
import { subscribe as subscribeSettings, get as getSettings, subscribeSection } from './services/settingsStore'
import { useKalshiConnection } from './hooks/useKalshiConnection'

function App() {
  const { connected, status, applyConnectionSettings } = useKalshiConnection()
  const lastConnectionSignatureRef = useRef('')

  // Connection settings sync — reconnects WebSocket on changes
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

  // Trading + Notifications runtime sync — broadcasts changes to downstream consumers
  // Consumers can also read directly via getTrading()/getNotifications()/subscribeSection()
  useEffect(() => {
    const unsubTrading = subscribeSection('trading', (trading) => {
      window.dispatchEvent(new CustomEvent('settings:trading', { detail: trading }))
    })
    const unsubNotifications = subscribeSection('notifications', (notifications) => {
      window.dispatchEvent(new CustomEvent('settings:notifications', { detail: notifications }))
    })
    return () => {
      unsubTrading()
      unsubNotifications()
    }
  }, [])

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
