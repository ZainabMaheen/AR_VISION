import { useState } from 'react'
import { Check } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { formatRelative } from '../../../lib/formatters'
import type { SavedScan } from '../../scans/types'

interface Props {
  open: boolean
  /** Saved visualisations not yet in the project. */
  available: SavedScan[]
  onClose: () => void
  onAdd: (ids: string[]) => void
}

/** Pick one or more saved visualisations to add to a project. */
export default function AddScansModal(props: Props) {
  return props.open ? <AddScansInner {...props} /> : null
}

function AddScansInner({ available, onClose, onAdd }: Props) {
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <Modal
      open
      title="Add visualisations"
      description={available.length ? 'Choose saved visualisations to add to this project.' : undefined}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={picked.length === 0} onClick={() => onAdd(picked)}>
            {picked.length ? `Add ${picked.length}` : 'Add'}
          </Button>
        </>
      }
    >
      {available.length === 0 ? (
        <p className="m-0 text-[13px] leading-[1.6] text-[#858179]">
          All your saved visualisations are already in this project. Save more from the AR preview.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {available.map((s) => {
            const on = picked.includes(s.id)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(s.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] border p-2 text-left ${
                    on ? 'border-[#b38b60] bg-[#f5f0e8]' : 'border-[#e8e4dc] bg-white hover:bg-[#faf8f4]'
                  }`}
                >
                  <img src={s.thumbnail} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[13px] font-semibold">{s.name}</strong>
                    <small className="block truncate text-[11px] text-[#858179]">
                      {s.materialName} · {formatRelative(s.createdAt)}
                    </small>
                  </span>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-md border ${
                      on ? 'border-[#b38b60] bg-[#b38b60] text-white' : 'border-[#d9d4ca] bg-white'
                    }`}
                  >
                    {on && <Check size={14} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
