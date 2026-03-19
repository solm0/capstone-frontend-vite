import type { TextGroup } from './types'

// ── Spring constants ──────────────────────────────────────────────────────────

const STIFFNESS = 180
const DAMPING = 22
const MASS = 1

// ── Per-frame spring update ───────────────────────────────────────────────────

export function updateSprings(groups: TextGroup[], dt: number) {
  const dtClamped = Math.min(dt, 0.05) // cap at 50ms to avoid explosions

  for (const g of groups) {
    const s = g.spring

    // Spring force toward target
    const fx = -STIFFNESS * (s.x - s.targetX) - DAMPING * s.vx
    const fy = -STIFFNESS * (s.y - s.targetY) - DAMPING * s.vy

    s.vx += (fx / MASS) * dtClamped
    s.vy += (fy / MASS) * dtClamped
    s.x += s.vx * dtClamped
    s.y += s.vy * dtClamped

    // Snap to rest when very close
    if (
      Math.abs(s.x - s.targetX) < 0.01 &&
      Math.abs(s.y - s.targetY) < 0.01 &&
      Math.abs(s.vx) < 0.01 &&
      Math.abs(s.vy) < 0.01
    ) {
      s.x = s.targetX
      s.y = s.targetY
      s.vx = 0
      s.vy = 0
    }
  }
}

// ── Hover targets ─────────────────────────────────────────────────────────────

/**
 * Sets spring targets so hovered group stays put and
 * non-hovered groups scatter away from it.
 */
export function setHoverTargets(
  groups: TextGroup[],
  hoveredId: string | null,
  scatterDist = 18,
) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    if (!hoveredId || g.id === hoveredId) {
      g.spring.targetX = 0
      g.spring.targetY = 0
    } else {
      // Scatter direction: left groups go left, right groups go right
      const hovIdx = groups.findIndex(x => x.id === hoveredId)
      const dir = i < hovIdx ? -1 : 1
      g.spring.targetX = dir * scatterDist
      g.spring.targetY = 0
    }
  }
}

// ── Hit testing ───────────────────────────────────────────────────────────────

/**
 * Returns the first group whose silhouette circles contain (mx, my).
 * Uses same circle data GPU renders — guaranteed pixel-perfect match.
 */
export function hitTest(
  groups: TextGroup[],
  mx: number,
  my: number,
): TextGroup | null {
  for (const g of groups) {
    const ox = g.spring.x
    const oy = g.spring.y
    for (const c of g.circles) {
      const dx = mx - (c.cx + ox)
      const dy = my - (c.cy + oy)
      if (dx * dx + dy * dy <= c.r * c.r) {
        return g
      }
    }
  }
  return null
}