import { Check } from 'lucide-react'

/** Visual "scanning" effect shown on top of the room photo (progress 0–100). */
export default function ScanOverlay({ progress }: { progress: number }) {
  const done = progress >= 100

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-live="polite">
      <div className="absolute inset-0 bg-[#1c1c19]/30" />

      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {!done && (
        <div className="animate-scan absolute inset-x-0 h-[3px] bg-[#b38b60] shadow-[0_0_28px_8px_rgba(179,139,96,0.55)] motion-reduce:animate-none" />
      )}

      <span className="absolute left-4 top-4 size-7 border-l-2 border-t-2 border-white/90" />
      <span className="absolute right-4 top-4 size-7 border-r-2 border-t-2 border-white/90" />
      <span className="absolute bottom-4 left-4 size-7 border-b-2 border-l-2 border-white/90" />
      <span className="absolute bottom-4 right-4 size-7 border-b-2 border-r-2 border-white/90" />

      <div className="absolute bottom-6 left-1/2 flex w-[230px] -translate-x-1/2 flex-col gap-2 rounded-[10px] border border-white/60 bg-white/90 px-3.5 py-3 text-[#4c4a43] backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          {done ? (
            <>
              <Check size={14} className="text-[#8b9a78]" />
              Walls and floor detected
            </>
          ) : (
            <>
              <span className="size-3 animate-spin rounded-full border-2 border-[#e0dbd2] border-t-[#b38b60]" />
              Scanning surfaces… {progress}%
            </>
          )}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#e8e4dc]">
          <div
            className="h-full rounded-full bg-[#b38b60] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}