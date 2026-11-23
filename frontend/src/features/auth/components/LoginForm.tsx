import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { errorMessage } from '../../../services/apiClient'
import { isValidEmail } from '../../settings/store'
import { registerAccount, signInWithPassword } from '../api'
import type { AuthUser } from '../store'

export type AuthMode = 'signin' | 'register'

interface Props {
  mode: AuthMode
  onSuccess: (user: AuthUser) => void
}

const MIN_PASSWORD = 8

type Errors = Partial<Record<'name' | 'email' | 'password' | 'form', string>>

/** Sign in or create a (customer) account. */
export default function LoginForm({ mode, onSuccess }: Props) {
  const register = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const next: Errors = {}
    if (register && !name.trim()) next.name = 'Please enter your name.'
    if (!email.trim()) next.email = 'Please enter your email.'
    else if (!isValidEmail(email)) next.email = 'Please enter a valid email address.'
    if (!password) next.password = 'Please enter your password.'
    else if (register && password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      const user = register
        ? await registerAccount(name.trim(), email.trim(), password)
        : await signInWithPassword(email.trim(), password)
      onSuccess(user)
    } catch (err) {
      setErrors({ form: errorMessage(err) })
      setBusy(false)
    }
  }

  const clear = (k: keyof Errors) => setErrors((x) => ({ ...x, [k]: undefined, form: undefined }))

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {register && (
        <Input
          label="Your name"
          autoComplete="name"
          value={name}
          maxLength={60}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value)
            clear('name')
          }}
        />
      )}
      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete={register ? 'email' : 'username'}
        value={email}
        maxLength={120}
        error={errors.email}
        onChange={(e) => {
          setEmail(e.target.value)
          clear('email')
        }}
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={register ? 'new-password' : 'current-password'}
          value={password}
          maxLength={128}
          error={errors.password}
          hint={register ? `At least ${MIN_PASSWORD} characters.` : undefined}
          onChange={(e) => {
            setPassword(e.target.value)
            clear('password')
          }}
        />
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-1 top-[22px] grid size-10 cursor-pointer place-items-center rounded-[8px] text-[#858179] hover:text-[#292a27]"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {errors.form && (
        <p role="alert" className="m-0 rounded-[9px] bg-[#fbf1ee] p-3 text-[12px] leading-[1.6] text-[#a2463a]">
          {errors.form}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {register ? <UserPlus size={15} /> : <LogIn size={15} />}
        {busy ? (register ? 'Creating account…' : 'Signing in…') : register ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  )
}
