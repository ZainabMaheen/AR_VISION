import { type FormEvent, useState } from 'react'
import { Check } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { errorMessage } from '../../../services/apiClient'
import { useProjects } from '../../projects/hooks/useProjects'
import { useProjectsStore } from '../../projects/store'
import type { SavedScan } from '../types'

interface Props {
  scan: SavedScan | null
  onClose: () => void
  onDone: (projectName: string) => void
}

/** Put one saved visualisation into an existing or a new project. */
export default function AddToProjectModal({ scan, onClose, onDone }: Props) {
  return scan ? <AddInner key={scan.id} scan={scan} onClose={onClose} onDone={onDone} /> : null
}

function AddInner({ scan, onClose, onDone }: { scan: SavedScan; onClose: () => void; onDone: (projectName: string) => void }) {
  const projects = useProjects()
  const create = useProjectsStore((s) => s.create)
  const addScans = useProjectsStore((s) => s.addScans)
  const [choice, setChoice] = useState<string>(projects[0]?.id ?? 'new')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (choice === 'new' && !newName.trim()) return setError('Please give the new project a name.')
    setBusy(true)
    setError(null)
    try {
      if (choice === 'new') {
        const p = await create(newName)
        await addScans(p.id, [scan.id])
        onDone(p.name)
        return
      }
      const p = projects.find((x) => x.id === choice)
      if (!p) return setBusy(false)
      await addScans(p.id, [scan.id])
      onDone(p.name)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const option = (active: boolean) =>
    `flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left text-[13px] ${
      active ? 'border-[#b38b60] bg-[#f5f0e8]' : 'border-[#e8e4dc] bg-white hover:bg-[#faf8f4]'
    }`

  return (
    <Modal
      open
      title="Add to project"
      description={`Choose where to keep “${scan.name}”.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-to-project-form" disabled={busy}>
            Add to project
          </Button>
        </>
      }
    >
      <form id="add-to-project-form" onSubmit={submit} className="flex flex-col gap-2">
        {projects.map((p) => {
          const already = p.scanIds.includes(scan.id)
          return (
            <button key={p.id} type="button" onClick={() => setChoice(p.id)} className={option(choice === p.id)}>
              <span className="min-w-0 flex-1">
                <strong className="block truncate font-semibold">{p.name}</strong>
                <small className="text-[11px] text-[#858179]">{already ? 'Already in this project' : `${p.scanIds.length} saved`}</small>
              </span>
              {choice === p.id && <Check size={16} className="shrink-0 text-[#b38b60]" />}
            </button>
          )
        })}

        <button type="button" onClick={() => setChoice('new')} className={option(choice === 'new')}>
          <span className="flex-1 font-semibold">+ New project</span>
          {choice === 'new' && <Check size={16} className="shrink-0 text-[#b38b60]" />}
        </button>

        {choice === 'new' && (
          <Input
            className="mt-2"
            label="Project name"
            value={newName}
            maxLength={60}
            error={error}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Kitchen renovation"
          />
        )}
        {error && choice !== 'new' && (
          <p role="alert" className="m-0 mt-2 rounded-[9px] bg-[#fbf1ee] p-3 text-[11px] leading-[1.6] text-[#a2463a]">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
