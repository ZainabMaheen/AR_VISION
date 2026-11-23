import { Camera, Compass, FileText, Grid2x2, Heart, House, Layers, LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** 'compare' / 'quote' = show the live count from the compare / quote store */
  badge?: 'compare' | 'quote'
  /** pathname that makes this item "active" */
  match?: string
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/#overview', icon: House, match: '/' },
  { label: 'AR Room Preview', to: '/arpreview', icon: Camera, match: '/arpreview' },
  { label: 'Material Catalogue', to: '/catalogue', icon: Grid2x2, match: '/catalogue' },
  { label: 'Compare', to: '/compare', icon: Layers, badge: 'compare', match: '/compare' },
  { label: 'Favourites', to: '/favourites', icon: Heart, match: '/favourites' },
  { label: 'Quote request', to: '/quote', icon: FileText, badge: 'quote', match: '/quote' },
  { label: 'My Projects', to: '/projects', icon: LayoutGrid, match: '/projects' },
  { label: 'Scan History', to: '/scans', icon: Compass, match: '/scans' },
]