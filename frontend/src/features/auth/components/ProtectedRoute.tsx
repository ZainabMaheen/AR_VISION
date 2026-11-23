import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Lock, Store } from 'lucide-react'
import { buttonClass } from '../../../components/ui/buttonStyles'
import { useAuthStore } from '../store'

interface Props {
  children: ReactNode
  /** Leave out to allow any signed-in user. */
  role?: 'business'
  /** Heading / text of the sign-in prompt. */
  title?: string
  message?: string
  /** Centre on the whole screen (outside a layout). */
  fullScreen?: boolean
}

/**
 * Shows the page only to signed-in users (and, with role="business", only to staff).
 * Otherwise a friendly prompt to sign in. This is about what the UI shows: the
 * server checks the token on every request.
 */
export default function ProtectedRoute({ children, role, title, message, fullScreen = false }: Props) {
  const user = useAuthStore((s) => s.user)
  const { pathname, search } = useLocation()
  const next = encodeURIComponent(pathname + search)

  if (user && (!role || user.role === role)) return <>{children}</>

  const wrongRole = user !== null // signed in, but not a business account
  const heading = wrongRole ? 'Business accounts only' : (title ?? 'Sign in to continue')
  const text = wrongRole
    ? `You are signed in as ${user.name}, a customer account. Sign in with a business account to manage the shop.`
    : (message ?? 'Sign in or create a free account to see this page.')

  const card = (
    <div className="w-full max-w-[420px] rounded-[16px] border border-[#e8e4dc] bg-white p-6 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-[10px] bg-[#f5f0e8] text-[#b38b60]">
        {role === 'business' ? <Store size={20} /> : <Lock size={20} />}
      </span>
      <h2 className="m-0 mt-4 text-[19px] font-medium tracking-[-0.4px]">{heading}</h2>
      <p className="m-0 mt-2 text-[13px] leading-[1.6] text-[#858179]">{text}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Link to={`/login?next=${next}`} className={buttonClass('primary')}>
          {wrongRole ? 'Sign in with a business account' : 'Sign in'}
        </Link>
        {!wrongRole && role !== 'business' && (
          <Link to={`/login?mode=register&next=${next}`} className={buttonClass('secondary')}>
            Create a free account
          </Link>
        )}
        {role === 'business' && (
          <Link to="/" className={buttonClass('secondary')}>
            Back to customer view
          </Link>
        )}
      </div>
    </div>
  )

  return fullScreen ? (
    <div className="grid min-h-[100dvh] place-items-center bg-[#faf8f4] p-4">{card}</div>
  ) : (
    <div className="mx-auto grid w-full max-w-[1600px] place-items-center px-4 py-12 sm:px-7">{card}</div>
  )
}
