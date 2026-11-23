from datetime import datetime, timezone

from ..extensions import db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime | None) -> str | None:
    """ISO 8601 in UTC. SQLite returns naive datetimes, which we store as UTC."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


# Many-to-many link tables
project_scans = db.Table(
    "project_scans",
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    db.Column("scan_id", db.Integer, db.ForeignKey("scans.id", ondelete="CASCADE"), primary_key=True),
)

enquiry_scans = db.Table(
    "enquiry_scans",
    db.Column("enquiry_id", db.Integer, db.ForeignKey("enquiries.id", ondelete="CASCADE"), primary_key=True),
    db.Column("scan_id", db.Integer, db.ForeignKey("scans.id", ondelete="CASCADE"), primary_key=True),
)
