import secrets

from flask import Blueprint, request
from sqlalchemy import or_

from ..extensions import db
from ..models import Enquiry, EnquiryItem, Material, Scan
from ..models.enquiry import STATUSES
from ..utils import validators as v
from ..utils.auth import business_required, current_user
from ..utils.responses import error, ok

bp = Blueprint("enquiries", __name__)

# No 0/O or 1/I, so references are easy to read out on the phone
REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _new_reference() -> str:
    for _ in range(20):
        ref = "AV-" + "".join(secrets.choice(REF_CHARS) for _ in range(5))
        if not Enquiry.query.filter_by(reference=ref).first():
            return ref
    raise RuntimeError("Could not create a unique reference")


def _get_or_404(enquiry_id: int) -> Enquiry:
    enquiry = db.session.get(Enquiry, enquiry_id)
    if enquiry is None:
        raise v.ValidationError("Enquiry not found.", 404)
    return enquiry


@bp.post("/enquiries")
def create_enquiry():
    """Public quote request. Body:
    {"customer": {"name", "email", "phone"?, "address"?, "postcode"?}, "notes"?,
     "items": [{"materialName", "areaSqFt"?, "wastagePct"?}], "scanIds"?: [..]}"""
    data = v.json_body()
    customer = data.get("customer")
    if not isinstance(customer, dict):
        raise v.ValidationError("'customer' must be an object with at least 'name' and 'email'.")

    items_in = data.get("items")
    if not isinstance(items_in, list) or not items_in:
        raise v.ValidationError("'items' must list at least one material.")
    if len(items_in) > 50:
        raise v.ValidationError("'items' can contain at most 50 materials.")

    enquiry = Enquiry(
        reference=_new_reference(),
        customer_name=v.text(customer, "name", required=True, max_len=60),
        email=v.email(customer, "email", required=True),
        phone=v.text(customer, "phone", max_len=30),
        address=v.text(customer, "address", max_len=300),
        postcode=v.text(customer, "postcode", max_len=12),
        notes=v.text(data, "notes", max_len=1000),
        status="new",
    )
    # Guests may request a quote; a signed-in customer's request is linked to them
    user = current_user()
    enquiry.user_id = user.id if user else None

    seen: set[str] = set()
    for raw in items_in:
        if not isinstance(raw, dict):
            raise v.ValidationError("Each item must be an object with 'materialName'.")
        name = v.text(raw, "materialName", required=True, max_len=80)
        if name in seen:
            raise v.ValidationError(f"'{name}' is listed more than once.")
        seen.add(name)
        material = Material.query.filter_by(name=name, visible=True).first()
        if material is None:
            raise v.ValidationError(f"'{name}' is not available.")
        enquiry.items.append(
            EnquiryItem(
                material_name=material.name,
                area_sqft=v.number(raw, "areaSqFt", min_value=0, max_value=1_000_000, default=0),
                wastage_pct=v.number(raw, "wastagePct", min_value=0, max_value=50, default=10),
                # Price is taken from the database, never from the request
                price_per_sqft_at_request=material.price_per_sqft,
            )
        )

    scan_ids = v.id_list(data, "scanIds")
    if scan_ids:
        if user is None:
            raise v.ValidationError("Sign in to attach saved visualisations.")
        # Only the customer's own saved visualisations can be attached
        scans = Scan.query.filter(Scan.id.in_(scan_ids), Scan.user_id == user.id).all()
        missing = sorted(set(scan_ids) - {s.id for s in scans})
        if missing:
            raise v.ValidationError(f"Saved visualisation(s) not found: {', '.join(map(str, missing))}.")
        enquiry.scans.extend(scans)

    db.session.add(enquiry)
    db.session.commit()
    # The customer gets a confirmation without staff fields
    body = enquiry.to_dict()
    body.pop("staffNote", None)
    return ok(body, 201)


@bp.get("/enquiries")
@business_required
def list_enquiries():
    q = Enquiry.query
    status = request.args.get("status")
    if status:
        if status not in STATUSES:
            return error(f"'status' must be one of: {', '.join(STATUSES)}.", 400)
        q = q.filter(Enquiry.status == status)
    term = (request.args.get("q") or "").strip()
    if term:
        like = f"%{term}%"
        q = q.filter(or_(Enquiry.reference.ilike(like), Enquiry.customer_name.ilike(like), Enquiry.email.ilike(like)))
    return ok([e.to_dict(include_scans=True) for e in q.order_by(Enquiry.created_at.desc(), Enquiry.id.desc()).all()])


@bp.get("/enquiries/<int:enquiry_id>")
@business_required
def get_enquiry(enquiry_id: int):
    return ok(_get_or_404(enquiry_id).to_dict(include_scans=True))


@bp.patch("/enquiries/<int:enquiry_id>")
@business_required
def update_enquiry(enquiry_id: int):
    enquiry = _get_or_404(enquiry_id)
    data = v.json_body()
    if "status" not in data and "staffNote" not in data:
        raise v.ValidationError("Send 'status' and/or 'staffNote'.")
    if "status" in data:
        enquiry.status = v.choice(data, "status", STATUSES, required=True)
    if "staffNote" in data:
        enquiry.staff_note = v.text(data, "staffNote", max_len=2000)
    db.session.commit()
    return ok(enquiry.to_dict(include_scans=True))
