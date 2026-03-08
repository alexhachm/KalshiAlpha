import { useState, useEffect, useCallback, useRef } from 'react'
import * as dataFeed from '../services/dataFeed'
import { get as getSettings } from '../services/settingsStore'

const DEFAULT_CONNECTION_SETTINGS = {
  apiKey: '',
  apiKeyId: '',
  privateKeyPem: '',
  paperMode: true,
  wsUrl: '',
  wsReconnectInterval: 5,
  wsMaxRetries: 10,
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function normalizeConnectionSettings(raw = {}) {
  return {
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
    apiKeyId: typeof raw.apiKeyId === 'string' ? raw.apiKeyId : '',
    privateKeyPem: typeof raw.privateKeyPem === 'string' ? raw.privateKeyPem : '',
    paperMode: raw.paperMode !== false,
    wsUrl: typeof raw.wsUrl === 'string' ? raw.wsUrl.trim() : '',
    wsReconnectInterval: clampInt(raw.wsReconnectInterval, 5, 1, 60),
    wsMaxRetries: clampInt(raw.wsMaxRetries, 10, 0, 100),
  }
}

function parseApiKeyBlob(apiKey = '') {
  if (typeof apiKey !== 'string') {
    return { apiKeyId: '', privateKeyPem: '' }
  }

  const trimmed = apiKey.trim()
  if (!trimmed) return { apiKeyId: '', privateKeyPem: '' }

  // Allow pasting JSON blobs from external secret managers.
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') {
      return {
        apiKeyId: String(parsed.apiKeyId || parsed.keyId || parsed.key_id || '').trim(),
        privateKeyPem: String(parsed.privateKeyPem || parsed.privateKey || parsed.pem || '').trim(),
      }
    }
  } catch {
    // Not JSON; continue to plaintext parsing.
  }

  const pemMatch = trimmed.match(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*-----END [^-]*PRIVATE KEY-----/)
  if (!pemMatch) return { apiKeyId: '', privateKeyPem: '' }

  const privateKeyPem = pemMatch[0].trim()
  const apiKeyId = trimmed.replace(privateKeyPem, '').trim()

  return {
    apiKeyId,
    privateKeyPem,
  }
}

function extractCredentials(connectionSettings = {}) {
  const normalized = normalizeConnectionSettings(connectionSettings)
  let apiKeyId = normalized.apiKeyId.trim()
  let privateKeyPem = normalized.privateKeyPem.trim()

  if (!apiKeyId || !privateKeyPem) {
    const parsedFromApiKey = parseApiKeyBlob(normalized.apiKey)
    if (!apiKeyId) apiKeyId = parsedFromApiKey.apiKeyId
    if (!privateKeyPem) privateKeyPem = parsedFromApiKey.privateKeyPem
  }

  return { apiKeyId, privateKeyPem }
}

function loadSavedConnectionSettings() {
  try {
    return normalizeConnectionSettings(getSettings()?.connection || {})
  } catch {
    return { ...DEFAULT_CONNECTION_SETTINGS }
  }
}

function toInitializeOptions(connectionSettings) {
  const normalized = normalizeConnectionSettings(connectionSettings)
  const credentials = extractCredentials(normalized)
  return {
    apiKey: normalized.apiKey,
    apiKeyId: credentials.apiKeyId,
    privateKeyPem: credentials.privateKeyPem,
    paperMode: normalized.paperMode,
    environment: normalized.paperMode ? 'demo' : 'production',
    wsUrl: normalized.wsUrl,
    wsReconnectInterval: normalized.wsReconnectInterval,
    wsMaxRetries: normalized.wsMaxRetries,
  }
}

export function useKalshiConnection() {
  const [connected, setConnected] = useState(dataFeed.isConnected())
  const [status, setStatus] = useState(() => {
    if (typeof dataFeed.getConnectionStatus === 'function') {
      return dataFeed.getConnectionStatus()
    }
    return dataFeed.isConnected() ? 'connected' : 'mock'
  })
  const lastSignatureRef = useRef('')

  useEffect(() => {
    const unsubConnected = dataFeed.onConnectionChange((isConn) => {
      setConnected(isConn)
    })
    const unsubStatus = dataFeed.onConnectionStatusChange((nextStatus) => {
      setStatus(nextStatus)
    })
    return () => {
      unsubConnected()
      unsubStatus()
    }
  }, [])

  const applyConnectionSettings = useCallback(async (connectionSettings = {}) => {
    const normalized = normalizeConnectionSettings(connectionSettings)
    const nextSignature = JSON.stringify(normalized)
    if (nextSignature === lastSignatureRef.current) return
    lastSignatureRef.current = nextSignature
    await dataFeed.initialize(toInitializeOptions(normalized))
  }, [])

  const initializeFromSavedSettings = useCallback(async () => {
    await applyConnectionSettings(loadSavedConnectionSettings())
  }, [applyConnectionSettings])

  const initialize = useCallback(async (opts) => {
    lastSignatureRef.current = ''
    await dataFeed.initialize(opts)
  }, [])

  const disconnect = useCallback(() => {
    dataFeed.disconnectFeed()
  }, [])

  return {
    connected,
    status,
    initialize,
    disconnect,
    initializeFromSavedSettings,
    applyConnectionSettings,
    loadSavedConnectionSettings,
  }
}

export { loadSavedConnectionSettings, normalizeConnectionSettings, toInitializeOptions }
