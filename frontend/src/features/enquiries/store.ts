import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { enquiriesApi } from '../../services/endpoints'
import { errorMessage } from '../../services/apiClient'
import { toEnquiry } from './api'
import type { Enquiry, EnquiryStatus } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface EnquiriesState {
  /** Staff list from GET /enquiries (newest first). TODO Phase 6B: requires the business role. */
  enquiries: Enquiry[]
  status: Status
  error: string | null
  load: () => Promise<void>
  /** GET /enquiries/:id (includes attachments); updates the list. Throws ApiError. */
  fetchOne: (id: string) => Promise<Enquiry>
  /** PATCH /enquiries/:id. Throw an Error with a readable message on failure. */
  setStatus: (id: string, status: EnquiryStatus) => Promise<void>
  setStaffNote: (id: string, note: string) => Promise<void>

  /** Requests this customer sent from this browser (for the confirmation page and dashboard).
   *  TODO Phase 6B: load the logged-in customer's own requests from the API instead. */
  sent: Enquiry[]
  recordSent: (e: Enquiry) => void
}

let inFlight: Promise<void> | null = null

const upsert = (list: Enquiry[], e: Enquiry) =>
  list.some((x) => x.id === e.id) ? list.map((x) => (x.id === e.id ? { ...e, attachments: e.attachments.length ? e.attachments : x.attachments } : x)) : [e, ...list]

export const useEnquiriesStore = create<EnquiriesState>()(
  persist(
    (set, get) => ({
      enquiries: [],
      status: 'idle',
      error: null,

      load: () => {
        if (inFlight) return inFlight
        set({ status: 'loading', error: null })
        inFlight = enquiriesApi
          .list()
          .then((list) => {
            // Keep attachments already fetched for an enquiry
            const prev = new Map(get().enquiries.map((e) => [e.id, e]))
            set({
              enquiries: list.map(toEnquiry).map((e) => ({ ...e, attachments: prev.get(e.id)?.attachments ?? [] })),
              status: 'ready',
            })
          })
          .catch((e: unknown) => {
            set({ status: 'error', error: errorMessage(e) })
          })
          .finally(() => {
            inFlight = null
          })
        return inFlight
      },

      fetchOne: async (id) => {
        const e = toEnquiry(await enquiriesApi.get(id))
        set((s) => ({ enquiries: upsert(s.enquiries, e) }))
        return e
      },

      setStatus: async (id, status) => {
        const e = toEnquiry(await enquiriesApi.update(id, { status }))
        set((s) => ({ enquiries: upsert(s.enquiries, e) }))
      },

      setStaffNote: async (id, note) => {
        const e = toEnquiry(await enquiriesApi.update(id, { staffNote: note.trim() }))
        set((s) => ({ enquiries: upsert(s.enquiries, e) }))
      },

      sent: [],
      recordSent: (e) => set((s) => ({ sent: [e, ...s.sent.filter((x) => x.id !== e.id)].slice(0, 50) })),
    }),
    {
      name: 'ar-vision-enquiries',
      // v0 kept every enquiry locally; those were sent from this browser, so they become "sent"
      version: 1,
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as { enquiries?: Enquiry[]; sent?: Enquiry[] }
        const sent = version < 1 ? (old.enquiries ?? []) : (old.sent ?? [])
        return { sent: sent.map((e) => ({ ...e, attachments: e.attachments ?? [] })) }
      },
      // Staff data is never cached in the browser; only the customer's own sent requests
      partialize: (s) => ({ sent: s.sent }),
    },
  ),
)
