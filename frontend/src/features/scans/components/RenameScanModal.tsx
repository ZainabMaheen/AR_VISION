import { type FormEvent, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { useScansStore } from '../store'
import type { SavedScan } from '../types'

interface Props {
  scan: SavedScan | null
  onClose: () => void
  onDone: (name: string) => void
}

export default function RenameScanModal({ scan, onClose, onDone }: Props) {
  return scan ? <RenameInner key={scan.id} scan={scan} onClose={onClose} onDone={onDone} /> : null
}

function RenameInner({ scan, onClose, onDone }: { scan: SavedScan; onClose: () => void; onDone: (name: string) => void }) {
  const rename = useScansStore((s) => s.rename)
  const [name, setName] = useState(scan.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter a name.')
    setBusy(true)
    try {
      await rename(scan.id, name)
      onDone(name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The name could not be saved.')
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="Rename visualisation"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="rename-scan-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save name'}
          </Button>
        </>
      }
    >
      <form id="rename-scan-form" onSubmit={submit}>
        <Input label="Name" value={name} maxLength={80} error={error} onChange={(e) => setName(e.target.value)} />
      </form>
    </Modal>
  )
}
