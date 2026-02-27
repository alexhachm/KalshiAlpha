// SnapManager — singleton window position registry + edge-snapping logic
// Import: { register, unregister, update, calculateSnap, findMergeTarget }

const DEFAULT_SNAP_DISTANCE = 10
const TITLEBAR_HEIGHT = 32

// Active window positions: id -> { x, y, width, height }
const registry = new Map()

function register(id, rect) {
  registry.set(id, { ...rect })
}

function unregister(id) {
  registry.delete(id)
}

function update(id, rect) {
  registry.set(id, { ...rect })
}

function getRect(id) {
  return registry.get(id) || null
}

/**
 * Calculate snapped position for a window being dragged.
 * Checks screen edges and other window edges.
 * Returns { x, y, didSnapX, didSnapY }.
 */
function calculateSnap(id, x, y, width, height, snapDistance = DEFAULT_SNAP_DISTANCE) {
  let snappedX = x
  let snappedY = y
  let didSnapX = false
  let didSnapY = false

  // Screen edges
  const screenW = window.innerWidth
  const screenH = window.innerHeight

  // Snap to screen left
  if (!didSnapX && Math.abs(x) < snapDistance) {
    snappedX = 0
    didSnapX = true
  }
  // Snap to screen right
  if (!didSnapX && Math.abs(x + width - screenW) < snapDistance) {
    snappedX = screenW - width
    didSnapX = true
  }
  // Snap to screen top
  if (!didSnapY && Math.abs(y) < snapDistance) {
    snappedY = 0
    didSnapY = true
  }
  // Snap to screen bottom
  if (!didSnapY && Math.abs(y + height - screenH + TITLEBAR_HEIGHT) < snapDistance) {
    snappedY = screenH - TITLEBAR_HEIGHT - height
    didSnapY = true
  }

  // Snap to other window edges
  registry.forEach((rect, otherId) => {
    if (otherId === id) return

    const otherRight = rect.x + rect.width
    const otherBottom = rect.y + rect.height
    const right = snappedX + width
    const bottom = snappedY + height

    if (!didSnapX) {
      // Left edge → other right edge
      if (Math.abs(snappedX - otherRight) < snapDistance) {
        snappedX = otherRight
        didSnapX = true
      }
      // Right edge → other left edge
      else if (Math.abs(right - rect.x) < snapDistance) {
        snappedX = rect.x - width
        didSnapX = true
      }
      // Left edge → other left edge
      else if (Math.abs(snappedX - rect.x) < snapDistance) {
        snappedX = rect.x
        didSnapX = true
      }
      // Right edge → other right edge
      else if (Math.abs(right - otherRight) < snapDistance) {
        snappedX = otherRight - width
        didSnapX = true
      }
    }

    if (!didSnapY) {
      // Top edge → other bottom edge
      if (Math.abs(snappedY - otherBottom) < snapDistance) {
        snappedY = otherBottom
        didSnapY = true
      }
      // Bottom edge → other top edge
      else if (Math.abs(bottom - rect.y) < snapDistance) {
        snappedY = rect.y - height
        didSnapY = true
      }
      // Top edge → other top edge
      else if (Math.abs(snappedY - rect.y) < snapDistance) {
        snappedY = rect.y
        didSnapY = true
      }
      // Bottom edge → other bottom edge
      else if (Math.abs(bottom - otherBottom) < snapDistance) {
        snappedY = otherBottom - height
        didSnapY = true
      }
    }
  })

  return { x: snappedX, y: snappedY, didSnapX, didSnapY }
}

/**
 * Check if a dragged window's center-top overlaps another window's titlebar.
 * Used for merge detection on drag end.
 * Returns the target window id or null.
 */
function findMergeTarget(draggedId, dragX, dragY, dragWidth) {
  const centerX = dragX + dragWidth / 2
  let target = null

  registry.forEach((rect, otherId) => {
    if (otherId === draggedId || target) return

    if (
      centerX >= rect.x &&
      centerX <= rect.x + rect.width &&
      dragY >= rect.y &&
      dragY <= rect.y + TITLEBAR_HEIGHT
    ) {
      target = otherId
    }
  })

  return target
}

/**
 * Find the best open position for a new window of the given size.
 * Scans a grid of candidate positions and returns the first one
 * that doesn't overlap significantly with existing windows.
 */
function findOpenPosition(width, height) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const rects = Array.from(registry.values())

  // Scan candidate positions on a grid (step = half the window size for overlap detection)
  const stepX = Math.max(width, 100)
  const stepY = Math.max(height, 80)
  const cols = Math.max(1, Math.floor(vw / stepX))
  const rows = Math.max(1, Math.floor(vh / stepY))

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * stepX
      const cy = row * stepY

      // Check if this candidate overlaps any existing window
      const overlaps = rects.some((r) => {
        return (
          cx < r.x + r.width &&
          cx + width > r.x &&
          cy < r.y + r.height &&
          cy + height > r.y
        )
      })

      if (!overlaps) return { x: cx, y: cy }
    }
  }

  // All cells occupied — cascade from top-left with offset
  const offset = (rects.length % 10) * 30
  return { x: 50 + offset, y: 10 + offset }
}

export {
  register,
  unregister,
  update,
  getRect,
  calculateSnap,
  findMergeTarget,
  findOpenPosition,
  DEFAULT_SNAP_DISTANCE,
}
