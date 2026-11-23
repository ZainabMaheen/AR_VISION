import { ArrowRight, FileText, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCompareStore } from '../../compare/store'
import { useFavouritesStore } from '../../favourites/store'
import { useCartStore } from '../../cart/store'
import { useMaterialsStore } from '../store'
import { useBusinessSettings } from '../../business/settingsStore'
import { formatPrice } from '../../business/format'
import type { Material } from '../../../types/stone'

export default function StoneCard({ material: m }: { material: Material }) {
  const isFav = useFavouritesStore((s) => s.names.includes(m.name))
  const toggleFav = useFavouritesStore((s) => s.toggle)
  const addCompare = useCompareStore((s) => s.add)
  const addToQuote = useCartStore((s) => s.add)
  const showPrices = useBusinessSettings((s) => !!s.settings.showPrices)
  const price = useMaterialsStore((s) => s.items.find((x) => x.name === m.name)?.price)

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white">
      <div className="relative h-[200px] overflow-hidden bg-[#e5ddd1]">
        <img src={m.image} alt={`${m.name} finish`} className="size-full object-cover" />
        <button
          type="button"
          aria-pressed={isFav}
          aria-label={isFav ? `Remove ${m.name} from favourites` : `Save ${m.name} to favourites`}
          onClick={() => toggleFav(m.name)}
          className={`absolute right-3 top-3 grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 backdrop-blur ${
            isFav ? 'text-[#b38b60]' : 'text-[#292a27] hover:text-[#b38b60]'
          }`}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <p className="m-0 text-[10px] font-semibold tracking-[1.1px] text-[#a67e50]">
          {m.category.toUpperCase()} · {m.finish.toUpperCase()}
        </p>
        <h3 className="m-0 text-[17px] font-medium tracking-[-0.4px]">{m.name}</h3>
        <span className="text-[11px] text-[#858179]">{m.tone}</span>
        {showPrices && typeof price === 'number' && (
          <span className="text-[13px] font-semibold tabular-nums">
            {formatPrice(price)} <small className="text-[11px] font-normal text-[#858179]">/ sq ft</small>
          </span>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-[#eeeae3] pt-3 text-xs font-semibold">
          <Link
            to={`/arpreview?material=${encodeURIComponent(m.name)}`}
            className="inline-flex items-center gap-1.5 text-[#292a27] no-underline hover:text-[#b38b60]"
          >
            Preview in AR <ArrowRight size={13} />
          </Link>
          <Link
            to="/compare"
            onClick={() => addCompare(m.name)}
            className="text-[#858179] no-underline hover:text-[#292a27]"
          >
            Compare
          </Link>
        </div>

        <Link
          to="/quote"
          onClick={() => addToQuote(m.name)}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white text-xs font-semibold text-[#292a27] no-underline hover:bg-[#f5f0e8]"
        >
          <FileText size={14} />
          Request a quote
        </Link>
      </div>
    </article>
  )
}