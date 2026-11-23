import { useMemo } from 'react'
import { useCartStore } from './store'
import { orderSqFt } from './area'
import { useMaterialsStore } from '../catalogue/store'
import { useBusinessSettings } from '../business/settingsStore'
import type { CatalogueMaterial } from '../catalogue/types'
import type { QuoteItem } from './types'

export interface QuoteLine {
  item: QuoteItem
  /** undefined if the shop has since deleted or hidden the material. */
  material: CatalogueMaterial | undefined
  orderSqFt: number
  /** null when the material is unavailable. */
  pricePerSqFt: number | null
  /** price × order area, or null when unknown (no area / no price). */
  estimate: number | null
}

/** Quote request lines joined with the shop's catalogue, plus totals. */
export function useQuoteLines() {
  const items = useCartStore((s) => s.items)
  const catalogue = useMaterialsStore((s) => s.items)
  const showPrices = useBusinessSettings((s) => !!s.settings.showPrices)

  return useMemo(() => {
    const lines: QuoteLine[] = items.map((item) => {
      const material = catalogue.find((m) => m.name === item.materialName && !m.hidden)
      const order = orderSqFt(item)
      const price = material ? material.price : null
      return {
        item,
        material,
        orderSqFt: order,
        pricePerSqFt: price,
        estimate: price !== null && order > 0 ? price * order : null,
      }
    })
    const available = lines.filter((l) => l.material)
    return {
      lines,
      showPrices,
      totalOrderSqFt: available.reduce((s, l) => s + l.orderSqFt, 0),
      /** Sum of the lines that have an estimate. */
      estimateTotal: available.reduce((s, l) => s + (l.estimate ?? 0), 0),
      missingAreas: available.filter((l) => l.item.areaSqFt <= 0).length,
      unavailable: lines.length - available.length,
    }
  }, [items, catalogue, showPrices])
}
