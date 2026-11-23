import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown, CircleHelp, Ellipsis, Scan, Settings } from 'lucide-react'
import { NAV } from '../../lib/nav'
import { useCompareStore } from '../../features/compare/store'
import { initials, useSettingsStore } from '../../features/settings/store'

interface Props {
  open: boolean
  onNavigate: () => void
}

const navLink =
  'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#68675f] no-underline transition-colors hover:bg-[#f5f0e8]'
const activeLink = 'bg-[#f5f0e8] font-medium text-[#292a27]'

/** "/projects" is also active on "/projects/abc". The dashboard ("/") only matches exactly. */
const isActive = (match: string | undefined, pathname: string) =>
  !!match && (match === pathname || (match !== '/' && pathname.startsWith(`${match}/`)))

export default function Sidebar({ open, onNavigate }: Props) {
  const { pathname } = useLocation()
  const compareCount = useCompareStore((s) => s.names.length)
  const profile = useSettingsStore((s) => s.profile)
  const workspace = useSettingsStore((s) => s.workspace)

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col gap-4 overflow-y-auto border-r border-[#e8e4dc] bg-white p-5 transition-transform duration-300 max-lg:-translate-x-full ${
        open ? 'max-lg:translate-x-0' : ''
      }`}
    >
      <Link
        to="/#overview"
        onClick={onNavigate}
        className="flex items-center gap-3 text-[13px] font-semibold tracking-[2px] text-[#292a27] no-underline"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-[#292a27] text-white">
          <Scan size={18} />
        </span>
        <span>AR VISION</span>
      </Link>

      <Link
        to="/settings"
        onClick={onNavigate}
        className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white p-2.5 text-left text-[#292a27] no-underline hover:bg-[#faf8f4]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f5f0e8] text-[11px] font-semibold text-[#b38b60]">
          {initials(workspace.name, 'WS')}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="truncate text-xs font-semibold">{workspace.name}</strong>
          <small className="truncate text-[10px] text-[#89857d]">{workspace.city || 'Personal workspace'}</small>
        </span>
        <ChevronDown size={16} className="shrink-0 text-[#89857d]" />
      </Link>

      <div className="h-px bg-[#eeeae3]" />

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ label, to, icon: Icon, badge, match }) => {
          const count = badge === 'compare' ? compareCount : 0
          return (
            <Link
              key={label}
              to={to}
              onClick={onNavigate}
              aria-current={isActive(match, pathname) ? 'page' : undefined}
              className={`${navLink} ${isActive(match, pathname) ? activeLink : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {count > 0 && (
                <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#292a27] px-1.5 py-0.5 text-[10px] text-white">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-3">
        <Link
          to="/settings"
          className={`${navLink} ${isActive('/settings', pathname) ? activeLink : ''}`}
          aria-current={pathname === '/settings' ? 'page' : undefined}
          onClick={onNavigate}
        >
          <Settings size={17} />
          <span>Settings</span>
        </Link>

        <Link
          to="/#help"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl bg-[#f7f4ee] p-3 text-[#292a27] no-underline"
        >
          <CircleHelp size={18} className="text-[#b38b60]" />
          <span className="flex flex-1 flex-col gap-0.5">
            <strong className="text-xs font-semibold">Need a hand?</strong>
            <small className="text-[10px] text-[#89857d]">Explore our AR guide</small>
          </span>
          <ArrowRight size={14} />
        </Link>

        <div className="flex items-center gap-3 border-t border-[#eeeae3] pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#292a27] text-[11px] font-semibold text-white">
            {initials(profile.fullName)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="truncate text-xs font-semibold">{profile.fullName || 'Your profile'}</strong>
            <small className="truncate text-[10px] text-[#89857d]">{profile.email || 'Add your email in Settings'}</small>
          </span>
          <Link
            to="/settings"
            onClick={onNavigate}
            aria-label="Profile settings"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-[#65635c] hover:bg-[#f5f0e8]"
          >
            <Ellipsis size={16} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
