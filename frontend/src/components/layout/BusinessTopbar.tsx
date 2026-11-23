import { Link } from 'react-router-dom'
import { ArrowLeftRight, Menu } from 'lucide-react'

interface Props {
  title: string
  onMenu: () => void
}

/** Slim top bar for the business portal. */
export default function BusinessTopbar({ title, onMenu }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e8e4dc] bg-white/95 backdrop-blur">
      <div className="flex min-h-[56px] items-center justify-between gap-3 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenu}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[#e8e4dc] bg-white text-[#65635c] hover:bg-[#f5f0e8] lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">BUSINESS /</p>
            <h1 className="m-0 truncate text-[16px] font-medium tracking-[-0.3px]">{title}</h1>
          </div>
        </div>

        <Link
          to="/"
          title="Switch to customer view"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white px-3 text-xs font-semibold text-[#292a27] no-underline hover:bg-[#f5f0e8]"
        >
          <ArrowLeftRight size={15} />
          <span className="max-sm:hidden">Customer view</span>
        </Link>
      </div>
    </header>
  )
}
