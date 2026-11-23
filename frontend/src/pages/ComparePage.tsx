import { Heart, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/ui/EmptyState'
import { MAX_COMPARE, useCompareStore } from '../features/compare/store'
import { useFavouritesStore } from '../features/favourites/store'
import { capitalise, findMaterial } from '../lib/materials'
import { desc, h2, kicker, pageWrap, textLink } from '../lib/styles'
import type { Material } from '../types/stone'

export default function ComparePage() {
  const names = useCompareStore((s) => s.names)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const favourites = useFavouritesStore((s) => s.names)
  const toggleFav = useFavouritesStore((s) => s.toggle)

  const items = names.map(findMaterial).filter((m): m is Material => !!m)

  return (
    <div className={pageWrap}>
      <section className="mb-6 flex items-end justify-between gap-5">
        <div>
          <p className={kicker}>SIDE BY SIDE</p>
          <h2 className={h2}>Compare materials.</h2>
          <p className={desc}>
            Shortlist up to {MAX_COMPARE} finishes and see how they differ.
            {items.length > 0 && ` ${items.length} of ${MAX_COMPARE} selected.`}
          </p>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={clear} className={textLink}>
            Clear all
          </button>
        )}
      </section>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing to compare yet"
          description="Add materials from the catalogue to see them side by side."
          to="/catalogue"
          cta="Browse materials"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((m) => {
            const isFav = favourites.includes(m.name)
            return (
              <article key={m.name} className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white">
                <div className="relative h-[200px] overflow-hidden bg-[#e5ddd1]">
                  <img src={m.image} alt={m.name} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${m.name} from comparison`}
                    onClick={() => remove(m.name)}
                    className="absolute right-3 top-3 grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 text-[#292a27] backdrop-blur hover:text-[#b38b60]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4">
                  <p className="m-0 text-[10px] font-semibold tracking-[1.1px] text-[#a67e50]">
                    {m.category.toUpperCase()} · {m.finish.toUpperCase()}
                  </p>
                  <h3 className="m-0 mt-1.5 text-[17px] font-medium tracking-[-0.4px]">{m.name}</h3>
                  <p className="mb-0 mt-1.5 text-[11px] text-[#858179]">{m.tone}</p>

                  <hr className="my-[15px] border-0 border-t border-[#eeeae3]" />

                  {[
                    ['Material', capitalise(m.category)],
                    ['Finish', m.finish],
                    ['Tone', m.tone],
                    ['Availability', 'Catalogue sample'],
                  ].map(([label, value]) => (
                    <div key={label} className="my-[13px] flex items-center justify-between gap-2.5">
                      <span className="text-[11px] text-[#858179]">{label}</span>
                      <strong className="text-right text-[11px] font-semibold">{value}</strong>
                    </div>
                  ))}

                  <div className="mt-[18px] flex flex-col gap-2">
                    <Link
                      to={`/arpreview?material=${encodeURIComponent(m.name)}`}
                      className="inline-flex min-h-[42px] w-full items-center justify-center rounded-[10px] border border-[#292a27] bg-[#292a27] px-3 text-[11px] font-semibold text-white no-underline hover:bg-black"
                    >
                      Preview in AR
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFav(m.name)}
                      className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white px-3 text-[11px] font-semibold text-[#292a27] hover:bg-[#f5f0e8]"
                    >
                      <Heart size={15} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'text-[#b38b60]' : ''} />
                      {isFav ? 'Saved' : 'Save material'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}