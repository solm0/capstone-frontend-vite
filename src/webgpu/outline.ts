import * as opentype from 'opentype.js'

export interface OutlinePoint {
  x: number
  y: number
  glyphId: number
  groupId: string
}

export interface GlyphOutline {
  points: OutlinePoint[]
  glyphId: number
  groupId: string
}

export function measureString(font: opentype.Font, chars: string, fontSize: number): number {
  const scale = fontSize / font.unitsPerEm
  let w = 0
  for (const ch of chars) {
    const g = font.charToGlyph(ch)
    w += (g?.advanceWidth ?? 0) * scale
  }
  return w
}

// Exported so TextCanvas can call it directly with an already-positioned path
export function sampleOpentypePath(
  path: opentype.Path,
  maxDist: number,
  glyphId: number,
  groupId: string,
): OutlinePoint[] {
  const allPoints: OutlinePoint[] = []
  let cx = 0, cy = 0
  let contourStart = { x: 0, y: 0 }

  for (const cmd of path.commands) {
    switch (cmd.type) {
      case 'M': {
        cx = cmd.x!; cy = cmd.y!
        contourStart = { x: cx, y: cy }
        allPoints.push({ x: cx, y: cy, glyphId, groupId })
        break
      }
      case 'L': {
        allPoints.push(...sampleLine(cx, cy, cmd.x!, cmd.y!, maxDist, glyphId, groupId))
        cx = cmd.x!; cy = cmd.y!
        break
      }
      case 'Q': {
        allPoints.push(...sampleQuadratic(cx, cy, cmd.x1!, cmd.y1!, cmd.x!, cmd.y!, maxDist, glyphId, groupId))
        cx = cmd.x!; cy = cmd.y!
        break
      }
      case 'C': {
        allPoints.push(...sampleCubic(cx, cy, cmd.x1!, cmd.y1!, cmd.x2!, cmd.y2!, cmd.x!, cmd.y!, maxDist, glyphId, groupId))
        cx = cmd.x!; cy = cmd.y!
        break
      }
      case 'Z': {
        allPoints.push(...sampleLine(cx, cy, contourStart.x, contourStart.y, maxDist, glyphId, groupId))
        cx = contourStart.x; cy = contourStart.y
        break
      }
    }
  }
  return allPoints
}

function sampleLine(
  x0: number, y0: number, x1: number, y1: number,
  maxDist: number, glyphId: number, groupId: string,
): OutlinePoint[] {
  const dx = x1 - x0, dy = y1 - y0
  const n = Math.max(1, Math.ceil(Math.sqrt(dx*dx + dy*dy) / maxDist))
  const pts: OutlinePoint[] = []
  for (let i = 1; i <= n; i++) {
    const t = i / n
    pts.push({ x: x0 + dx*t, y: y0 + dy*t, glyphId, groupId })
  }
  return pts
}

function sampleQuadratic(
  x0: number, y0: number, cx1: number, cy1: number, x1: number, y1: number,
  maxDist: number, glyphId: number, groupId: string,
): OutlinePoint[] {
  const chord = d(x0,y0,x1,y1), ctrl = d(x0,y0,cx1,cy1)+d(cx1,cy1,x1,y1)
  const n = Math.max(2, Math.ceil((chord+ctrl)/2/maxDist))
  const pts: OutlinePoint[] = []
  for (let i = 1; i <= n; i++) {
    const t = i/n, mt = 1-t
    pts.push({ x: mt*mt*x0+2*mt*t*cx1+t*t*x1, y: mt*mt*y0+2*mt*t*cy1+t*t*y1, glyphId, groupId })
  }
  return pts
}

function sampleCubic(
  x0: number, y0: number,
  cx1: number, cy1: number, cx2: number, cy2: number,
  x1: number, y1: number,
  maxDist: number, glyphId: number, groupId: string,
): OutlinePoint[] {
  const chord = d(x0,y0,x1,y1), ctrl = d(x0,y0,cx1,cy1)+d(cx1,cy1,cx2,cy2)+d(cx2,cy2,x1,y1)
  const n = Math.max(2, Math.ceil((chord+ctrl)/2/maxDist))
  const pts: OutlinePoint[] = []
  for (let i = 1; i <= n; i++) {
    const t = i/n, mt = 1-t
    pts.push({
      x: mt*mt*mt*x0+3*mt*mt*t*cx1+3*mt*t*t*cx2+t*t*t*x1,
      y: mt*mt*mt*y0+3*mt*mt*t*cy1+3*mt*t*t*cy2+t*t*t*y1,
      glyphId, groupId,
    })
  }
  return pts
}

function d(x0: number, y0: number, x1: number, y1: number) {
  return Math.sqrt((x1-x0)**2+(y1-y0)**2)
}