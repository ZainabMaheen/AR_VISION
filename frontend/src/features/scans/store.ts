import { create } from 'zustand'
import { errorMessage } from '../../services/apiClient'
import { scansApi } from '../../services/endpoints'
import { useAuthStore } from '../auth/store'
import { useProjectsStore } from '../projects/store'
import { clearScans, isIndexedDbAvailable } from './db'
import { toSavedScan, uploadScan } from './api'
import type { NewScan, SavedScan } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface ScansState {
  /** The signed-in user's saved visualisations, newest first (empty for guests). */
  scans: SavedScan[]
  status: Status
  error: string | null
  /** Always true now that saves go to the server (kept for the existing UI). */
  persistent: boolean
  load: (opts?: { force?: boolean }) => Promise<void>
  /** Throw an Error with a readable message on failure. */
  add: (scan: NewScan) => Promise<SavedScan>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  /** Clears copies still stored only in this browser (IndexedDB). Account data is not touched. */
  clearAll: () => Promise<void>
}

let inFlight: Promise<void> | null = null

/**
 * Saved visualisations, stored on the server per user (GET/POST/PATCH/DELETE /scans).
 * Guests have none: the UI asks them to sign in before saving.
 */
export const useScansStore = create<ScansState>()((set, get) => ({
  scans: [],
  status: 'idle',
  error: null,
  persistent: true,

  load: (opts = {}) => {
    if (!useAuthStore.getState().user) {
      set({ scans: [], status: 'ready', error: null })
      return Promise.resolve()
    }
    if (get().status === 'ready' && !opts.force) return Promise.resolve()
    if (inFlight) return inFlight
    set({ status: 'loading', error: null })
    inFlight = scansApi
      .list()
      .then((list) => {
        set({ scans: list.map(toSavedScan), status: 'ready' })
      })
      .catch((e: unknown) => {
        set({ status: 'error', error: errorMessage(e, 'Saved visualisations could not be loaded.') })
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  },

  add: async (input) => {
    if (!useAuthStore.getState().user) throw new Error('Please sign in to save visualisations.')
    const scan = await uploadScan(input)
    set((s) => ({ scans: [scan, ...s.scans] }))
    return scan
  },

  rename: async (id, name) => {
    const updated = toSavedScan(await scansApi.rename(id, name))
    set((s) => ({ scans: s.scans.map((x) => (x.id === id ? updated : x)) }))
  },

  remove: async (id) => {
    await scansApi.remove(id)
    set((s) => ({ scans: s.scans.filter((x) => x.id !== id) }))
    useProjectsStore.getState().detachScanEverywhere(id)
  },

  clearAll: async () => {
    if (isIndexedDbAvailable()) await clearScans()
  },
}))

// A different (or no) user signed in: forget the previous user's list
useAuthStore.subscribe((s, prev) => {
  if (s.user?.id !== prev.user?.id) {
    inFlight = null
    useScansStore.setState({ scans: [], status: 'idle', error: null })
  }
})

/** Find one saved visualisation of the signed-in user (loads the list first). */
export async function getScan(id: string): Promise<SavedScan | undefined> {
  await useScansStore.getState().load()
  const found = useScansStore.getState().scans.find((s) => s.id === id)
  if (found || !useAuthStore.getState().user) return found
  try {
    return toSavedScan(await scansApi.get(id))
  } catch {
    return undefined
  }
}
