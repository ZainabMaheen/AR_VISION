import { isRouteErrorResponse, Link, useLocation, useRouteError } from 'react-router-dom'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import Button from '../ui/Button'
import { buttonClass } from '../ui/buttonStyles'

/**
 * Route error screen (used as `errorElement` in the router). Shown instead of a
 * blank page when a page crashes or a route cannot be found.
 */
export default function ErrorBoundary() {
  const error = useRouteError()
  const { pathname } = useLocation()
  const home = pathname.startsWith('/business') ? '/business' : '/'

  const notFound = isRouteErrorResponse(error) && error.status === 404
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null

  if (error) console.error('[AR Vision] page error:', error)

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#faf8f4] p-4">
      <div className="w-full max-w-[440px] rounded-[16px] border border-[#e8e4dc] bg-white p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-[10px] bg-[#fbf1ee] text-[#a2463a]">
          <AlertTriangle size={20} />
        </span>
        <h1 className="m-0 mt-4 text-[19px] font-medium tracking-[-0.4px]">
          {notFound ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="m-0 mt-2 text-[13px] leading-[1.6] text-[#858179]">
          {notFound
            ? 'This link does not lead anywhere. It may be old or mistyped.'
            : 'This page hit a problem. Your saved work is safe in this browser. Try reloading, or go back to the start.'}
        </p>
        {detail && !notFound && (
          <p className="m-0 mt-3 break-words rounded-[8px] bg-[#faf8f4] p-2.5 font-mono text-[11px] text-[#77736b]">{detail}</p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {!notFound && (
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RotateCcw size={15} />
              Reload
            </Button>
          )}
          <Link to={home} className={buttonClass('primary')}>
            Go to {home === '/' ? 'the dashboard' : 'the business overview'}
          </Link>
        </div>
      </div>
    </div>
  )
}
