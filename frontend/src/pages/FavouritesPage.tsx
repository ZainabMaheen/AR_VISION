import EmptyState from '../components/ui/EmptyState'
import StoneCard from '../features/catalogue/components/StoneCard'
import { useFavouritesStore } from '../features/favourites/store'
import { findMaterial } from '../lib/materials'
import { desc, h2, kicker, pageWrap } from '../lib/styles'
import type { Material } from '../types/stone'

export default function FavouritesPage() {
  const names = useFavouritesStore((s) => s.names)
  const items = names.map(findMaterial).filter((m): m is Material => !!m)

  return (
    <div className={pageWrap}>
      <section className="mb-6">
        <p className={kicker}>YOUR SHORTLIST</p>
        <h2 className={h2}>Favourites.</h2>
        <p className={desc}>Materials you've saved to revisit.</p>
      </section>

      {items.length === 0 ? (
        <EmptyState
          title="No favourites yet"
          description="Tap the heart on any material to save it here."
          to="/catalogue"
          cta="Browse materials"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <StoneCard key={m.name} material={m} />
          ))}
        </div>
      )}
    </div>
  )
}