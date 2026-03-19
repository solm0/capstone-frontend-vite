// ── Silhouette mesh pass ──────────────────────────────────────────────────────
// Renders a pre-tessellated triangle mesh. Each group is one draw call.
// Offset is passed as a uniform so the mesh can be animated without re-upload.

export const SILHOUETTE_SHADER = /* wgsl */`
struct Uni {
  canvas_size : vec2f,
  offset      : vec2f,
  color       : vec4f,
}
@group(0) @binding(0) var<uniform> uni : Uni;

struct VIn  { @location(0) pos : vec2f }
struct VOut { @builtin(position) pos : vec4f }

@vertex fn vs(v: VIn) -> VOut {
  let w = (v.pos + uni.offset) / uni.canvas_size * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
  return VOut(vec4f(w, 0.0, 1.0));
}

@fragment fn fs() -> @location(0) vec4f {
  return uni.color;
}
`

// ── Glyph SDF pass ────────────────────────────────────────────────────────────

export const GLYPH_SHADER = /* wgsl */`
struct Uni {
  canvas_size    : vec2f,
  atlas_size     : vec2f,
  distance_range : f32,
  _pad           : f32,
}

struct Glyph {
  x        : f32,  y        : f32,
  w        : f32,  h        : f32,
  u0       : f32,  v0       : f32,
  u1       : f32,  v1       : f32,
  offset_x : f32,  offset_y : f32,
  r        : f32,  g        : f32,
  b        : f32,  a        : f32,
  _p0      : f32,  _p1      : f32,
}

@group(0) @binding(0) var<uniform>       uni    : Uni;
@group(0) @binding(1) var<storage,read>  glyphs : array<Glyph>;
@group(0) @binding(2) var                atlas  : texture_2d<f32>;
@group(0) @binding(3) var                smp    : sampler;

struct VOut {
  @builtin(position) pos   : vec4f,
  @location(0)       uv    : vec2f,
  @location(1)       color : vec4f,
}

var<private> Q : array<vec2f,6> = array<vec2f,6>(
  vec2f(0,0),vec2f(1,0),vec2f(0,1),
  vec2f(1,0),vec2f(1,1),vec2f(0,1),
);

@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
  let g  = glyphs[ii];
  let q  = Q[vi];
  let wx = g.x + g.offset_x + q.x * g.w;
  let wy = g.y + g.offset_y + q.y * g.h;
  let nx =  wx / uni.canvas_size.x * 2.0 - 1.0;
  let ny = -wy / uni.canvas_size.y * 2.0 + 1.0;
  let uv = vec2f(g.u0 + q.x*(g.u1-g.u0), g.v0 + q.y*(g.v1-g.v0));
  return VOut(vec4f(nx,ny,0,1), uv, vec4f(g.r,g.g,g.b,g.a));
}

fn median(r:f32,g:f32,b:f32)->f32 { return max(min(r,g),min(max(r,g),b)); }

@fragment fn fs(in: VOut) -> @location(0) vec4f {
  let s  = textureSample(atlas, smp, in.uv);
  let sd = median(s.r, s.g, s.b);
  let dx = dpdx(in.uv.x) * uni.atlas_size.x;
  let dy = dpdy(in.uv.y) * uni.atlas_size.y;
  let w  = length(vec2f(dx,dy)) * 0.25;
  let a  = smoothstep(0.5-w, 0.5+w, sd);  
  return vec4f(in.color.rgb, in.color.a * a);
}
`