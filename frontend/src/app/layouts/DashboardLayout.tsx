import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { useAppData } from '../useAppData'

export interface LayoutContext {
  globalSearch: string
}

const TITLES: Record<string, string> = {
  '/arpreview': 'AR Room Preview',
  '/catalogue': 'Material Catalogue',
  '/compare': 'Compare',
  '/favourites': 'Favourites',
  '/scans': 'Scan History',
  '/projects': 'My Projects',
  '/settings': 'Settings',
  '/quote': 'Quote request',
  '/checkout': 'Your details',
}

export default function DashboardLayout() {
  useAppData('customer')
  const [open, setOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const { pathname, hash } = useLocation()

  const title =
    TITLES[pathname] ??
    (pathname.startsWith('/projects/') ? 'Project' : pathname.startsWith('/request-sent/') ? 'Request sent' : 'Dashboard')

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />

      <div
        id="backdrop"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <main className="min-h-screen min-w-0 lg:ml-[248px]">
        <Topbar title={title} search={globalSearch} onSearch={setGlobalSearch} onMenu={() => setOpen((v) => !v)} />
        <Outlet context={{ globalSearch } satisfies LayoutContext} />
      </main>
    </div>
  )
}