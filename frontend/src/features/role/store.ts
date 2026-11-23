import { useAuthStore } from '../auth/store'

export type Role = 'guest' | 'customer' | 'business'

/**
 * The current role now comes from the signed-in user (Phase 6B); the old
 * switchable placeholder is gone. The API checks the role on every request.
 */
export const useRole = (): Role => useAuthStore((s) => s.user?.role ?? 'guest')
