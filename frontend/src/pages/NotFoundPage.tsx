import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { buttonClass } from '../components/ui/buttonStyles'
import { pageWrap } from '../lib/styles'

/** Shown inside the layout for links that do not exist. */
export default function NotFoundPage() {
  const { pathname } = useLocation()
  const business = pathname.startsWith('/business')

  return (
    <div className={pageWrap}>
      <div className="mx-auto flex max-w-[460px] flex-col items-center rounded-2xl border border-dashed border-[#e0dbd2] bg-white px-6 py-14 text-center">
        <span className="grid size-11 place-items-center rounded-[10px] bg-[#f5f0e8] text-[#b38b60]">
          <Compass size={20} />
        </span>
        <p className="m-0 mt-4 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">404</p>
        <h2 className="m-0 mt-1 text-[22px] font-medium tracking-[-0.6px]">Page not found.</h2>
        <p className="m-0 mt-2 max-w-[340px] break-words text-[13px] leading-[1.6] text-[#858179]">
          Nothing lives at <span className="font-mono text-[12px]">{pathname}</span>. The link may be old or mistyped.
        </p>
        <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link to={business ? '/business' : '/'} className={buttonClass('primary')}>
            {business ? 'Business overview' : 'Go to dashboard'}
          </Link>
          {!business && (
            <Link to="/catalogue" className={buttonClass('secondary')}>
              Browse materials
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
