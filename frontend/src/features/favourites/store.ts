import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavouritesState {
  /** Material names (unique) the user has hearted */
  names: string[]
  toggle: (name: string) => void
}

// Local for now (this browser). TODO Phase 6B: store per user via the API after login.
export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set) => ({
      names: [],
      toggle: (name) =>
        set((s) => ({
          names: s.names.includes(name) ? s.names.filter((n) => n !== name) : [...s.names, name],
        })),
    }),
    { name: 'ar-vision-favourites' },
  ),
)