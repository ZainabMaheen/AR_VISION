import { Link } from 'react-router-dom'

interface Props {
  title: string
  description: string
  to?: string
  cta?: string
}

export default function EmptyState({ title, description, to, cta }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#e0dbd2] bg-white px-6 py-14 text-center">
      <h3 className="m-0 text-[17px] font-medium tracking-[-0.4px]">{title}</h3>
      <p className="m-0 max-w-[360px] text-[13px] leading-[1.6] text-[#858179]">{description}</p>
      {to && cta && (
        <Link
          to={to}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#292a27] px-5 text-xs font-semibold text-white no-underline hover:bg-black"
        >
          {cta}
        </Link>
      )}
    </div>
  )
}