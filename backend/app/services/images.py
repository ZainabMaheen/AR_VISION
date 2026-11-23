"""Image uploads: validate, fix rotation, resize with Pillow, save as files.
Only the relative path (e.g. "rooms/ab12.jpg") goes in the database, never the bytes."""
import uuid
from io import BytesIO
from pathlib import Path

from flask import current_app
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.datastructures import FileStorage

from ..utils.validators import ValidationError

KINDS = ("materials", "rooms", "scans")
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def upload_root() -> Path:
    return Path(current_app.config["UPLOAD_FOLDER"])


def upload_url(rel_path: str | None) -> str | None:
    """Public URL for a stored file (served by routes/uploads.py)."""
    return f"/api/uploads/{rel_path}" if rel_path else None


def save_image(file: FileStorage | None, kind: str, *, max_side: int | None = None, field: str = "image") -> str:
    """Validate and store an uploaded image. Returns its path relative to the uploads folder."""
    if kind not in KINDS:
        raise ValueError(f"Unknown upload kind: {kind}")
    if file is None or not file.filename:
        raise ValidationError(f"'{field}' image file is required.")

    limit_mb = current_app.config["MAX_IMAGE_MB"]
    data = file.read(limit_mb * 1024 * 1024 + 1)
    if len(data) > limit_mb * 1024 * 1024:
        raise ValidationError(f"'{field}' is too large. The limit is {limit_mb} MB.", 413)
    if not data:
        raise ValidationError(f"'{field}' is empty.")

    try:
        with Image.open(BytesIO(data)) as probe:
            probe.verify()  # cheap integrity check
        img = Image.open(BytesIO(data))
        fmt = img.format
        img.load()
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError):
        raise ValidationError(f"'{field}' is not a valid image.")
    if fmt not in ALLOWED_FORMATS:
        raise ValidationError(f"'{field}' must be a JPEG, PNG or WebP image.")

    img = ImageOps.exif_transpose(img)  # phone photos: apply the rotation flag, then drop EXIF
    side = max_side or current_app.config["MAX_IMAGE_SIDE"]
    img.thumbnail((side, side), Image.Resampling.LANCZOS)

    # Keep transparency for PNG material images; everything else becomes JPEG
    keep_png = kind == "materials" and fmt == "PNG" and img.mode in ("RGBA", "LA", "P")
    folder = upload_root() / kind
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{'.png' if keep_png else '.jpg'}"
    if keep_png:
        img.save(folder / name, "PNG", optimize=True)
    else:
        img.convert("RGB").save(folder / name, "JPEG", quality=85, optimize=True, progressive=True)
    return f"{kind}/{name}"


def delete_upload(rel_path: str | None) -> None:
    """Delete a stored file; ignores missing files and paths outside the uploads folder."""
    if not rel_path:
        return
    root = upload_root().resolve()
    target = (root / rel_path).resolve()
    if root in target.parents and target.is_file():
        target.unlink(missing_ok=True)
