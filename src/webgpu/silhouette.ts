import ClipperLib from 'clipper-lib'
// @ts-ignore
import hull from 'hull.js'
import earcut from 'earcut'
import type { OutlinePoint } from './outline'

const CLIPPER_SCALE = 100
const CIRCLE_STEPS  = 48

export interface SilhouetteMesh {
  vertices: Float32Array<ArrayBuffer>
  indices:  Uint32Array<ArrayBuffer>
}

export interface SilhouetteDebug {
  offsetPolygons: { groupId: string; pts: [number, number][] }[]
  hullPoints:     { pt: [number, number]; groupId: string }[]
  arcEdges:       { A: [number, number]; B: [number, number]; cx: number; cy: number; r: number }[]
  directEdges:    { pts: [number, number][] }[]
  finalPath:      [number, number][]
}

export function buildCombinedSilhouette(
  pointsByGroup: Map<string, OutlinePoint[]>,
  offsetDist: number,
  arcRadiusRatio: number,
  offsetsByGroup?: Map<string, { x: number; y: number }>,
): { mesh: SilhouetteMesh; debug: SilhouetteDebug } {

  const empty = (): ReturnType<typeof buildCombinedSilhouette> => ({
    mesh:  { vertices: new Float32Array(new ArrayBuffer(0)), indices: new Uint32Array(new ArrayBuffer(0)) },
    debug: { offsetPolygons: [], hullPoints: [], arcEdges: [], directEdges: [], finalPath: [] },
  })

  // 1. Offset each group outline
  const offsetPolygons = new Map<string, [number, number][]>()
  const debugOffsetPolys: SilhouetteDebug['offsetPolygons'] = []

  for (const [groupId, pts] of pointsByGroup) {
    if (pts.length < 3) continue
    const sp  = offsetsByGroup?.get(groupId) ?? { x: 0, y: 0 }
    const raw = pts.map(p => [p.x + sp.x, p.y + sp.y] as [number, number])
    const expanded = offsetPolygonYFlipped(raw, offsetDist)
    offsetPolygons.set(groupId, expanded)
    debugOffsetPolys.push({ groupId, pts: expanded })
  }

  if (offsetPolygons.size === 0) return empty()

  // 2. All tagged offset vertices
  const tagged: { pt: [number, number]; groupId: string }[] = []
  for (const [groupId, poly] of offsetPolygons) {
    for (const pt of poly) tagged.push({ pt, groupId })
  }
  if (tagged.length < 3) return empty()

  // 3. Concave hull — same logic as working version
  const allY = tagged.map(t => t.pt[1])
  const spanY = Math.max(...allY) - Math.min(...allY)
  const concavity = spanY * 0.6

  const rawHull = hull(tagged.map(t => t.pt), concavity) as [number, number][]

  const hullTagged = rawHull.map((hpt): { pt: [number, number]; groupId: string } => {
    let bestD = Infinity, bestGroupId = tagged[0].groupId
    for (const t of tagged) {
      const d = dist2(hpt, t.pt)
      if (d < bestD) { bestD = d; bestGroupId = t.groupId }
    }
    return { pt: hpt, groupId: bestGroupId }
  })

  // 4. Centroid
  const centroid = {
    x: tagged.reduce((s, t) => s + t.pt[0], 0) / tagged.length,
    y: tagged.reduce((s, t) => s + t.pt[1], 0) / tagged.length,
  }

  // 5. Find cross-group bridge circles (same hull traversal as working version)
  const arcEdges: SilhouetteDebug['arcEdges'] = []
  const bridgeCircles: [number, number][][] = []
  const n = hullTagged.length

  for (let i = 0; i < n; i++) {
    const A = hullTagged[i]
    const B = hullTagged[(i + 1) % n]

    if (A.groupId !== B.groupId) {
      const chord = Math.sqrt(dist2(A.pt, B.pt))
      // r = half chord: circle center is midpoint, edges touch A and B exactly
      // arcRadiusRatio > 0.5 makes a larger circle (rounder bridge)
      const r = Math.max(chord * 0.5 * arcRadiusRatio * 2, chord * 0.501)
      const center = outerArcCenter(A.pt, B.pt, r, centroid)
      arcEdges.push({ A: A.pt, B: B.pt, cx: center.x, cy: center.y, r })
      bridgeCircles.push(circlePolygon(center.x, center.y, r, CIRCLE_STEPS))
    }
  }

  // 6. Clipper UNION: offset polygons + bridge circles
  // All in y-flipped space so clipper offset direction is correct
  const toC = (pts: [number, number][]) =>
    pts.map(([x, y]) => ({ X: Math.round(x * CLIPPER_SCALE), Y: Math.round(-y * CLIPPER_SCALE) }))
  const fromC = (pts: { X: number; Y: number }[]): [number, number][] =>
    pts.map(p => [p.X / CLIPPER_SCALE, -p.Y / CLIPPER_SCALE])

  // Step A: fill the convex hull of all groups as base shape
  // This covers the gaps between groups
  const hullPoly = hullTagged.map(h => h.pt)
  const hullUnion: { X: number; Y: number }[][] = []
  const hullClipper = new ClipperLib.Clipper()
  // Add convex hull as subject
  hullClipper.AddPath(toC(hullPoly), ClipperLib.PolyType.ptSubject, true)
  // Also add each offset polygon so their rounded edges are preserved
  for (const poly of offsetPolygons.values()) {
    hullClipper.AddPath(toC(poly), ClipperLib.PolyType.ptClip, true)
  }
  hullClipper.Execute(
    ClipperLib.ClipType.ctUnion, hullUnion,
    ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero,
  )
  if (hullUnion.length === 0) return empty()

  // Step B: subtract bridge circles (positioned OUTSIDE the text)
  // Each circle's inner arc carves a concave curve between adjacent groups
  const solution: { X: number; Y: number }[][] = []
  if (bridgeCircles.length > 0) {
    const diffClipper = new ClipperLib.Clipper()
    for (const poly of hullUnion) {
      diffClipper.AddPath(poly, ClipperLib.PolyType.ptSubject, true)
    }
    for (const circle of bridgeCircles) {
      diffClipper.AddPath(toC(circle), ClipperLib.PolyType.ptClip, true)
    }
    diffClipper.Execute(
      ClipperLib.ClipType.ctDifference, solution,
      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero,
    )
  }
  if (solution.length === 0) {
    solution.push(...hullUnion)
  }

  if (solution.length === 0) return empty()

  // Take the outer boundary (largest area polygon)
  const outer = solution.reduce((best, poly) =>
    Math.abs(ClipperLib.Clipper.Area(poly)) > Math.abs(ClipperLib.Clipper.Area(best)) ? poly : best
  )

  const finalPath = fromC(outer)

  // Ensure CCW-math winding for earcut
  const area = signedArea(finalPath)
  const oriented = area > 0 ? finalPath : [...finalPath].reverse()

  return {
    mesh: tessellate(oriented),
    debug: {
      offsetPolygons: debugOffsetPolys,
      hullPoints: hullTagged,
      arcEdges,
      directEdges: [],
      finalPath: oriented,
    },
  }
}

// ── Polygon offset with y-flip ────────────────────────────────────────────────

function offsetPolygonYFlipped(pts: [number, number][], amount: number): [number, number][] {
  const scaled = pts.map(([x, y]) => ({
    X: Math.round(x * CLIPPER_SCALE),
    Y: Math.round(-y * CLIPPER_SCALE),
  }))
  const co = new ClipperLib.ClipperOffset()
  co.AddPath(scaled, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
  const result: { X: number; Y: number }[][] = []
  co.Execute(result, amount * CLIPPER_SCALE)
  if (!result.length) return pts
  return result[0].map(p => [p.X / CLIPPER_SCALE, -p.Y / CLIPPER_SCALE])
}

// ── Outer arc center ──────────────────────────────────────────────────────────

function outerArcCenter(
  A: [number, number], B: [number, number],
  r: number,
  centroid: { x: number; y: number },
): { x: number; y: number } {
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2
  const dx = B[0] - A[0], dy = B[1] - A[1]
  const len = Math.sqrt(dx * dx + dy * dy)
  const halfChord = len / 2
  const safeR = Math.max(r, halfChord * 1.001)
  const px = -dy / len, py = dx / len
  const h  = Math.sqrt(safeR * safeR - halfChord * halfChord)
  const c1 = { x: mx + px * h, y: my + py * h }
  const c2 = { x: mx - px * h, y: my - py * h }
  // Pick center FARTHER from text centroid = outside the text
  return dist2([c1.x,c1.y],[centroid.x,centroid.y]) > dist2([c2.x,c2.y],[centroid.x,centroid.y]) ? c1 : c2
}

// ── Circle polygon ────────────────────────────────────────────────────────────

function circlePolygon(cx: number, cy: number, r: number, steps: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

// ── Tessellate ────────────────────────────────────────────────────────────────

function tessellate(path: [number, number][]): SilhouetteMesh {
  const flat     = path.flatMap(([x, y]) => [x, y])
  const idxArray = earcut(flat, undefined, 2)
  const vBuf = new ArrayBuffer(flat.length * 4)
  const iBuf = new ArrayBuffer(idxArray.length * 4)
  const vertices = new Float32Array(vBuf)
  const indices  = new Uint32Array(iBuf)
  flat.forEach((v, i) => { vertices[i] = v })
  idxArray.forEach((v: number, i: number) => { indices[i] = v })
  return { vertices, indices }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function signedArea(pts: [number, number][]): number {
  let a = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n]
    a += x0 * y1 - x1 * y0
  }
  return a / 2
}

function dist2(a: [number, number], b: [number, number]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
}