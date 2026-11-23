from ..extensions import db
from .base import TimestampMixin, enquiry_scans, iso

STATUSES = ("new", "quoted", "confirmed", "delivered")


class Enquiry(TimestampMixin, db.Model):
    """A customer's quote request."""

    __tablename__ = "enquiries"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(12), unique=True, nullable=False, index=True)  # e.g. AV-7K3P2
    # Set when a signed-in customer sent it; NULL for guests
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = db.Column(db.String(60), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False, default="")
    address = db.Column(db.Text, nullable=False, default="")
    postcode = db.Column(db.String(12), nullable=False, default="")
    notes = db.Column(db.Text, nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default="new", index=True)
    staff_note = db.Column(db.Text, nullable=False, default="")

    items = db.relationship(
        "EnquiryItem", back_populates="enquiry", cascade="all, delete-orphan", lazy="selectin", order_by="EnquiryItem.id"
    )
    scans = db.relationship("Scan", secondary=enquiry_scans, lazy="selectin", backref=db.backref("enquiries", lazy="selectin"))

    def to_dict(self, *, include_scans: bool = False) -> dict:
        data = {
            "id": self.id,
            "reference": self.reference,
            "status": self.status,
            "customer": {
                "name": self.customer_name,
                "email": self.email,
                "phone": self.phone,
                "address": self.address,
                "postcode": self.postcode,
            },
            "notes": self.notes,
            "staffNote": self.staff_note,
            "items": [i.to_dict() for i in self.items],
            "scanIds": [s.id for s in self.scans],
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
        }
        if include_scans:
            data["scans"] = [s.to_dict() for s in self.scans]
        return data


class EnquiryItem(db.Model):
    __tablename__ = "enquiry_items"

    id = db.Column(db.Integer, primary_key=True)
    enquiry_id = db.Column(db.Integer, db.ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    material_name = db.Column(db.String(80), nullable=False)
    area_sqft = db.Column(db.Float, nullable=False, default=0)  # before wastage; 0 = not given
    wastage_pct = db.Column(db.Float, nullable=False, default=10)
    # Snapshot of the shop's price when the request was sent
    price_per_sqft_at_request = db.Column(db.Float, nullable=True)

    enquiry = db.relationship("Enquiry", back_populates="items")

    def to_dict(self) -> dict:
        order = round(self.area_sqft * (1 + self.wastage_pct / 100), 2)
        return {
            "id": self.id,
            "materialName": self.material_name,
            "areaSqFt": self.area_sqft,
            "wastagePct": self.wastage_pct,
            "orderSqFt": order,
            "pricePerSqFtAtRequest": self.price_per_sqft_at_request,
        }
