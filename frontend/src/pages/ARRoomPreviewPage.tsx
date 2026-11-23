import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Camera,
  Eraser,
  FileText,
  Heart,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Scan,
  SquareDashedMousePointer,
  Undo2,
  Upload,
  X,
} from 'lucide-react'
import MaterialPicker from '../features/ar/components/MaterialPicker'
import CameraCapture from '../features/ar/components/CameraCapture'
import ScanOverlay from '../features/ar/components/ScanOverlay'
import SurfaceCanvas from '../features/ar/components/SurfaceCanvas'
import SurfaceMarker from '../features/ar/components/SurfaceMarker'
import { useContainRect } from '../features/ar/hooks/useContainRect'
import { downscaleImage } from '../features/ar/utils/imageProcessing'
import { getStoneTextureUrl } from '../features/ar/utils/stoneTexture'
import type { Quad } from '../features/ar/utils/homography'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useVisibleMaterials } from '../features/catalogue/store'
import { useCartStore } from '../features/cart/store'
import SaveVisualisationModal from '../features/ar/components/SaveVisualisationModal'
import { getScan } from '../features/scans/store'
import { useCompareStore } from '../features/compare/store'
import { useFavouritesStore } from '../features/favourites/store'
import { MATERIALS, PALETTE, ROOM_IMAGE } from '../lib/constants'
import { findMaterial } from '../lib/materials'
import type { CategoryFilter, Material } from '../types/stone'
import type { LayoutContext } from '../app/layouts/DashboardLayout'

// 40px tap targets on phones, original 34px from 651px up
const stageIconBtn =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#e8e4dc] bg-white text-[#65635c] hover:bg-[#f5f0e8] disabled:cursor-default disabled:opacity-50 min-[651px]:size-[34px]'
const viewBtn =
  'grid size-10 cursor-pointer place-items-center rounded-[7px] border border-[#e8e4dc] bg-white text-[#68665e] min-[651px]:size-[30px]'
const actionBtn =
  'inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] px-3 text-[11px] font-semibold'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (v: number) => void
}

function SettingSlider({ label, value, min, max, suffix = '', onChange }: SliderProps) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-[#858179]">{label}</span>
        <strong className="font-semibold tabular-nums">
          {value}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block h-10 w-full cursor-pointer accent-[#b38b60]"
      />
    </label>
  )
}

export default function ARRoomPreviewPage() {
  const { globalSearch } = useOutletContext<LayoutContext>()
  const [params] = useSearchParams()
  const isPhone = useMediaQuery('(max-width: 650px)')
  const catalogue = useVisibleMaterials()

  // Opens with the material chosen from a card ("Preview in AR"), else the first one
  const [selected, setSelected] = useState<Material>(() => findMaterial(params.get('material')) ?? catalogue[0] ?? MATERIALS[0])
  // ?material=Name can arrive before the catalogue has loaded from the API: select it once it is there
  const [pendingMaterial, setPendingMaterial] = useState(() =>
    findMaterial(params.get('material')) ? null : params.get('material'),
  )
  if (pendingMaterial) {
    const found = catalogue.find((m) => m.name === pendingMaterial)
    if (found) {
      setPendingMaterial(null)
      setSelected(found)
    }
  }
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [zoom, setZoom] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const [activeColor, setActiveColor] = useState(PALETTE[0].value)
  const [tagColor, setTagColor] = useState<string | undefined>()
  const [toast, setToast] = useState({ text: '', visible: false })
  const toastTimer = useRef<number | undefined>(undefined)

  // Camera + scan
  const [roomPhoto, setRoomPhoto] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [processing, setProcessing] = useState(false) // scaling a large photo down
  const [scanProgress, setScanProgress] = useState<number | null>(null) // null = not scanning
  const scanTimer = useRef<number | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)

  // Surface marking + rendering
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null)
  const [marking, setMarking] = useState(false)
  const [corners, setCorners] = useState<Quad | null>(null)
  const [tilesX, setTilesX] = useState(4)
  const [tilesY, setTilesY] = useState(4)
  const [lighting, setLighting] = useState(70)
  const [surfaceStatus, setSurfaceStatus] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const photoBoxRef = useRef<HTMLDivElement>(null)
  const scanId = params.get('scan')

  const aspect = photoSize ? photoSize.w / photoSize.h : 4 / 3
  const { ref: stageRef, rect } = useContainRect<HTMLDivElement>(aspect)
  const photoSrc = roomPhoto ?? ROOM_IMAGE

  // Shared stores (same data the cards and sidebar use)
  const isSaved = useFavouritesStore((s) => s.names.includes(selected.name))
  const toggleFavourite = useFavouritesStore((s) => s.toggle)
  const inCompare = useCompareStore((s) => s.names.includes(selected.name))
  const addCompare = useCompareStore((s) => s.add)
  const addToQuote = useCartStore((s) => s.add)
  const attachToQuote = useCartStore((s) => s.attachScan)
  const [savedScanId, setSavedScanId] = useState<string | null>(null)

  const showToast = (text: string) => {
    setToast({ text, visible: true })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800)
  }

  useEffect(() => {
    setQuery(globalSearch)
    setCategory('all')
  }, [globalSearch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false)
        setCameraOpen(false)
        setMarking(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Clean up timers when leaving the page
  useEffect(
    () => () => {
      window.clearInterval(scanTimer.current)
      window.clearTimeout(toastTimer.current)
    },
    [],
  )

  // When the scan animation reaches 100%, pause a moment, then ask for the corners
  useEffect(() => {
    if (scanProgress === null || scanProgress < 100) return
    window.clearInterval(scanTimer.current)
    const t = window.setTimeout(() => {
      setScanProgress(null)
      setMarking(true)
      showToast('Now tap the 4 corners of the wall or floor you want to cover.')
    }, 1200)
    return () => window.clearTimeout(t)
  }, [scanProgress])

  // Opened from Scan history or a project: /arpreview?scan=<id>
  useEffect(() => {
    if (!scanId) return
    let cancelled = false
    void getScan(scanId).then((scan) => {
      if (cancelled) return
      if (!scan) {
        showToast('That saved visualisation was not found in this browser.')
        return
      }
      window.clearInterval(scanTimer.current)
      setScanProgress(null)
      setRoomPhoto(scan.photo === ROOM_IMAGE ? null : scan.photo)
      setSelected(findMaterial(scan.materialName) ?? catalogue[0] ?? MATERIALS[0])
      setCorners(scan.corners)
      setTilesX(scan.tilesX)
      setTilesY(scan.tilesY)
      setLighting(scan.lighting)
      setMarking(false)
      setZoom(1)
      setSurfaceStatus(null)
      showToast(`Opened “${scan.name}”.`)
    })
    return () => {
      cancelled = true
    }
  }, [scanId])

  const startScan = (photo: string) => {
    setSavedScanId(null)
    setRoomPhoto(photo)
    setCameraOpen(false)
    setZoom(1)
    setCorners(null)
    setMarking(false)
    setSurfaceStatus(null)
    window.clearInterval(scanTimer.current)
    setScanProgress(0)
    scanTimer.current = window.setInterval(() => {
      setScanProgress((p) => (p === null ? null : Math.min(100, p + 2)))
    }, 60) // 50 ticks ≈ 3 seconds
  }

  // Large phone photos are scaled down (max 1600px) before anything else touches them
  const applyPhoto = async (source: Blob | string) => {
    setCameraOpen(false)
    setProcessing(true)
    try {
      const scaled = await downscaleImage(source)
      startScan(scaled.url)
    } catch {
      showToast('That photo could not be read. Please try another one.')
    } finally {
      setProcessing(false)
    }
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.')
      return
    }
    void applyPhoto(file)
  }

  const resetRoomPhoto = () => {
    window.clearInterval(scanTimer.current)
    setScanProgress(null)
    setRoomPhoto(null)
    setZoom(1)
    setCorners(null)
    setMarking(false)
    setSurfaceStatus(null)
    showToast('Back to the sample room.')
  }

  const toggleMarking = () => {
    if (marking) {
      setMarking(false)
      return
    }
    setMarking(true)
    showToast(corners ? 'Tap 4 new corners to replace the surface.' : 'Tap the 4 corners of a wall or floor.')
  }

  const onSurfaceComplete = (q: Quad) => {
    setCorners(q)
    setMarking(false)
    showToast(`${selected.name} applied. Drag the corners to fine-tune.`)
  }

  const clearSurface = () => {
    setCorners(null)
    setMarking(false)
    setSurfaceStatus(null)
    showToast('Surface cleared.')
  }

  const visible = useMemo(() => {
    const s = query.trim().toLowerCase()
    return catalogue.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(s) ||
        m.category.toLowerCase().includes(s) ||
        m.finish.toLowerCase().includes(s)
      const matchesCategory = category === 'all' || m.category === category
      return matchesSearch && matchesCategory
    })
  }, [catalogue, query, category])

  const textureUrl = useMemo(() => (corners ? getStoneTextureUrl(selected.name) : null), [corners, selected.name])

  const typeLabel = selected.category.charAt(0).toUpperCase() + selected.category.slice(1)
  const scanning = scanProgress !== null
  const busy = scanning || processing || cameraOpen
  const showMarker = !busy && (marking || corners !== null)

  const reset = () => {
    setQuery('')
    setCategory('all')
    setSelected(catalogue[0] ?? MATERIALS[0])
    showToast('Material selection reset.')
  }

  const toggleSave = () => {
    const name = selected.name
    toggleFavourite(name)
    showToast(isSaved ? `${name} removed from favourites.` : `${name} added to favourites.`)
  }

  const addToCompare = () => {
    const name = selected.name
    if (inCompare) return showToast(`${name} is already in your comparison.`)
    addCompare(name)
    showToast(`${name} added to comparison.`)
  }

  const hint = marking
    ? 'Tap the 4 corners of the wall or floor, in any order.'
    : corners
      ? 'Drag the numbered corners to fine-tune the surface.'
      : 'Mark a wall or floor to preview the stone on it.'

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-[26px] min-[651px]:px-6 min-[651px]:py-8 min-[1401px]:px-11 min-[1401px]:pb-9 min-[1401px]:pt-[38px]">
      {/* HEADING */}
      <section className="mb-5 flex flex-col items-start gap-3.5 min-[651px]:mb-[27px] min-[651px]:flex-row min-[651px]:items-end min-[651px]:justify-between min-[651px]:gap-5">
        <div className="min-w-0">
          <p className="m-0 mb-2.5 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">MATERIAL EXPLORATION</p>
          <h2 className="m-0 text-2xl font-medium leading-[1.2] tracking-[-0.8px] min-[651px]:text-[28px]">
            Preview your space.
          </h2>
          <p className="m-0 mt-2.5 text-[13px] leading-[1.6] text-[#858179]">
            Add a photo of your room, mark a wall or floor, and see the stone on it.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-[30px] border border-[#e5e1d9] bg-white px-3 py-[9px] text-[11px] text-[#68675f]">
          <span className="size-[7px] rounded-full bg-[#8b9a78]" />
          {corners ? 'Surface preview' : 'Preview mode'}
        </span>
      </section>

      {/* WORKSPACE */}
      <section className="grid grid-cols-1 items-stretch gap-3.5 min-[651px]:grid-cols-[200px_minmax(0,1fr)] min-[1101px]:grid-cols-[195px_minmax(0,1fr)_215px] min-[1101px]:gap-3 min-[1401px]:grid-cols-[218px_minmax(0,1fr)_238px] min-[1401px]:gap-4">
        {/* LEFT */}
        <MaterialPicker
          materials={visible}
          selected={selected}
          query={query}
          category={category}
          onSelect={setSelected}
          onQuery={setQuery}
          onCategory={setCategory}
          onReset={reset}
        />

        {/* CENTER */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#e8e4dc] bg-[#eeece6]">
          <div className="flex min-h-[59px] flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#e0ddd5] bg-white px-[15px] py-[11px] max-[650px]:p-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <strong className="truncate text-xs font-semibold">{roomPhoto ? 'Your Room' : 'Living Room'}</strong>
              <small className="truncate text-[10px] text-[#858179]">
                {roomPhoto ? 'Photo you added' : 'Sample room · Daylight'}
              </small>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-[5px]">
              <button
                type="button"
                aria-label="Scan with camera"
                title="Take a room photo with the camera"
                disabled={busy}
                onClick={() => setCameraOpen(true)}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-[#292a27] bg-[#292a27] px-3 text-[11px] font-semibold text-white hover:bg-black disabled:cursor-default disabled:opacity-50 min-[651px]:h-[34px]"
              >
                <Camera size={15} />
                <span className="max-sm:hidden">Scan room</span>
              </button>
              <button
                type="button"
                className={stageIconBtn}
                aria-label="Upload a room photo"
                title="Upload a room photo"
                disabled={scanning || processing}
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={16} />
              </button>
              <button
                type="button"
                aria-label={marking ? 'Stop marking the surface' : 'Mark a wall or floor'}
                aria-pressed={marking}
                title="Mark a wall or floor"
                disabled={busy}
                onClick={toggleMarking}
                className={`${stageIconBtn} ${marking ? '!border-[#b38b60] !bg-[#f5f0e8] !text-[#a67e50]' : ''}`}
              >
                <SquareDashedMousePointer size={16} />
              </button>
              {roomPhoto && (
                <button
                  type="button"
                  className={stageIconBtn}
                  aria-label="Use sample room"
                  title="Use sample room"
                  disabled={processing}
                  onClick={resetRoomPhoto}
                >
                  <Undo2 size={16} />
                </button>
              )}
              <button
                className={stageIconBtn}
                aria-label="Reset view"
                title="Reset view"
                type="button"
                onClick={() => {
                  setZoom(1)
                  showToast('Room view reset.')
                }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                className={stageIconBtn}
                aria-label={expanded ? 'Exit expanded preview' : 'Expand room preview'}
                title="Expand preview"
                type="button"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>
          </div>

          <div
            ref={stageRef}
            style={!expanded && isPhone ? { aspectRatio: String(aspect) } : undefined}
            className={`isolate overflow-hidden bg-[#d7d0c4] ${
              expanded
                ? 'fixed inset-0 z-[200] h-[100dvh]'
                : 'relative max-h-[70dvh] min-h-[220px] flex-none min-[651px]:flex-1 min-[651px]:max-h-none min-[651px]:min-h-[350px] min-[901px]:min-h-[370px] min-[1401px]:min-h-[400px]'
            }`}
          >
            {/* Photo, WebGL canvas and marker share one box the exact size of the photo */}
            <div
              ref={photoBoxRef}
              className="absolute origin-center transition-transform duration-300"
              style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, transform: `scale(${zoom})` }}
            >
              <img
                src={photoSrc}
                alt={roomPhoto ? 'Your room photo' : 'Sample living room'}
                draggable={false}
                onLoad={(e) => setPhotoSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                className="absolute inset-0 size-full select-none"
              />
              {corners && (
                <SurfaceCanvas
                  src={photoSrc}
                  corners={marking ? null : corners}
                  materialName={selected.name}
                  tilesX={tilesX}
                  tilesY={tilesY}
                  lighting={lighting}
                  onStatus={setSurfaceStatus}
                />
              )}
              {showMarker && (
                <SurfaceMarker
                  marking={marking}
                  corners={corners}
                  onComplete={onSurfaceComplete}
                  onChange={setCorners}
                  onCancel={() => setMarking(false)}
                />
              )}
            </div>

            {!marking && (
              <div className="pointer-events-none absolute left-[15px] top-[15px] flex items-center gap-[7px] rounded-lg border border-white/60 bg-white/90 px-[11px] py-[9px] text-[10px] text-[#4c4a43] backdrop-blur-sm">
                <Scan size={14} className="text-[#a67e50]" />
                {roomPhoto ? 'Your room' : 'Sample room'}
              </div>
            )}

            {!scanning && !marking && !corners && (
              <div
                className="pointer-events-none absolute bottom-[24%] left-1/2 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-[7px] whitespace-nowrap rounded-[7px] border border-white/60 bg-white/90 px-[11px] py-2 text-[10px] text-[#4d4942] backdrop-blur-sm"
                style={tagColor ? { borderColor: tagColor } : undefined}
              >
                <span className="size-[7px] shrink-0 rounded-full bg-[#b38b60]" />
                <strong className="truncate">{selected.name}</strong>
              </div>
            )}

            {corners && surfaceStatus && !marking && (
              <p
                role="alert"
                className="absolute inset-x-3 bottom-3 z-[6] m-0 mx-auto max-w-[380px] rounded-[10px] bg-[#292a27]/90 px-3.5 py-2.5 text-center text-[11px] leading-[1.5] text-white"
              >
                {surfaceStatus}
              </p>
            )}

            {processing && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[#1c1c19]/30">
                <span className="flex items-center gap-2 rounded-[10px] bg-white/95 px-3.5 py-2.5 text-[11px] font-semibold text-[#4c4a43]">
                  <span className="size-3 animate-spin rounded-full border-2 border-[#e0dbd2] border-t-[#b38b60]" />
                  Preparing photo…
                </span>
              </div>
            )}

            {scanning && <ScanOverlay progress={scanProgress} />}
            {cameraOpen && <CameraCapture onCapture={(url) => void applyPhoto(url)} onClose={() => setCameraOpen(false)} />}

            {expanded && !cameraOpen && (
              <button
                type="button"
                aria-label="Exit expanded preview"
                onClick={() => setExpanded(false)}
                className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-30 grid size-10 cursor-pointer place-items-center rounded-lg border border-white/60 bg-white/90 text-[#4c4a43] backdrop-blur-sm"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex min-h-[59px] items-center justify-between gap-3 border-t border-[#e0ddd5] bg-white px-[15px] py-[11px] max-[650px]:p-2.5">
            <div className="flex min-w-0 items-center gap-2 text-[10px] leading-normal text-[#858179]">
              <Info size={16} className="shrink-0 text-[#a67e50]" />
              <span>{hint}</span>
            </div>

            <div className="flex shrink-0 items-center gap-[5px]">
              <button
                className={viewBtn}
                aria-label="Zoom out"
                title="Zoom out"
                type="button"
                onClick={() => setZoom((z) => Math.max(+(z - 0.1).toFixed(2), 1))}
              >
                <Minus size={14} />
              </button>
              <button
                className={viewBtn}
                aria-label="Zoom in"
                title="Zoom in"
                type="button"
                onClick={() => setZoom((z) => Math.min(+(z + 0.1).toFixed(2), 1.6))}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="min-w-0 overflow-hidden rounded-[14px] border border-[#e8e4dc] bg-white min-[651px]:col-span-2 min-[1101px]:col-span-1">
          <div className="border-b border-[#eeeae3] px-[17px] pb-[15px] pt-[19px]">
            <h3 className="m-0 text-sm font-semibold">Material details</h3>
            <p className="m-0 mt-[7px] text-[11px] leading-normal text-[#89857d]">Your selected finish.</p>
          </div>

          <div className="p-[15px]">
            {corners && (
              <div className="mb-[18px] rounded-[10px] border border-[#e8e4dc] bg-[#faf8f4] p-3">
                <div className="mb-2 flex items-center gap-2.5">
                  {textureUrl && (
                    <img src={textureUrl} alt="" className="size-10 shrink-0 rounded-lg border border-[#e8e4dc] object-cover" />
                  )}
                  <div className="min-w-0">
                    <h5 className="m-0 text-xs font-semibold">Surface settings</h5>
                    <p className="m-0 mt-0.5 text-[10px] leading-[1.5] text-[#858179]">
                      Generated sample texture, not a photo of the real stone.
                    </p>
                  </div>
                </div>

                <SettingSlider label="Tiles across" value={tilesX} min={1} max={12} onChange={setTilesX} />
                <SettingSlider label="Tiles down" value={tilesY} min={1} max={12} onChange={setTilesY} />
                <SettingSlider label="Keep room lighting" value={lighting} min={0} max={100} suffix="%" onChange={setLighting} />

                <button
                  type="button"
                  onClick={() => setSaveOpen(true)}
                  className={`${actionBtn} mb-2 mt-1 border border-[#292a27] bg-[#292a27] text-white hover:bg-black`}
                >
                  <Save size={15} />
                  Save visualisation
                </button>
                <button
                  type="button"
                  onClick={clearSurface}
                  className={`${actionBtn} mt-1 border border-[#e8e4dc] bg-white text-[#292a27] hover:bg-[#f5f0e8]`}
                >
                  <Eraser size={15} />
                  Clear surface
                </button>
              </div>
            )}

            <div className="h-[190px] overflow-hidden rounded-[10px] bg-[#e5ddd1] min-[651px]:h-[150px] min-[1101px]:h-[125px]">
              <img src={selected.image} alt={selected.name} className="size-full object-cover" />
            </div>

            <p className="m-0 mb-[7px] mt-[15px] text-[9px] font-semibold tracking-[1.1px] text-[#a67e50]">
              {selected.category.toUpperCase()} · {selected.finish.toUpperCase()}
            </p>

            <h4 className="m-0 text-[17px] font-medium tracking-[-0.4px]">{selected.name}</h4>
            <p className="mb-4 mt-[7px] text-[11px] text-[#858179]">{selected.tone}</p>

            <hr className="my-[15px] border-0 border-t border-[#eeeae3]" />

            {[
              ['Material', typeLabel],
              ['Finish', selected.finish],
              ['Availability', 'Catalogue sample'],
            ].map(([label, value]) => (
              <div key={label} className="my-[13px] flex items-center justify-between gap-2.5">
                <span className="text-[11px] text-[#858179]">{label}</span>
                <strong className="text-right text-[11px] font-semibold">{value}</strong>
              </div>
            ))}

            <hr className="my-[15px] border-0 border-t border-[#eeeae3]" />

            <h5 className="m-0 mb-3 text-xs font-semibold">Colour palette</h5>

            <div className="flex items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={`${c.label} colour`}
                  style={{ background: c.value }}
                  onClick={() => {
                    setActiveColor(c.value)
                    setTagColor(c.value)
                    showToast('Colour option selected.')
                  }}
                  className={`size-6 cursor-pointer rounded-full border-2 border-white ${
                    activeColor === c.value ? 'outline outline-2 outline-[#b38b60]' : 'outline outline-1 outline-[#e0dbd2]'
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 rounded-[9px] bg-[#f7f4ee] p-[11px] text-[10px] leading-[1.6] text-[#77736b]">
              <strong className="mb-1 block text-[11px] text-[#49463f]">How this preview works</strong>
              <ul className="m-0 list-disc pl-4">
                <li>The &ldquo;scan&rdquo; animation is a visual effect only.</li>
                <li>Walls and floors are not detected automatically. You mark them by tapping 4 corners.</li>
                <li>Stone textures are generated samples, not photos of the real stone.</li>
                <li>The camera only works on localhost or https. Upload a photo works everywhere.</li>
              </ul>
            </div>

            <div className="mt-[18px] flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleSave}
                className={`${actionBtn} border border-[#292a27] bg-[#292a27] text-white hover:bg-black`}
              >
                <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save material'}
              </button>
              <button
                type="button"
                onClick={addToCompare}
                className={`${actionBtn} border border-[#e8e4dc] bg-white text-[#292a27] hover:bg-[#f5f0e8]`}
              >
                <Layers size={15} />
                {inCompare ? 'In comparison' : 'Add to compare'}
              </button>
              <Link
                to="/quote"
                onClick={() => {
                  addToQuote(selected.name)
                  // Attach the visualisation that was just saved or opened, if a surface is showing
                  const attach = corners ? (savedScanId ?? scanId) : null
                  if (attach) attachToQuote(attach)
                }}
                className={`${actionBtn} border border-[#e8e4dc] bg-white text-[#292a27] no-underline hover:bg-[#f5f0e8]`}
              >
                <FileText size={15} />
                Request a quote
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <p className="m-0 mt-[19px] text-[10px] leading-[1.6] text-[#89857d]">
        <Info size={13} className="mr-1 inline-block align-middle" />
        Previews are approximate. Colour, veining, scale and lighting will differ from the real stone, so always view a
        physical sample before ordering.
      </p>

      <footer className="mt-10 flex items-center justify-between gap-3 border-t border-[#e8e4dc] pt-6 text-xs text-[#858179]">
        <span>© 2026 AR Vision</span>
        <a href="/#help" className="text-[#292a27] no-underline hover:text-[#b38b60]">
          Need help?
        </a>
      </footer>

      {corners && (
        <SaveVisualisationModal
          open={saveOpen}
          onClose={() => setSaveOpen(false)}
          onSaved={(scan, projectName) => {
            setSaveOpen(false)
            setSavedScanId(scan.id)
            showToast(
              projectName
                ? `Saved to “${projectName}”. Find it in Scan history.`
                : `“${scan.name}” saved. Find it in Scan history.`,
            )
          }}
          getPreviewCanvas={() => photoBoxRef.current?.querySelector<HTMLCanvasElement>('canvas:not(.invisible)') ?? null}
          photoSrc={photoSrc}
          corners={corners}
          materialName={selected.name}
          tilesX={tilesX}
          tilesY={tilesY}
          lighting={lighting}
          defaultName={`${selected.name} · ${roomPhoto ? 'My room' : 'Sample room'}`}
        />
      )}

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 right-4 z-[300] rounded-[10px] bg-[#292a27] px-[17px] py-[13px] text-xs text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] transition-all duration-200 min-[651px]:left-auto min-[651px]:right-6 min-[651px]:max-w-[calc(100vw-48px)] ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        {toast.text}
      </div>
    </div>
  )
}
