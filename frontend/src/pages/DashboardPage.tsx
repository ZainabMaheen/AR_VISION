import { ArrowRight, Box, Camera, Check, FileText, Layers, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroSection from '../features/dashboard/components/HeroSection'
import ARPromoBanner from '../features/dashboard/components/ARPromoBanner'
import StoneCard from '../features/catalogue/components/StoneCard'
import EmptyState from '../components/ui/EmptyState'
import { useProjects } from '../features/projects/hooks/useProjects'
import { useScans } from '../features/scans/hooks/useScans'
import { useEnquiriesStore } from '../features/enquiries/store'
import { formatRelative } from '../lib/formatters'
import { useMaterialsStore, useVisibleMaterials } from '../features/catalogue/store'
import Loader from '../components/common/Loader'
import ServerError from '../components/common/ServerError'
import { desc, h2, kicker, pageWrap, textLink } from '../lib/styles'

// Explanation only: not clickable
const SHORTCUTS = [
  { icon: Camera, title: 'Scan New Room', sub: 'Start a new AR visualisation' },
  { icon: Box, title: 'Browse Materials', sub: 'Explore marble, granite and tiles' },
  { icon: Layers, title: 'Compare Materials', sub: 'Compare your shortlisted options' },
]

const ACTIVITY_ICONS = { camera: Camera, 'layout-grid': LayoutGrid, quote: FileText }

export default function DashboardPage() {
  const materials = useVisibleMaterials()
  const projects = useProjects()
  const { scans } = useScans()
  const enquiries = useEnquiriesStore((s) => s.sent)
  const materialsStatus = useMaterialsStore((s) => s.status)
  const materialsError = useMaterialsStore((s) => s.error)
  const scanById = new Map(scans.map((s) => [s.id, s]))

  // Real activity from this browser: saves, projects and quote requests, newest first
  const activity = [
    ...scans.map((s) => ({ key: `s-${s.id}`, icon: 'camera' as const, title: 'Visualisation saved', meta: s.materialName, at: s.createdAt })),
    ...projects.map((p) => ({
      key: `p-${p.id}`,
      icon: 'layout-grid' as const,
      title: p.updatedAt === p.createdAt ? 'Project created' : 'Project updated',
      meta: p.name,
      at: p.updatedAt,
    })),
    ...enquiries.map((e) => ({ key: `e-${e.id}`, icon: 'quote' as const, title: 'Quote request sent', meta: e.reference, at: e.createdAt })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)

  return (
    <div id="overview" className={pageWrap}>
      <HeroSection />
      <ARPromoBanner />

      {/* GET STARTED (info only) */}
      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <p className={kicker}>GET STARTED</p>
            <h2 className={h2}>Make a space yours.</h2>
          </div>
          <span className="text-xs text-[#89857d]">01 — 03</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {SHORTCUTS.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex cursor-default items-center gap-4 rounded-2xl border border-[#e8e4dc] bg-white p-5 text-[#292a27]"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-[#f5f0e8] text-[#b38b60]">
                <Icon size={20} />
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <strong className="text-[13px] font-semibold">{title}</strong>
                <small className="text-[11px] text-[#858179]">{sub}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT PROJECTS (hover only) */}
      <section id="projects" className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <p className={kicker}>YOUR SPACES</p>
            <h2 className={h2}>Recent projects.</h2>
            <p className={desc}>Continue exploring your spaces.</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Group your saved visualisations by room, for example “Kitchen renovation”."
            to="/projects"
            cta="Create a project"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {projects.slice(0, 3).map((p) => {
              const cover = p.scanIds.map((id) => scanById.get(id)).find((s) => s !== undefined)
              return (
                <div key={p.id} className="group relative block h-[280px] cursor-default overflow-hidden rounded-2xl bg-[#d7d0c4]">
                  {cover && (
                    <img
                      src={cover.thumbnail}
                      alt={p.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-[#1c1c19]/75 via-transparent to-transparent p-5 text-white">
                    <span className="text-[10px] font-semibold tracking-[1.4px] text-[#e4d8c5]">
                      {cover ? cover.materialName.toUpperCase() : 'NO VISUALISATIONS YET'}
                    </span>
                    <h3 className="m-0 truncate text-lg font-medium">{p.name}</h3>
                    <small className="text-[11px] text-white/75">Updated {formatRelative(p.updatedAt).toLowerCase()}</small>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* RECOMMENDED MATERIALS */}
      <section id="materials" className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <p className={kicker}>CURATED FOR YOU</p>
            <h2 className={h2}>Recommended materials.</h2>
            <p className={desc}>Finishes that could transform your space.</p>
          </div>
          <Link to="/catalogue" className={textLink}>
            View catalogue <ArrowRight size={14} />
          </Link>
        </div>

        {materials.length === 0 && materialsStatus === 'error' && (
          <ServerError message={materialsError} onRetry={() => void useMaterialsStore.getState().load('public', { force: true })} />
        )}
        {materials.length === 0 && materialsStatus !== 'ready' && materialsStatus !== 'error' && <Loader text="Loading materials…" />}
        <div className="grid gap-4 md:grid-cols-3">
          {materials.slice(0, 3).map((m) => (
            <StoneCard key={m.name} material={m} />
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section id="activity" className="mt-14">
        <p className={kicker}>TIMELINE</p>
        <h2 className={h2}>Recent activity.</h2>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white">
          {activity.length === 0 && (
            <p className="m-0 p-4 text-[13px] text-[#858179]">
              Nothing yet. Save a visualisation, create a project or send a quote request and it will show here.
            </p>
          )}
          {activity.map((a) => {
            const Icon = ACTIVITY_ICONS[a.icon]
            return (
              <div key={a.key} className="flex items-center gap-4 border-t border-[#f0ede7] p-4 first:border-t-0">
                <span className="grid size-10 place-items-center rounded-xl bg-[#f5f0e8] text-[#b38b60]">
                  <Icon size={17} />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <strong className="text-[13px] font-semibold">{a.title}</strong>
                  <small className="text-[11px] text-[#858179]">
                    {a.meta} · {formatRelative(a.at)}
                  </small>
                </span>
                <Check size={16} className="text-[#8b9a78]" />
              </div>
            )
          })}
        </div>
      </section>

      <footer
        id="settings"
        className="mt-14 flex items-center justify-between border-t border-[#e8e4dc] pt-6 text-xs text-[#858179]"
      >
        <span>© 2026 AR Vision</span>
        <a href="#help" id="help" className="text-[#292a27] no-underline hover:text-[#b38b60]">
          Need help?
        </a>
      </footer>
    </div>
  )
}