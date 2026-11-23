import { CheckCircle2, CircleDot, FileText, Truck } from 'lucide-react'
import Badge, { type BadgeTone } from '../../../components/ui/Badge'
import { statusLabel, type EnquiryStatus } from '../types'

const LOOK: Record<EnquiryStatus, { tone: BadgeTone; Icon: typeof CircleDot }> = {
  new: { tone: 'accent', Icon: CircleDot },
  quoted: { tone: 'neutral', Icon: FileText },
  confirmed: { tone: 'success', Icon: CheckCircle2 },
  delivered: { tone: 'dark', Icon: Truck },
}

/** Enquiry status with icon + label. */
export default function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const { tone, Icon } = LOOK[status]
  return (
    <Badge tone={tone} icon={<Icon size={12} className="shrink-0" />}>
      {statusLabel(status)}
    </Badge>
  )
}
