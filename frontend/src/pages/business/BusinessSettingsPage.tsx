import { type FormEvent, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import Button from '../../components/ui/Button'
import Loader from '../../components/common/Loader'
import ServerError from '../../components/common/ServerError'
import { errorMessage } from '../../services/apiClient'
import { plural } from '../../lib/formatters'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input, { TextArea } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'
import SettingsCard from '../../features/settings/components/SettingsCard'
import { isValidEmail } from '../../features/settings/store'
import { useBusinessSettings } from '../../features/business/settingsStore'
import { useMaterialsStore } from '../../features/catalogue/store'
import { bizWrap, isWebUrl } from '../../features/business/format'
import type { BusinessSettings } from '../../features/business/types'
import { kicker } from '../../lib/styles'

type Errors = Partial<Record<'shopName' | 'logoUrl' | 'email', string>>

export default function BusinessSettingsPage() {
  const status = useBusinessSettings((s) => s.status)
  const error = useBusinessSettings((s) => s.error)
  const version = useBusinessSettings((s) => s.version)
  const retry = () => void useBusinessSettings.getState().load({ force: true })

  // Show the form only once the server's values have arrived (version > 0)
  if (version === 0) {
    return (
      <div className={bizWrap}>
        {status === 'error' ? <ServerError message={error} onRetry={retry} /> : <Loader text="Loading shop settings…" />}
      </div>
    )
  }
  return <ShopSettingsForm />
}

function ShopSettingsForm() {
  const settings = useBusinessSettings((s) => s.settings)
  const save = useBusinessSettings((s) => s.save)
  const restoreSamples = useMaterialsStore((s) => s.restoreSamples)
  const { showToast, toast } = useToast()

  // Older saved settings may not have showPrices yet
  const current: BusinessSettings = { ...settings, showPrices: !!settings.showPrices }
  const [v, setV] = useState<BusinessSettings>(current)
  const [errors, setErrors] = useState<Errors>({})
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const dirty = (Object.keys(v) as (keyof BusinessSettings)[]).some((k) => v[k] !== current[k])

  const set = (k: keyof BusinessSettings) => (value: string) => {
    setV((s) => ({ ...s, [k]: value }))
    setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const next: Errors = {}
    if (!v.shopName.trim()) next.shopName = 'Please enter the shop name.'
    if (v.logoUrl.trim() && !isWebUrl(v.logoUrl)) next.logoUrl = 'Use a full link starting with https://'
    if (v.email.trim() && !isValidEmail(v.email)) next.email = 'Please enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setSaveError(null)
    try {
      await save(v)
      setV((s) => ({ shopName: s.shopName.trim(), logoUrl: s.logoUrl.trim(), email: s.email.trim(), phone: s.phone.trim(), address: s.address.trim(), showPrices: s.showPrices }))
      setSaved(true)
    } catch (err) {
      setSaveError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={bizWrap}>
      <section className="mb-4">
        <p className={kicker}>SHOP</p>
        <h2 className="m-0 text-[22px] font-medium leading-[1.2] tracking-[-0.6px] sm:text-[24px]">Shop settings.</h2>
        <p className="m-0 mt-1.5 text-[12px] leading-[1.6] text-[#858179]">Saved on the server. Staff changes apply to every customer.</p>
      </section>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <SettingsCard title="Shop details" description="Shown in the business portal now, and on quotes and order emails later." onSubmit={submit} saved={saved} dirty={dirty}>
          <Input label="Shop name" autoComplete="organization" value={v.shopName} maxLength={60} error={errors.shopName} onChange={(e) => set('shopName')(e.target.value)} />
          <div className="flex items-end gap-3">
            <Input
              className="min-w-0 flex-1"
              label="Logo URL (optional)"
              type="url"
              inputMode="url"
              value={v.logoUrl}
              error={errors.logoUrl}
              placeholder="https://…"
              hint="Square images look best. Leave empty to show your initials."
              onChange={(e) => set('logoUrl')(e.target.value)}
            />
            {isWebUrl(v.logoUrl) && (
              <img src={v.logoUrl} alt="Logo preview" className="mb-6 size-[42px] shrink-0 rounded-[8px] border border-[#e8e4dc] bg-white object-contain" />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" inputMode="email" autoComplete="email" value={v.email} maxLength={120} error={errors.email} onChange={(e) => set('email')(e.target.value)} />
            <Input label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} maxLength={30} onChange={(e) => set('phone')(e.target.value)} />
          </div>
          <TextArea label="Showroom address" autoComplete="street-address" value={v.address} maxLength={300} onChange={(e) => set('address')(e.target.value)} />
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border border-[#e8e4dc] px-3 py-2.5 text-[13px]">
            <input
              type="checkbox"
              checked={v.showPrices}
              onChange={(e) => setV((s) => ({ ...s, showPrices: e.target.checked }))}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#b38b60]"
            />
            <span>
              <strong className="block font-semibold">Show prices to customers</strong>
              <small className="block text-[11px] leading-[1.5] text-[#858179]">
                Off: customers only see “Request a quote”. On: they also see the price per sq ft and an estimate. Staff always see prices.
              </small>
            </span>
          </label>
          {saveError && (
            <p role="alert" className="m-0 rounded-[9px] bg-[#fbf1ee] p-3 text-[11px] leading-[1.6] text-[#a2463a]">
              {saveError}
            </p>
          )}
        </SettingsCard>

        <section className="rounded-[12px] border border-[#e8e4dc] bg-white p-4">
          <h3 className="m-0 text-[13px] font-semibold">Restore sample materials</h3>
          <p className="m-0 mt-1.5 text-[12px] leading-[1.6] text-[#858179]">
            Adds back any of the 6 starting materials that were deleted. Existing materials are not changed.
          </p>
          <Button variant="secondary" className="mt-3 max-sm:w-full" onClick={() => setConfirming(true)}>
            <RotateCcw size={15} />
            Restore samples
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Restore sample materials?"
        message="Any deleted sample materials are added back with their sample prices. Your other materials stay as they are."
        confirmLabel="Restore samples"
        onConfirm={async () => {
          const added = await restoreSamples()
          showToast(added ? `${plural(added, 'sample material')} restored.` : 'All sample materials are already there.')
        }}
        onClose={() => setConfirming(false)}
      />

      {toast}
    </div>
  )
}
