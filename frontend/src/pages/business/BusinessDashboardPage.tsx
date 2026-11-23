import { Link } from 'react-router-dom'
import { ArrowRight, Inbox } from 'lucide-react'
import KpiTile from '../../features/business/components/KpiTile'
import { useCatalogueCounts } from '../../features/business/catalogue'
import { useBusinessSettings } from '../../features/business/settingsStore'
import { bizCard, bizCardHead, bizWrap } from '../../features/business/format'
import { useEnquiriesStore } from '../../features/enquiries/store'
import EnquiryStatusBadge from '../../features/enquiries/components/EnquiryStatusBadge'
import ServerError from '../../components/common/ServerError'
import { formatRelative, plural } from '../../lib/formatters'
import { kicker, textLink } from '../../lib/styles'

export default function BusinessDashboardPage() {
  const shopName = useBusinessSettings((s) => s.settings.shopName)
  const counts = useCatalogueCounts()
  const enquiries = useEnquiriesStore((s) => s.enquiries)
  const newCount = enquiries.filter((e) => e.status === 'new').length
  const enquiriesLoading = useEnquiriesStore((s) => s.status === 'idle' || s.status === 'loading')
  // Visualisations customers attached to quote requests (their other saves are private)
  const attachments = enquiries.flatMap((e) => e.attachments.map((a) => ({ ...a, enquiryId: e.id, reference: e.reference, at: e.createdAt })))
  const recent = attachments.slice(0, 6)
  const enquiriesError = useEnquiriesStore((s) => (s.status === 'error' ? s.error : null))

  return (
    <div className={bizWrap}>
      <section className="mb-5">
        <p className={kicker}>OVERVIEW</p>
        <h2 className="m-0 text-[22px] font-medium leading-[1.2] tracking-[-0.6px] sm:text-[24px]">
          {shopName || 'Your shop'} <em className="font-normal italic text-[#b38b60]">at a glance.</em>
        </h2>
      </section>

      {enquiriesError && (
        <ServerError compact message={enquiriesError} note="Enquiry figures may be missing." onRetry={() => void useEnquiriesStore.getState().load()} />
      )}

      <section aria-label="Key figures" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <KpiTile
          label="MATERIALS"
          value={counts.visible}
          detail={counts.hidden ? `shown · ${counts.hidden} hidden` : `shown to customers`}
          to="/business/stock"
        />
        <KpiTile label="VISUALISATIONS" value={enquiriesLoading && !enquiries.length ? '…' : attachments.length} detail="sent with enquiries" />
        <div className="col-span-2 sm:col-span-1">
          <KpiTile
            label="ENQUIRIES"
            value={enquiries.length}
            detail={newCount ? `${newCount} new` : enquiries.length ? 'none new' : 'none yet'}
            to="/business/enquiries"
          />
        </div>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={bizCard} aria-labelledby="recent-title">
          <div className={bizCardHead}>
            <h3 id="recent-title" className="m-0 text-[13px] font-semibold">
              Visualisations from enquiries
            </h3>
            {attachments.length > 0 && <span className="text-[11px] text-[#858179]">{plural(attachments.length, 'total', 'total')}</span>}
          </div>

          {enquiriesLoading && !enquiries.length ? (
            <p className="m-0 px-4 py-8 text-center text-[12px] text-[#858179]">Loading…</p>
          ) : recent.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="m-0 text-[13px] font-semibold">No visualisations attached yet</p>
              <p className="m-0 mx-auto mt-1 max-w-[340px] text-[12px] leading-[1.6] text-[#858179]">
                When a signed-in customer attaches saved visualisations to a quote request, they appear here.
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {recent.map((s) => (
                <li key={`${s.enquiryId}-${s.id}`} className="border-b border-[#f0ede7] last:border-0">
                  <Link to={`/business/enquiries/${encodeURIComponent(s.enquiryId)}`} className="flex min-h-14 items-center gap-3 px-4 py-2 text-[#292a27] no-underline hover:bg-[#fffdf9]">
                    <img src={s.thumbnailUrl} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded-[6px] bg-[#e7dfd2] object-cover" />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] font-semibold">{s.name}</strong>
                      <small className="block truncate text-[11px] text-[#858179]">{s.materialName} · {s.reference}</small>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-[#858179]">{formatRelative(s.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={bizCard} aria-labelledby="enquiries-title">
          <div className={bizCardHead}>
            <h3 id="enquiries-title" className="m-0 text-[13px] font-semibold">
              Enquiries
            </h3>
            {enquiries.length > 0 && (
              <Link to="/business/enquiries" className={`${textLink} min-h-10`}>
                View all <ArrowRight size={13} />
              </Link>
            )}
          </div>
          {enquiries.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span className="grid size-10 place-items-center rounded-[10px] bg-[#f5f0e8] text-[#b38b60]">
                <Inbox size={18} />
              </span>
              <p className="m-0 mt-3 text-[13px] font-semibold">No enquiries yet</p>
              <p className="m-0 mt-1 max-w-[260px] text-[12px] leading-[1.6] text-[#858179]">
                Quote requests from customers appear here with their saved visualisations.
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {enquiries.slice(0, 5).map((e) => (
                <li key={e.id} className="border-b border-[#f0ede7] last:border-0">
                  <Link
                    to={`/business/enquiries/${encodeURIComponent(e.id)}`}
                    className="flex min-h-12 items-center gap-2 px-4 py-2 text-[#292a27] no-underline hover:bg-[#fffdf9]"
                  >
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] font-semibold">{e.contact.name}</strong>
                      <small className="block truncate font-mono text-[11px] text-[#858179]">
                        {e.reference} · {formatRelative(e.createdAt)}
                      </small>
                    </span>
                    <EnquiryStatusBadge status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${bizCard} mt-3 flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
        <p className="m-0 text-[12px] text-[#5f5c55]">
          {counts.outOfStock > 0 ? `${plural(counts.outOfStock, 'material')} marked out of stock.` : 'Keep prices and availability up to date.'}
        </p>
        <Link to="/business/stock" className={`${textLink} min-h-10`}>
          Open stock manager <ArrowRight size={13} />
        </Link>
      </section>
    </div>
  )
}
