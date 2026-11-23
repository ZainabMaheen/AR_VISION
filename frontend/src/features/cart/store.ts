import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSettingsStore } from '../settings/store'
import type { QuoteItem } from './types'

interface QuoteState {
  items: QuoteItem[]
  /** Saved visualisations the customer wants to send with the request. */
  scanIds: string[]
  /** Adds a material (no-op if it is already there). */
  add: (materialName: string) => void
  setArea: (materialName: string, areaSqFt: number) => void
  setWastage: (materialName: string, wastage: number) => void
  remove: (materialName: string) => void
  attachScan: (scanId: string) => void
  setScans: (scanIds: string[]) => void
  clear: () => void
}

const clampWastage = (n: number) => (Number.isFinite(n) ? Math.min(50, Math.max(0, Math.round(n))) : 0)
const cleanArea = (n: number) => (Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0)

/** The customer's quote request ("cart"). No payment: it is sent as an enquiry. */
// Local for now (this browser). TODO Phase 6B: store per user via the API after login.
export const useCartStore = create<QuoteState>()(
  persist(
    (set) => ({
      items: [],
      scanIds: [],
      add: (materialName) =>
        set((s) =>
          s.items.some((i) => i.materialName === materialName)
            ? s
            : {
                items: [
                  ...s.items,
                  {
                    materialName,
                    areaSqFt: 0,
                    wastage: clampWastage(useSettingsStore.getState().preferences.wastage),
                    addedAt: Date.now(),
                  },
                ],
              },
        ),
      setArea: (materialName, areaSqFt) =>
        set((s) => ({ items: s.items.map((i) => (i.materialName === materialName ? { ...i, areaSqFt: cleanArea(areaSqFt) } : i)) })),
      setWastage: (materialName, wastage) =>
        set((s) => ({ items: s.items.map((i) => (i.materialName === materialName ? { ...i, wastage: clampWastage(wastage) } : i)) })),
      remove: (materialName) => set((s) => ({ items: s.items.filter((i) => i.materialName !== materialName) })),
      attachScan: (scanId) => set((s) => (s.scanIds.includes(scanId) ? s : { scanIds: [...s.scanIds, scanId] })),
      setScans: (scanIds) => set({ scanIds }),
      clear: () => set({ items: [], scanIds: [] }),
    }),
    { name: 'ar-vision-quote' },
  ),
)
