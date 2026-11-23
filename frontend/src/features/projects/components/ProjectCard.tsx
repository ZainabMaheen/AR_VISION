import { Link } from 'react-router-dom'
import { ArrowRight, FolderOpen } from 'lucide-react'
import { formatRelative, plural } from '../../../lib/formatters'
import type { SavedScan } from '../../scans/types'
import type { Project } from '../types'

interface Props {
  project: Project
  /** Saved visualisations in this project (for the cover images). */
  scans: SavedScan[]
}

export default function ProjectCard({ project, scans }: Props) {
  const covers = scans.slice(0, 3)

  return (
    <Link
      to={`/projects/${encodeURIComponent(project.id)}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white text-[#292a27] no-underline transition-shadow hover:shadow-[0_10px_30px_rgba(41,42,39,0.08)]"
    >
      <div className="relative grid aspect-[16/10] grid-cols-3 grid-rows-2 gap-0.5 overflow-hidden bg-[#eeeae3]">
        {covers.length === 0 ? (
          <div className="col-span-3 row-span-2 grid place-items-center text-[#b9b2a6]">
            <FolderOpen size={34} strokeWidth={1.4} />
          </div>
        ) : (
          covers.map((s, i) => (
            <img
              key={s.id}
              src={s.thumbnail}
              alt=""
              loading="lazy"
              className={`size-full object-cover ${
                covers.length === 1 ? 'col-span-3 row-span-2' : i === 0 ? 'col-span-2 row-span-2' : covers.length === 2 ? 'row-span-2' : ''
              }`}
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-sm font-semibold">{project.name}</h3>
          <p className="m-0 mt-1 truncate text-[11px] text-[#858179]">
            {plural(scans.length, 'visualisation')} · Updated {formatRelative(project.updatedAt).toLowerCase()}
          </p>
        </div>
        <ArrowRight size={16} className="shrink-0 text-[#858179] transition-transform group-hover:translate-x-0.5 group-hover:text-[#b38b60]" />
      </div>
    </Link>
  )
}
