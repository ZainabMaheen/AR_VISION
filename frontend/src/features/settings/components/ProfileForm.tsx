import { type FormEvent, useState } from 'react'
import Input from '../../../components/ui/Input'
import SettingsCard from './SettingsCard'
import { isValidEmail, type Profile, useSettingsStore } from '../store'

export default function ProfileForm() {
  const profile = useSettingsStore((s) => s.profile)
  const saveProfile = useSettingsStore((s) => s.saveProfile)
  const [values, setValues] = useState<Profile>(profile)
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({})
  const [saved, setSaved] = useState(false)

  const dirty = values.fullName !== profile.fullName || values.email !== profile.email || values.phone !== profile.phone

  const set = (key: keyof Profile) => (v: string) => {
    setValues((s) => ({ ...s, [key]: v }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!values.fullName.trim()) next.fullName = 'Please enter your name.'
    if (values.email.trim() && !isValidEmail(values.email)) next.email = 'Please enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) return
    saveProfile(values)
    setValues((v) => ({ fullName: v.fullName.trim(), email: v.email.trim(), phone: v.phone.trim() }))
    setSaved(true)
  }

  return (
    <SettingsCard
      title="Profile"
      description="Your name and contact details. Shown in the sidebar and used to pre-fill orders later."
      onSubmit={submit}
      saved={saved}
      dirty={dirty}
    >
      <Input label="Full name" autoComplete="name" value={values.fullName} maxLength={60} error={errors.fullName} onChange={(e) => set('fullName')(e.target.value)} />
      <Input label="Email" type="email" inputMode="email" autoComplete="email" value={values.email} maxLength={120} error={errors.email} onChange={(e) => set('email')(e.target.value)} />
      <Input label="Phone (optional)" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} maxLength={30} onChange={(e) => set('phone')(e.target.value)} />
    </SettingsCard>
  )
}
