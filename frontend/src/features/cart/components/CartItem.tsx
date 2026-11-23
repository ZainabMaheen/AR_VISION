import { Link } from 'react-router-dom'
import { Camera, Trash2 } from 'lucide-react'
import AreaCalculator from '../../checkout/components/AreaCalculator'
import StockStatusBadge from '../../business/components/StockStatusBadge'
import { formatPrice } from '../../business/format'
import { useCartStore } from '../store'
import type { AreaUnit } from '../../settings/store'
import type { QuoteLine } from '../useQuoteLines'

interface Props {
  line: QuoteLine
  unit: AreaUnit
  showPrices: boolean
}

/** One material in the quote request, with its area calculator. */
export default function CartItem({ line, unit, showPrices }: Props) {
  const setArea = useCartStore((s) => s.setArea)
  const setWastage = useCartStore((s) => s.setWastage)
  const remove = useCartStore((s) => s.remove)
  const { item, material } = line

  const removeBtn = (
    <button
      type="button"
      aria-label={`Remove ${item.materialName} from the quote request`}
      title="Remove"
      onClick={() => remove(item.materialName)}
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[#e8e4dc] bg-white text-[#65635c] hover:border-[#ecd3cc] hover:bg-[#fbf1ee] hover:text-[#a2463a]"
    >
      <Trash2 size={15} />
    </button>
  )

  if (!material) {
    return (
      <li className="flex items-center gap-3 rounded-2xl border border-dashed border-[#e0dbd2] bg-white p-4">
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[13px] font-semibold">{item.materialName}</strong>
          <small className="text-[11px] text-[#a2463a]">No longer available from the shop. Remove it to continue.</small>
        </div>
        {removeBtn}
      </li>
    )
  }

  return (
    <li className="min-w-0 rounded-2xl border border-[#e8e4dc] bg-white p-4">
      <div className="flex min-w-0 items-start gap-3">
        <img src={material.thumb} alt="" className="size-16 shrink-0 rounded-[10px] bg-[#e7dfd2] object-cover" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[10px] font-semibold tracking-[1.1px] text-[#a67e50]">
            {material.category.toUpperCase()} · {material.finish.toUpperCase()}
          </p>
          <h3 className="m-0 mt-0.5 truncate text-[15px] font-medium tracking-[-0.3px]">{material.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StockStatusBadge availability={material.availability} />
            {showPrices && material.price !== null && (
              <span className="text-[12px] font-semibold tabular-nums">
                {formatPrice(material.price)} <small className="font-normal text-[#858179]">/ sq ft</small>
              </span>
            )}
          </div>
        </div>
        {removeBtn}
      </div>

      <div className="mt-4 border-t border-[#eeeae3] pt-4">
        <AreaCalculator
          areaSqFt={item.areaSqFt}
          wastage={item.wastage}
          unit={unit}
          onArea={(a) => setArea(item.materialName, a)}
          onWastage={(w) => setWastage(item.materialName, w)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/arpreview?material=${encodeURIComponent(material.name)}`}
          className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[#292a27] no-underline hover:text-[#b38b60]"
        >
          <Camera size={14} />
          Preview in AR
        </Link>
        {showPrices && line.estimate !== null && (
          <span className="text-[12px] text-[#5f5c55]">
            Estimate <strong className="tabular-nums text-[#292a27]">{formatPrice(line.estimate)}</strong>
          </span>
        )}
        {!showPrices && <span className="text-[11px] text-[#858179]">Price on quote</span>}
      </div>
    </li>
  )
}
