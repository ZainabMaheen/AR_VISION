import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/useToast'
import Loader from '../../components/common/Loader'
import ServerError from '../../components/common/ServerError'
import { errorMessage } from '../../services/apiClient'
import StockList from '../../features/business/components/StockList'
import MaterialFormModal from '../../features/business/components/MaterialFormModal'
import { useMaterialsStore } from '../../features/catalogue/store'
import { bizWrap } from '../../features/business/format'
import type { CatalogueMaterial } from '../../features/catalogue/types'
import { kicker } from '../../lib/styles'

type Filter = 'all' | 'shown' | 'hidden' | 'out'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'shown', label: 'Shown' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'out', label: 'Out of stock' },
]

const matches = (m: CatalogueMaterial, f: Filter) =>
  f === 'all' || (f === 'shown' && !m.hidden) || (f === 'hidden' && m.hidden) || (f === 'out' && m.availability === 'out-of-stock')

export default function StockManagerPage() {
  const items = useMaterialsStore((s) => s.items)
  const setHidden = useMaterialsStore((s) => s.setHidden)
  const remove = useMaterialsStore((s) => s.remove)
  const status = useMaterialsStore((s) => s.status)
  const loadError = useMaterialsStore((s) => s.error)
  const reload = () => void useMaterialsStore.getState().load('staff', { force: true })
  const { showToast, toast } = useToast()

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<CatalogueMaterial | null>(null)
  const [deleting, setDeleting] = useState<CatalogueMaterial | null>(null)

  const term = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      items
        .filter((m) => matches(m, filter))
        .filter((m) => !term || `${m.name} ${m.category} ${m.finish} ${m.tone}`.toLowerCase().includes(term))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, filter, term],
  )

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn()
    } catch (e) {
      showToast(errorMessage(e, 'That change could not be saved.'))
    }
  }

  return (
    <div className={bizWrap}>
      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={kicker}>STOCK</p>
          <h2 className="m-0 text-[22px] font-medium leading-[1.2] tracking-[-0.6px] sm:text-[24px]">Stock manager.</h2>
          <p className="m-0 mt-1.5 text-[12px] leading-[1.6] text-[#858179]">
            {items.length} materials. Hidden ones never appear in the customer catalogue or AR preview.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setAdding(true)}>
          <Plus size={15} />
          Add material
        </Button>
      </section>

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
          {FILTERS.map((f) => {
            const n = items.filter((m) => matches(m, f.id)).length
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`min-h-10 cursor-pointer rounded-[8px] border px-3 text-[12px] md:min-h-8 ${
                  filter === f.id ? 'border-[#b38b60] bg-[#f5f0e8] font-semibold text-[#292a27]' : 'border-[#e8e4dc] bg-white text-[#68665e] hover:bg-[#faf8f4]'
                }`}
              >
                {f.label} <span className="tabular-nums text-[#858179]">{n}</span>
              </button>
            )
          })}
        </div>

        <label className="flex items-center gap-2 rounded-[8px] border border-[#e8e4dc] bg-white pl-2.5 text-[#858179] md:w-[260px]">
          <Search size={14} className="shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, finish, tone…"
            aria-label="Search materials"
            className="min-h-10 w-full min-w-0 border-0 bg-transparent py-2 pr-2.5 text-base text-[#292a27] outline-none placeholder:text-[#a9a59d] sm:text-[13px] md:min-h-8"
          />
        </label>
      </div>

      {status === 'error' && items.length > 0 && <ServerError compact message={loadError} onRetry={reload} />}

      {items.length === 0 && status !== 'ready' ? (
        status === 'error' ? <ServerError message={loadError} onRetry={reload} /> : <Loader text="Loading materials…" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-[#e0dbd2] bg-white px-6 py-12 text-center">
          <h3 className="m-0 text-[15px] font-medium">No materials yet</h3>
          <p className="m-0 max-w-[340px] text-[12px] leading-[1.6] text-[#858179]">
            Add your first material, or restore the samples in Shop settings.
          </p>
          <Button className="mt-3" onClick={() => setAdding(true)}>
            <Plus size={15} />
            Add material
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing matches" description="Try another search, or set the filter back to All." />
      ) : (
        <StockList
          items={visible}
          onToggleHidden={(m) =>
            void run(async () => {
              await setHidden(m.id, !m.hidden)
              showToast(m.hidden ? `${m.name} is now shown to customers.` : `${m.name} is now hidden from customers.`)
            })
          }
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <MaterialFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={(name) => {
          setAdding(false)
          showToast(`${name} added.`)
        }}
      />

      <MaterialFormModal
        key={editing?.id ?? 'none'}
        open={editing !== null}
        material={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSaved={(name) => {
          setEditing(null)
          showToast(`${name} updated.`)
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete material?"
        message={`“${deleting?.name ?? ''}” will be removed from the stock list and the customer catalogue. To keep it but stop showing it, hide it instead.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleting) return
          await remove(deleting.id)
          showToast(`${deleting.name} deleted.`)
        }}
        onClose={() => setDeleting(null)}
      />

      {toast}
    </div>
  )
}
