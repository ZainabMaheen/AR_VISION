import Input, { TextArea } from '../../../components/ui/Input'
import type { ContactDetails, ContactErrors } from '../types'

interface Props {
  value: ContactDetails
  errors: ContactErrors
  onChange: (key: keyof ContactDetails, value: string) => void
}

/** Contact and delivery details for a quote request. */
export default function AddressForm({ value, errors, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" autoComplete="name" value={value.name} maxLength={60} error={errors.name} onChange={(e) => onChange('name', e.target.value)} />
        <Input label="Email" type="email" inputMode="email" autoComplete="email" value={value.email} maxLength={120} error={errors.email} onChange={(e) => onChange('email', e.target.value)} />
        <Input label="Phone (optional)" type="tel" inputMode="tel" autoComplete="tel" value={value.phone} maxLength={30} error={errors.phone} onChange={(e) => onChange('phone', e.target.value)} />
        <Input label="Postcode (optional)" autoComplete="postal-code" value={value.postcode} maxLength={12} onChange={(e) => onChange('postcode', e.target.value)} />
      </div>
      <TextArea
        label="Delivery or fitting address (optional)"
        autoComplete="street-address"
        value={value.address}
        maxLength={300}
        onChange={(e) => onChange('address', e.target.value)}
      />
      <TextArea
        label="Anything else? (optional)"
        value={value.notes}
        maxLength={1000}
        placeholder="Room, timing, edge finishes, budget, questions…"
        onChange={(e) => onChange('notes', e.target.value)}
      />
    </div>
  )
}
