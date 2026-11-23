import { isValidEmail } from '../settings/store'

/** Contact and delivery details on the quote request form. */
export interface ContactDetails {
  name: string
  email: string
  phone: string
  address: string
  postcode: string
  notes: string
}

export type ContactErrors = Partial<Record<keyof ContactDetails, string>>

export const EMPTY_CONTACT: ContactDetails = { name: '', email: '', phone: '', address: '', postcode: '', notes: '' }

export function validateContact(c: ContactDetails): ContactErrors {
  const e: ContactErrors = {}
  if (!c.name.trim()) e.name = 'Please enter your name.'
  if (!c.email.trim()) e.email = 'Please enter your email so the shop can reply.'
  else if (!isValidEmail(c.email)) e.email = 'Please enter a valid email address.'
  if (c.phone.trim() && c.phone.replace(/[^\d]/g, '').length < 7) e.phone = 'Please check the phone number.'
  return e
}
