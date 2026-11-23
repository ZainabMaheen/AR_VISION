import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

/** "Are you sure?" dialog. Shows an error if the action fails, instead of closing. */
export default function ConfirmDialog(props: Props) {
  return props.open ? <ConfirmInner {...props} /> : null
}

function ConfirmInner({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={title}
      description={message}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => void confirm()} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="m-0 rounded-[9px] bg-[#fbf1ee] p-3 text-[11px] leading-[1.6] text-[#a2463a]">
          {error}
        </p>
      )}
    </Modal>
  )
}
