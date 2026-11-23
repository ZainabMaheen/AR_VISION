/** One material in the customer's quote request. Areas are stored in sq ft. */
export interface QuoteItem {
  materialName: string
  /** Area to cover, before wastage. 0 = not entered yet. */
  areaSqFt: number
  /** Extra material for cuts and breakages, in %. */
  wastage: number
  addedAt: number
}
