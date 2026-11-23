import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Send } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Loader from '../components/common/Loader'
import AddressForm from '../features/checkout/components/AddressForm'
import { EMPTY_CONTACT, validateContact, type ContactDetails, type ContactErrors } from '../features/checkout/types'
import { useQuoteLines } from '../features/cart/useQuoteLines'
import { useCartStore } from '../features/cart/store'
import { formatArea } from '../features/cart/area'
import { sendQuoteRequest } from '../features/checkout/api'
import { errorMessage } from '../services/apiClient'
import { useScans } from '../features/scans/hooks/useScans'
import { useSettingsStore } from '../features/settings/store'
import { useAuthStore } from '../features/auth/store'
import { formatPrice } from '../features/business/format'
import { formatRelative } from '../lib/formatters'
import { pageWrap, textLink } from '../lib/styles'

const panel = 'min-w-0 rounded-2xl border border-[#e8e4dc] bg-white'
const panelHead = 'border-b border-[#eeeae3] px-5 pb-3.5 pt-4'

/** "Checkout" without payment: the customer's details, then the request is sent. */
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, showPrices, estimateTotal, unavailable } = useQuoteLines()
  const scanIds = useCartStore((s) => s.scanIds)
  const setScans = useCartStore((s) => s.setScans)
  const clear = useCartStore((s) => s.clear)
  const [progress, setProgress] = useState('')
  const profile = useSettingsStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const unit = useSettingsStore((s) => s.preferences.units)
  const { scans, loading } = useScans()

  // Pre-fill from Settings > Profile
  const [contact, setContact] = useState<ContactDetails>({
    ...EMPTY_CONTACT,
    name: user?.name ?? profile.fullName,
    email: user?.email ?? profile.email,
    phone: profile.phone,
  })
  const [errors, setErrors] = useState<ContactErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const back = (
    <Link to="/quote" className={`${textLink} mb-5 min-h-10`}>
      <ArrowLeft size={14} />
      Back to quote request
    </Link>
  )

  if (lines.length === 0) {
    return (
      <div className={pageWrap}>
        {back}
        <EmptyState title="Nothing to send yet" description="Add materials to your quote request first." to="/catalogue" cta="Browse materials" />
      </div>
    )
  }

  const attached = scanIds.filter((id) => scans.some((s) => s.id === id))
  const toggleScan = (id: string) => setScans(attached.includes(id) ? attached.filter((x) => x !== id) : [...attached, id])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    const next = validateContact(contact)
    setErrors(next)
    if (Object.keys(next).length) {
      setFormError('Please check the highlighted fields.')
      return
    }
    if (unavailable > 0) {
      setFormError('Some materials are no longer available. Go back and remove them first.')
      return
    }
    setSending(true)
    setFormError(null)
    try {
      // Attached visualisations are uploaded first (POST /scans), then the request is sent (POST /enquiries)
      const enquiry = await sendQuoteRequest({
        contact,
        lines: lines.map((l) => ({ materialName: l.item.materialName, areaSqFt: l.item.areaSqFt, wastage: l.item.wastage })),
        scanIds: attached,
        pricesShown: showPrices,
        onProgress: setProgress,
      })
      clear()
      navigate(`/request-sent/${encodeURIComponent(enquiry.id)}`, { replace: true })
    } catch (err) {
      setFormError(errorMessage(err, 'The request could not be sent. Please try again.'))
      setSending(false)
      setProgress('')
    }
  }

  return (
    <div className={pageWrap}>
      {back}
      <PageHeader
        eyebrow="ALMOST DONE"
        title="Your details."
        description="The shop uses these to send your quote. No payment is taken."
      />

      <form onSubmit={onSubmit} noValidate className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={panel} aria-labelledby="contact-title">
            <div className={panelHead}>
              <h3 id="contact-title" className="m-0 text-sm font-semibold">
                Contact details
              </h3>
            </div>
            <div className="p-5">
              <AddressForm
                value={contact}
                errors={errors}
                onChange={(k, v) => {
                  setContact((c) => ({ ...c, [k]: v }))
                  setErrors((x) => ({ ...x, [k]: undefined }))
                }}
              />
            </div>
          </section>

          <section className={panel} aria-labelledby="attach-title">
            <div className={panelHead}>
              <h3 id="attach-title" className="m-0 text-sm font-semibold">
                Attach saved visualisations (optional)
              </h3>
              <p className="m-0 mt-1 text-[12px] leading-[1.5] text-[#858179]">Helps the shop see the room and the look you want.</p>
            </div>
            {loading ? (
              <Loader text="Loading saved visualisations…" />
            ) : !user ? (
              <p className="m-0 px-5 py-5 text-[12px] leading-[1.6] text-[#858179]">
                <Link to="/login?next=%2Fcheckout" className="font-semibold text-[#292a27]">
                  Sign in
                </Link>{' '}
                to attach your saved visualisations. You can also send the request without them.
              </p>
            ) : scans.length === 0 ? (
              <p className="m-0 px-5 py-5 text-[12px] text-[#858179]">
                You have no saved visualisations. You can save one on the{' '}
                <Link to="/arpreview" className="font-semibold text-[#292a27]">
                  AR preview
                </Link>{' '}
                page first.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-2 p-4 sm:grid-cols-2">
                {scans.map((s) => {
                  const on = attached.includes(s.id)
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggleScan(s.id)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] border p-2 text-left ${
                          on ? 'border-[#b38b60] bg-[#f5f0e8]' : 'border-[#e8e4dc] bg-white hover:bg-[#faf8f4]'
                        }`}
                      >
                        <img src={s.thumbnail} alt="" className="h-11 w-14 shrink-0 rounded-[6px] object-cover" />
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[12px] font-semibold">{s.name}</strong>
                          <small className="block truncate text-[11px] text-[#858179]">
                            {s.materialName} · {formatRelative(s.createdAt)}
                          </small>
                        </span>
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-[5px] border ${
                            on ? 'border-[#b38b60] bg-[#b38b60] text-white' : 'border-[#d9d4ca] bg-white'
                          }`}
                        >
                          {on && <Check size={13} />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className={`${panel} p-5 lg:sticky lg:top-[96px]`}>
          <h3 className="m-0 text-sm font-semibold">Your request</h3>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
            {lines.map((l) => (
              <li key={l.item.materialName} className="flex items-start justify-between gap-3 text-[12px]">
                <span className="min-w-0">
                  <strong className="block truncate font-semibold">{l.item.materialName}</strong>
                  <small className="text-[11px] text-[#858179]">
                    {l.orderSqFt > 0 ? `${formatArea(l.orderSqFt, unit)} incl. ${l.item.wastage}%` : 'Area not given'}
                  </small>
                </span>
                {showPrices && l.estimate !== null && <span className="shrink-0 tabular-nums">{formatPrice(l.estimate)}</span>}
              </li>
            ))}
          </ul>
          {showPrices && estimateTotal > 0 && (
            <div className="mt-3 flex justify-between gap-3 border-t border-[#eeeae3] pt-3 text-[13px]">
              <span className="text-[#858179]">Estimated total</span>
              <strong className="tabular-nums">{formatPrice(estimateTotal)}</strong>
            </div>
          )}
          {attached.length > 0 && <p className="m-0 mt-3 text-[11px] text-[#5f5c55]">+ {attached.length} attached visualisation{attached.length === 1 ? '' : 's'}</p>}

          {formError && (
            <p role="alert" className="m-0 mt-4 rounded-[9px] bg-[#fbf1ee] p-3 text-[11px] leading-[1.6] text-[#a2463a]">
              {formError}
            </p>
          )}

          <Button type="submit" className="mt-4 w-full" disabled={sending}>
            <Send size={15} />
            {sending ? progress || 'Sending…' : 'Send quote request'}
          </Button>
          <p className="m-0 mt-3 text-[11px] leading-[1.6] text-[#858179]">
            No payment is taken. Your request and any attached visualisations are sent to the shop.
          </p>
        </aside>
      </form>
    </div>
  )
}
