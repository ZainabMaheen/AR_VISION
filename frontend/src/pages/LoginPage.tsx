import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Info, ShieldCheck } from 'lucide-react'
import Button from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import LoginForm, { type AuthMode } from '../features/auth/components/LoginForm'
import { safeNext } from '../features/auth/hooks/useAuth'
import { useAuthStore, type AuthUser } from '../features/auth/store'

/** Sign in / Create account. Business accounts are created by the shop (flask create-business-user). */
export default function LoginPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const notice = useAuthStore((s) => s.notice)
  const signOut = useAuthStore((s) => s.signOut)
  const clearNotice = useAuthStore((s) => s.clearNotice)

  const mode: AuthMode = params.get('mode') === 'register' ? 'register' : 'signin'
  const next = params.get('next')

  const setMode = (m: AuthMode) => {
    const p = new URLSearchParams(params)
    if (m === 'register') p.set('mode', 'register')
    else p.delete('mode')
    setParams(p, { replace: true })
  }

  const done = (u: AuthUser) => {
    clearNotice()
    navigate(safeNext(next, u.role === 'business' ? '/business' : '/'), { replace: true })
  }

  const tab = (m: AuthMode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`min-h-10 flex-1 cursor-pointer rounded-[8px] px-3 text-[13px] ${
        mode === m ? 'bg-white font-semibold text-[#292a27] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-[#77736c]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="w-full max-w-[420px]">
      <section className="rounded-[16px] border border-[#e8e4dc] bg-white p-5 sm:p-6">
        <p className="m-0 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">YOUR ACCOUNT</p>
        <h1 className="m-0 mt-1.5 text-[24px] font-medium tracking-[-0.6px]">
          {mode === 'register' ? (
            <>
              Create an <em className="font-normal italic text-[#b38b60]">account.</em>
            </>
          ) : (
            <>
              Welcome <em className="font-normal italic text-[#b38b60]">back.</em>
            </>
          )}
        </h1>
        <p className="m-0 mt-1.5 text-[13px] leading-[1.6] text-[#858179]">
          {mode === 'register'
            ? 'Save visualisations and projects, and see them on any device.'
            : 'Sign in to see your saved visualisations and projects.'}
        </p>

        {notice && (
          <p role="status" className="m-0 mt-4 flex gap-2 rounded-[10px] border border-[#ecdcb9] bg-[#fbf5e8] p-3 text-[12px] leading-[1.5] text-[#8a6418]">
            <Info size={15} className="mt-0.5 shrink-0" />
            {notice}
          </p>
        )}

        {user ? (
          <div className="mt-5 flex flex-col gap-2">
            <p className="m-0 rounded-[10px] bg-[#faf8f4] p-3 text-[13px]">
              Signed in as <strong>{user.name}</strong> ({user.email})
            </p>
            <Link to={safeNext(next, user.role === 'business' ? '/business' : '/')} className={buttonClass('primary')}>
              Continue
            </Link>
            <Button variant="secondary" onClick={() => signOut()}>
              Sign out to use another account
            </Button>
          </div>
        ) : (
          <>
            <div role="tablist" aria-label="Sign in or create an account" className="mt-5 flex gap-1 rounded-[10px] bg-[#f3f0ea] p-1">
              {tab('signin', 'Sign in')}
              {tab('register', 'Create account')}
            </div>
            <div className="mt-5">
              {/* key: fresh fields when switching tabs */}
              <LoginForm key={mode} mode={mode} onSuccess={done} />
            </div>
          </>
        )}
      </section>

      <p className="m-0 mt-4 flex items-start justify-center gap-2 px-2 text-center text-[11px] leading-[1.6] text-[#858179]">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#8b9a78]" />
        Browsing, the AR preview and quote requests work without an account. Shop staff accounts are set up by the shop.
      </p>
    </div>
  )
}
