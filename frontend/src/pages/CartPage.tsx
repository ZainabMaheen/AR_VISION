import { Paperclip } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import CartItem from '../features/cart/components/CartItem'
import CartSummary from '../features/cart/components/CartSummary'
import { useQuoteLines } from '../features/cart/useQuoteLines'
import { useCartStore } from '../features/cart/store'
import { useSettingsStore } from '../features/settings/store'
import { plural } from '../lib/formatters'
import { pageWrap } from '../lib/styles'

/** The customer's quote request ("cart"): materials, areas and wastage. */
export default function CartPage() {
  const { lines, showPrices, totalOrderSqFt, estimateTotal, missingAreas, unavailable } = useQuoteLines()
  const attached = useCartStore((s) => s.scanIds.length)
  const unit = useSettingsStore((s) => s.preferences.units)

  return (
    <div className={pageWrap}>
      <PageHeader
        eyebrow="YOUR QUOTE"
        title={
          <>
            Quote <em className="font-normal italic text-[#b38b60]">request.</em>
          </>
        }
        description={
          lines.length
            ? `${plural(lines.length, 'material')}. Add the area for each so the shop can quote accurately.`
            : 'Choose materials, add your room sizes, and the shop will send you a quote.'
        }
      />

      {lines.length === 0 ? (
        <EmptyState
          title="Your quote request is empty"
          description="Tap “Request a quote” on any material in the catalogue or the AR preview."
          to="/catalogue"
          cta="Browse materials"
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {lines.map((line) => (
                <CartItem key={line.item.materialName} line={line} unit={unit} showPrices={showPrices} />
              ))}
            </ul>
            {attached > 0 && (
              <p className="m-0 mt-3 flex items-center gap-2 text-[12px] text-[#5f5c55]">
                <Paperclip size={14} className="shrink-0 text-[#a67e50]" />
                {plural(attached, 'saved visualisation')} will be attached. You can change this on the next step.
              </p>
            )}
          </div>
          <CartSummary
            materials={lines.length}
            totalOrderSqFt={totalOrderSqFt}
            missingAreas={missingAreas}
            unavailable={unavailable}
            showPrices={showPrices}
            estimateTotal={estimateTotal}
            unit={unit}
          />
        </div>
      )}
    </div>
  )
}
