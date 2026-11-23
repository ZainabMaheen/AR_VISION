import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { buttonClass } from '../components/ui/buttonStyles'
import { useEnquiriesStore } from '../features/enquiries/store'
import { formatArea } from '../features/cart/area'
import { useSettingsStore } from '../features/settings/store'
import { useBusinessSettings } from '../features/business/settingsStore'
import { formatDateTime, plural } from '../lib/formatters'
import { pageWrap } from '../lib/styles'

/** Confirmation after a quote request is sent (no payment). */
export default function OrderSuccessPage() {
  const { enquiryId } = useParams()
  const enquiry = useEnquiriesStore((s) => s.sent.find((e) => e.id === enquiryId))
  const unit = useSettingsStore((s) => s.preferences.units)
  const shop = useBusinessSettings((s) => s.settings)

  if (!enquiry) {
    return (
      <div className={pageWrap}>
        <EmptyState
          title="Request not found"
          description="This confirmation link is not available in this browser."
          to="/"
          cta="Go to dashboard"
        />
      </div>
    )
  }

  return (
    <div className={pageWrap}>
      <div className="mx-auto max-w-[620px]">
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 text-center sm:p-8">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#f3f6ef] text-[#8b9a78]">
            <CheckCircle2 size={24} />
          </span>
          <p className="m-0 mt-4 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">REQUEST SENT</p>
          <h2 className="m-0 mt-1 text-[24px] font-medium tracking-[-0.6px]">
            Thank you, <em className="font-normal italic text-[#b38b60]">{enquiry.contact.name.split(' ')[0] || 'there'}.</em>
          </h2>
          <p className="m-0 mt-2 text-[13px] leading-[1.6] text-[#858179]">
            {shop.shopName || 'The shop'} will reply to <strong className="text-[#292a27]">{enquiry.contact.email}</strong> with a quote.
          </p>
          <p className="m-0 mt-4 inline-block rounded-[10px] bg-[#faf8f4] px-4 py-2 text-[13px]">
            Reference <strong className="font-mono tracking-[1px]">{enquiry.reference}</strong>
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-[#e8e4dc] bg-white p-5">
          <h3 className="m-0 text-sm font-semibold">What you asked for</h3>
          <p className="m-0 mt-1 text-[11px] text-[#858179]">
            Sent {formatDateTime(enquiry.createdAt)}
            {enquiry.scanIds.length > 0 ? ` · ${plural(enquiry.scanIds.length, 'visualisation')} attached` : ''}
          </p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {enquiry.lines.map((l) => (
              <li key={l.materialName} className="flex justify-between gap-3 border-t border-[#f0ede7] pt-2 text-[13px] first:border-0 first:pt-0">
                <span className="min-w-0 truncate font-semibold">{l.materialName}</span>
                <span className="shrink-0 text-[12px] text-[#5f5c55]">{l.orderSqFt > 0 ? formatArea(l.orderSqFt, unit) : 'Area to confirm'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl bg-[#f7f4ee] p-5 text-[12px] leading-[1.7] text-[#5f5c55]">
          <strong className="mb-1 block text-[13px] text-[#292a27]">What happens next</strong>
          The shop checks availability and sends you a quote. Before you order, view a physical sample: colour and veining vary
          between slabs. No payment has been taken.
        </section>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/catalogue" className={buttonClass('primary')}>
            Keep browsing
          </Link>
          <Link to="/" className={buttonClass('secondary')}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
