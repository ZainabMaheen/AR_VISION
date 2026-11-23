import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { isConvexQuad, orderCorners, type Point, type Quad } from '../utils/homography'

interface Props {
  /** True while the customer is tapping the 4 corners. */
  marking: boolean
  /** Finished surface (0–1 fractions of the photo), shown as draggable handles. */
  corners: Quad | null
  onComplete: (corners: Quad) => void
  onChange: (corners: Quad) => void
  onCancel: () => void
}

const MIN_AREA = 0.002 // fraction of the photo; smaller shapes are treated as a mistake
const MIN_GAP_PX = 18 // taps closer than this to an existing corner are ignored
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Transparent overlay on top of the photo.
 * Marking: each tap adds a numbered corner (1–4). Editing: corners are draggable handles.
 * Positions are stored as 0–1 fractions of the photo, so they survive resizing and zoom.
 */
export default function SurfaceMarker({ marking, corners, onComplete, onChange, onCancel }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState<Point[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const errorTimer = useRef<number | undefined>(undefined)

  // Start fresh every time marking mode is switched on (state adjusted during render)
  const [wasMarking, setWasMarking] = useState(marking)
  if (marking !== wasMarking) {
    setWasMarking(marking)
    if (marking) {
      setPending([])
      setError(null)
    }
  }

  useEffect(() => () => window.clearTimeout(errorTimer.current), [])

  const showError = (msg: string) => {
    setError(msg)
    window.clearTimeout(errorTimer.current)
    errorTimer.current = window.setTimeout(() => setError(null), 4000)
  }

  const toFraction = (clientX: number, clientY: number): Point | null => {
    const r = rootRef.current?.getBoundingClientRect() // includes the zoom transform
    if (!r || r.width === 0 || r.height === 0) return null
    return { x: clamp01((clientX - r.left) / r.width), y: clamp01((clientY - r.top) / r.height) }
  }

  const onTap = (e: PointerEvent<HTMLDivElement>) => {
    if (!marking || !e.isPrimary || e.button > 0) return
    e.preventDefault()
    const p = toFraction(e.clientX, e.clientY)
    const r = rootRef.current?.getBoundingClientRect()
    if (!p || !r) return

    const tooClose = pending.some(
      (q) => Math.hypot((q.x - p.x) * r.width, (q.y - p.y) * r.height) < MIN_GAP_PX,
    )
    if (tooClose) return showError('That is very close to a corner you already tapped. Tap the next corner.')

    const next = [...pending, p]
    if (next.length < 4) {
      setError(null)
      setPending(next)
      return
    }

    const ordered = orderCorners(next)
    if (!ordered || !isConvexQuad(ordered, MIN_AREA)) {
      setPending([])
      showError(
        'Those 4 points do not make a clear 4-sided shape (they cross over or are too small). Tap the 4 corners again.',
      )
      return
    }
    setPending([])
    setError(null)
    onComplete(ordered)
  }

  /* ---------- dragging finished corners ---------- */

  const moveCorner = (index: number, p: Point) => {
    if (!corners) return
    const next = corners.map((c, i) => (i === index ? p : c)) as Quad
    // Only accept moves that keep a valid, non-crossing shape
    if (isConvexQuad(next, MIN_AREA)) onChange(next)
  }

  const onHandleDown = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(i)
  }

  const onHandleMove = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (dragging !== i) return
    const p = toFraction(e.clientX, e.clientY)
    if (p) moveCorner(i, p)
  }

  const onHandleUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(null)
  }

  const onHandleKey = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!corners) return
    const step = e.shiftKey ? 0.02 : 0.005
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    }
    const move = d[e.key]
    if (!move) return
    e.preventDefault()
    moveCorner(i, { x: clamp01(corners[i].x + move[0]), y: clamp01(corners[i].y + move[1]) })
  }

  const shape = marking ? pending : corners ?? []
  const points = shape.map((p) => `${p.x},${p.y}`).join(' ')
  const nextCorner = pending.length + 1

  return (
    <div
      ref={rootRef}
      onPointerDown={onTap}
      className={`absolute inset-0 z-[5] select-none ${
        marking ? 'cursor-crosshair touch-none' : 'pointer-events-none'
      }`}
    >
      {/* Outline of the surface */}
      {shape.length > 1 && (
        <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          {marking || shape.length < 4 ? (
            <polyline points={points} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          ) : (
            <polygon points={points} fill="none" stroke="#ffffff" strokeOpacity={0.9} strokeWidth={1.5} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      )}

      {/* Corners tapped so far (marking mode) */}
      {marking &&
        pending.map((p, i) => (
          <span
            key={i}
            className="pointer-events-none absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#b38b60] text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            {i + 1}
          </span>
        ))}

      {/* Draggable handles (editing mode). 44px touch area, smaller visible dot. */}
      {!marking &&
        corners?.map((p, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Corner ${i + 1} of the surface. Drag, or use the arrow keys, to adjust.`}
            onPointerDown={onHandleDown(i)}
            onPointerMove={onHandleMove(i)}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onKeyDown={onHandleKey(i)}
            className="pointer-events-auto absolute grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-full border-0 bg-transparent p-0 outline-none active:cursor-grabbing focus-visible:[&>span]:outline-2 focus-visible:[&>span]:outline-offset-2 focus-visible:[&>span]:outline-white"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            <span
              className={`grid place-items-center rounded-full border-2 border-white bg-[#b38b60] text-[10px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform ${
                dragging === i ? 'size-7 scale-110' : 'size-6'
              }`}
            >
              {i + 1}
            </span>
          </button>
        ))}

      {/* Instructions while marking (top, so floor corners at the bottom stay tappable) */}
      {marking && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-2 px-3">
          <div
            aria-live="polite"
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto flex items-center gap-2 rounded-[10px] border border-white/60 bg-white/95 py-1 pl-3.5 pr-1 text-[11px] font-semibold text-[#4c4a43] shadow-[0_6px_20px_rgba(0,0,0,0.15)] backdrop-blur-sm"
          >
            <span className="size-[7px] shrink-0 rounded-full bg-[#b38b60]" />
            <span className="whitespace-nowrap">Tap corner {nextCorner} of 4</span>
            <button
              type="button"
              aria-label="Cancel marking"
              onClick={onCancel}
              className="grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-[#65635c] hover:bg-[#f5f0e8]"
            >
              <X size={16} />
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="m-0 max-w-[360px] rounded-[10px] bg-[#292a27]/90 px-3.5 py-2.5 text-center text-[11px] leading-[1.5] text-white"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
