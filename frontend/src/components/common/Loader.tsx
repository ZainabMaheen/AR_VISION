import Spinner from '../ui/Spinner'

/** Centred "loading" block for panels and pages. */
export default function Loader({ text = 'Loading…' }: { text?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2.5 px-4 py-10 text-[12px] text-[#858179]">
      <Spinner size={18} />
      {text}
    </div>
  )
}
