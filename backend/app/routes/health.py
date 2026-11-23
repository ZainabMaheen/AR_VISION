from flask import Blueprint
from sqlalchemy import text

from ..extensions import db
from ..utils.responses import error, ok

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - report, never crash
        return error("Database is not reachable.", 503)
    return ok({"status": "ok", "database": "ok"})
