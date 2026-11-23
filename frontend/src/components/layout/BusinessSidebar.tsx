import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftRight, Boxes, Inbox, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBusinessSettings } from '../../features/business/settingsStore'
import { useCatalogueCounts } from '../../features/business/catalogue'
import { useAuthStore } from '../../features/auth/store'
import { useEnquiriesStore } from '../../features/enquiries/store'
import { initials } from '../../features/settings/store'

interface Props {
  open: boolean
  onNavigate: () => void
}

interface Item {
  label: string
  to: string
  icon: LucideIcon
  exact?: boolean
}

const NAV: Item[] = [
  { label: 'Overview', to: '/business', icon: LayoutDashboard, exact: true },
  { label: 'Stock manager', to: '/business/stock', icon: Boxes },
  { label: 'Enquiries', to: '/business/enquiries', icon: Inbox },
  { label: 'Shop settings', to: '/business/settings', icon: Settings },
]

const link =
  'relative flex min-h-10 items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] text-[#5f5c55] no-underline transition-colors hover:bg-[#f2ece2]'
// Bronze bar on the active item
const activeLink =
  'bg-[#f2ece2] font-semibold text-[#292a27] before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-[#b38b60]'

function ShopLogo({ name, url }: { name: string; url: string }) {
  const [broken, setBroken] = useState(false)
  if (url && !broken) {
    return <img src={url} alt="" onError={() => setBroken(true)} className="size-9 shrink-0 rounded-[8px] border border-[#e8e4dc] bg-white object-contain" />
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#b38b60] text-[11px] font-semibold text-white">
      {initials(name, 'SH')}
    </span>
  )
}

/** Cream sidebar for the business portal (visibly different from the white customer one). */
export default function BusinessSidebar({ open, onNavigate }: Props) {
  const { pathname } = useLocation()
  const { shopName, logoUrl } = useBusinessSettings((s) => s.settings)
  const { hidden } = useCatalogueCounts()
  const newEnquiries = useEnquiriesStore((s) => s.enquiries.filter((e) => e.status === 'new').length)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const isActive = (i: Item) => (i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`))

  return (
    <aside
      id="business-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col gap-3 overflow-y-auto border-r border-[#e8e4dc] bg-[#faf8f4] p-4 transition-transform duration-300 max-lg:-translate-x-full ${
        open ? 'max-lg:translate-x-0' : ''
      }`}
    >
      <Link to="/business" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 rounded-[10px] p-1 text-[#292a27] no-underline">
        {/* key resets the "broken image" state when the URL changes */}
        <ShopLogo key={logoUrl} name={shopName} url={logoUrl} />
        <span className="flex min-w-0 flex-col">
          <strong className="truncate text-[13px] font-semibold">{shopName || 'Your shop'}</strong>
          <small className="text-[10px] font-semibold tracking-[1.2px] text-[#a67e50]">BUSINESS</small>
        </span>
      </Link>

      <div className="h-px bg-[#eae4d9]" />

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Business">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`${link} ${active ? activeLink : ''}`}
            >
              <Icon size={16} className={active ? 'text-[#b38b60]' : ''} />
              <span>{item.label}</span>
              {item.to === '/business/enquiries' && newEnquiries > 0 && (
                <span title={`${newEnquiries} new`} className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#b38b60] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {newEnquiries}
                </span>
              )}
              {item.to === '/business/stock' && hidden > 0 && (
                <span title={`${hidden} hidden from customers`} className="ml-auto rounded-full bg-[#ece4d6] px-1.5 py-0.5 text-[10px] font-semibold text-[#86602f]">
                  {hidden} hidden
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2.5">
        {user && (
          <div className="flex items-center gap-2.5 rounded-[8px] border border-[#eae4d9] bg-white p-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#292a27] text-[10px] font-semibold text-white">
              {initials(user.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-[12px] font-semibold">{user.name}</strong>
              <small className="truncate text-[10px] text-[#89857d]">{user.email}</small>
            </span>
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                signOut()
                onNavigate()
              }}
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[8px] text-[#65635c] hover:bg-[#f5f0e8]"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <Link
          to="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#d9cbb6] bg-white px-3 text-xs font-semibold text-[#292a27] no-underline hover:bg-[#f5f0e8]"
        >
          <ArrowLeftRight size={15} />
          Switch to customer view
        </Link>
      </div>
    </aside>
  )
}
