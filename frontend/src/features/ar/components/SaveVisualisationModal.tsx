import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Save } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input, { fieldClass } from '../../../components/ui/Input'
import { buttonClass } from '../../../components/ui/buttonStyles'
import { useAuthStore } from '../../auth/store'
import { useProjects } from '../../projects/hooks/useProjects'
import { useScansStore } from '../../scans/store'
import { useProjectsStore } from '../../projects/store'
import { makeThumbnail, photoForSaving, thumbnailFromUrl } from '../../scans/utils/thumbnail'
import type { SavedScan } from '../../scans/types'
import type { Quad } from '../utils/homography'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (scan: SavedScan, projectName: string | null) => void
  /** The WebGL preview canvas (photo + stone), used for the thumbnail. */
  getPreviewCanvas: () => HTMLCanvasElement | null
  photoSrc: string
  corners: Quad
  materialName: string
  tilesX: number
  tilesY: number
  lighting: number
  defaultName: string
}

const NEW_PROJECT = '__new__'

export default function SaveVisualisationModal(props: Props) {
  // Mounted only while open, so the form starts fresh every time
  return props.open ? <SaveDialog {...props} /> : null
}

function SaveDialog({
  onClose, onSaved, getPreviewCanvas, photoSrc, corners, materialName, tilesX, tilesY, lighting, defaultName,
}: Props) {
  const projects = useProjects()
  const user = useAuthStore((s) => s.user)
  const createProject = useProjectsStore((s) => s.create)
  const addScans = useProjectsStore((s) => s.addScans)
  const addScan = useScansStore((s) => s.add)
  const persistent = useScansStore((s) => s.persistent)

  const [name, setName] = useState(defaultName)
  const [projectId, setProjectId] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Saving needs an account: show a friendly prompt instead of an error
  if (!user) {
    return (
      <Modal
        open
        title="Sign in to save"
        description="Saved visualisations are kept in your free account, so you can open them again on any device."
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Not now
            </Button>
            <Link to="/login?next=%2Farpreview" className={buttonClass('primary')}>
              <LogIn size={15} />
              Sign in or create an account
            </Link>
          </>
        }
      >
        <p className="m-0 text-[12px] leading-[1.6] text-[#77736b]">
          Signing in leaves this page, so mark the surface again afterwards. Browsing, favourites, comparisons and quote
          requests all work without an account.
        </p>
      </Modal>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (projectId === NEW_PROJECT && !newProjectName.trim()) {
      setError('Give the new project a name, or choose another option.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Thumbnail of the finished preview; fall back to the plain photo
      const canvas = getPreviewCanvas()
      const thumbnail = (canvas && makeThumbnail(canvas)) || (await thumbnailFromUrl(photoSrc))
      if (!thumbnail) throw new Error('A preview image could not be created for this visualisation.')
      const photo = await photoForSaving(photoSrc)

      const scan = await addScan({ name, materialName, photo, thumbnail, corners, tilesX, tilesY, lighting })

      let projectName: string | null = null
      if (projectId === NEW_PROJECT) {
        const p = await createProject(newProjectName)
        await addScans(p.id, [scan.id])
        projectName = p.name
      } else if (projectId) {
        await addScans(projectId, [scan.id])
        projectName = projects.find((p) => p.id === projectId)?.name ?? null
      }
      onSaved(scan, projectName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The visualisation could not be saved.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title="Save visualisation"
      description="Keep this preview so you can open it again, compare it, or add it to a project."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="save-visualisation-form" disabled={saving}>
            <Save size={15} />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="save-visualisation-form" onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen floor" />

        <div>
          <label htmlFor="save-project" className="mb-1.5 block text-[11px] font-semibold text-[#49463f]">
            Add to a project (optional)
          </label>
          <select
            id="save-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={`${fieldClass} min-h-[42px] cursor-pointer`}
          >
            <option value="">Don&rsquo;t add to a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={NEW_PROJECT}>+ New project…</option>
          </select>
        </div>

        {projectId === NEW_PROJECT && (
          <Input
            label="New project name"
            value={newProjectName}
            maxLength={60}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="e.g. Kitchen renovation"
          />
        )}

        <p className="m-0 rounded-[9px] bg-[#f7f4ee] p-3 text-[11px] leading-[1.6] text-[#77736b]">
          {persistent
            ? `Saved to your account (${user.email}), so you can open it on any device.`
            : 'This visualisation could not be saved.'}
        </p>

        {error && (
          <p role="alert" className="m-0 rounded-[9px] bg-[#fbf1ee] p-3 text-[11px] leading-[1.6] text-[#a2463a]">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
