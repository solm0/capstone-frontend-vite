import type { LoadedAtlas } from './atlas'
import type { TextGroup } from './types'
import type { SilhouetteMesh } from './silhouette'
import { SILHOUETTE_SHADER, GLYPH_SHADER } from './shaders'

const GLYPH_STRIDE = 16   // floats per glyph instance

// Per-group GPU buffers
interface GroupBuffers {
  vertexBuf: GPUBuffer
  indexBuf:  GPUBuffer
  indexCount: number
  silUni:    GPUBuffer
  silBG:     GPUBindGroup
}

export class TextRenderer {
  private device:  GPUDevice
  private context: GPUCanvasContext
  private atlas:   LoadedAtlas
  private format:  GPUTextureFormat

  private silPipeline:   GPURenderPipeline
  private glyphPipeline: GPURenderPipeline
  private sampler:       GPUSampler
  private glyphUniBuf:   GPUBuffer
  private glyphBuf:      GPUBuffer | null = null
  private glyphBufCap = 0
  private glyphBG:       GPUBindGroup | null = null
  private glyphCount = 0

  private groupBufs: Map<string, GroupBuffers> = new Map()

  constructor(device: GPUDevice, context: GPUCanvasContext, atlas: LoadedAtlas, format: GPUTextureFormat) {
    this.device  = device
    this.context = context
    this.atlas   = atlas
    this.format  = format

    this.sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' })

    this.glyphUniBuf = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const blend: GPUBlendState = {
      color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      alpha: { srcFactor: 'one',       dstFactor: 'one-minus-src-alpha', operation: 'add' },
    }

    // ── Silhouette pipeline ──────────────────────────────────────────────────
    const silMod = device.createShaderModule({ code: SILHOUETTE_SHADER })
    this.silPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: silMod, entryPoint: 'vs',
        buffers: [{
          arrayStride: 8,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
        }],
      },
      fragment: { module: silMod, entryPoint: 'fs', targets: [{ format, blend }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
    })

    // ── Glyph pipeline ───────────────────────────────────────────────────────
    const glyphMod = device.createShaderModule({ code: GLYPH_SHADER })
    this.glyphPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: glyphMod, entryPoint: 'vs' },
      fragment: { module: glyphMod, entryPoint: 'fs', targets: [{ format, blend }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
    })
  }

  // ── Upload silhouette mesh for a group ────────────────────────────────────

  uploadGroupMesh(groupId: string, mesh: SilhouetteMesh, color: [number,number,number,number] = [0.85,0.85,0.85,1]) {
    const { device } = this
    const old = this.groupBufs.get(groupId)
    old?.vertexBuf.destroy()
    old?.indexBuf.destroy()
    old?.silUni.destroy()

    if (mesh.indices.length === 0) {
      this.groupBufs.delete(groupId)
      return
    }

    const vertexBuf = device.createBuffer({
      size: mesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(vertexBuf, 0, mesh.vertices)

    const indexBuf = device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(indexBuf, 0, mesh.indices)

    // Uniform: canvas_size(2) + offset(2) + color(4) = 32 bytes
    const silUni = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const silBG = device.createBindGroup({
      layout: this.silPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: silUni } }],
    })

    this.groupBufs.set(groupId, { vertexBuf, indexBuf, indexCount: mesh.indices.length, silUni, silBG })
    this.updateGroupColor(groupId, color)
  }

  updateGroupColor(groupId: string, color: [number,number,number,number]) {
    const b = this.groupBufs.get(groupId)
    if (!b) return
    const canvas = this.context.canvas as HTMLCanvasElement
    this.device.queue.writeBuffer(
      b.silUni, 0,
      new Float32Array([canvas.width, canvas.height, 0, 0, ...color]),
    )
  }

  // ── Upload glyph instances for all groups ─────────────────────────────────

  uploadGlyphs(groups: TextGroup[], scale: number) {
    const { device, atlas } = this
    const instances: number[] = []

    for (const g of groups) {
      const ox = g.spring.x
      const oy = g.spring.y
      for (const gi of g.glyphs) {
        const info = atlas.glyphMap.get(gi.char)
        if (!info) continue
        // gi.x = cursor x, gi.y = baseline y (opentype convention)
        // msdf-bmfont yoffset = pixels from line-top to glyph-top (y-down)
        // atlas.base = pixels from line-top to baseline (y-down)
        // → quad top = baseline - (base - yoffset) * scale
        const qx = gi.x + info.xoffset * scale
        const qy = gi.y - (atlas.base - info.yoffset) * scale
        instances.push(
          qx, qy, info.width * scale, info.height * scale,
          info.u0, info.v0, info.u1, info.v1,
          ox, oy,
          0, 0, 0, 1,
          0, 0,
        )
      }
    }

    this.glyphCount = instances.length / GLYPH_STRIDE
    if (this.glyphCount === 0) return

    const data = new Float32Array(instances)
    if (data.byteLength > this.glyphBufCap) {
      this.glyphBuf?.destroy()
      const cap = Math.max(data.byteLength, 4096)
      this.glyphBuf = device.createBuffer({
        size: cap,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
      this.glyphBufCap = cap
      this.glyphBG = device.createBindGroup({
        layout: this.glyphPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.glyphUniBuf } },
          { binding: 1, resource: { buffer: this.glyphBuf } },
          { binding: 2, resource: atlas.texture.createView() },
          { binding: 3, resource: this.sampler },
        ],
      })
    }
    device.queue.writeBuffer(this.glyphBuf!, 0, data)
  }

  // ── Per-frame: update offsets only (cheap) ────────────────────────────────

  updateOffsets(groups: TextGroup[]) {
    const canvas = this.context.canvas as HTMLCanvasElement
    const W = canvas.width, H = canvas.height

    for (const g of groups) {
      const b = this.groupBufs.get(g.id)
      if (!b) continue
      // offset is at byte offset 8 (after canvas_size vec2)
      this.device.queue.writeBuffer(b.silUni, 8, new Float32Array([g.spring.x, g.spring.y]))
    }

    // Update glyph offsets by re-uploading (small, fast)
    // For more perf, could use a separate per-instance offset buffer
    this.uploadGlyphs(groups, this._scale)

    // Glyph uniform
    this.device.queue.writeBuffer(
      this.glyphUniBuf, 0,
      new Float32Array([W, H, this.atlas.scaleW, this.atlas.scaleH, this.atlas.distanceRange, 0, 0, 0]),
    )
  }

  private _scale = 1
  setScale(s: number) { this._scale = s }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const { device, context } = this
    const view = context.getCurrentTexture().createView()
    const enc  = device.createCommandEncoder()

    const pass = enc.beginRenderPass({
      colorAttachments: [{
        view,
        clearValue: { r: 1, g: 1, b: 1, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    })

    // Pass 1: silhouettes (one draw per group)
    pass.setPipeline(this.silPipeline)
    for (const [, b] of this.groupBufs) {
      if (b.indexCount === 0) continue
      pass.setBindGroup(0, b.silBG)
      pass.setVertexBuffer(0, b.vertexBuf)
      pass.setIndexBuffer(b.indexBuf, 'uint32')
      pass.drawIndexed(b.indexCount)
    }

    // Pass 2: glyphs on top
    if (this.glyphBG && this.glyphCount > 0) {
      pass.setPipeline(this.glyphPipeline)
      pass.setBindGroup(0, this.glyphBG)
      pass.draw(6, this.glyphCount)
    }

    pass.end()
    device.queue.submit([enc.finish()])
  }

  destroy() {
    for (const b of this.groupBufs.values()) {
      b.vertexBuf.destroy(); b.indexBuf.destroy(); b.silUni.destroy()
    }
    this.glyphBuf?.destroy()
    this.glyphUniBuf.destroy()
    this.atlas.texture.destroy()
  }
}