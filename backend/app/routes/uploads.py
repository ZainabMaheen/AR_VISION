from flask import Blueprint, current_app, request, send_from_directory

from ..services.images import save_image, upload_url
from ..utils.auth import business_required
from ..utils.responses import ok

bp = Blueprint("uploads", __name__)


@bp.get("/uploads/<path:filename>")
def serve_upload(filename: str):
    # send_from_directory refuses paths outside the folder (404)
    response = send_from_directory(current_app.config["UPLOAD_FOLDER"], filename, max_age=60 * 60 * 24 * 30)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@bp.post("/uploads/materials")
@business_required
def upload_material_image():
    """multipart/form-data with 'image'. Returns {"url": "/api/uploads/materials/..."}
    to use as a material's imageUrl."""
    path = save_image(request.files.get("image"), "materials", field="image")
    return ok({"url": upload_url(path), "path": path}, 201)
