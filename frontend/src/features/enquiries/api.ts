import { assetUrl } from '../../services/apiClient'
import type { ApiEnquiry } from '../../services/endpoints'
import type { Enquiry } from './types'

/** API enquiry -> frontend enquiry. */
export function toEnquiry(e: ApiEnquiry): Enquiry {
  return {
    id: String(e.id),
    reference: e.reference,
    createdAt: Date.parse(e.createdAt) || Date.now(),
    status: e.status,
    statusUpdatedAt: Date.parse(e.updatedAt) || Date.now(),
    contact: {
      name: e.customer.name,
      email: e.customer.email,
      phone: e.customer.phone,
      address: e.customer.address,
      postcode: e.customer.postcode,
      notes: e.notes,
    },
    lines: e.items.map((i) => ({
      materialName: i.materialName,
      areaSqFt: i.areaSqFt,
      wastage: i.wastagePct,
      orderSqFt: i.orderSqFt,
      pricePerSqFt: i.pricePerSqFtAtRequest,
    })),
    scanIds: e.scanIds.map(String),
    attachments: (e.scans ?? []).map((s) => ({
      id: String(s.id),
      name: s.name,
      materialName: s.materialName,
      thumbnailUrl: assetUrl(s.thumbnailUrl),
      roomImageUrl: assetUrl(s.roomImageUrl),
    })),
    pricesShown: null,
    staffNote: e.staffNote ?? '',
  }
}
