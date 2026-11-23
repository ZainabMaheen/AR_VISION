import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import StockStatusBadge from './StockStatusBadge'
import { formatPrice } from '../format'
import { capitalise } from '../../../lib/materials'
import type { CatalogueMaterial } from '../../catalogue/types'

interface Props {
  items: CatalogueMaterial[]
  onToggleHidden: (m: CatalogueMaterial) => void
  onEdit: (m: CatalogueMaterial) => void
  onDelete: (m: CatalogueMaterial) => void
}

// 40px on phones; 32px in the dense desktop table
const iconBtn =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-[8px] border border-[#e8e4dc] bg-white text-[#65635c] hover:bg-[#f5f0e8] lg:size-8'
const dangerBtn = `${iconBtn} hover:!border-[#ecd3cc] hover:!bg-[#fbf1ee] hover:!text-[#a2463a]`

function VisibilitySwitch({ m, onToggle }: { m: CatalogueMaterial; onToggle: () => void }) {
  const on = !m.hidden
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Show ${m.name} to customers`}
      onClick={onToggle}
      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[8px] px-1 text-[12px] font-semibold text-[#5f5c55] lg:min-h-8"
    >
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-[#b38b60]' : 'bg-[#d9d4ca]'}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      {on ? <Eye size={13} /> : <EyeOff size={13} />}
      {on ? 'Shown' : 'Hidden'}
    </button>
  )
}

const Thumb = ({ m, size }: { m: CatalogueMaterial; size: string }) => (
  <img src={m.thumb} alt="" loading="lazy" className={`${size} shrink-0 rounded-[6px] bg-[#e7dfd2] object-cover`} />
)

/** Dense table from 1024px, stacked cards below. */
export default function StockList({ items, onToggleHidden, onEdit, onDelete }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[12px] border border-[#e8e4dc] bg-white lg:block">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="bg-[#faf8f4]">
            <tr className="border-b border-[#eeeae3] text-[10px] tracking-[1.1px] text-[#a67e50]">
              <th scope="col" className="px-3 py-2 font-semibold">MATERIAL</th>
              <th scope="col" className="px-3 py-2 font-semibold">CATEGORY</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">PRICE / SQ FT</th>
              <th scope="col" className="px-3 py-2 font-semibold">AVAILABILITY</th>
              <th scope="col" className="px-3 py-2 font-semibold">CUSTOMERS</th>
              <th scope="col" className="px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className={`border-b border-[#f0ede7] last:border-0 hover:bg-[#fffdf9] ${m.hidden ? 'text-[#858179]' : ''}`}>
                <td className="px-3 py-1.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Thumb m={m} size="size-8" />
                    <div className="min-w-0">
                      <strong className="block max-w-[260px] truncate font-semibold">{m.name}</strong>
                      <small className="block max-w-[260px] truncate text-[11px] text-[#858179]">{m.finish} · {m.tone}</small>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5">{capitalise(m.category)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{m.price === null ? '—' : formatPrice(m.price)}</td>
                <td className="px-3 py-1.5">
                  <StockStatusBadge availability={m.availability} />
                </td>
                <td className="px-3 py-1.5">
                  <VisibilitySwitch m={m} onToggle={() => onToggleHidden(m)} />
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex justify-end gap-1">
                    <button type="button" aria-label={`Edit ${m.name}`} title="Edit" onClick={() => onEdit(m)} className={iconBtn}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" aria-label={`Delete ${m.name}`} title="Delete" onClick={() => onDelete(m)} className={dangerBtn}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2 lg:hidden">
        {items.map((m) => (
          <li key={m.id} className={`min-w-0 rounded-[12px] border border-[#e8e4dc] p-3 ${m.hidden ? 'bg-[#faf8f4]' : 'bg-white'}`}>
            <div className="flex min-w-0 items-start gap-3">
              <Thumb m={m} size="size-12" />
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[13px] font-semibold">{m.name}</strong>
                <small className="block truncate text-[11px] text-[#858179]">
                  {capitalise(m.category)} · {m.finish}
                </small>
                <span className="mt-0.5 block text-[13px] font-semibold tabular-nums">
                  {m.price === null ? '—' : formatPrice(m.price)} <small className="text-[11px] font-normal text-[#858179]">/ sq ft</small>
                </span>
              </div>
              <StockStatusBadge availability={m.availability} />
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#eeeae3] pt-2.5">
              <VisibilitySwitch m={m} onToggle={() => onToggleHidden(m)} />
              <div className="flex gap-1.5">
                <button type="button" aria-label={`Edit ${m.name}`} onClick={() => onEdit(m)} className={iconBtn}>
                  <Pencil size={15} />
                </button>
                <button type="button" aria-label={`Delete ${m.name}`} onClick={() => onDelete(m)} className={dangerBtn}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
