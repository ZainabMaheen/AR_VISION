import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  label: string
  value: ReactNode
  /** Small line under the number, e.g. "2 hidden". */
  detail?: ReactNode
  to?: string
}

/** Compact headline-number tile (no chart). */
export default function KpiTile({ label, value, detail, to }: Props) {
  const body = (
    <>
      <p className="m-0 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">{label}</p>
      <strong className="mt-1.5 block truncate text-[28px] font-light leading-none tracking-[-1px] tabular-nums text-[#292a27]">
        {value}
      </strong>
      {detail && <span className="mt-1.5 block truncate text-[11px] text-[#858179]">{detail}</span>}
    </>
  )
  const cls = 'block min-w-0 rounded-[12px] border border-[#e8e4dc] bg-white p-4 text-[#292a27] no-underline'
  return to ? (
    <Link to={to} className={`${cls} hover:border-[#d9cbb6] hover:bg-[#fffdf9]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
