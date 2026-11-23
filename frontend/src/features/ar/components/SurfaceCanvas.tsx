import { useEffect, useRef, useState } from 'react'
import { createSurfaceRenderer, type SurfaceRenderer } from '../utils/surfaceRenderer'
import { getStoneTexture } from '../utils/stoneTexture'
import { drawScaled, loadImage, MAX_PHOTO_SIDE } from '../utils/imageProcessing'
import { pointInQuad, quadToPixels, type Quad } from '../utils/homography'

interface Props {
  /** Room photo URL (data URL from camera/upload, or a remote sample image). */
  src: string
  /** Surface corners as 0–1 fractions of the photo, clockwise from top-left. */
  corners: Quad | null
  materialName: string
  tilesX: number
  tilesY: number
  /** 0–100 */
  lighting: number
  /** Reports a problem (or null when everything is fine). The plain photo stays visible. */
  onStatus?: (message: string | null) => void
  className?: string
}

const LUM_SIDE = 96 // size of the small brightness grid used for the area average

interface LumGrid {
  w: number
  h: number
  values: Float32Array
}

function buildLumGrid(photo: HTMLCanvasElement): LumGrid | null {
  try {
    const scale = LUM_SIDE / Math.max(photo.width, photo.height)
    const w = Math.max(1, Math.round(photo.width * scale))
    const h = Math.max(1, Math.round(photo.height * scale))
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(photo, 0, 0, w, h)
    const px = ctx.getImageData(0, 0, w, h).data // throws if the image is CORS-tainted
    const values = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      values[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255
    }
    return { w, h, values }
  } catch {
    return null
  }
}

function averageLum(grid: LumGrid | null, corners: Quad | null): number {
  if (!grid) return 0.5
  let sum = 0
  let n = 0
  let all = 0
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      const v = grid.values[y * grid.w + x]
      all += v
      if (corners && pointInQuad({ x: (x + 0.5) / grid.w, y: (y + 0.5) / grid.h }, corners)) {
        sum += v
        n++
      }
    }
  }
  return n > 0 ? sum / n : all / (grid.w * grid.h)
}

/**
 * WebGL canvas that draws the room photo with the selected stone inside the
 * marked corners. Sits exactly on top of the plain <img>; if anything fails it
 * stays hidden, so the plain photo shows through.
 */
export default function SurfaceCanvas({
  src, corners, materialName, tilesX, tilesY, lighting, onStatus, className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SurfaceRenderer | null>(null)
  const lumRef = useRef<LumGrid | null>(null)
  const frame = useRef(0)
  const statusRef = useRef(onStatus)
  const stoneNameRef = useRef<string | null>(null) // material currently on the GPU
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null) // photo currently on the GPU
  const [photoVersion, setPhotoVersion] = useState(0) // bumps on every upload (also after a remount)
  const [failed, setFailed] = useState(false)
  const [drawnSrc, setDrawnSrc] = useState<string | null>(null) // photo of the last finished draw

  useEffect(() => {
    statusRef.current = onStatus
  }, [onStatus])

  // Create the renderer once; release GPU resources on unmount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = createSurfaceRenderer(canvas)
    if (!renderer) {
      setFailed(true)
      statusRef.current?.(
        'This browser could not start WebGL, so the stone cannot be drawn on the photo. Try another browser or device.',
      )
      return
    }
    rendererRef.current = renderer
    stoneNameRef.current = null // a new renderer has no stone texture yet

    const onLost = (e: Event) => {
      e.preventDefault()
      setFailed(true)
      statusRef.current?.('The 3D preview was paused by the browser. Clear the surface and mark it again, or reload the page.')
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      cancelAnimationFrame(frame.current)
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  // Load + downscale the photo, then upload it to the GPU
  useEffect(() => {
    let cancelled = false
    loadImage(src)
      .then((img) => {
        if (cancelled) return
        const renderer = rendererRef.current
        if (!renderer) return
        const scaled = drawScaled(img, MAX_PHOTO_SIDE)
        try {
          renderer.setPhoto(scaled)
        } catch {
          setFailed(true)
          statusRef.current?.(
            'This photo is blocked by the image server (CORS), so the stone cannot be drawn on it. Upload or take your own photo instead.',
          )
          return
        }
        lumRef.current = buildLumGrid(scaled)
        scaled.width = 0 // pixels are on the GPU now; free the copy
        scaled.height = 0
        setFailed(false)
        statusRef.current?.(null)
        setLoadedSrc(src)
        setPhotoVersion((v) => v + 1)
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
        statusRef.current?.(
          'This photo could not be loaded for the preview (it may be blocked by CORS). Upload or take your own photo instead.',
        )
      })
    return () => {
      cancelled = true
    }
  }, [src])

  // Redraw whenever anything visible changes (coalesced to one draw per frame).
  // The stone texture is (re)uploaded here when the material has changed.
  useEffect(() => {
    const renderer = rendererRef.current
    const canvas = canvasRef.current
    if (!renderer || !canvas || failed || !loadedSrc || !renderer.hasPhoto()) return
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      if (stoneNameRef.current !== materialName) {
        const tex = getStoneTexture(materialName)
        try {
          if (!tex) throw new Error('no texture')
          renderer.setStone(tex)
          stoneNameRef.current = materialName
        } catch {
          stoneNameRef.current = null
          statusRef.current?.('The sample texture for this material could not be created. Showing the plain photo.')
          return
        }
      }
      const shown = canvas.clientWidth || canvas.width
      const featherPx = Math.min(8, Math.max(1.5, 2.5 * (canvas.width / shown)))
      renderer.render({
        corners: corners ? quadToPixels(corners, canvas.width, canvas.height) : null,
        tilesX,
        tilesY,
        lighting: lighting / 100,
        avgLum: averageLum(lumRef.current, corners),
        featherPx,
      })
      setDrawnSrc(loadedSrc)
    })
  }, [corners, tilesX, tilesY, lighting, materialName, loadedSrc, photoVersion, failed])

  const visible = !failed && drawnSrc === src && loadedSrc === src

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 size-full ${visible ? '' : 'invisible'} ${className}`}
    />
  )
}
