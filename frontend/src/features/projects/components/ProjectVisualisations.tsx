import { FolderMinus } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ScanHistoryList, { ScanListSkeleton } from '../../scans/components/ScanHistoryList'
import { cardIconBtn } from '../../scans/links'
import type { SavedScan } from '../../scans/types'

interface Props {
  scans: SavedScan[]
  loading: boolean
  hasSavedScans: boolean
  onAdd: () => void
  onRemove: (scan: SavedScan) => void
}

/** The saved visualisations inside one project. */
export default function ProjectVisualisations({ scans, loading, hasSavedScans, onAdd, onRemove }: Props) {
  if (loading) return <ScanListSkeleton count={2} />

  if (scans.length === 0) {
    return hasSavedScans ? (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#e0dbd2] bg-white px-6 py-14 text-center">
        <h3 className="m-0 text-[17px] font-medium tracking-[-0.4px]">This project is empty</h3>
        <p className="m-0 max-w-[360px] text-[13px] leading-[1.6] text-[#858179]">
          Add visualisations you have already saved, or create a new one in the AR preview.
        </p>
        <Button className="mt-4" onClick={onAdd}>
          Add visualisations
        </Button>
      </div>
    ) : (
      <EmptyState
        title="This project is empty"
        description="Save a visualisation in the AR preview first, then add it here."
        to="/arpreview"
        cta="Open AR preview"
      />
    )
  }

  return (
    <ScanHistoryList
      scans={scans}
      actions={(scan) => (
        <button
          type="button"
          aria-label={`Remove ${scan.name} from this project`}
          title="Remove from project"
          onClick={() => onRemove(scan)}
          className={cardIconBtn}
        >
          <FolderMinus size={16} />
        </button>
      )}
    />
  )
}
