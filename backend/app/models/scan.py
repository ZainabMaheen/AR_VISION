from ..extensions import db
from ..services.images import upload_url
from .base import TimestampMixin, iso


class Scan(TimestampMixin, db.Model):
    """A saved visualisation: room photo + 4 corners + material + settings."""

    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    # Owner (customer). NULL = no longer owned, kept only because it is attached to an enquiry
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    material_id = db.Column(db.Integer, db.ForeignKey("materials.id", ondelete="SET NULL"), nullable=True)
    # Kept even if the material is later deleted
    material_name = db.Column(db.String(80), nullable=False)
    # [{"x": 0..1, "y": 0..1} x 4], clockwise from top-left
    corners = db.Column(db.JSON, nullable=False)
    tiles_x = db.Column(db.Integer, nullable=False, default=4)
    tiles_y = db.Column(db.Integer, nullable=False, default=4)
    light = db.Column(db.Integer, nullable=False, default=70)  # "keep room lighting", 0..100
    # Paths relative to the uploads folder, e.g. "rooms/ab12.jpg"
    room_image_path = db.Column(db.String(255), nullable=False)
    thumbnail_path = db.Column(db.String(255), nullable=True)

    material = db.relationship("Material")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "materialId": self.material_id,
            "materialName": self.material_name,
            "corners": self.corners,
            "tilesX": self.tiles_x,
            "tilesY": self.tiles_y,
            "light": self.light,
            "roomImageUrl": upload_url(self.room_image_path),
            "thumbnailUrl": upload_url(self.thumbnail_path or self.room_image_path),
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
        }
