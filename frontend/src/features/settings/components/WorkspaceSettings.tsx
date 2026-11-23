import { type FormEvent, useState } from 'react'
import Input from '../../../components/ui/Input'
import SettingsCard from './SettingsCard'
import { useSettingsStore, type Workspace } from '../store'

export default function WorkspaceSettings() {
  const workspace = useSettingsStore((s) => s.workspace)
  const saveWorkspace = useSettingsStore((s) => s.saveWorkspace)
  const [values, setValues] = useState<Workspace>(workspace)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const dirty = values.name !== workspace.name || values.city !== workspace.city

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!values.name.trim()) {
      setError('Please give your workspace a name.')
      return
    }
    saveWorkspace(values)
    setValues((v) => ({ name: v.name.trim(), city: v.city.trim() }))
    setSaved(true)
  }

  return (
    <SettingsCard
      title="Workspace"
      description="The name shown at the top of the sidebar, e.g. your home or studio."
      onSubmit={submit}
      saved={saved}
      dirty={dirty}
    >
      <Input
        label="Workspace name"
        value={values.name}
        maxLength={40}
        error={error}
        onChange={(e) => {
          setValues((v) => ({ ...v, name: e.target.value }))
          setError(null)
        }}
      />
      <Input
        label="City (optional)"
        autoComplete="address-level2"
        value={values.city}
        maxLength={40}
        onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
      />
    </SettingsCard>
  )
}
