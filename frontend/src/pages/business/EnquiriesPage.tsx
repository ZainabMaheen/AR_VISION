import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Inbox, Paperclip, Search } from 'lucide-react'
import EnquiryStatusBadge from '../../features/enquiries/components/EnquiryStatusBadge'
import { useEnquiriesStore } from '../../features/enquiries/store'
import Loader from '../../components/common/Loader'
import ServerError from '../../components/common/ServerError'
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from '../../features/enquiries/types'
import { formatArea } from '../../features/cart/area'
import { bizWrap } from '../../features/business/format'
import { formatDateTime, formatRelative } from '../../lib/formatters'
import { kicker } from '../../lib/styles'

type Filter = 'all' | EnquiryStatus

const detailUrl = (e: Enquiry) => `/business/enquiries/${encodeURIComponent(e.id)}`
const totalArea = (e: Enquiry) => e.lines.reduce((s, l) => s + l.orderSqFt, 0)
const materialsText = (e: Enquiry) => e.lines.map((l) => l.materialName).join(', ')

export default function EnquiriesPage() {
  const enquiries = useEnquiriesStore((s) => s.enquiries)
  const status = useEnquiriesStore((s) => s.status)
  const loadError = useEnquiriesStore((s) => s.error)
  const reload = () => void useEnquiriesStore.getState().load()

  // Refresh whenever the page opens
  useEffect(() => {
    void useEnquiriesStore.getState().load()
  }, [])
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const term = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      enquiries.filter(
        (e) =>
          (filter === 'all' || e.status === filter) &&
          (!term || `${e.reference} ${e.contact.name} ${e.contact.email} ${materialsText(e)}`.toLowerCase().includes(term)),
      ),
    [enquiries, filter, term],
  )

  const count = (f: Filter) => (f === 'all' ? enquiries.length : enquiries.filter((e) => e.status === f).length)
  const filters: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, ...ENQUIRY_STATUSES]

  return (
    <div className={bizWrap}>
      <section className="mb-4">
        <p className={kicker}>CUSTOMERS</p>
        <h2 className="m-0 text-[22px] font-medium leading-[1.2] tracking-[-0.6px] sm:text-[24px]">Enquiries & orders.</h2>
        <p className="m-0 mt-1.5 text-[12px] leading-[1.6] text-[#858179]">
          Quote requests from customers, newest first.
        </p>
      </section>

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-10 cursor-pointer rounded-[8px] border px-3 text-[12px] md:min-h-8 ${
                filter === f.id ? 'border-[#b38b60] bg-[#f5f0e8] font-semibold text-[#292a27]' : 'border-[#e8e4dc] bg-white text-[#68665e] hover:bg-[#faf8f4]'
              }`}
            >
              {f.label} <span className="tabular-nums text-[#858179]">{count(f.id)}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-[8px] border border-[#e8e4dc] bg-white pl-2.5 text-[#858179] md:w-[260px]">
          <Search size={14} className="shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Reference, name, material…"
            aria-label="Search enquiries"
            className="min-h-10 w-full min-w-0 border-0 bg-transparent py-2 pr-2.5 text-base text-[#292a27] outline-none placeholder:text-[#a9a59d] sm:text-[13px] md:min-h-8"
          />
        </label>
      </div>

      {status === 'error' && enquiries.length > 0 && <ServerError compact message={loadError} onRetry={reload} />}

      {enquiries.length === 0 && status !== 'ready' ? (
        status === 'error' ? <ServerError message={loadError} onRetry={reload} /> : <Loader text="Loading enquiries…" />
      ) : enquiries.length === 0 ? (
        <div className="flex flex-col items-center rounded-[12px] border border-dashed border-[#e0dbd2] bg-white px-6 py-12 text-center">
          <span className="grid size-10 place-items-center rounded-[10px] bg-[#f5f0e8] text-[#b38b60]">
            <Inbox size={18} />
          </span>
          <h3 className="m-0 mt-3 text-[15px] font-medium">No enquiries yet</h3>
          <p className="m-0 mt-1 max-w-[360px] text-[12px] leading-[1.6] text-[#858179]">
            When a customer sends a quote request, it appears here with their areas and saved visualisations.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="m-0 rounded-[12px] border border-dashed border-[#e0dbd2] bg-white px-6 py-10 text-center text-[13px] text-[#858179]">
          Nothing matches. Try another search, or set the filter back to All.
        </p>
      ) : (
        <>
          {/* Desktop: dense table */}
          <div className="hidden overflow-hidden rounded-[12px] border border-[#e8e4dc] bg-white lg:block">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="bg-[#faf8f4]">
                <tr className="border-b border-[#eeeae3] text-[10px] tracking-[1.1px] text-[#a67e50]">
                  <th scope="col" className="px-3 py-2 font-semibold">REFERENCE</th>
                  <th scope="col" className="px-3 py-2 font-semibold">CUSTOMER</th>
                  <th scope="col" className="px-3 py-2 font-semibold">MATERIALS</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">AREA</th>
                  <th scope="col" className="px-3 py-2 font-semibold">RECEIVED</th>
                  <th scope="col" className="px-3 py-2 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id} className="border-b border-[#f0ede7] last:border-0 hover:bg-[#fffdf9]">
                    <td className="px-3 py-2">
                      <Link to={detailUrl(e)} className="font-mono text-[12px] font-semibold text-[#292a27] underline decoration-[#d9cbb6] underline-offset-2 hover:text-[#b38b60]">
                        {e.reference}
                      </Link>
                    </td>
                    <td className="max-w-[200px] px-3 py-2">
                      <span className="block truncate font-semibold">{e.contact.name}</span>
                      <small className="block truncate text-[11px] text-[#858179]">{e.contact.email}</small>
                    </td>
                    <td className="max-w-[280px] px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate">{materialsText(e)}</span>
                        {e.scanIds.length > 0 && (
                          <span title={`${e.scanIds.length} visualisation(s) attached`} className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-[#86602f]">
                            <Paperclip size={12} />
                            {e.scanIds.length}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{totalArea(e) > 0 ? formatArea(totalArea(e), 'sqft') : '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[12px] text-[#5f5c55]" title={formatDateTime(e.createdAt)}>
                      {formatRelative(e.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <EnquiryStatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones / tablets: cards */}
          <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2 lg:hidden">
            {visible.map((e) => (
              <li key={e.id}>
                <Link to={detailUrl(e)} className="flex min-w-0 items-start gap-3 rounded-[12px] border border-[#e8e4dc] bg-white p-3 text-[#292a27] no-underline hover:bg-[#fffdf9]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold">{e.reference}</span>
                      <EnquiryStatusBadge status={e.status} />
                    </div>
                    <strong className="mt-1 block truncate text-[13px] font-semibold">{e.contact.name}</strong>
                    <small className="block truncate text-[11px] text-[#858179]">{materialsText(e)}</small>
                    <small className="mt-0.5 block text-[11px] text-[#858179]">
                      {formatRelative(e.createdAt)}
                      {totalArea(e) > 0 ? ` · ${formatArea(totalArea(e), 'sqft')}` : ''}
                      {e.scanIds.length > 0 ? ` · ${e.scanIds.length} attached` : ''}
                    </small>
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-[#858179]" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
