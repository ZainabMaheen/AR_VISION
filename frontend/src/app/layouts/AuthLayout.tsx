import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Scan } from 'lucide-react'

/** Simple centred shell for the login page. */
export default function AuthLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#faf8f4]">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-7">
        <Link to="/" className="flex items-center gap-3 text-[13px] font-semibold tracking-[2px] text-[#292a27] no-underline">
          <span className="grid size-9 place-items-center rounded-lg bg-[#292a27] text-white">
            <Scan size={18} />
          </span>
          AR VISION
        </Link>
        <Link to="/" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#292a27] no-underline hover:text-[#b38b60]">
          <ArrowLeft size={14} />
          <span className="max-sm:hidden">Back to the app</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 sm:items-center sm:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
