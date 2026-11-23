import { MATERIALS } from '../../lib/constants'
import type { Availability, CatalogueMaterial } from '../catalogue/types'

/**
 * SAMPLE shop details for the 6 starting materials. Prices are made up so the
 * stock manager has something to show. Replace them with the shop's real figures.
 */
const SAMPLE: Record<string, { price: number; availability: Availability; description: string }> = {
  'Carrara Vein': { price: 9.5, availability: 'in-stock', description: 'Classic Italian white marble with soft grey veining.' },
  'Nero Marquina': { price: 12, availability: 'made-to-order', description: 'Deep black marble with crisp white veins.' },
  'Alpine Mist': { price: 7.25, availability: 'in-stock', description: 'Hard-wearing grey granite with a leathered texture.' },
  'Sandstone Beige': { price: 4.5, availability: 'in-stock', description: 'Warm, matte tile with a sandstone look.' },
  'Warm Travertine': { price: 6.8, availability: 'made-to-order', description: 'Natural travertine-look tile with soft banding.' },
  'Silver Cloud': { price: 8.4, availability: 'out-of-stock', description: 'Polished silver-grey granite with fine speckles.' },
}

/** The starting catalogue: MATERIALS from lib/constants plus sample shop details. */
export function sampleCatalogue(): CatalogueMaterial[] {
  const now = Date.now()
  return MATERIALS.map((m, i) => ({
    ...m,
    ...(SAMPLE[m.name] ?? { price: 0, availability: 'in-stock' as const, description: '' }),
    id: `sample-${i + 1}`,
    hidden: false,
    custom: false,
    updatedAt: now,
  }))
}
