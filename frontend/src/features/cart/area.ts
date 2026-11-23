import type { AreaUnit } from '../settings/store'
import type { QuoteItem } from './types'

export const SQFT_PER_SQM = 10.7639

/** Convert from the customer's unit to sq ft. */
export const toSqFt = (value: number, unit: AreaUnit) => (unit === 'sqm' ? value * SQFT_PER_SQM : value)

/** Convert sq ft to the customer's unit. */
export const fromSqFt = (sqft: number, unit: AreaUnit) => (unit === 'sqm' ? sqft / SQFT_PER_SQM : sqft)

export const unitShort = (unit: AreaUnit) => (unit === 'sqm' ? 'm²' : 'sq ft')

const areaFmt = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

/** "123.5 sq ft" / "11.5 m²" from a sq ft value. */
export const formatArea = (sqft: number, unit: AreaUnit) => `${areaFmt.format(fromSqFt(sqft, unit))} ${unitShort(unit)}`

/** Area to order, including wastage, in sq ft. */
export const orderSqFt = (item: Pick<QuoteItem, 'areaSqFt' | 'wastage'>) => item.areaSqFt * (1 + item.wastage / 100)
