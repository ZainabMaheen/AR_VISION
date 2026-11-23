import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search } from 'lucide-react'
import StoneCard from '../features/catalogue/components/StoneCard'
import EmptyState from '../components/ui/EmptyState'
import { useMaterialsStore, useVisibleMaterials } from '../features/catalogue/store'
import Loader from '../components/common/Loader'
import ServerError from '../components/common/ServerError'
import { desc, h2, kicker, pageWrap } from '../lib/styles'
import type { CategoryFilter } from '../types/stone'
import type { LayoutContext } from '../app/layouts/DashboardLayout'

const CHIPS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'marble', label: 'Marble' },
  { id: 'granite', label: 'Granite' },
  { id: 'tiles', label: 'Tiles' },
]

export default function MaterialCataloguePage() {
  const { globalSearch } = useOutletContext<LayoutContext>()
  const [query, setQuery] = useState(globalSearch)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const materials = useVisibleMaterials()
  const status = useMaterialsStore((s) => s.status)
  const loadError = useMaterialsStore((s) => s.error)
  const reload = () => void useMaterialsStore.getState().load('public', { force: true })

  // Topbar search drives this page too
  useEffect(() => {
    setQuery(globalSearch)
  }, [globalSearch])

  const visible = useMemo(() => {
    const s = query.trim().toLowerCase()
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(s) ||
        m.category.toLowerCase().includes(s) ||
        m.finish.toLowerCase().includes(s) ||
        m.tone.toLowerCase().includes(s)
      return matchesSearch && (category === 'all' || m.category === category)
    })
  }, [materials, query, category])

  return (
    <div className={pageWrap}>
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={kicker}>MATERIAL CATALOGUE</p>
          <h2 className={h2}>Explore finishes.</h2>
          <p className={desc}>Save the ones you like, preview them in your room, or compare them side by side.</p>
        </div>

        <label className="flex w-full items-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white px-3 py-2.5 text-[#858179] md:w-[280px]">
          <Search size={15} className="shrink-0" />
          <input
            type="search"
            placeholder="Find a material..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-w-0 border-0 bg-transparent p-0 text-xs text-[#292a27] outline-none"
          />
        </label>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`cursor-pointer rounded-[20px] border px-3 py-[7px] text-[11px] ${
                category === c.id
                  ? 'border-[#292a27] bg-[#292a27] text-white'
                  : 'border-[#e8e4dc] bg-white text-[#77736c]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#89857d]">
          {visible.length} {visible.length === 1 ? 'material' : 'materials'}
        </span>
      </div>

      {status === 'error' && materials.length > 0 && <ServerError compact message={loadError} onRetry={reload} />}

      {materials.length === 0 && status !== 'ready' ? (
        status === 'error' ? <ServerError message={loadError} onRetry={reload} /> : <Loader text="Loading materials…" />
      ) : visible.length === 0 ? (
        <EmptyState title="No materials found" description="Try a different search or switch the category filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <StoneCard key={m.name} material={m} />
          ))}
        </div>
      )}
    </div>
  )
}