/**
 * Generated, seamless 512x512 stone textures for the AR surface preview.
 *
 * IMPORTANT: these are GENERATED SAMPLES made in code, not photos of the real
 * stone. They are a stand-in until real slab/tile photos are available.
 *
 * Every texture tiles seamlessly: all noise is periodic over the texture size,
 * and veins use whole-number frequencies, so the right edge meets the left edge.
 */
import type { MaterialCategory } from '../../../types/stone'
import { findMaterial } from '../../../lib/materials'

export const TEXTURE_SIZE = 512

type Rgb = readonly [number, number, number]

type Recipe =
  | {
      kind: 'marble'
      base: Rgb
      cloud: Rgb // soft cloudy variation in the background
      vein: Rgb
      veinStrength: number // 0–1
      veinThinness: number // higher = thinner veins
      seed: number
    }
  | { kind: 'granite'; base: Rgb; specks: readonly { color: Rgb; amount: number }[]; seed: number }
  | { kind: 'tile'; base: Rgb; cloud: Rgb; grout: Rgb; seed: number }
  | { kind: 'travertine'; base: Rgb; band: Rgb; pit: Rgb; seed: number }

/** One recipe per material name in lib/constants.ts. */
const RECIPES: Record<string, Recipe> = {
  'Carrara Vein': {
    kind: 'marble', base: [236, 233, 227], cloud: [221, 219, 214], vein: [138, 136, 134],
    veinStrength: 0.75, veinThinness: 9, seed: 11,
  },
  'Nero Marquina': {
    kind: 'marble', base: [30, 30, 32], cloud: [44, 43, 45], vein: [232, 230, 224],
    veinStrength: 0.9, veinThinness: 14, seed: 23,
  },
  'Alpine Mist': {
    kind: 'granite', base: [160, 159, 154], seed: 37,
    specks: [
      { color: [58, 58, 56], amount: 0.24 },
      { color: [214, 212, 205], amount: 0.2 },
      { color: [118, 112, 104], amount: 0.14 },
    ],
  },
  'Sandstone Beige': { kind: 'tile', base: [216, 198, 166], cloud: [202, 182, 148], grout: [184, 176, 162], seed: 41 },
  'Warm Travertine': { kind: 'travertine', base: [218, 196, 160], band: [194, 164, 122], pit: [160, 134, 100], seed: 53 },
  'Silver Cloud': {
    kind: 'granite', base: [198, 198, 196], seed: 67,
    specks: [
      { color: [88, 88, 92], amount: 0.18 },
      { color: [238, 238, 236], amount: 0.22 },
      { color: [150, 150, 154], amount: 0.2 },
    ],
  },
}

/** Fallback per category for materials without their own recipe. */
const FALLBACK: Record<MaterialCategory, Recipe> = {
  marble: {
    kind: 'marble', base: [232, 228, 220], cloud: [218, 214, 206], vein: [150, 146, 140],
    veinStrength: 0.65, veinThinness: 10, seed: 101,
  },
  granite: {
    kind: 'granite', base: [150, 148, 144], seed: 103,
    specks: [
      { color: [60, 60, 58], amount: 0.22 },
      { color: [210, 208, 202], amount: 0.18 },
    ],
  },
  tiles: { kind: 'tile', base: [210, 200, 184], cloud: [196, 186, 170], grout: [180, 174, 164], seed: 107 },
}

/* ---------- periodic (tileable) noise ---------- */

function hash(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const mod = (a: number, n: number) => ((a % n) + n) % n

/** Value noise that repeats every periodX/periodY lattice cells. */
function noise(x: number, y: number, periodX: number, periodY: number, seed: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = smooth(x - x0)
  const fy = smooth(y - y0)
  const ix0 = mod(x0, periodX)
  const ix1 = mod(x0 + 1, periodX)
  const iy0 = mod(y0, periodY)
  const iy1 = mod(y0 + 1, periodY)
  const a = hash(ix0, iy0, seed)
  const b = hash(ix1, iy0, seed)
  const c = hash(ix0, iy1, seed)
  const d = hash(ix1, iy1, seed)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/** Fractal noise over u,v in [0,1); seamless because every octave's period divides 1. */
function fbm(u: number, v: number, basePeriod: number, octaves: number, seed: number): number {
  let sum = 0
  let amp = 0.5
  let norm = 0
  let p = basePeriod
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(u * p, v * p, p, p, seed + o * 131)
    norm += amp
    amp *= 0.5
    p *= 2
  }
  return sum / norm
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const TAU = Math.PI * 2

/* ---------- recipes -> pixels ---------- */

function shadePixel(r: Recipe, x: number, y: number, size: number, out: [number, number, number]) {
  const u = x / size
  const v = y / size
  const grain = hash(x, y, r.seed + 999) - 0.5 // fine per-pixel grain, also periodic

  if (r.kind === 'marble') {
    const cloud = fbm(u, v, 3, 5, r.seed)
    const turb = fbm(u, v, 4, 5, r.seed + 7)
    // Whole-number frequencies keep the veins seamless across the edges
    const main = 1 - Math.abs(Math.sin(TAU * (1 * u + 2 * v) + turb * 9))
    const fine = 1 - Math.abs(Math.sin(TAU * (3 * u - 1 * v) + turb * 12 + cloud * 4))
    const vein = clamp01(Math.pow(main, r.veinThinness) + 0.45 * Math.pow(fine, r.veinThinness * 1.6))
    const t = clamp01(cloud * 1.4 - 0.2)
    for (let i = 0; i < 3; i++) {
      const bg = mix(r.base[i], r.cloud[i], t)
      out[i] = mix(bg, r.vein[i], vein * r.veinStrength) + grain * 4
    }
    return
  }

  if (r.kind === 'granite') {
    const tone = fbm(u, v, 4, 3, r.seed) - 0.5
    for (let i = 0; i < 3; i++) out[i] = r.base[i] * (1 + tone * 0.12)
    r.specks.forEach((s, k) => {
      // Crystal-sized blobs: high-frequency noise thresholded
      const n = noise(u * 96, v * 96, 96, 96, r.seed + 17 * (k + 1)) * 0.7 + noise(u * 192, v * 192, 192, 192, r.seed + 29 * (k + 1)) * 0.3
      const t = clamp01((n - (1 - s.amount)) / 0.06)
      for (let i = 0; i < 3; i++) out[i] = mix(out[i], s.color[i], t)
    })
    for (let i = 0; i < 3; i++) out[i] += grain * 14
    return
  }

  if (r.kind === 'tile') {
    const cloud = fbm(u, v, 2, 4, r.seed)
    for (let i = 0; i < 3; i++) out[i] = mix(r.base[i], r.cloud[i], clamp01(cloud * 1.3 - 0.15)) + grain * 6
    return
  }

  // travertine: horizontal layered bands with small elongated pits
  const warp = fbm(u, v, 2, 4, r.seed)
  const band = 0.5 + 0.5 * Math.sin(TAU * 4 * v + warp * 7)
  const fineBand = 0.5 + 0.5 * Math.sin(TAU * 11 * v + warp * 10)
  const t = clamp01(band * 0.55 + fineBand * 0.2)
  const pitNoise = noise(u * 24, v * 96, 24, 96, r.seed + 5)
  const pit = clamp01((pitNoise - 0.84) / 0.05)
  for (let i = 0; i < 3; i++) {
    out[i] = mix(mix(r.base[i], r.band[i], t), r.pit[i], pit) + grain * 6
  }
}

/** Darkens the outer border so slabs/tiles show a joint where they repeat. */
function jointFactor(r: Recipe, x: number, y: number, size: number, rgb: [number, number, number]) {
  const edge = Math.min(x, y, size - 1 - x, size - 1 - y)
  if (r.kind === 'tile' || r.kind === 'travertine') {
    const groutHalf = r.kind === 'tile' ? 6 : 3 // half of the joint on each side
    if (edge < groutHalf) {
      const g = r.kind === 'tile' ? r.grout : ([176, 160, 134] as const)
      rgb[0] = g[0]
      rgb[1] = g[1]
      rgb[2] = g[2]
    } else if (edge < groutHalf + 2) {
      rgb[0] *= 0.92 // small bevel next to the grout
      rgb[1] *= 0.92
      rgb[2] *= 0.92
    }
  } else if (edge < 1) {
    // very fine slab joint for marble/granite
    rgb[0] *= 0.82
    rgb[1] *= 0.82
    rgb[2] *= 0.82
  }
}

function recipeFor(materialName: string): Recipe {
  return RECIPES[materialName] ?? FALLBACK[findMaterial(materialName)?.category ?? 'marble']
}

function generate(recipe: Recipe, size: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Explicit ArrayBuffer avoids the TS "ArrayBufferLike" overload error on new ImageData(...)
  const data = new Uint8ClampedArray(new ArrayBuffer(size * size * 4))
  const rgb: [number, number, number] = [0, 0, 0]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      shadePixel(recipe, x, y, size, rgb)
      jointFactor(recipe, x, y, size, rgb)
      const o = (y * size + x) * 4
      data[o] = rgb[0]
      data[o + 1] = rgb[1]
      data[o + 2] = rgb[2]
      data[o + 3] = 255
    }
  }

  try {
    ctx.putImageData(new ImageData(data, size, size), 0, 0)
  } catch {
    return null // a texture problem must never crash the page
  }
  return canvas
}

const cache = new Map<string, HTMLCanvasElement | null>()
const urlCache = new Map<string, string | null>()

/**
 * Seamless sample texture for a material (cached). Returns null if it could
 * not be created; callers should fall back to the plain photo.
 */
export function getStoneTexture(materialName: string): HTMLCanvasElement | null {
  if (cache.has(materialName)) return cache.get(materialName) ?? null
  let canvas: HTMLCanvasElement | null
  try {
    canvas = generate(recipeFor(materialName), TEXTURE_SIZE)
  } catch {
    canvas = null
  }
  cache.set(materialName, canvas)
  return canvas
}

/** Small data URL of the generated texture, for swatches in the UI (cached). */
export function getStoneTextureUrl(materialName: string): string | null {
  if (urlCache.has(materialName)) return urlCache.get(materialName) ?? null
  let url: string | null = null
  const tex = getStoneTexture(materialName)
  if (tex) {
    try {
      const small = document.createElement('canvas')
      small.width = 160
      small.height = 160
      small.getContext('2d')?.drawImage(tex, 0, 0, 160, 160)
      url = small.toDataURL('image/jpeg', 0.85)
    } catch {
      url = null
    }
  }
  urlCache.set(materialName, url)
  return url
}
