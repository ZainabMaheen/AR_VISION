import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { buttonClass } from '../../../components/ui/buttonStyles'
import { formatPrice } from '../../business/format'
import { formatArea } from '../area'
import { plural } from '../../../lib/formatters'
import type { AreaUnit } from '../../settings/store'

interface Props {
  materials: number
  totalOrderSqFt: number
  missingAreas: number
  unavailable: number
  showPrices: boolean
  estimateTotal: number
  unit: AreaUnit
}

/** Totals panel for the quote request (no payment). */
export default function CartSummary({ materials, totalOrderSqFt, missingAreas, unavailable, showPrices, estimateTotal, unit }: Props) {
  const blocked = materials === 0 || unavailable > 0

  return (
    <aside className="min-w-0 rounded-2xl border border-[#e8e4dc] bg-white p-5 lg:sticky lg:top-[96px]">
      <h3 className="m-0 text-sm font-semibold">Summary</h3>

      <dl className="m-0 mt-4 flex flex-col gap-2.5 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-[#858179]">Materials</dt>
          <dd className="m-0 font-semibold tabular-nums">{materials}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#858179]">Total to order</dt>
          <dd className="m-0 font-semibold tabular-nums">{totalOrderSqFt > 0 ? formatArea(totalOrderSqFt, unit) : '—'}</dd>
        </div>
        {showPrices && (
          <div className="flex justify-between gap-3 border-t border-[#eeeae3] pt-2.5">
            <dt className="text-[#858179]">Estimated total</dt>
            <dd className="m-0 font-semibold tabular-nums">{estimateTotal > 0 ? formatPrice(estimateTotal) : '—'}</dd>
          </div>
        )}
      </dl>

      {missingAreas > 0 && (
        <p className="m-0 mt-3 text-[11px] leading-[1.5] text-[#86602f]">
          {plural(missingAreas, 'material')} without an area. You can still send the request.
        </p>
      )}
      {unavailable > 0 && (
        <p className="m-0 mt-3 text-[11px] leading-[1.5] text-[#a2463a]">Remove materials that are no longer available to continue.</p>
      )}

      {blocked ? (
        <span aria-disabled="true" className={buttonClass('primary', 'mt-4 w-full cursor-default opacity-50')}>
          Continue
        </span>
      ) : (
        <Link to="/checkout" className={buttonClass('primary', 'mt-4 w-full')}>
          Continue to your details <ArrowRight size={15} />
        </Link>
      )}

      <p className="m-0 mt-3 flex gap-2 text-[11px] leading-[1.6] text-[#858179]">
        <Info size={14} className="mt-0.5 shrink-0 text-[#a67e50]" />
        {showPrices
          ? 'Estimates only. The shop confirms the final price, delivery and fitting in its quote. No payment is taken here.'
          : 'The shop will reply with a quote. No payment is taken here.'}
      </p>
    </aside>
  )
}
