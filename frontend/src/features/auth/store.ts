import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'customer' | 'business'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
}

interface AuthState {
  /** JWT access token. NOTE: kept in localStorage in this version (see backend README). */
  token: string | null
  user: AuthUser | null
  /** One-off message for the login page, e.g. "Your session has expired". */
  notice: string | null
  signIn: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  signOut: (notice?: string) => void
  clearNotice: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      notice: null,
      signIn: (token, user) => set({ token, user, notice: null }),
      setUser: (user) => set({ user }),
      signOut: (notice) => set({ token: null, user: null, notice: notice ?? null }),
      clearNotice: () => set({ notice: null }),
    }),
    { name: 'ar-vision-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
)
