import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shopApi } from '../../services/endpoints'
import { errorMessage } from '../../services/apiClient'
import type { BusinessSettings } from './types'

export const DEFAULT_BUSINESS: BusinessSettings = {
  shopName: 'Atelier Stone Co.',
  logoUrl: '',
  email: '',
  phone: '',
  address: '',
  showPrices: false,
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface BusinessSettingsState {
  settings: BusinessSettings
  status: Status
  error: string | null
  /** Bumps on every successful load/save, so forms can reset to the server's values. */
  version: number
  load: (opts?: { force?: boolean }) => Promise<void>
  /** PUT /shop. Throws an Error with a readable message on failure. */
  save: (s: BusinessSettings) => Promise<void>
}

let inFlight: Promise<void> | null = null

const fromApi = (s: BusinessSettings): BusinessSettings => ({
  shopName: s.shopName,
  logoUrl: s.logoUrl,
  email: s.email,
  phone: s.phone,
  address: s.address,
  showPrices: !!s.showPrices,
})

/**
 * Shop name, logo, contact details and "show prices to customers", from GET/PUT /shop.
 * Cached in localStorage so the name and price setting are available straight away.
 */
export const useBusinessSettings = create<BusinessSettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_BUSINESS,
      status: 'idle',
      error: null,
      version: 0,

      load: (opts = {}) => {
        if (get().status === 'ready' && !opts.force) return Promise.resolve()
        if (inFlight) return inFlight
        set({ status: 'loading', error: null })
        inFlight = shopApi
          .get()
          .then((s) => {
            set((st) => ({ settings: fromApi(s), status: 'ready', version: st.version + 1 }))
          })
          .catch((e: unknown) => {
            set({ status: 'error', error: errorMessage(e) })
          })
          .finally(() => {
            inFlight = null
          })
        return inFlight
      },

      save: async (s) => {
        const saved = await shopApi.update({
          shopName: s.shopName.trim(),
          logoUrl: s.logoUrl.trim(),
          email: s.email.trim(),
          phone: s.phone.trim(),
          address: s.address.trim(),
          showPrices: !!s.showPrices,
        })
        set((st) => ({ settings: fromApi(saved), status: 'ready', error: null, version: st.version + 1 }))
      },
    }),
    { name: 'ar-vision-business', version: 1, partialize: (s) => ({ settings: s.settings }) },
  ),
)
