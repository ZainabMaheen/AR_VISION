/** Shop details shown in the business portal (saved in this browser). */
export interface BusinessSettings {
  shopName: string
  /** https:// link to the shop's logo; empty = initials. */
  logoUrl: string
  email: string
  phone: string
  address: string
  /** Customers see prices per sq ft when true; otherwise only "Request a quote". Staff always see prices. */
  showPrices: boolean
}
