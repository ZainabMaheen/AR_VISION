from flask import Blueprint, request
from sqlalchemy import func, or_

from ..extensions import db
from ..models import Material, Shop
from ..models.material import AVAILABILITY, CATEGORIES
from ..services.seed import seed_database
from ..utils import validators as v
from ..utils.auth import business_required, require_business
from ..utils.responses import error, ok

bp = Blueprint("materials", __name__)


def _get_or_404(material_id: int) -> Material:
    material = db.session.get(Material, material_id)
    if material is None:
        raise v.ValidationError("Material not found.", 404)
    return material


def _name_taken(name: str, exclude_id: int | None = None) -> bool:
    # no_autoflush: the edited (unsaved) material must not hit the UNIQUE constraint first
    with db.session.no_autoflush:
        q = Material.query.filter(func.lower(Material.name) == name.lower())
        if exclude_id is not None:
            q = q.filter(Material.id != exclude_id)
        return bool(db.session.query(q.exists()).scalar())


def _apply(material: Material, data: dict, *, partial: bool) -> None:
    """Validate the body and copy it onto the material. partial=False means PUT/POST."""
    required = not partial
    if not partial or "name" in data:
        material.name = v.text(data, "name", required=True, max_len=80)
    if not partial or "category" in data:
        material.category = v.choice(data, "category", CATEGORIES, required=required, default=material.category or "marble")
    if not partial or "pricePerSqFt" in data:
        material.price_per_sqft = v.number(data, "pricePerSqFt", allow_null=True, min_value=0, max_value=100000)
    if not partial or "availability" in data:
        material.availability = v.choice(data, "availability", AVAILABILITY, default="in_stock")
    for key, attr, max_len in (("finish", "finish", 40), ("tone", "tone", 40), ("description", "description", 2000)):
        if not partial or key in data:
            setattr(material, attr, v.text(data, key, max_len=max_len))
    if not partial or "imageUrl" in data:
        material.image_url = v.url(data, "imageUrl")
    if not partial or "visible" in data:
        material.visible = v.boolean(data, "visible", default=True)


@bp.get("/materials")
def list_materials():
    include_hidden = v.query_bool("include_hidden")
    if include_hidden:
        require_business()  # hidden materials and staff prices are for business accounts
    q = Material.query
    if not include_hidden:
        q = q.filter(Material.visible.is_(True))
    category = request.args.get("category")
    if category:
        if category not in CATEGORIES:
            return error(f"'category' must be one of: {', '.join(CATEGORIES)}.", 400)
        q = q.filter(Material.category == category)
    term = (request.args.get("q") or "").strip()
    if term:
        like = f"%{term}%"
        q = q.filter(or_(Material.name.ilike(like), Material.finish.ilike(like), Material.tone.ilike(like)))

    # Customers only see prices when the shop allows it; staff always do
    show_price = include_hidden or Shop.get().show_prices
    return ok([m.to_dict(show_price=show_price) for m in q.order_by(Material.id).all()])


@bp.get("/materials/<int:material_id>")
def get_material(material_id: int):
    material = _get_or_404(material_id)
    include_hidden = v.query_bool("include_hidden")
    if include_hidden:
        require_business()
    if not material.visible and not include_hidden:
        return error("Material not found.", 404)
    return ok(material.to_dict(show_price=include_hidden or Shop.get().show_prices))


@bp.post("/materials")
@business_required
def create_material():
    data = v.json_body()
    material = Material()
    _apply(material, data, partial=False)
    if _name_taken(material.name):
        return error(f"A material called '{material.name}' already exists.", 409)
    db.session.add(material)
    db.session.commit()
    return ok(material.to_dict(), 201)


@bp.route("/materials/<int:material_id>", methods=["PUT", "PATCH"])
@business_required
def update_material(material_id: int):
    material = _get_or_404(material_id)
    data = v.json_body()
    _apply(material, data, partial=request.method == "PATCH")
    if _name_taken(material.name, exclude_id=material.id):
        db.session.rollback()
        return error(f"A material called '{material.name}' already exists.", 409)
    db.session.commit()
    return ok(material.to_dict())


@bp.post("/materials/restore-samples")
@business_required
def restore_samples():
    """Add back any of the 6 sample materials that were deleted. Existing rows are never changed."""
    result = seed_database()
    return ok({"added": result["materials_added"], "total": result["materials_total"]})


@bp.delete("/materials/<int:material_id>")
@business_required
def delete_material(material_id: int):
    material = _get_or_404(material_id)
    db.session.delete(material)
    db.session.commit()
    return ok({"id": material_id, "deleted": True})
