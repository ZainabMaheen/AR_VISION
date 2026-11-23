import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_COMPARE = 3

interface CompareState {
  names: string[]
  /** Adds a material. If the list is full, the oldest one is dropped. */
  add: (name: string) => void
  remove: (name: string) => void
  clear: () => void
}

// Local for now (this browser). TODO Phase 6B: store per user via the API after login.
export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      names: [],
      add: (name) =>
        set((s) => (s.names.includes(name) ? s : { names: [...s.names, name].slice(-MAX_COMPARE) })),
      remove: (name) => set((s) => ({ names: s.names.filter((n) => n !== name) })),
      clear: () => set({ names: [] }),
    }),
    { name: 'ar-vision-compare' },
  ),
)