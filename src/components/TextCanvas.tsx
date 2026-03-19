import { useEffect, useRef, useCallback, useState } from 'react'
import * as opentype from 'opentype.js'
import { loadAtlas } from '../webgpu/atlas'
import { sampleOpentypePath } from '../webgpu/outline'
import { buildCombinedSilhouette } from '../webgpu/silhouette'
import { TextRenderer } from '../webgpu/renderer'
import { updateSprings, setHoverTargets } from '../webgpu/physics'
import type { TextGroup, GlyphInstance } from '../webgpu/types'
import type { SilhouetteDebug } from '../webgpu/silhouette'
import type { OutlinePoint } from '../webgpu/outline'

// ── Config ────────────────────────────────────────────────────────────────────

const FONT_URL   = '/assets/fonts/xtypewriter.ttf'
const ATLAS_JSON = '/assets/fonts/atlas.json'
const ATLAS_PNG  = '/assets/fonts/atlas.png'

const FONT_SIZE   = 96
const OFFSET_DIST = 14
const ARC_RATIO   = 0.8

const SILHOUETTE_COLOR: [number,number,number,number] = [0.85, 0.85, 0.85, 1]
const COMBINED_ID = '__sil__'

const GROUP_DEFS = [
  { id: 'prefix', chars: 'сме' },
  { id: 'root',   chars: 'мерт' },
  { id: 'suffix', chars: 'меь' },
]

const DEBUG_COLORS: Record<string, string> = {
  prefix: '#e03050', root: '#0077ee', suffix: '#00aa55',
}

// ── Static scene ──────────────────────────────────────────────────────────────

interface SceneData {
  groups: TextGroup[]
  pointsByGroup: Map<string, OutlinePoint[]>
}

async function buildScene(
  font: opentype.Font,
  glyphMap: Map<string, any>,
  atlasScale: number,
): Promise<SceneData> {
  const baselineY = FONT_SIZE + 40
  const groupGap  = FONT_SIZE * 0.15
  const otScale   = FONT_SIZE / font.unitsPerEm

  let cursorX = 40
  const groups: TextGroup[]               = []
  const pointsByGroup = new Map<string, OutlinePoint[]>()

  for (const def of GROUP_DEFS) {
    const glyphs:   GlyphInstance[] = []
    const groupPts: OutlinePoint[]  = []
    let gc = cursorX

    for (let ci = 0; ci < def.chars.length; ci++) {
      const ch      = def.chars[ci]
      const otGlyph = font.charToGlyph(ch)
      const info    = glyphMap.get(ch)
      if (!otGlyph) continue

      const path = otGlyph.getPath(gc, baselineY, FONT_SIZE)
      groupPts.push(...sampleOpentypePath(path, 2, ci, def.id))

      if (info) {
        glyphs.push({ char: ch, x: gc, y: baselineY, glyphId: ci, groupId: def.id })
      }

      gc += (otGlyph.advanceWidth ?? 0) * otScale
    }

    pointsByGroup.set(def.id, groupPts)
    groups.push({
      id: def.id, chars: def.chars, glyphs, circles: [],
      spring: { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 },
      hovered: false,
      onClick:  () => console.log('clicked:', def.id),
      onHover:  (h: boolean) => console.log('hover:', def.id, h),
    })

    cursorX = gc + groupGap
  }

  return { groups, pointsByGroup }
}

// ── Hit test — point-in-polygon on finalPath ──────────────────────────────────

function pointInPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function hitTest(
  groups: TextGroup[],
  mx: number,
  my: number,
  finalPath: [number, number][],
  font: opentype.Font,
): TextGroup | null {
  if (finalPath.length > 0 && !pointInPolygon(mx, my, finalPath)) return null

  // Find the closest glyph's group
  const otScale = FONT_SIZE / font.unitsPerEm
  let closest: TextGroup | null = null
  let closestDist = Infinity

  for (const g of groups) {
    const ox = g.spring.x, oy = g.spring.y
    for (const gi of g.glyphs) {
      const otGlyph = font.charToGlyph(gi.char)
      if (!otGlyph) continue
      const bb = otGlyph.getBoundingBox()
      const cx = gi.x + ox + (bb.x2 - bb.x1) * otScale * 0.5
      const cy = gi.y + oy - (bb.y2 - bb.y1) * otScale * 0.5
      const d  = (mx - cx) ** 2 + (my - cy) ** 2
      if (d < closestDist) { closestDist = d; closest = g }
    }
  }
  return closest
}

// ── Debug overlay ─────────────────────────────────────────────────────────────

function drawDebug(ctx: CanvasRenderingContext2D, debug: SilhouetteDebug) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  for (const poly of debug.offsetPolygons) {
    const color = DEBUG_COLORS[poly.groupId] ?? '#888'
    ctx.strokeStyle = color + '88'; ctx.lineWidth = 1; ctx.setLineDash([3, 2])
    ctx.beginPath()
    poly.pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([])
  }

  for (const { pt, groupId } of debug.hullPoints) {
    ctx.fillStyle = DEBUG_COLORS[groupId] ?? '#333'
    ctx.fillRect(pt[0]-3, pt[1]-3, 6, 6)
  }

  for (const arc of debug.arcEdges) {
    const angA = Math.atan2(arc.A[1]-arc.cy, arc.A[0]-arc.cx)
    const angB = Math.atan2(arc.B[1]-arc.cy, arc.B[0]-arc.cx)
    ctx.fillStyle = '#ff6600'
    ctx.beginPath(); ctx.arc(arc.cx, arc.cy, 4, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = '#ff660022'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(arc.cx, arc.cy, arc.r, 0, Math.PI*2); ctx.stroke()
    ctx.strokeStyle = '#ff6600cc'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(arc.cx, arc.cy, arc.r, angA, angB, false); ctx.stroke()
  }

  if (debug.finalPath.length > 1) {
    ctx.strokeStyle = '#000a'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3])
    ctx.beginPath()
    debug.finalPath.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([])
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TextCanvas() {
  const gpuCanvasRef = useRef<HTMLCanvasElement>(null)
  const dbgCanvasRef = useRef<HTMLCanvasElement>(null)
  const [debugOn, setDebugOn] = useState(false)

  const rendererRef      = useRef<TextRenderer | null>(null)
  const groupsRef        = useRef<TextGroup[]>([])
  const fontRef          = useRef<opentype.Font | null>(null)
  const glyphMapRef      = useRef<Map<string, any>>(new Map())
  const atlasScaleRef    = useRef(1)
  const pointsByGroupRef = useRef<Map<string, OutlinePoint[]>>(new Map())
  const finalPathRef     = useRef<[number, number][]>([])
  const hoveredIdRef     = useRef<string | null>(null)
  const lastTimeRef      = useRef(0)
  const rafRef           = useRef(0)
  const debugOnRef       = useRef(debugOn)
  debugOnRef.current     = debugOn

  useEffect(() => {
    const gpuCanvas = gpuCanvasRef.current!
    let destroyed   = false

    async function init() {
      if (!navigator.gpu) { console.error('WebGPU not supported'); return }
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) { console.error('No GPU adapter'); return }
      const device  = await adapter.requestDevice()
      const format  = navigator.gpu.getPreferredCanvasFormat()
      const ctx     = gpuCanvas.getContext('webgpu') as GPUCanvasContext
      ctx.configure({ device, format, alphaMode: 'premultiplied' })

      const [font, atlas] = await Promise.all([
        opentype.load(FONT_URL),
        loadAtlas(device, ATLAS_JSON, ATLAS_PNG),
      ])

      fontRef.current       = font
      glyphMapRef.current   = atlas.glyphMap
      atlasScaleRef.current = FONT_SIZE / atlas.infoSize

      const { groups, pointsByGroup } = await buildScene(font, atlas.glyphMap, atlasScaleRef.current)
      groupsRef.current        = groups
      pointsByGroupRef.current = pointsByGroup

      if (destroyed) return

      const renderer = new TextRenderer(device, ctx, atlas, format)
      renderer.setScale(atlasScaleRef.current)
      rendererRef.current = renderer

      renderer.uploadGlyphs(groups, atlasScaleRef.current)

      function frame(ts: number) {
        if (destroyed) return
        const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
        lastTimeRef.current = ts

        updateSprings(groupsRef.current, dt)

        const offsets = new Map(groupsRef.current.map(g => [g.id, { x: g.spring.x, y: g.spring.y }]))
        const { mesh, debug } = buildCombinedSilhouette(
          pointsByGroupRef.current, OFFSET_DIST, ARC_RATIO, offsets,
        )

        // Update finalPath for hit testing
        finalPathRef.current = debug.finalPath

        renderer.uploadGroupMesh(COMBINED_ID, mesh, SILHOUETTE_COLOR)
        renderer.updateOffsets(groupsRef.current)
        renderer.render()

        const dbgCtx = dbgCanvasRef.current?.getContext('2d')
        if (dbgCtx) {
          if (debugOnRef.current) drawDebug(dbgCtx, debug)
          else dbgCtx.clearRect(0, 0, dbgCanvasRef.current!.width, dbgCanvasRef.current!.height)
        }

        rafRef.current = requestAnimationFrame(frame)
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    init()
    return () => {
      destroyed = true
      cancelAnimationFrame(rafRef.current)
      rendererRef.current?.destroy()
    }
  }, [])

  const toCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return {
      mx: (e.clientX - r.left) * (gpuCanvasRef.current!.width  / r.width),
      my: (e.clientY - r.top)  * (gpuCanvasRef.current!.height / r.height),
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!fontRef.current) return
    const { mx, my } = toCanvas(e)
    const hit   = hitTest(groupsRef.current, mx, my, finalPathRef.current, fontRef.current)
    const newId = hit?.id ?? null
    if (newId !== hoveredIdRef.current) {
      for (const g of groupsRef.current) {
        const now = g.id === newId
        if (g.hovered !== now) { g.hovered = now; g.onHover?.(now) }
      }
      hoveredIdRef.current = newId
      setHoverTargets(groupsRef.current, newId, FONT_SIZE * 0.3)
    }
    ;(e.target as HTMLCanvasElement).style.cursor = newId ? 'pointer' : 'default'
  }, [])

  const handleMouseLeave = useCallback(() => {
    for (const g of groupsRef.current) if (g.hovered) { g.hovered = false; g.onHover?.(false) }
    hoveredIdRef.current = null
    setHoverTargets(groupsRef.current, null)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!fontRef.current) return
    const { mx, my } = toCanvas(e)
    hitTest(groupsRef.current, mx, my, finalPathRef.current, fontRef.current)?.onClick?.()
  }, [])

  return (
    <div className="relative inline-block">
      <canvas ref={gpuCanvasRef} width={900} height={320}
        className="block w-full h-auto"
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleClick}
      />
      <canvas ref={dbgCanvasRef} width={900} height={320}
        className="absolute inset-0 w-full h-auto pointer-events-none"
      />
      <button
        className="absolute top-2 right-2 px-2 py-1 text-xs font-mono bg-black/60 text-white rounded"
        onClick={() => setDebugOn(d => !d)}
      >
        {debugOn ? 'hide debug' : 'show debug'}
      </button>
    </div>
  )
}