import { type FormEvent, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input, { TextArea } from '../../../components/ui/Input'
import { errorMessage } from '../../../services/apiClient'

export interface ProjectFormValues {
  name: string
  notes: string
}

interface Props {
  open: boolean
  /** Set for "edit", leave out for "create". */
  initial?: ProjectFormValues
  onClose: () => void
  /** May return a promise; an error it throws is shown in the form. */
  onSubmit: (values: ProjectFormValues) => void | Promise<void>
}

/** Create or edit a project (name + notes) in a dialog. */
export default function ProjectForm(props: Props) {
  return props.open ? <ProjectFormInner {...props} /> : null
}

function ProjectFormInner({ initial, onClose, onSubmit }: Props) {
  const editing = initial !== undefined
  const [name, setName] = useState(initial?.name ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) {
      setError('Please give the project a name.')
      return
    }
    setBusy(true)
    try {
      await onSubmit({ name, notes })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={editing ? 'Edit project' : 'New project'}
      description={editing ? undefined : 'Group saved visualisations for one room or job, e.g. “Kitchen renovation”.'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Project name"
          value={name}
          maxLength={60}
          error={error}
          placeholder="e.g. Kitchen renovation"
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
        />
        <TextArea
          label="Notes (optional)"
          value={notes}
          maxLength={500}
          placeholder="Room size, budget, ideas…"
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  )
}
