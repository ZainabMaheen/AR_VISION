import { CheckCircle2, RotateCcw, Search } from 'lucide-react'
import type { CategoryFilter, Material } from '../../../types/stone'

const CHIPS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'marble', label: 'Marble' },
  { id: 'granite', label: 'Granite' },
  { id: 'tiles', label: 'Tiles' },
]

interface Props {
  materials: Material[]
  selected: Material
  query: string
  category: CategoryFilter
  onSelect: (m: Material) => void
  onQuery: (v: string) => void
  onCategory: (c: CategoryFilter) => void
  onReset: () => void
}

export function MaterialPicker({
  materials, selected, query, category, onSelect, onQuery, onCategory, onReset,
}: Props) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-[14px] border border-[#e8e4dc] bg-white">
      <div className="border-b border-[#eeeae3] px-[17px] pb-[15px] pt-[19px]">
        <h3 className="m-0 text-sm font-semibold">Materials</h3>
        <p className="m-0 mt-[7px] text-[11px] leading-normal text-[#89857d]">Choose a finish to explore.</p>
      </div>

      <label className="mx-3 mb-3 mt-3.5 flex items-center gap-2 rounded-[9px] border border-[#e8e4dc] p-2.5 text-[#858179]">
        <Search size={15} className="shrink-0" />
        <input
          id="materialSearch"
          type="search"
          placeholder="Find a material..."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="w-full min-w-0 border-0 bg-transparent p-0 text-base text-[#292a27] outline-none min-[651px]:text-[11px]"
        />
      </label>

      <div className="flex flex-wrap gap-1.5 px-3 pb-[13px]">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategory(c.id)}
            className={`cursor-pointer rounded-[20px] border px-[9px] py-[7px] text-[10px] ${
              category === c.id
                ? 'border-[#292a27] bg-[#292a27] text-white'
                : 'border-[#e8e4dc] bg-white text-[#77736c]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div id="materialsList" className="grid grid-cols-2 min-[651px]:flex min-[651px]:flex-col">
        {materials.map((m) => {
          const active = selected.name === m.name
          return (
            <button
              key={m.name}
              type="button"
              onClick={() => onSelect(m)}
              className={`flex w-full cursor-pointer items-center gap-2.5 border-0 border-t border-[#f0ede7] p-3 text-left transition-colors max-[650px]:flex-wrap max-[650px]:items-start max-[650px]:p-2.5 ${
                active ? 'bg-[#f5f0e8] shadow-[inset_3px_0_#b38b60]' : 'bg-white hover:bg-[#faf8f4]'
              }`}
            >
              <span className="size-[38px] shrink-0 overflow-hidden rounded-lg bg-[#e7dfd2] min-[651px]:size-[42px] min-[1401px]:size-12">
                <img src={m.thumb} alt="" className="size-full object-cover" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <strong className="text-[11px] font-semibold leading-[1.4] max-[650px]:text-[10px]">{m.name}</strong>
                <small className="text-[10px] text-[#89857d]">
                  {m.category.charAt(0).toUpperCase() + m.category.slice(1)} · {m.finish}
                </small>
              </span>
              <CheckCircle2 size={16} className={`shrink-0 text-[#b38b60] ${active ? '' : 'invisible'}`} />
            </button>
          )
        })}
      </div>

      <div className="border-t border-[#eeeae3] px-3 py-3.5">
        <button
          id="resetMaterials"
          type="button"
          onClick={onReset}
          className="flex min-h-[39px] w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-[#e8e4dc] bg-white text-[11px] font-semibold hover:bg-[#faf8f4]"
        >
          <RotateCcw size={15} />
          Reset selection
        </button>
      </div>
    </aside>
  )
}

export default MaterialPicker