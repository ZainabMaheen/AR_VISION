import { type FormEvent, useState } from 'react'
import SettingsCard from './SettingsCard'
import { type AreaUnit, type Preferences, useSettingsStore } from '../store'

const UNITS: { id: AreaUnit; label: string }[] = [
  { id: 'sqft', label: 'Square feet (sq ft)' },
  { id: 'sqm', label: 'Square metres (m²)' },
]

export default function PreferencesForm() {
  const preferences = useSettingsStore((s) => s.preferences)
  const savePreferences = useSettingsStore((s) => s.savePreferences)
  const [values, setValues] = useState<Preferences>(preferences)
  const [saved, setSaved] = useState(false)

  const dirty = values.units !== preferences.units || values.wastage !== preferences.wastage

  const submit = (e: FormEvent) => {
    e.preventDefault()
    savePreferences(values)
    setSaved(true)
  }

  return (
    <SettingsCard
      title="Measurements"
      description="Defaults for the area calculator on your quote request."
      onSubmit={submit}
      saved={saved}
      dirty={dirty}
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1.5 block p-0 text-[11px] font-semibold text-[#49463f]">Area units</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {UNITS.map((u) => (
            <label
              key={u.id}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 text-[13px] ${
                values.units === u.id ? 'border-[#b38b60] bg-[#f5f0e8]' : 'border-[#e8e4dc] bg-white hover:bg-[#faf8f4]'
              }`}
            >
              <input
                type="radio"
                name="units"
                value={u.id}
                checked={values.units === u.id}
                onChange={() => setValues((v) => ({ ...v, units: u.id }))}
                className="size-4 cursor-pointer accent-[#b38b60]"
              />
              {u.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-[#49463f]">Default wastage</span>
          <strong className="font-semibold tabular-nums">{values.wastage}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={25}
          step={1}
          value={values.wastage}
          onChange={(e) => setValues((v) => ({ ...v, wastage: Number(e.target.value) }))}
          className="block h-10 w-full cursor-pointer accent-[#b38b60]"
        />
        <span className="block text-[11px] leading-[1.5] text-[#858179]">
          Extra material for cuts and breakages. 10% is typical; complex layouts may need 15%.
        </span>
      </label>
    </SettingsCard>
  )
}
