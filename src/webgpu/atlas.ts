import type { AtlasJSON, GlyphInfo, GlyphMap } from './types'

export interface LoadedAtlas {
  texture: GPUTexture
  glyphMap: GlyphMap
  lineHeight: number
  base: number
  scaleW: number
  scaleH: number
  distanceRange: number
  infoSize: number       // atlas generation fontSize (e.g. 42)
}

export async function loadAtlas(
  device: GPUDevice,
  jsonUrl: string,
  pngUrl: string,
): Promise<LoadedAtlas> {
  // Load JSON and PNG in parallel
  const [atlasJSON, imageBitmap] = await Promise.all([
    fetch(jsonUrl).then(r => r.json()) as Promise<AtlasJSON>,
    fetch(pngUrl)
      .then(r => r.blob())
      .then(blob => createImageBitmap(blob)),
  ])

  // Upload texture to GPU
  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  })
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height],
  )

  // Build glyph map
  const { scaleW, scaleH, lineHeight, base } = atlasJSON.common
  const glyphMap: GlyphMap = new Map()

  for (const c of atlasJSON.chars) {
    const info: GlyphInfo = {
      char: c.char,
      u0: c.x / scaleW,
      v0: c.y / scaleH,
      u1: (c.x + c.width) / scaleW,
      v1: (c.y + c.height) / scaleH,
      xoffset: c.xoffset,
      yoffset: c.yoffset,
      xadvance: c.xadvance,
      width: c.width,
      height: c.height,
    }
    glyphMap.set(c.char, info)
  }

  // msdf-bmfont-xml puts distanceRange in info.charset or as top-level field
  // Default is 4 if not present
  const distanceRange = (atlasJSON as any).distanceRange ?? 4
  const infoSize: number = atlasJSON.info?.size ?? lineHeight

  return { texture, glyphMap, lineHeight, base, scaleW, scaleH, distanceRange, infoSize }
}