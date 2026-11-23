from ..extensions import db
from .base import TimestampMixin, iso

CATEGORIES = ("marble", "granite", "tiles")
AVAILABILITY = ("in_stock", "made_to_order", "out_of_stock")


class Material(TimestampMixin, db.Model):
    __tablename__ = "materials"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    category = db.Column(db.String(20), nullable=False)
    price_per_sqft = db.Column(db.Float, nullable=True)
    availability = db.Column(db.String(20), nullable=False, default="in_stock")
    finish = db.Column(db.String(40), nullable=False, default="")
    tone = db.Column(db.String(40), nullable=False, default="")
    description = db.Column(db.Text, nullable=False, default="")
    image_url = db.Column(db.String(500), nullable=False, default="")
    visible = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self, *, show_price: bool = True) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "pricePerSqFt": self.price_per_sqft if show_price else None,
            "availability": self.availability,
            "finish": self.finish,
            "tone": self.tone,
            "description": self.description,
            "imageUrl": self.image_url,
            "visible": self.visible,
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
        }
