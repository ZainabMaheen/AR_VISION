from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from .base import TimestampMixin, iso

ROLES = ("customer", "business")


class User(TimestampMixin, db.Model):
    """Model only. Login endpoints (JWT) arrive in Phase 6."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="customer")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        # Never include password_hash
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role, "createdAt": iso(self.created_at)}
