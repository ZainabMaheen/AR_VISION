import { useEffect } from 'react'
import { refreshCurrentUser } from '../api'
import { useAuthStore } from '../store'

/** The signed-in user (or null for guests) and sign-out. */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const signOut = useAuthStore((s) => s.signOut)
  return {
    user,
    token,
    isSignedIn: user !== null,
    isBusiness: user?.role === 'business',
    signOut: () => signOut(),
  }
}

let checked = false

/** Once per page load: confirm the stored token is still valid (a 401 signs out via apiClient). */
export function useSessionCheck() {
  useEffect(() => {
    if (checked) return
    checked = true
    void refreshCurrentUser().catch(() => {
      // Network problems are shown by the pages that need data; nothing to do here
    })
  }, [])
}

/** Safe "come back to" path from ?next= (internal paths only). */
export function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : fallback
}
