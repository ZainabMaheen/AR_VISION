import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Loader from '../components/common/Loader'
import ServerError from '../components/common/ServerError'
import ProjectCard from '../features/projects/components/ProjectCard'
import ProjectForm from '../features/projects/components/ProjectForm'
import { useProjects } from '../features/projects/hooks/useProjects'
import { useProjectsStore } from '../features/projects/store'
import { useScans } from '../features/scans/hooks/useScans'
import type { SavedScan } from '../features/scans/types'
import { plural } from '../lib/formatters'
import { pageWrap } from '../lib/styles'
import type { LayoutContext } from '../app/layouts/DashboardLayout'

export default function ProjectsPage() {
  const { globalSearch } = useOutletContext<LayoutContext>()
  const navigate = useNavigate()
  const projects = useProjects()
  const create = useProjectsStore((s) => s.create)
  const status = useProjectsStore((s) => s.status)
  const loadError = useProjectsStore((s) => s.error)
  const { scans } = useScans()
  const [creating, setCreating] = useState(false)

  const byId = new Map(scans.map((s) => [s.id, s]))
  const scansFor = (ids: string[]) => ids.map((id) => byId.get(id)).filter((s): s is SavedScan => s !== undefined)

  const term = globalSearch.trim().toLowerCase()
  const visible = term ? projects.filter((p) => `${p.name} ${p.notes}`.toLowerCase().includes(term)) : projects

  return (
    <div className={pageWrap}>
      <PageHeader
        eyebrow="YOUR SPACES"
        title={
          <>
            My <em className="font-normal italic text-[#b38b60]">projects.</em>
          </>
        }
        description={
          projects.length
            ? `${plural(projects.length, 'project')}. Group saved visualisations by room or job.`
            : 'Group saved visualisations by room or job.'
        }
        actions={
          projects.length > 0 && (
            <Button className="w-full sm:w-auto" onClick={() => setCreating(true)}>
              <Plus size={15} />
              New project
            </Button>
          )
        }
      />

      {projects.length === 0 && (status === 'idle' || status === 'loading') ? (
        <Loader text="Loading projects…" />
      ) : projects.length === 0 && status === 'error' ? (
        <ServerError message={loadError} onRetry={() => void useProjectsStore.getState().load({ force: true })} />
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#e0dbd2] bg-white px-6 py-14 text-center">
          <h3 className="m-0 text-[17px] font-medium tracking-[-0.4px]">No projects yet</h3>
          <p className="m-0 max-w-[360px] text-[13px] leading-[1.6] text-[#858179]">
            Create a project for a room, like “Kitchen renovation”, then add your saved visualisations to it.
          </p>
          <Button className="mt-4" onClick={() => setCreating(true)}>
            <Plus size={15} />
            Create your first project
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" description={`No project matches “${globalSearch.trim()}”.`} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} scans={scansFor(p.scanIds)} />
          ))}
        </div>
      )}

      <ProjectForm
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={async ({ name, notes }) => {
          const p = await create(name, notes)
          setCreating(false)
          navigate(`/projects/${encodeURIComponent(p.id)}`)
        }}
      />
    </div>
  )
}
