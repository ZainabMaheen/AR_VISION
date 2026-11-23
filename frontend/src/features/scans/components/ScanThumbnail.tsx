import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { buttonClass } from '../../../components/ui/buttonStyles'
import { scanUrl } from '../links'
import { formatDateTime, formatRelative } from '../../../lib/formatters'
import type { SavedScan } from '../types'

interface Props {
  scan: SavedScan
  /** Extra icon buttons next to "Open in AR". */
  actions?: ReactNode
}

/** Card for one saved visualisation. */
export default function ScanThumbnail({ scan, actions }: Props) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white">
      <Link to={scanUrl(scan.id)} className="group relative block aspect-[4/3] overflow-hidden bg-[#e7dfd2]">
        <img
          src={scan.thumbnail}
          alt={`${scan.name}: ${scan.materialName} preview`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-[7px] border border-white/60 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#4d4942] backdrop-blur-sm">
          {scan.materialName}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="m-0 truncate text-sm font-semibold" title={scan.name}>
          {scan.name}
        </h3>
        <p className="m-0 mt-1 text-[11px] text-[#858179]" title={formatDateTime(scan.createdAt)}>
          Saved {formatRelative(scan.createdAt).toLowerCase()} · {scan.tilesX}×{scan.tilesY} tiles
        </p>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link to={scanUrl(scan.id)} className={buttonClass('primary', 'min-w-0 flex-1')}>
            <Camera size={15} className="shrink-0" />
            <span className="truncate">Open in AR</span>
          </Link>
          {actions}
        </div>
      </div>
    </article>
  )
}
