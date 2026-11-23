/**
 * Image helpers for the AR preview.
 * Phone photos can be 12 MP+; drawing or uploading them at full size can freeze
 * a phone, so everything is scaled down to a sensible size first.
 */

export const MAX_PHOTO_SIDE = 1600

export interface ScaledImage {
  url: string // JPEG data URL
  width: number
  height: number
}

/** True for URLs that come from this page (data:/blob:), which never need CORS. */
export const isLocalUrl = (src: string) => src.startsWith('data:') || src.startsWith('blob:')

/** Load an image. Remote images are requested with CORS so WebGL/canvas can read them. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!isLocalUrl(src)) img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image could not be loaded'))
    img.src = src
  })
}

/** Size that fits inside maxSide on the longest side (never scales up). */
export function fitSize(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height, 1))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/** Draw an image into a new canvas no larger than maxSide on its longest side. */
export function drawScaled(img: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, maxSide)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)
  }
  return canvas
}

/**
 * Scale a photo (File/Blob or URL) down and return it as a JPEG data URL.
 * Object URLs created here are always released.
 */
export async function downscaleImage(
  source: Blob | string,
  maxSide = MAX_PHOTO_SIDE,
  quality = 0.88,
): Promise<ScaledImage> {
  const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source)
  try {
    const img = await loadImage(objectUrl ?? (source as string))
    const canvas = drawScaled(img, maxSide)
    const url = canvas.toDataURL('image/jpeg', quality)
    const out = { url, width: canvas.width, height: canvas.height }
    canvas.width = 0 // let the browser free the pixel memory straight away
    canvas.height = 0
    return out
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}
