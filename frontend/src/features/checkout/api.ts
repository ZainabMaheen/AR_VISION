import { enquiriesApi } from '../../services/endpoints'
import { toEnquiry } from '../enquiries/api'
import { useEnquiriesStore } from '../enquiries/store'
import type { Enquiry, EnquiryLine } from '../enquiries/types'
import type { ContactDetails } from './types'

interface SendInput {
  contact: ContactDetails
  lines: Pick<EnquiryLine, 'materialName' | 'areaSqFt' | 'wastage'>[]
  /** Server ids of the signed-in customer's saved visualisations to attach (empty for guests). */
  scanIds: string[]
  pricesShown: boolean
  /** Progress text for the button. */
  onProgress?: (text: string) => void
}

/**
 * Send a quote request (POST /enquiries). Guests may send one; a signed-in
 * customer's request is linked to their account and can include their saved
 * visualisations. Records it locally for the confirmation page.
 * Throws an Error with a readable message.
 */
export async function sendQuoteRequest({ contact, lines, scanIds, pricesShown, onProgress }: SendInput): Promise<Enquiry> {
  onProgress?.('Sending request…')
  const created = await enquiriesApi.create({
    customer: {
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      address: contact.address.trim(),
      postcode: contact.postcode.trim(),
    },
    notes: contact.notes.trim(),
    items: lines.map((l) => ({ materialName: l.materialName, areaSqFt: l.areaSqFt, wastagePct: l.wastage })),
    scanIds: scanIds.map(Number).filter((n) => Number.isInteger(n) && n > 0),
  })

  const enquiry: Enquiry = { ...toEnquiry(created), pricesShown }
  useEnquiriesStore.getState().recordSent(enquiry)
  return enquiry
}
