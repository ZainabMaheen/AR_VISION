import { RotateCcw, WifiOff } from 'lucide-react'
import Button from '../ui/Button'

interface Props {
  message?: string | null
  onRetry: () => void
  /** Slim banner (e.g. above data that is still shown from the cache). */
  compact?: boolean
  /** Extra text for the compact banner. */
  note?: string
}

/** Friendly "could not load" message with a Retry button. Never leaves a blank screen. */
export default function ServerError({ message, onRetry, compact = false, note = 'Showing the last saved copy.' }: Props) {
  const text = message || "Can't reach the server. Is the backend running?"

  if (compact) {
    return (
      <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#ecdcb9] bg-[#fbf5e8] px-3.5 py-2.5 text-[12px] text-[#8a6418]">
        <WifiOff size={15} className="shrink-0" />
        <span className="min-w-0 flex-1">
          {text} {note}
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-[8px] px-2 font-semibold text-[#292a27] hover:bg-white/70"
        >
          <RotateCcw size={14} />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-dashed border-[#e0dbd2] bg-white px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-[10px] bg-[#fbf5e8] text-[#8a6418]">
        <WifiOff size={20} />
      </span>
      <h3 className="m-0 mt-3 text-[16px] font-medium tracking-[-0.3px]">Could not load this</h3>
      <p className="m-0 mt-1.5 max-w-[360px] text-[13px] leading-[1.6] text-[#858179]">{text}</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        <RotateCcw size={15} />
        Retry
      </Button>
    </div>
  )
}
