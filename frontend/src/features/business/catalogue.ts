import { useMemo } from 'react'
import { useMaterialsStore } from '../catalogue/store'

/** Counts used by the business dashboard and sidebar. */
export function useCatalogueCounts() {
  const items = useMaterialsStore((s) => s.items)
  return useMemo(
    () => ({
      total: items.length,
      visible: items.filter((m) => !m.hidden).length,
      hidden: items.filter((m) => m.hidden).length,
      outOfStock: items.filter((m) => m.availability === 'out-of-stock').length,
    }),
    [items],
  )
}
