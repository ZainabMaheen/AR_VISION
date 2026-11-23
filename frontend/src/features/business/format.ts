import type { Availability } from '../catalogue/types'

const priceFmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

/** "£9.50" (prices are per sq ft). */
export const formatPrice = (n: number) => priceFmt.format(n)

export const AVAILABILITY: { id: Availability; label: string }[] = [
  { id: 'in-stock', label: 'In stock' },
  { id: 'made-to-order', label: 'Made to order' },
  { id: 'out-of-stock', label: 'Out of stock' },
]

export const availabilityLabel = (a: Availability) => AVAILABILITY.find((x) => x.id === a)?.label ?? a

/** Business pages: denser than the customer pageWrap. */
export const bizWrap = 'mx-auto w-full max-w-[1600px] px-4 pb-9 pt-5 sm:px-6 sm:pt-6 xl:px-8'

/** White panel used on business pages. */
export const bizCard = 'min-w-0 rounded-[12px] border border-[#e8e4dc] bg-white'

/** Panel header row. */
export const bizCardHead = 'flex items-center justify-between gap-3 border-b border-[#eeeae3] px-4 py-3'

/** https:// or http:// link check for image and logo URLs. */
export const isWebUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim())
