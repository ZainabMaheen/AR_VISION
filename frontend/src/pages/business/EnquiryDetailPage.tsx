import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import Button from '../../components/ui/Button'
import Loader from '../../components/common/Loader'
import ServerError from '../../components/common/ServerError'
import { ApiError, errorMessage } from '../../services/apiClient'
import { TextArea } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'
import EnquiryStatusBadge from '../../features/enquiries/components/EnquiryStatusBadge'
import { useEnquiriesStore } from '../../features/enquiries/store'
import { ENQUIRY_STATUSES, statusLabel, type Enquiry } from '../../features/enquiries/types'
import { formatArea } from '../../features/cart/area'
import { bizCard, bizCardHead, bizWrap, formatPrice } from '../../features/business/format'
import { formatDateTime } from '../../lib/formatters'
import { textLink } from '../../lib/styles'

function StaffNote({ enquiry }: { enquiry: Enquiry }) {
  const setStaffNote = useEnquiriesStore((s) => s.setStaffNote)
  const [note, setNote] = useState(enquiry.staffNote)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (saving) return
        setSaving(true)
        setError(null)
        try {
          await setStaffNote(enquiry.id, note)
          setSaved(true)
        } catch (err) {
          setError(errorMessage(err))
        } finally {
          setSaving(false)
        }
      }}
      className="flex flex-col gap-2 p-4"
    >
      <TextArea
        label="Private note (staff only)"
        value={note}
        maxLength={1000}
        placeholder="e.g. Quote sent by email on…"
        onChange={(e) => {
          setNote(e.target.value)
          setSaved(false)
        }}
      />
      {error && (
        <p role="alert" className="m-0 text-[11px] leading-[1.5] text-[#a2463a]">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-[12px] font-semibold text-[#8b9a78]">Saved</span>}
        <Button type="submit" variant="secondary" disabled={saving || note.trim() === enquiry.staffNote}>
          {saving ? 'Saving…' : 'Save note'}
        </Button>
      </div>
    </form>
  )
}

export default function EnquiryDetailPage() {
  const { enquiryId } = useParams()
  const enquiry = useEnquiriesStore((s) => s.enquiries.find((e) => e.id === enquiryId))
  const setStatus = useEnquiriesStore((s) => s.setStatus)
  const { showToast, toast } = useToast()
  const [load, setLoad] = useState<{ state: 'loading' | 'ready' | 'missing' | 'error'; error?: string }>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [updating, setUpdating] = useState(false)

  // Always fetch the full enquiry: the list does not include attachments
  useEffect(() => {
    if (!enquiryId) return
    let cancelled = false
    useEnquiriesStore
      .getState()
      .fetchOne(enquiryId)
      .then(() => {
        if (!cancelled) setLoad({ state: 'ready' })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoad(e instanceof ApiError && e.status === 404 ? { state: 'missing' } : { state: 'error', error: errorMessage(e) })
      })
    return () => {
      cancelled = true
    }
  }, [enquiryId, attempt])

  const retry = () => {
    setLoad({ state: 'loading' })
    setAttempt((n) => n + 1)
  }

  const back = (
    <Link to="/business/enquiries" className={`${textLink} mb-4 min-h-10`}>
      <ArrowLeft size={14} />
      All enquiries
    </Link>
  )

  if (!enquiry || load.state === 'missing') {
    return (
      <div className={bizWrap}>
        {back}
        {load.state === 'loading' ? (
          <Loader text="Loading enquiry…" />
        ) : load.state === 'error' ? (
          <ServerError message={load.error} onRetry={retry} />
        ) : (
          <p className="m-0 rounded-[12px] border border-dashed border-[#e0dbd2] bg-white px-6 py-10 text-center text-[13px] text-[#858179]">
            This enquiry was not found. It may have been removed.
          </p>
        )}
      </div>
    )
  }

  const estimate = enquiry.lines.reduce((s, l) => s + (l.pricePerSqFt !== null ? l.pricePerSqFt * l.orderSqFt : 0), 0)
  const c = enquiry.contact

  return (
    <div className={bizWrap}>
      {back}
      {load.state === 'error' && <ServerError compact message={load.error} onRetry={retry} />}

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="m-0 mb-1.5 font-mono text-[12px] font-semibold tracking-[1px] text-[#a67e50]">{enquiry.reference}</p>
          <h2 className="m-0 truncate text-[22px] font-medium leading-[1.2] tracking-[-0.6px]">{c.name}</h2>
          <p className="m-0 mt-1 text-[12px] text-[#858179]">
            Received {formatDateTime(enquiry.createdAt)}
            {enquiry.pricesShown !== null && (enquiry.pricesShown ? ' · customer saw prices' : ' · customer saw “Request a quote” only')}
          </p>
        </div>
        <EnquiryStatusBadge status={enquiry.status} />
      </section>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-3">
          <section className={bizCard} aria-labelledby="status-title">
            <div className={bizCardHead}>
              <h3 id="status-title" className="m-0 text-[13px] font-semibold">
                Status
              </h3>
              <span className="text-[11px] text-[#858179]">Updated {formatDateTime(enquiry.statusUpdatedAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-4" role="radiogroup" aria-label="Enquiry status">
              {ENQUIRY_STATUSES.map((s) => {
                const on = enquiry.status === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={updating}
                    onClick={async () => {
                      if (on || updating) return
                      setUpdating(true)
                      try {
                        await setStatus(enquiry.id, s.id)
                        showToast(`Marked as ${statusLabel(s.id).toLowerCase()}.`)
                      } catch (err) {
                        showToast(errorMessage(err))
                      } finally {
                        setUpdating(false)
                      }
                    }}
                    className={`min-h-10 cursor-pointer rounded-[8px] border px-3 text-[12px] disabled:cursor-wait ${
                      on ? 'border-[#b38b60] bg-[#f5f0e8] font-semibold text-[#292a27]' : 'border-[#e8e4dc] bg-white text-[#5f5c55] hover:bg-[#faf8f4]'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className={bizCard} aria-labelledby="lines-title">
            <div className={bizCardHead}>
              <h3 id="lines-title" className="m-0 text-[13px] font-semibold">
                Materials requested
              </h3>
            </div>
            <ul className="m-0 list-none p-0">
              {enquiry.lines.map((l) => (
                <li key={l.materialName} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-[#f0ede7] px-4 py-2.5 text-[13px] last:border-0">
                  <div className="min-w-0">
                    <strong className="block truncate font-semibold">{l.materialName}</strong>
                    <small className="text-[11px] text-[#858179]">
                      {l.areaSqFt > 0
                        ? `${formatArea(l.areaSqFt, 'sqft')} + ${l.wastage}% wastage = ${formatArea(l.orderSqFt, 'sqft')}`
                        : 'Area not given'}
                    </small>
                  </div>
                  <div className="text-right text-[12px] tabular-nums">
                    {l.pricePerSqFt !== null ? (
                      <>
                        <span className="block">{formatPrice(l.pricePerSqFt)} / sq ft</span>
                        {l.orderSqFt > 0 && <strong className="block">{formatPrice(l.pricePerSqFt * l.orderSqFt)}</strong>}
                      </>
                    ) : (
                      <span className="text-[#858179]">No price set</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {estimate > 0 && (
              <div className="flex justify-between gap-3 border-t border-[#eeeae3] bg-[#faf8f4] px-4 py-2.5 text-[13px]">
                <span className="text-[#5f5c55]">Estimate at prices when sent</span>
                <strong className="tabular-nums">{formatPrice(estimate)}</strong>
              </div>
            )}
          </section>

          <section className={bizCard} aria-labelledby="vis-title">
            <div className={bizCardHead}>
              <h3 id="vis-title" className="m-0 text-[13px] font-semibold">
                Saved visualisations
              </h3>
            </div>
            {enquiry.scanIds.length === 0 ? (
              <p className="m-0 px-4 py-5 text-[12px] text-[#858179]">The customer did not attach any.</p>
            ) : enquiry.attachments.length === 0 ? (
              load.state === 'loading' ? (
                <Loader text="Loading visualisations…" />
              ) : (
                <p className="m-0 px-4 py-5 text-[12px] text-[#858179]">The attached visualisations could not be loaded.</p>
              )
            ) : (
              <ul className="m-0 grid list-none gap-3 p-4 sm:grid-cols-2">
                {enquiry.attachments.map((a) => (
                  <li key={a.id} className="min-w-0 overflow-hidden rounded-[10px] border border-[#e8e4dc]">
                    <a href={a.roomImageUrl} target="_blank" rel="noreferrer" className="block text-[#292a27] no-underline">
                      <img src={a.thumbnailUrl} alt={`${a.name}: ${a.materialName}`} loading="lazy" className="aspect-[4/3] w-full bg-[#e7dfd2] object-cover" />
                      <span className="flex items-center gap-2 px-3 py-2">
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[12px] font-semibold">{a.name}</strong>
                          <small className="block truncate text-[11px] text-[#858179]">{a.materialName} · room photo</small>
                        </span>
                        <ExternalLink size={13} className="shrink-0 text-[#858179]" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <section className={bizCard} aria-labelledby="contact-title">
            <div className={bizCardHead}>
              <h3 id="contact-title" className="m-0 text-[13px] font-semibold">
                Contact
              </h3>
            </div>
            <ul className="m-0 flex list-none flex-col gap-1 p-3 text-[13px]">
              <li>
                <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your quote ${enquiry.reference}`)}`} className="flex min-h-10 items-center gap-2 break-all rounded-[8px] px-1 text-[#292a27] no-underline hover:bg-[#faf8f4]">
                  <Mail size={15} className="shrink-0 text-[#a67e50]" />
                  {c.email}
                </a>
              </li>
              {c.phone && (
                <li>
                  <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="flex min-h-10 items-center gap-2 rounded-[8px] px-1 text-[#292a27] no-underline hover:bg-[#faf8f4]">
                    <Phone size={15} className="shrink-0 text-[#a67e50]" />
                    {c.phone}
                  </a>
                </li>
              )}
              {(c.address || c.postcode) && (
                <li className="flex gap-2 px-1 py-2 text-[#5f5c55]">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#a67e50]" />
                  <span className="min-w-0 whitespace-pre-line break-words">{[c.address, c.postcode].filter(Boolean).join('\n')}</span>
                </li>
              )}
            </ul>
            {c.notes && (
              <div className="border-t border-[#eeeae3] px-4 py-3">
                <p className="m-0 text-[10px] font-semibold tracking-[1.1px] text-[#a67e50]">CUSTOMER NOTE</p>
                <p className="m-0 mt-1 whitespace-pre-line break-words text-[13px] leading-[1.6] text-[#5f5c55]">{c.notes}</p>
              </div>
            )}
          </section>

          <section className={bizCard} aria-label="Staff note">
            <StaffNote key={enquiry.id} enquiry={enquiry} />
          </section>
        </div>
      </div>

      {toast}
    </div>
  )
}
