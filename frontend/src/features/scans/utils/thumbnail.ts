import { downscaleImage, fitSize, isLocalUrl, loadImage } from '../../ar/utils/imageProcessing'

export const THUMB_SIDE = 400
export const SAVED_PHOTO_SIDE = 1280

/**
 * Small JPEG of a canvas or image (e.g. the WebGL preview, which keeps its
 * pixels because it uses preserveDrawingBuffer). Returns null on failure.
 */
export function makeThumbnail(
  source: HTMLCanvasElement | HTMLImageElement,
  maxSide = THUMB_SIDE,
  quality = 0.8,
): string | null {
  try {
    const w = source instanceof HTMLImageElement ? source.naturalWidth : source.width
    const h = source instanceof HTMLImageElement ? source.naturalHeight : source.height
    if (!w || !h) return null
    const size = fitSize(w, h, maxSide)
    const c = document.createElement('canvas')
    c.width = size.width
    c.height = size.height
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, size.width, size.height)
    return c.toDataURL('image/jpeg', quality)
  } catch {
    return null // e.g. a CORS-tainted image
  }
}

/** Thumbnail straight from a photo URL (used when the preview canvas is not available). */
export async function thumbnailFromUrl(src: string, maxSide = THUMB_SIDE): Promise<string | null> {
  try {
    return makeThumbnail(await loadImage(src), maxSide)
  } catch {
    return null
  }
}

/** Room photo to store: our own photos are re-encoded smaller; the sample room keeps its URL. */
export async function photoForSaving(src: string): Promise<string> {
  if (!isLocalUrl(src)) return src
  return (await downscaleImage(src, SAVED_PHOTO_SIDE, 0.85)).url
}
