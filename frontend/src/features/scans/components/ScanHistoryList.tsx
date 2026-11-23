import type { ReactNode } from 'react'
import ScanThumbnail from './ScanThumbnail'
import type { SavedScan } from '../types'

interface Props {
  scans: SavedScan[]
  actions?: (scan: SavedScan) => ReactNode
}

/** Grid of saved visualisations: 1 column on phones, 2 on tablets, 3 on desktop. */
export default function ScanHistoryList({ scans, actions }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {scans.map((scan) => (
        <ScanThumbnail key={scan.id} scan={scan} actions={actions?.(scan)} />
      ))}
    </div>
  )
}

/** Placeholder cards while saved visualisations load. */
export function ScanListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white">
          <div className="aspect-[4/3] animate-pulse bg-[#eeeae3]" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#eeeae3]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#f3f0ea]" />
            <div className="mt-3 h-[42px] animate-pulse rounded-[10px] bg-[#f3f0ea]" />
          </div>
        </div>
      ))}
    </div>
  )
}
