from ..extensions import db
from .base import TimestampMixin, iso


class Shop(TimestampMixin, db.Model):
    """Single row (id = 1) with the shop's details and settings."""

    __tablename__ = "shop"

    id = db.Column(db.Integer, primary_key=True)
    shop_name = db.Column(db.String(60), nullable=False, default="Atelier Stone Co.")
    logo_url = db.Column(db.String(500), nullable=False, default="")
    email = db.Column(db.String(120), nullable=False, default="")
    phone = db.Column(db.String(30), nullable=False, default="")
    address = db.Column(db.Text, nullable=False, default="")
    show_prices = db.Column(db.Boolean, nullable=False, default=False)

    @classmethod
    def get(cls) -> "Shop":
        """The shop row, created with defaults if it does not exist yet."""
        shop = db.session.get(cls, 1)
        if shop is None:
            shop = cls(id=1)
            db.session.add(shop)
            db.session.commit()
        return shop

    def to_dict(self) -> dict:
        return {
            "shopName": self.shop_name,
            "logoUrl": self.logo_url,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "showPrices": self.show_prices,
            "updatedAt": iso(self.updated_at),
        }
