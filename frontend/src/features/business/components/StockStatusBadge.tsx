import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { availabilityLabel } from '../format'
import type { Availability } from '../../catalogue/types'

// Status colours always come with an icon and a label, never colour alone
const STYLES: Record<Availability, string> = {
  'in-stock': 'border-[#d8e0cf] bg-[#f3f6ef] text-[#5d6b4d]',
  'made-to-order': 'border-[#e6d9c6] bg-[#faf5ec] text-[#86602f]',
  'out-of-stock': 'border-[#ecd3cc] bg-[#fbf1ee] text-[#a2463a]',
}

const ICONS = { 'in-stock': CheckCircle2, 'made-to-order': Clock3, 'out-of-stock': XCircle } as const

/** Availability badge: In stock / Made to order / Out of stock. */
export default function StockStatusBadge({ availability }: { availability: Availability }) {
  const Icon = ICONS[availability]
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STYLES[availability]}`}>
      <Icon size={12} className="shrink-0" />
      {availabilityLabel(availability)}
    </span>
  )
}
