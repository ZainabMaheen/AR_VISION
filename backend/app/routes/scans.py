import json

from flask import Blueprint, current_app, g, request

from ..extensions import db
from ..models import Material, Scan
from ..services.images import delete_upload, save_image
from ..utils import validators as v
from ..utils.auth import login_required
from ..utils.responses import ok

bp = Blueprint("scans", __name__)

# Every route needs a signed-in user; a saved visualisation belongs to the user who created it.


def _get_or_404(scan_id: int) -> Scan:
    """The caller's own scan. Other people's scans look like they do not exist (404)."""
    scan = db.session.get(Scan, scan_id)
    if scan is None or scan.user_id != g.auth_user.id:
        raise v.ValidationError("Saved visualisation not found.", 404)
    return scan


def _parse_corners(raw: str | None) -> list[dict]:
    """4 points {x, y} as 0..1 fractions of the photo."""
    try:
        corners = json.loads(raw or "")
    except json.JSONDecodeError:
        raise v.ValidationError("'corners' must be JSON: a list of 4 points like {\"x\": 0.1, \"y\": 0.2}.")
    if not isinstance(corners, list) or len(corners) != 4:
        raise v.ValidationError("'corners' must contain exactly 4 points.")
    out = []
    for p in corners:
        if not isinstance(p, dict):
            raise v.ValidationError("Each corner must be an object with 'x' and 'y'.")
        x = v.number(p, "x", required=True, min_value=0, max_value=1)
        y = v.number(p, "y", required=True, min_value=0, max_value=1)
        out.append({"x": round(x, 5), "y": round(y, 5)})
    return out


@bp.get("/scans")
@login_required
def list_scans():
    own = Scan.query.filter_by(user_id=g.auth_user.id)
    return ok([s.to_dict() for s in own.order_by(Scan.created_at.desc(), Scan.id.desc()).all()])


@bp.get("/scans/<int:scan_id>")
@login_required
def get_scan(scan_id: int):
    scan = db.session.get(Scan, scan_id)
    user = g.auth_user
    # Business staff may read scans that customers attached to an enquiry
    if scan is not None and user.role == "business" and scan.user_id != user.id and scan.enquiries:
        return ok(scan.to_dict())
    return ok(_get_or_404(scan_id).to_dict())


@bp.post("/scans")
@login_required
def create_scan():
    """multipart/form-data: room (image, required), thumbnail (image, optional),
    name, materialName, corners (JSON), tilesX, tilesY, light."""
    form = request.form
    name = v.text(form, "name", required=True, max_len=80)
    material_name = v.text(form, "materialName", required=True, max_len=80)
    corners = _parse_corners(form.get("corners"))
    tiles_x = v.form_number("tilesX", default=4, min_value=1, max_value=12, integer=True)
    tiles_y = v.form_number("tilesY", default=4, min_value=1, max_value=12, integer=True)
    light = v.form_number("light", default=70, min_value=0, max_value=100, integer=True)

    material = Material.query.filter_by(name=material_name).first()
    if material is None:
        raise v.ValidationError(f"Unknown material '{material_name}'.")

    room_path = save_image(request.files.get("room"), "rooms", field="room")
    thumb_path = None
    try:
        if request.files.get("thumbnail"):
            thumb_path = save_image(
                request.files["thumbnail"], "scans", max_side=current_app.config["THUMBNAIL_SIDE"], field="thumbnail"
            )
        scan = Scan(
            name=name,
            user_id=g.auth_user.id,
            material_id=material.id,
            material_name=material.name,
            corners=corners,
            tiles_x=tiles_x,
            tiles_y=tiles_y,
            light=light,
            room_image_path=room_path,
            thumbnail_path=thumb_path,
        )
        db.session.add(scan)
        db.session.commit()
    except Exception:
        # Do not leave orphan files behind
        db.session.rollback()
        delete_upload(room_path)
        delete_upload(thumb_path)
        raise
    return ok(scan.to_dict(), 201)


@bp.patch("/scans/<int:scan_id>")
@login_required
def rename_scan(scan_id: int):
    scan = _get_or_404(scan_id)
    scan.name = v.text(v.json_body(), "name", required=True, max_len=80)
    db.session.commit()
    return ok(scan.to_dict())


@bp.delete("/scans/<int:scan_id>")
@login_required
def delete_scan(scan_id: int):
    scan = _get_or_404(scan_id)
    if scan.enquiries:
        # Attached to a quote request: hide it from the customer but keep it for the shop
        scan.user_id = None
        for project in list(scan.projects):
            project.scans.remove(scan)
        db.session.commit()
        return ok({"id": scan_id, "deleted": True})
    paths = (scan.room_image_path, scan.thumbnail_path)
    db.session.delete(scan)  # also removes it from projects and enquiries
    db.session.commit()
    for p in paths:
        delete_upload(p)
    return ok({"id": scan_id, "deleted": True})
