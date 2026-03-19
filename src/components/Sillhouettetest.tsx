/**
 * SilhouetteTest — pure Canvas 2D diagnostic component
 * No WebGPU, no atlas, no renderer.
 * Just: opentype outlines → silhouette path → Canvas 2D fill
 * This isolates correctness of outline/silhouette logic completely.
 */
import { useEffect, useRef } from 'react'
import * as opentype from 'opentype.js'
import { sampleOpentypePath } from '../webgpu/outline'
import { buildCombinedSilhouette } from '../webgpu/silhouette'
import type { OutlinePoint } from '../webgpu/outline'

const FONT_URL  = '/assets/fonts/xtypewriter.ttf'
const FONT_SIZE = 96
const OFFSET    = 14
const ARC_RATIO = 0.8

const GROUP_DEFS = [
  { id: 'prefix', chars: 'сме' },
  { id: 'root',   chars: 'мерт' },
  { id: 'suffix', chars: 'меь' },
]

export default function SilhouetteTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!

    opentype.load(FONT_URL).then(font => {
      const otScale   = FONT_SIZE / font.unitsPerEm
      const baselineY = FONT_SIZE + 40
      const groupGap  = FONT_SIZE * 0.15
      let cursorX     = 40

      const pointsByGroup = new Map<string, OutlinePoint[]>()

      for (const def of GROUP_DEFS) {
        const groupPts: OutlinePoint[] = []
        let gc = cursorX

        for (let ci = 0; ci < def.chars.length; ci++) {
          const ch      = def.chars[ci]
          const otGlyph = font.charToGlyph(ch)
          if (!otGlyph) continue

          const path = otGlyph.getPath(gc, baselineY, FONT_SIZE)
          groupPts.push(...sampleOpentypePath(path, 2, ci, def.id))
          gc += (otGlyph.advanceWidth ?? 0) * otScale
        }

        console.log(`[${def.id}] points:`, groupPts.length,
          'y range:', Math.min(...groupPts.map(p=>p.y)).toFixed(1),
          '–', Math.max(...groupPts.map(p=>p.y)).toFixed(1))

        pointsByGroup.set(def.id, groupPts)
        cursorX = gc + groupGap
      }

      // Build silhouette
      const { mesh, debug } = buildCombinedSilhouette(pointsByGroup, OFFSET, ARC_RATIO)

      console.log('finalPath length:', debug.finalPath.length)
      console.log('finalPath y range:',
        Math.min(...debug.finalPath.map(p=>p[1])).toFixed(1),
        '–', Math.max(...debug.finalPath.map(p=>p[1])).toFixed(1))
      console.log('arcEdges count:', debug.arcEdges.length)
      console.log('first 3 finalPath pts:', debug.finalPath.slice(0,3).map(p=>`(${p[0].toFixed(1)},${p[1].toFixed(1)})`))

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Draw silhouette fill using finalPath
      if (debug.finalPath.length > 2) {
        ctx.beginPath()
        debug.finalPath.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
        ctx.closePath()
        ctx.fillStyle = '#cccccc'
        ctx.fill('evenodd')  // evenodd shows if path self-intersects
        // outline
        ctx.strokeStyle = '#000'
        ctx.lineWidth   = 1.5
        ctx.setLineDash([4, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // 2. Draw glyph outlines (red, so we can see if they sit inside silhouette)
      for (const [groupId, pts] of pointsByGroup) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth   = 0.5
        // Draw sampled outline points as tiny dots
        for (const p of pts) {
          ctx.fillStyle = '#ff000044'
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
        }
      }

      // 3. Draw text on top with Canvas 2D (ground truth position)
      ctx.font         = `${FONT_SIZE}px serif`
      ctx.fillStyle    = '#000'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('смерть', 40, baselineY)

      // 4. Draw baseline
      ctx.strokeStyle = '#0000ff44'
      ctx.lineWidth   = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(0, baselineY)
      ctx.lineTo(canvas.width, baselineY)
      ctx.stroke()
      ctx.setLineDash([])

      // 5. Arc circles (ghost)
      for (const arc of debug.arcEdges) {
        ctx.strokeStyle = '#ff660044'
        ctx.lineWidth   = 1
        ctx.beginPath()
        ctx.arc(arc.cx, arc.cy, arc.r, 0, Math.PI*2)
        ctx.stroke()
      }
    }).catch(e => console.error('font load failed:', e))
  }, [])

  return (
    <div>
      <p style={{fontFamily:'monospace', fontSize:12, margin:'8px'}}>
        SilhouetteTest — grey=silhouette fill, red dots=outline pts, black=Canvas2D text, blue=baseline
      </p>
      <canvas ref={canvasRef} width={900} height={320}
        style={{border:'1px solid #ccc', display:'block'}} />
    </div>
  )
}