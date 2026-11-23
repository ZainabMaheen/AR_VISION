import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BusinessSidebar from '../../components/layout/BusinessSidebar'
import BusinessTopbar from '../../components/layout/BusinessTopbar'
import { useAppData } from '../useAppData'
import type { LayoutContext } from './DashboardLayout'

const TITLES: Record<string, string> = {
  '/business': 'Overview',
  '/business/stock': 'Stock manager',
  '/business/settings': 'Shop settings',
  '/business/enquiries': 'Enquiries',
}

/**
 * Shell for the business portal (/business/*). Only business accounts get here
 * (ProtectedRoute in the router); the API checks the role on every request.
 */
export default function BusinessLayout() {
  useAppData('business')
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Context keeps the same shape as the customer layout; business pages do their own search
  const context: LayoutContext = { globalSearch: '' }

  return (
    <div className="min-h-[100dvh] bg-[#faf8f4]">
      <BusinessSidebar open={open} onNavigate={() => setOpen(false)} />

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <main className="min-h-[100dvh] min-w-0 lg:ml-[236px]">
        <BusinessTopbar title={TITLES[pathname] ?? (pathname.startsWith('/business/enquiries/') ? 'Enquiry' : 'Business')} onMenu={() => setOpen((v) => !v)} />
        <Outlet context={context} />
      </main>
    </div>
  )
}
