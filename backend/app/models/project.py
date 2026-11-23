from ..extensions import db
from .base import TimestampMixin, iso, project_scans


class Project(TimestampMixin, db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    notes = db.Column(db.Text, nullable=False, default="")

    # backref lets SQLAlchemy remove the link rows when a scan is deleted
    scans = db.relationship(
        "Scan",
        secondary=project_scans,
        lazy="selectin",
        order_by="Scan.created_at.desc()",
        backref=db.backref("projects", lazy="selectin"),
    )

    def to_dict(self, *, include_scans: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "notes": self.notes,
            "scanIds": [s.id for s in self.scans],
            "scanCount": len(self.scans),
            "coverUrl": self.scans[0].to_dict()["thumbnailUrl"] if self.scans else None,
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
        }
        if include_scans:
            data["scans"] = [s.to_dict() for s in self.scans]
        return data
