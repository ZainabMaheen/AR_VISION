import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/useToast'
import Loader from '../components/common/Loader'
import { errorMessage } from '../services/apiClient'
import ProjectForm from '../features/projects/components/ProjectForm'
import ProjectVisualisations from '../features/projects/components/ProjectVisualisations'
import AddScansModal from '../features/projects/components/AddScansModal'
import { useProject } from '../features/projects/hooks/useProjects'
import { useProjectsStore } from '../features/projects/store'
import { formatDate, plural } from '../lib/formatters'
import { pageWrap, textLink } from '../lib/styles'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, scans, allScans, loading } = useProject(projectId)
  const update = useProjectsStore((s) => s.update)
  const removeProject = useProjectsStore((s) => s.remove)
  const addScans = useProjectsStore((s) => s.addScans)
  const removeScan = useProjectsStore((s) => s.removeScan)
  const { showToast, toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [adding, setAdding] = useState(false)

  const back = (
    <Link to="/projects" className={`${textLink} mb-5 min-h-10`}>
      <ArrowLeft size={14} />
      All projects
    </Link>
  )

  if (!project && loading) {
    return (
      <div className={pageWrap}>
        {back}
        <Loader text="Loading project…" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className={pageWrap}>
        {back}
        <EmptyState
          title="Project not found"
          description="It may have been deleted, or it belongs to another account."
          to="/projects"
          cta="Back to projects"
        />
      </div>
    )
  }

  const available = allScans.filter((s) => !project.scanIds.includes(s.id))

  return (
    <div className={pageWrap}>
      {back}

      <PageHeader
        eyebrow="PROJECT"
        title={project.name}
        description={
          <>
            {plural(scans.length, 'visualisation')} · Created {formatDate(project.createdAt)}
          </>
        }
        actions={
          <>
            <Button className="flex-1 sm:flex-none" onClick={() => setAdding(true)}>
              <Plus size={15} />
              Add visualisations
            </Button>
            <Button variant="secondary" aria-label="Edit project" title="Edit project" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              <span className="max-sm:hidden">Edit</span>
            </Button>
            <Button variant="danger" aria-label="Delete project" title="Delete project" onClick={() => setDeleting(true)}>
              <Trash2 size={15} />
              <span className="max-sm:hidden">Delete</span>
            </Button>
          </>
        }
      />

      {project.notes && (
        <p className="m-0 mb-6 max-w-[720px] whitespace-pre-line break-words rounded-[12px] border border-[#e8e4dc] bg-white p-4 text-[13px] leading-[1.6] text-[#5f5c55]">
          {project.notes}
        </p>
      )}

      <ProjectVisualisations
        scans={scans}
        loading={loading}
        hasSavedScans={allScans.length > 0}
        onAdd={() => setAdding(true)}
        onRemove={async (scan) => {
          try {
            await removeScan(project.id, scan.id)
            showToast(`“${scan.name}” removed from this project. It is still in Scan history.`)
          } catch (err) {
            showToast(errorMessage(err))
          }
        }}
      />

      <ProjectForm
        open={editing}
        initial={{ name: project.name, notes: project.notes }}
        onClose={() => setEditing(false)}
        onSubmit={async (values) => {
          await update(project.id, values)
          setEditing(false)
          showToast('Project updated.')
        }}
      />

      <AddScansModal
        open={adding}
        available={available}
        onClose={() => setAdding(false)}
        onAdd={async (ids) => {
          try {
            await addScans(project.id, ids)
            setAdding(false)
            showToast(`${plural(ids.length, 'visualisation')} added.`)
          } catch (err) {
            showToast(errorMessage(err))
          }
        }}
      />

      <ConfirmDialog
        open={deleting}
        title="Delete project?"
        message={`“${project.name}” will be deleted. Its saved visualisations stay in Scan history.`}
        confirmLabel="Delete project"
        danger
        onConfirm={async () => {
          await removeProject(project.id)
          navigate('/projects')
        }}
        onClose={() => setDeleting(false)}
      />

      {toast}
    </div>
  )
}
