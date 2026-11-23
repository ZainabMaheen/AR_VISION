import { useEffect } from 'react'
import { useScansStore } from '../store'
import { useAuthStore } from '../../auth/store'

/** The signed-in user's saved visualisations, loaded from the API (empty for guests). */
export function useScans() {
  const scans = useScansStore((s) => s.scans)
  const status = useScansStore((s) => s.status)
  const error = useScansStore((s) => s.error)
  const persistent = useScansStore((s) => s.persistent)
  const load = useScansStore((s) => s.load)
  const userId = useAuthStore((s) => s.user?.id)

  // Reload when someone signs in or out
  useEffect(() => {
    void load()
  }, [load, userId])

  return { scans, status, error, persistent, retry: load, loading: status === 'idle' || status === 'loading' }
}

export default useScans
