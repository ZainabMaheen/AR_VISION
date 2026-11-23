import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FolderPlus, Pencil, Search, Trash2, Upload } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/common/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/useToast'
import ScanHistoryList, { ScanListSkeleton } from '../features/scans/components/ScanHistoryList'
import { cardIconBtn } from '../features/scans/links'
import RenameScanModal from '../features/scans/components/RenameScanModal'
import AddToProjectModal from '../features/scans/components/AddToProjectModal'
import { useScans } from '../features/scans/hooks/useScans'
import { useScansStore } from '../features/scans/store'
import { countLocalScans, importLocalScans } from '../features/scans/api'
import type { SavedScan } from '../features/scans/types'
import { plural } from '../lib/formatters'
import { pageWrap } from '../lib/styles'
import type { LayoutContext } from '../app/layouts/DashboardLayout'

export default function ScanHistoryPage() {
  const { globalSearch } = useOutletContext<LayoutContext>()
  const { scans, loading, error, persistent, retry } = useScans()
  const remove = useScansStore((s) => s.remove)
  const { showToast, toast } = useToast()

  const [query, setQuery] = useState('')
  const [deleting, setDeleting] = useState<SavedScan | null>(null)
  const [renaming, setRenaming] = useState<SavedScan | null>(null)
  const [adding, setAdding] = useState<SavedScan | null>(null)
  // Visualisations saved in this browser before accounts existed (IndexedDB)
  const [localCount, setLocalCount] = useState(0)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void countLocalScans().then((n) => {
      if (alive) setLocalCount(n)
    })
    return () => {
      alive = false
    }
  }, [])

  const runImport = async () => {
    setImporting('Starting…')
    try {
      const { imported, failed } = await importLocalScans((done, total) => setImporting(`Importing ${Math.min(done + 1, total)} of ${total}…`))
      await useScansStore.getState().load({ force: true })
      showToast(
        failed.length
          ? `${plural(imported, 'visualisation')} imported. ${failed.length} could not be imported and stay in this browser.`
          : `${plural(imported, 'visualisation')} imported to your account.`,
      )
    } catch {
      showToast('The import could not finish. Please try again.')
    } finally {
      setImporting(null)
      setLocalCount(await countLocalScans())
    }
  }

  // Page search box, or the top bar search when the page box is empty
  const term = (query || globalSearch).trim().toLowerCase()
  const visible = useMemo(
    () => (term ? scans.filter((s) => `${s.name} ${s.materialName}`.toLowerCase().includes(term)) : scans),
    [scans, term],
  )

  return (
    <div className={pageWrap}>
      <PageHeader
        eyebrow="YOUR WORK"
        title="Scan history."
        description={
          scans.length
            ? `${plural(scans.length, 'saved visualisation')}, newest first. Saved to your account.`
            : 'Visualisations you save on the AR Room Preview page appear here.'
        }
      />

      {localCount > 0 && (
        <div className="mb-5 flex flex-col gap-3 rounded-[12px] border border-[#e6d9c6] bg-[#faf5ec] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-[13px] leading-[1.6] text-[#5f5c55]">
            <strong className="text-[#292a27]">{plural(localCount, 'visualisation')}</strong> {localCount === 1 ? 'is' : 'are'} still
            saved only in this browser, from before you had an account.
          </p>
          <Button className="shrink-0 max-sm:w-full" disabled={importing !== null} onClick={() => void runImport()}>
            <Upload size={15} />
            {importing ?? 'Import my saved visualisations from this browser'}
          </Button>
        </div>
      )}

      {!persistent && (
        <p className="m-0 mb-4 rounded-[10px] bg-[#fbf1ee] p-3 text-xs leading-[1.6] text-[#a2463a]">
          This browser does not allow saving data, so visualisations are lost when you close the tab.
        </p>
      )}

      {scans.length > 0 && (
        <label className="mb-5 flex max-w-[420px] items-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white pl-3 text-[#858179]">
          <Search size={15} className="shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or material…"
            aria-label="Search saved visualisations"
            className="min-h-[42px] w-full min-w-0 border-0 bg-transparent py-2.5 pr-3 text-base text-[#292a27] outline-none placeholder:text-[#a9a59d] sm:text-[13px]"
          />
        </label>
      )}

      {loading ? (
        <ScanListSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#e0dbd2] bg-white px-6 py-14 text-center">
          <p className="m-0 max-w-[360px] text-[13px] leading-[1.6] text-[#858179]">{error}</p>
          <Button variant="secondary" onClick={() => void retry()}>
            Try again
          </Button>
        </div>
      ) : scans.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Open the AR Room Preview, mark a wall or floor, then tap “Save visualisation”."
          to="/arpreview"
          cta="Open AR preview"
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" description={`Nothing matches “${term}”. Try another name or material.`} />
      ) : (
        <ScanHistoryList
          scans={visible}
          actions={(scan) => (
            <>
              <button type="button" aria-label={`Add ${scan.name} to a project`} title="Add to project" onClick={() => setAdding(scan)} className={cardIconBtn}>
                <FolderPlus size={16} />
              </button>
              <button type="button" aria-label={`Rename ${scan.name}`} title="Rename" onClick={() => setRenaming(scan)} className={cardIconBtn}>
                <Pencil size={16} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${scan.name}`}
                title="Delete"
                onClick={() => setDeleting(scan)}
                className={`${cardIconBtn} hover:!bg-[#fbf1ee] hover:!text-[#a2463a]`}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete visualisation?"
        message={`“${deleting?.name ?? ''}” will be removed from this browser and from any projects. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleting) return
          await remove(deleting.id)
          showToast('Visualisation deleted.')
        }}
        onClose={() => setDeleting(null)}
      />

      <RenameScanModal
        scan={renaming}
        onClose={() => setRenaming(null)}
        onDone={() => {
          setRenaming(null)
          showToast('Name saved.')
        }}
      />

      <AddToProjectModal
        scan={adding}
        onClose={() => setAdding(null)}
        onDone={(name) => {
          setAdding(null)
          showToast(`Added to “${name}”.`)
        }}
      />

      {toast}
    </div>
  )
}
