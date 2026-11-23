import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, CircleHelp, Menu, Search, X } from 'lucide-react'
import { initials } from '../../features/settings/store'
import { useAuthStore } from '../../features/auth/store'

interface Props {
  title: string
  search: string
  onSearch: (v: string) => void
  onMenu: () => void
}

const iconBtn =
  'relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[#e8e4dc] bg-white text-[#65635c] hover:bg-[#f5f0e8]'

export default function Topbar({ title, search, onSearch, onMenu }: Props) {
  // Phones: the search box is hidden in the bar, so a search button opens a row below it
  const [mobileSearch, setMobileSearch] = useState(false)
  const user = useAuthStore((s) => s.user)
  const mobileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mobileSearch) mobileInput.current?.focus()
  }, [mobileSearch])

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8e4dc] bg-white/90 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-7 xl:px-11">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" aria-label="Open navigation" onClick={onMenu} className={`${iconBtn} lg:hidden`}>
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">WORKSPACE /</p>
            <h1 className="m-0 mt-1 truncate text-[18px] font-medium tracking-[-0.4px]">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <label className="hidden w-[280px] items-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white px-3 py-2.5 text-[#858179] md:flex">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search marble, granite, tiles..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full min-w-0 border-0 bg-transparent p-0 text-xs text-[#292a27] outline-none"
            />
          </label>

          <button
            type="button"
            aria-label={mobileSearch ? 'Close search' : 'Search'}
            aria-expanded={mobileSearch}
            onClick={() => setMobileSearch((v) => !v)}
            className={`${iconBtn} md:hidden`}
          >
            {mobileSearch ? <X size={17} /> : <Search size={17} />}
            {!mobileSearch && search && <span className="absolute right-2.5 top-2.5 size-[7px] rounded-full bg-[#b38b60]" />}
          </button>

          <button type="button" aria-label="Help" className={`${iconBtn} max-sm:hidden`}>
            <CircleHelp size={17} />
          </button>

          <button type="button" aria-label="Notifications" className={iconBtn}>
            <Bell size={17} />
            <span className="absolute right-2.5 top-2.5 size-[7px] rounded-full bg-[#b38b60]" />
          </button>

          {user ? (
            <Link
              to="/settings"
              className="flex max-w-[200px] items-center gap-2 rounded-full border border-[#e8e4dc] bg-white py-1 pl-1 pr-3 text-xs text-[#292a27] no-underline hover:bg-[#faf8f4] max-sm:hidden"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#292a27] text-[10px] font-semibold text-white">
                {initials(user.name)}
              </span>
              <span className="truncate">{user.name}</span>
              <ChevronDown size={14} className="shrink-0 text-[#89857d]" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center rounded-full border border-[#292a27] bg-[#292a27] px-4 text-xs font-semibold text-white no-underline hover:bg-black max-sm:hidden"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {mobileSearch && (
        <div className="px-4 pb-3 md:hidden">
          <label className="flex items-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white px-3 py-2.5 text-[#858179]">
            <Search size={16} className="shrink-0" />
            <input
              ref={mobileInput}
              type="search"
              placeholder="Search marble, granite, tiles..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setMobileSearch(false)
              }}
              // 16px font stops iOS from zooming into the field
              className="w-full min-w-0 border-0 bg-transparent p-0 text-base text-[#292a27] outline-none"
            />
          </label>
        </div>
      )}
    </header>
  )
}
