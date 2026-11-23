import type { ContactDetails } from '../checkout/types'

export type EnquiryStatus = 'new' | 'quoted' | 'confirmed' | 'delivered'

export const ENQUIRY_STATUSES: { id: EnquiryStatus; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'delivered', label: 'Delivered' },
]

export const statusLabel = (s: EnquiryStatus) => ENQUIRY_STATUSES.find((x) => x.id === s)?.label ?? s

export interface EnquiryLine {
  materialName: string
  /** Area to cover (before wastage), sq ft. */
  areaSqFt: number
  wastage: number
  /** Area including wastage, sq ft. */
  orderSqFt: number
  /** Shop price per sq ft when the request was sent (null if the material no longer existed). */
  pricePerSqFt: number | null
}

/** A saved visualisation uploaded with a request (served by the backend). */
export interface EnquiryAttachment {
  id: string
  name: string
  materialName: string
  thumbnailUrl: string
  roomImageUrl: string
}

/** A customer's quote request, as the shop sees it. */
export interface Enquiry {
  id: string
  /** Short reference shown to the customer, e.g. AV-7K3P2. */
  reference: string
  createdAt: number
  status: EnquiryStatus
  statusUpdatedAt: number
  contact: ContactDetails
  lines: EnquiryLine[]
  /** Server ids of the attached saved visualisations. */
  scanIds: string[]
  /** Filled when a single enquiry is loaded (GET /enquiries/:id). */
  attachments: EnquiryAttachment[]
  /** Whether prices were shown to the customer when they sent it (null = not recorded by the server). */
  pricesShown: boolean | null
  /** Private note for staff. */
  staffNote: string
}

