"""Sample data, matching the frontend's lib/constants.ts (names, categories, tones,
finishes, image URLs) and features/business/sampleStock.ts (descriptions, sample
prices, availability). Prices are SAMPLE figures: replace them with real ones."""
from ..extensions import db
from ..models import Material, Shop
from .schema import upgrade_schema


def _unsplash(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=700&q=80"


SAMPLE_MATERIALS = [
    {
        "name": "Carrara Vein", "category": "marble", "tone": "Ivory tone", "finish": "Honed",
        "image_url": _unsplash("1600210492486-724fe5c67fb0"), "price_per_sqft": 9.5, "availability": "in_stock",
        "description": "Classic Italian white marble with soft grey veining.",
    },
    {
        "name": "Nero Marquina", "category": "marble", "tone": "Charcoal tone", "finish": "Polished",
        "image_url": _unsplash("1618221195710-dd6b41faaea6"), "price_per_sqft": 12.0, "availability": "made_to_order",
        "description": "Deep black marble with crisp white veins.",
    },
    {
        "name": "Alpine Mist", "category": "granite", "tone": "Grey tone", "finish": "Leathered",
        "image_url": _unsplash("1600607687920-4e2a09cf159d"), "price_per_sqft": 7.25, "availability": "in_stock",
        "description": "Hard-wearing grey granite with a leathered texture.",
    },
    {
        "name": "Sandstone Beige", "category": "tiles", "tone": "Sand tone", "finish": "Matte",
        "image_url": _unsplash("1600607687939-ce8a6c25118c"), "price_per_sqft": 4.5, "availability": "in_stock",
        "description": "Warm, matte tile with a sandstone look.",
    },
    {
        "name": "Warm Travertine", "category": "tiles", "tone": "Warm beige", "finish": "Natural",
        "image_url": _unsplash("1600566753086-00f18fb6b3ea"), "price_per_sqft": 6.8, "availability": "made_to_order",
        "description": "Natural travertine-look tile with soft banding.",
    },
    {
        "name": "Silver Cloud", "category": "granite", "tone": "Silver grey", "finish": "Polished",
        "image_url": _unsplash("1600607687920-4e2a09cf159d"), "price_per_sqft": 8.4, "availability": "out_of_stock",
        "description": "Polished silver-grey granite with fine speckles.",
    },
]


def seed_database() -> dict:
    """Create missing tables, add any missing sample materials and the shop row.
    Safe to run more than once: existing rows are never changed."""
    db.create_all()
    upgrade_schema()
    existing = {name for (name,) in db.session.query(Material.name).all()}
    added = 0
    for row in SAMPLE_MATERIALS:
        if row["name"] not in existing:
            db.session.add(Material(visible=True, **row))
            added += 1
    db.session.commit()
    Shop.get()  # creates the default shop row if missing
    return {"materials_added": added, "materials_total": Material.query.count()}


def seed_if_empty() -> None:
    """Used at start-up: seed only when the materials table is empty."""
    db.create_all()
    upgrade_schema()
    if Material.query.count() == 0:
        seed_database()
    else:
        Shop.get()
