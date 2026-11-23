import { useEffect } from 'react'
import { Camera, X } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'

interface Props {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const { videoRef, ready, error, start } = useCamera()

  useEffect(() => {
    start()
  }, [start])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.9))
  }

  return (
    <div className="absolute inset-0 z-20 bg-[#1c1c19]">
      <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 size-full object-cover" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/50 to-transparent p-[15px]">
        <span className="rounded-lg border border-white/30 bg-black/30 px-[11px] py-[9px] text-[10px] text-white backdrop-blur-sm">
          Point at a wall or floor
        </span>
        <button
          type="button"
          aria-label="Close camera"
          onClick={onClose}
          className="grid size-[34px] cursor-pointer place-items-center rounded-lg border border-white/30 bg-black/30 text-white backdrop-blur-sm"
        >
          <X size={16} />
        </button>
      </div>

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
          <Camera size={26} className="text-[#e4d8c5]" />
          <p className="m-0 max-w-[340px] text-xs leading-[1.7]">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 cursor-pointer rounded-[10px] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#292a27]"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/50 to-transparent p-5">
          {!ready && <span className="text-[10px] text-white/80">Starting camera…</span>}
          <button
            type="button"
            aria-label="Take photo"
            disabled={!ready}
            onClick={capture}
            className="grid size-[68px] cursor-pointer place-items-center rounded-full border-4 border-white bg-white/20 disabled:cursor-default disabled:opacity-40"
          >
            <span className="size-[48px] rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  )
}