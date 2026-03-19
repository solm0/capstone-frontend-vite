// ── Atlas types (msdf-bmfont-xml output format) ──────────────────────────────

export interface AtlasChar {
  id: number
  index: number
  char: string
  width: number
  height: number
  xoffset: number
  yoffset: number
  xadvance: number
  chnl: number
  x: number
  y: number
  page: number
}

export interface AtlasInfo {
  type: string
  size: number
  bold: number
  italic: number
  charset: string[]
  unicode: number
  stretchH: number
  smooth: number
  aa: number
  padding: number[]
  spacing: number[]
}

export interface AtlasCommon {
  lineHeight: number
  base: number
  scaleW: number
  scaleH: number
  pages: number
  packed: number
  alphaChnl: number
  redChnl: number
  greenChnl: number
  blueChnl: number
}

export interface AtlasJSON {
  pages: string[]
  chars: AtlasChar[]
  info: AtlasInfo
  common: AtlasCommon
  kernings: { first: number; second: number; amount: number }[]
}

// ── Glyph map (runtime lookup) ────────────────────────────────────────────────

export interface GlyphInfo {
  char: string
  // UV coords (normalized 0–1)
  u0: number
  v0: number
  u1: number
  v1: number
  // Layout
  xoffset: number
  yoffset: number
  xadvance: number
  width: number
  height: number
}

export type GlyphMap = Map<string, GlyphInfo>

// ── Text group (semantic unit with interaction) ───────────────────────────────

export interface Circle {
  cx: number
  cy: number
  r: number
}

export interface SpringState {
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
}

export interface TextGroup {
  id: string
  chars: string          // e.g. "мерт"
  // computed each time text/layout changes
  glyphs: GlyphInstance[]
  circles: Circle[]      // hull-derived silhouette circles
  // animation state
  spring: SpringState
  // interaction callbacks
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  // visual state
  hovered: boolean
}

export interface GlyphInstance {
  char: string
  x: number              // baseline position in canvas space
  y: number
  glyphId: number        // for tagging hull points
  groupId: string
}

// ── Render frame data ─────────────────────────────────────────────────────────

export interface RenderUniforms {
  canvasWidth: number
  canvasHeight: number
  atlasWidth: number
  atlasHeight: number
  distanceRange: number  // from atlas JSON (default 4)
}