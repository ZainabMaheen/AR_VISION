import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { materialsApi, type ApiMaterialBody } from '../../services/endpoints'
import { errorMessage } from '../../services/apiClient'
import { toApiMaterialBody, toCatalogueMaterial } from './api'
import type { CatalogueMaterial, MaterialInput } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'
/** public = what customers may see; staff = everything, with prices (include_hidden=true). */
type Scope = 'public' | 'staff'

interface MaterialsState {
  items: CatalogueMaterial[]
  status: Status
  error: string | null
  loadedScope: Scope | null
  /** Fetch from the API. Skips the request if a suitable list is already loaded, unless force. */
  load: (scope: Scope, opts?: { force?: boolean }) => Promise<void>
  /** All mutations call the API and throw an Error with a readable message on failure. */
  add: (input: MaterialInput) => Promise<CatalogueMaterial>
  /** The name cannot change: favourites, comparisons and saved visualisations refer to it. */
  update: (id: string, changes: Partial<Omit<MaterialInput, 'name'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  setHidden: (id: string, hidden: boolean) => Promise<void>
  /** Adds back any deleted sample materials (never changes existing ones). Returns how many were added. */
  restoreSamples: () => Promise<number>
}

let inFlight: { scope: Scope; promise: Promise<void> } | null = null
let requestSeq = 0

/**
 * The shop's catalogue, loaded from the Flask API (GET /materials).
 * The last list is cached in localStorage so pages render instantly, then refreshed.
 */
export const useMaterialsStore = create<MaterialsState>()(
  persist(
    (set, get) => {
      const replace = (m: CatalogueMaterial) => set((s) => ({ items: s.items.map((x) => (x.id === m.id ? m : x)) }))

      return {
        items: [],
        status: 'idle',
        error: null,
        loadedScope: null,

        load: (scope, opts = {}) => {
          const s = get()
          const enough = s.status === 'ready' && (scope === 'public' || s.loadedScope === 'staff')
          if (enough && !opts.force) return Promise.resolve()
          if (inFlight && (inFlight.scope === scope || inFlight.scope === 'staff')) return inFlight.promise

          set({ status: 'loading', error: null })
          const seq = ++requestSeq // only the newest request may write its result
          const promise = materialsApi
            .list(scope === 'staff')
            .then((list) => {
              if (seq === requestSeq) set({ items: list.map(toCatalogueMaterial), status: 'ready', loadedScope: scope })
            })
            .catch((e: unknown) => {
              if (seq === requestSeq) set({ status: 'error', error: errorMessage(e) })
            })
            .finally(() => {
              if (seq === requestSeq) inFlight = null
            })
          inFlight = { scope, promise }
          return promise
        },

        add: async (input) => {
          const created = toCatalogueMaterial(await materialsApi.create(toApiMaterialBody(input) as ApiMaterialBody))
          set((s) => ({ items: [...s.items, created] }))
          return created
        },

        update: async (id, changes) => {
          replace(toCatalogueMaterial(await materialsApi.update(id, toApiMaterialBody(changes))))
        },

        remove: async (id) => {
          await materialsApi.remove(id)
          set((s) => ({ items: s.items.filter((m) => m.id !== id) }))
        },

        setHidden: async (id, hidden) => {
          replace(toCatalogueMaterial(await materialsApi.update(id, { visible: !hidden })))
        },

        restoreSamples: async () => {
          const { added } = await materialsApi.restoreSamples()
          await get().load('staff', { force: true })
          return added
        },
      }
    },
    {
      name: 'ar-vision-catalogue',
      // v1 was the local-only catalogue (Phase 3); the API is now the source of truth
      version: 2,
      migrate: () => ({ items: [], loadedScope: null }),
      partialize: (s) => ({ items: s.items, loadedScope: s.loadedScope }),
    },
  ),
)

/** Materials customers may see (not hidden), in catalogue order. */
export function useVisibleMaterials(): CatalogueMaterial[] {
  const items = useMaterialsStore((s) => s.items)
  return useMemo(() => items.filter((m) => !m.hidden), [items])
}

/** A visible material by exact name (outside React; used by findMaterial). */
export const findVisibleMaterial = (name: string): CatalogueMaterial | undefined =>
  useMaterialsStore.getState().items.find((m) => m.name === name && !m.hidden)
