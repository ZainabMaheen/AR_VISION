/**
 * Small WebGL1 renderer for the photo-based surface preview.
 *
 * Draws the room photo, and inside the marked quad draws the tiled stone with
 * correct perspective: for each pixel the fragment shader applies the INVERSE
 * homography (quad -> unit square), then multiplies by the tile counts and
 * samples the stone texture with REPEAT wrapping and mipmaps.
 *
 * Room lighting is kept by scaling the stone by each pixel's (slightly blurred)
 * brightness relative to the marked area's average brightness.
 */
import { quadToSquare, signedArea, toColumnMajor, type Quad } from './homography'

export interface SurfaceRenderParams {
  /** Corners in canvas PIXELS, clockwise from top-left. null = draw the plain photo. */
  corners: Quad | null
  tilesX: number
  tilesY: number
  /** 0–1: how much of the room's light and shadow is kept on the stone. */
  lighting: number
  /** Average brightness (0–1) of the photo inside the marked area. */
  avgLum: number
  /** Width of the soft edge, in canvas pixels. */
  featherPx: number
}

export interface SurfaceRenderer {
  /** Upload the (already downscaled) photo. Throws a SecurityError if a remote image has no CORS. */
  setPhoto(source: HTMLCanvasElement | HTMLImageElement): void
  setStone(texture: HTMLCanvasElement): void
  hasPhoto(): boolean
  hasStone(): boolean
  render(params: SurfaceRenderParams): void
  dispose(): void
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  // vUv: (0,0) = top-left of the photo, (1,1) = bottom-right
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;
uniform sampler2D uPhoto;
uniform sampler2D uStone;
uniform vec2 uSize;        // canvas size in px
uniform mat3 uInv;         // quad (px) -> unit square
uniform vec2 uC0;
uniform vec2 uC1;
uniform vec2 uC2;
uniform vec2 uC3;
uniform float uOrient;     // +1 / -1 so edge normals point inwards
uniform float uFeather;    // soft edge width in px
uniform vec2 uTiles;
uniform float uLight;      // 0..1
uniform float uAvgLum;
uniform float uHasSurface;

float edgeDist(vec2 p, vec2 a, vec2 b) {
  vec2 e = b - a;
  vec2 n = normalize(vec2(-e.y, e.x)) * uOrient;
  return dot(p - a, n);
}

float lumAt(vec2 uv) {
  return dot(texture2D(uPhoto, uv).rgb, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 photo = texture2D(uPhoto, vUv);
  vec2 p = vUv * uSize;

  // Signed distance to the quad (positive inside), for a soft feathered edge
  float d = min(min(edgeDist(p, uC0, uC1), edgeDist(p, uC1, uC2)),
                min(edgeDist(p, uC2, uC3), edgeDist(p, uC3, uC0)));
  float a = smoothstep(-0.5 * uFeather, 0.5 * uFeather, d) * uHasSurface;

  // Perspective-correct position inside the quad (0..1), then repeat the tiles.
  // Sampled outside any branch so mipmap derivatives stay valid.
  vec3 h = uInv * vec3(p, 1.0);
  vec2 st = h.xy / (abs(h.z) < 1e-6 ? 1e-6 : h.z);
  vec3 stone = texture2D(uStone, st * uTiles).rgb;

  // Room light and shadow: blurred brightness here vs. the area's average
  vec2 px = 4.0 / uSize;
  float l = lumAt(vUv) * 0.2;
  l += lumAt(vUv + vec2( px.x, 0.0)) * 0.1;
  l += lumAt(vUv + vec2(-px.x, 0.0)) * 0.1;
  l += lumAt(vUv + vec2(0.0,  px.y)) * 0.1;
  l += lumAt(vUv + vec2(0.0, -px.y)) * 0.1;
  l += lumAt(vUv + px) * 0.1;
  l += lumAt(vUv - px) * 0.1;
  l += lumAt(vUv + vec2(px.x, -px.y)) * 0.1;
  l += lumAt(vUv + vec2(-px.x, px.y)) * 0.1;
  float ratio = clamp(l / max(uAvgLum, 0.04), 0.25, 1.8);
  vec3 lit = stone * mix(1.0, ratio, uLight);

  gl_FragColor = vec4(mix(photo.rgb, clamp(lit, 0.0, 1.0), a), 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type)
  if (!s) return null
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[surfaceRenderer] shader error:', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

const IDENTITY = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])

/** Create a renderer on the canvas, or null if WebGL is not available. */
export function createSurfaceRenderer(canvas: HTMLCanvasElement): SurfaceRenderer | null {
  let gl: WebGLRenderingContext | null = null
  try {
    const opts: WebGLContextAttributes = { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false }
    gl = (canvas.getContext('webgl', opts) ?? canvas.getContext('experimental-webgl', opts)) as WebGLRenderingContext | null
  } catch {
    gl = null
  }
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[surfaceRenderer] link error:', gl.getProgramInfoLog(program))
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  const loc = (name: string) => gl.getUniformLocation(program, name)
  const u = {
    photo: loc('uPhoto'), stone: loc('uStone'), size: loc('uSize'), inv: loc('uInv'),
    c0: loc('uC0'), c1: loc('uC1'), c2: loc('uC2'), c3: loc('uC3'),
    orient: loc('uOrient'), feather: loc('uFeather'), tiles: loc('uTiles'),
    light: loc('uLight'), avgLum: loc('uAvgLum'), hasSurface: loc('uHasSurface'),
  }
  const aPos = gl.getAttribLocation(program, 'aPos')

  const aniso =
    gl.getExtension('EXT_texture_filter_anisotropic') ??
    (gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') as EXT_texture_filter_anisotropic | null)

  let photoTex: WebGLTexture | null = null
  let stoneTex: WebGLTexture | null = null
  let disposed = false

  const setPhoto: SurfaceRenderer['setPhoto'] = (source) => {
    if (disposed) return
    const tex = photoTex ?? gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    // Any size: no mipmaps, clamp to edge (WebGL1 rules for non-power-of-two)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    } catch (e) {
      if (!photoTex) gl.deleteTexture(tex)
      throw e
    }
    photoTex = tex
    const w = source instanceof HTMLImageElement ? source.naturalWidth : source.width
    const h = source instanceof HTMLImageElement ? source.naturalHeight : source.height
    canvas.width = w
    canvas.height = h
  }

  const setStone: SurfaceRenderer['setStone'] = (texture) => {
    if (disposed) return
    const tex = stoneTex ?? gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture)
    // 512x512 is a power of two, so REPEAT + mipmaps are allowed in WebGL1
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.generateMipmap(gl.TEXTURE_2D)
    if (aniso) {
      const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max || 1))
    }
    stoneTex = tex
  }

  const render: SurfaceRenderer['render'] = (p) => {
    if (disposed || !photoTex || gl.isContextLost()) return
    const w = canvas.width
    const h = canvas.height
    gl.viewport(0, 0, w, h)
    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, photoTex)
    gl.uniform1i(u.photo, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, stoneTex ?? photoTex)
    gl.uniform1i(u.stone, 1)

    gl.uniform2f(u.size, w, h)
    const inv = p.corners && stoneTex ? quadToSquare(p.corners) : null
    const c = p.corners
    if (inv && c) {
      gl.uniformMatrix3fv(u.inv, false, toColumnMajor(inv))
      gl.uniform2f(u.c0, c[0].x, c[0].y)
      gl.uniform2f(u.c1, c[1].x, c[1].y)
      gl.uniform2f(u.c2, c[2].x, c[2].y)
      gl.uniform2f(u.c3, c[3].x, c[3].y)
      gl.uniform1f(u.orient, signedArea(c) >= 0 ? 1 : -1)
      gl.uniform1f(u.hasSurface, 1)
    } else {
      gl.uniformMatrix3fv(u.inv, false, IDENTITY)
      gl.uniform1f(u.hasSurface, 0)
    }
    gl.uniform1f(u.feather, Math.max(0.5, p.featherPx))
    gl.uniform2f(u.tiles, Math.max(0.1, p.tilesX), Math.max(0.1, p.tilesY))
    gl.uniform1f(u.light, Math.min(1, Math.max(0, p.lighting)))
    gl.uniform1f(u.avgLum, p.avgLum)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    // Free GPU memory. (We don't call WEBGL_lose_context: React StrictMode remounts
    // reuse the same canvas, and a lost context could not be created again.)
    if (photoTex) gl.deleteTexture(photoTex)
    if (stoneTex) gl.deleteTexture(stoneTex)
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    photoTex = null
    stoneTex = null
  }

  return {
    setPhoto,
    setStone,
    hasPhoto: () => photoTex !== null,
    hasStone: () => stoneTex !== null,
    render,
    dispose,
  }
}
