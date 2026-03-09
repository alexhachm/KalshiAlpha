import { useState, useEffect } from 'react'
import {
  getColorGroup,
  subscribeToGroupChanges,
  unsubscribeToGroupChanges,
} from '../services/linkBus'

/**
 * Reactively tracks the color group assigned to a window.
 * Re-renders when the window's group changes at runtime (e.g. color chip click).
 */
export default function useColorGroup(windowId) {
  const [colorId, setColorId] = useState(() => getColorGroup(windowId))

  useEffect(() => {
    // Sync in case assignment changed between render and effect
    setColorId(getColorGroup(windowId))

    const handleGroupChange = ({ windowId: changedId, colorId: newColorId }) => {
      if (changedId === windowId) {
        setColorId(newColorId)
      }
    }

    subscribeToGroupChanges(handleGroupChange)
    return () => unsubscribeToGroupChanges(handleGroupChange)
  }, [windowId])

  return colorId
}
