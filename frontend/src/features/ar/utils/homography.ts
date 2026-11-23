/**
 * Perspective maths for the photo-based surface preview.
 *
 * A homography is a 3x3 matrix that maps one flat 4-sided shape onto another
 * with correct perspective. We map the unit square (one stone "tile") onto the
 * 4 corners the customer tapped, and use the inverse in the shader to find
 * which part of the stone texture each photo pixel should show.
 *
 * Matrices are plain arrays of 9 numbers in ROW-MAJOR order:
 *   [a, b, c,
 *    d, e, f,
 *    g, h, i]
 */

export interface Point {
  x: number
  y: number
}

/** 4 corners, clockwise from top-left: [top-left, top-right, bottom-right, bottom-left]. */
export type Quad = [Point, Point, Point, Point]

export type Mat3 = [number, number, number, number, number, number, number, number, number]

const EPS = 1e-10

/**
 * Matrix that maps the unit square onto the quad:
 *   (0,0) -> q[0], (1,0) -> q[1], (1,1) -> q[2], (0,1) -> q[3]
 * (Heckbert's square-to-quad method.) Returns null for a degenerate quad.
 */
export function squareToQuad(q: Quad): Mat3 | null {
  const [p0, p1, p2, p3] = q
  const sx = p0.x - p1.x + p2.x - p3.x
  const sy = p0.y - p1.y + p2.y - p3.y

  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number

  if (Math.abs(sx) < EPS && Math.abs(sy) < EPS) {
    // Parallelogram: a plain affine map is enough
    a = p1.x - p0.x
    b = p2.x - p1.x
    c = p0.x
    d = p1.y - p0.y
    e = p2.y - p1.y
    f = p0.y
    g = 0
    h = 0
  } else {
    const dx1 = p1.x - p2.x
    const dx2 = p3.x - p2.x
    const dy1 = p1.y - p2.y
    const dy2 = p3.y - p2.y
    const den = dx1 * dy2 - dx2 * dy1
    if (Math.abs(den) < EPS) return null
    g = (sx * dy2 - dx2 * sy) / den
    h = (dx1 * sy - sx * dy1) / den
    a = p1.x - p0.x + g * p1.x
    b = p3.x - p0.x + h * p3.x
    c = p0.x
    d = p1.y - p0.y + g * p1.y
    e = p3.y - p0.y + h * p3.y
    f = p0.y
  }

  return [a, b, c, d, e, f, g, h, 1]
}

/** Inverse of a 3x3 matrix, or null if it cannot be inverted. */
export function invert3(m: Mat3): Mat3 | null {
  const [a, b, c, d, e, f, g, h, i] = m
  const A = e * i - f * h
  const B = -(d * i - f * g)
  const C = d * h - e * g
  const det = a * A + b * B + c * C
  if (Math.abs(det) < EPS) return null
  const s = 1 / det
  return [
    A * s, -(b * i - c * h) * s, (b * f - c * e) * s,
    B * s, (a * i - c * g) * s, -(a * f - c * d) * s,
    C * s, -(a * h - b * g) * s, (a * e - b * d) * s,
  ]
}

/** Matrix that maps the quad back onto the unit square (inverse of squareToQuad). */
export function quadToSquare(q: Quad): Mat3 | null {
  const m = squareToQuad(q)
  return m ? invert3(m) : null
}

/** Apply a homography to a point (with the perspective divide). */
export function applyHomography(m: Mat3, p: Point): Point {
  const w = m[6] * p.x + m[7] * p.y + m[8]
  const iw = Math.abs(w) < EPS ? 0 : 1 / w
  return {
    x: (m[0] * p.x + m[1] * p.y + m[2]) * iw,
    y: (m[3] * p.x + m[4] * p.y + m[5]) * iw,
  }
}

/** Row-major -> column-major (what WebGL's uniformMatrix3fv expects). */
export function toColumnMajor(m: Mat3): Float32Array {
  return new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]])
}

/**
 * Put 4 points in clockwise order (as seen on screen, y pointing down),
 * starting from the top-left one, whatever order they were tapped in.
 * A tapped "bow-tie" order is untangled by this step.
 */
export function orderCorners(points: readonly Point[]): Quad | null {
  if (points.length !== 4) return null
  const cx = (points[0].x + points[1].x + points[2].x + points[3].x) / 4
  const cy = (points[0].y + points[1].y + points[2].y + points[3].y) / 4

  // With y pointing down, increasing atan2 angle goes clockwise on screen
  const sorted = [...points].sort(
    (p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx),
  )

  // Start from the point closest to the top-left (smallest x + y)
  let start = 0
  for (let i = 1; i < 4; i++) {
    if (sorted[i].x + sorted[i].y < sorted[start].x + sorted[start].y) start = i
  }

  const out = [0, 1, 2, 3].map((k) => {
    const p = sorted[(start + k) % 4]
    return { x: p.x, y: p.y }
  })
  return [out[0], out[1], out[2], out[3]]
}

/** Signed area (shoelace). Positive = clockwise on screen when y points down. */
export function signedArea(q: readonly Point[]): number {
  let s = 0
  for (let i = 0; i < q.length; i++) {
    const a = q[i]
    const b = q[(i + 1) % q.length]
    s += a.x * b.y - b.x * a.y
  }
  return s / 2
}

/**
 * True if the 4 points form a convex, non-crossing, non-degenerate shape.
 * `minArea` is in the same units as the points (e.g. 0.002 for 0–1 fractions).
 */
export function isConvexQuad(q: readonly Point[], minArea = 0): boolean {
  if (q.length !== 4) return false
  let sign = 0
  for (let i = 0; i < 4; i++) {
    const a = q[i]
    const b = q[(i + 1) % 4]
    const c = q[(i + 2) % 4]
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    if (Math.abs(cross) < EPS) return false // three points in a line
    const s = Math.sign(cross)
    if (sign === 0) sign = s
    else if (s !== sign) return false // concave or crossing (bow-tie)
  }
  return Math.abs(signedArea(q)) > minArea
}

/** Point-in-polygon test (ray casting). Works for any simple quad. */
export function pointInQuad(p: Point, q: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const a = q[i]
    const b = q[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Scale a quad stored as 0–1 fractions to pixel coordinates. */
export function quadToPixels(q: Quad, width: number, height: number): Quad {
  return q.map((p) => ({ x: p.x * width, y: p.y * height })) as Quad
}
