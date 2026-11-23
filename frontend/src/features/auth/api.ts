import { apiRequest } from '../../services/apiClient'
import { useAuthStore, type AuthUser } from './store'

interface ApiSession {
  token: string
  user: AuthUser & { createdAt?: string }
}

const cleanUser = (u: ApiSession['user']): AuthUser => ({ id: u.id, name: u.name, email: u.email, role: u.role })

/** POST /auth/login, then remember the session. Throws ApiError with a readable message. */
export async function signInWithPassword(email: string, password: string): Promise<AuthUser> {
  const s = await apiRequest<ApiSession>('/auth/login', { method: 'POST', json: { email, password }, skipAuth: true })
  const user = cleanUser(s.user)
  useAuthStore.getState().signIn(s.token, user)
  return user
}

/** POST /auth/register (customer accounts only), then sign in. */
export async function registerAccount(name: string, email: string, password: string): Promise<AuthUser> {
  const s = await apiRequest<ApiSession>('/auth/register', { method: 'POST', json: { name, email, password }, skipAuth: true })
  const user = cleanUser(s.user)
  useAuthStore.getState().signIn(s.token, user)
  return user
}

/** GET /auth/me: refresh the stored user (name / role may have changed). A 401 signs out via apiClient. */
export async function refreshCurrentUser(): Promise<void> {
  if (!useAuthStore.getState().token) return
  const user = await apiRequest<ApiSession['user']>('/auth/me')
  useAuthStore.getState().setUser(cleanUser(user))
}
