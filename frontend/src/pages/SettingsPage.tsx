import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/useToast'
import ProfileForm from '../features/settings/components/ProfileForm'
import WorkspaceSettings from '../features/settings/components/WorkspaceSettings'
import PreferencesForm from '../features/settings/components/PreferencesForm'
import { useScansStore } from '../features/scans/store'
import { useFavouritesStore } from '../features/favourites/store'
import { useCompareStore } from '../features/compare/store'
import { pageWrap } from '../lib/styles'

export default function SettingsPage() {
  const clearScans = useScansStore((s) => s.clearAll)
  const clearCompare = useCompareStore((s) => s.clear)
  const [confirming, setConfirming] = useState(false)
  const { showToast, toast } = useToast()

  const clearEverything = async () => {
    try {
      await clearScans()
    } catch (e) {
      throw new Error('Saved visualisations could not be cleared. Please try again.', { cause: e })
    }
    clearCompare()
    useFavouritesStore.setState({ names: [] })
    showToast('Data saved in this browser has been cleared.')
  }

  return (
    <div className={pageWrap}>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Settings."
        description="Profile, workspace and measurements are saved in this browser. Your account keeps saved visualisations and projects."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ProfileForm />
        <div className="flex min-w-0 flex-col gap-4">
          <WorkspaceSettings />
          <PreferencesForm />
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-[#ecd9d3] bg-white p-5">
        <h3 className="m-0 text-sm font-semibold text-[#a2463a]">Clear saved data</h3>
        <p className="m-0 mt-1.5 max-w-[620px] text-xs leading-[1.6] text-[#858179]">
          Removes favourites, comparisons and any visualisations still stored only in this browser. Your account&rsquo;s
          saved visualisations and projects, and your profile and settings, are kept.
        </p>
        <Button variant="danger" className="mt-4 max-sm:w-full" onClick={() => setConfirming(true)}>
          <Trash2 size={15} />
          Clear saved data
        </Button>
      </section>

      <ConfirmDialog
        open={confirming}
        title="Clear all saved data?"
        message="Favourites, comparisons and visualisations stored only in this browser will be deleted. Your account is not affected. This cannot be undone."
        confirmLabel="Clear everything"
        danger
        onConfirm={clearEverything}
        onClose={() => setConfirming(false)}
      />

      {toast}
    </div>
  )
}
