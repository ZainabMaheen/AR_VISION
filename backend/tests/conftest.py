import io

import pytest
from PIL import Image

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import User
from app.services.seed import seed_database

PASSWORD = "correct-horse-1"


@pytest.fixture()
def app(tmp_path):
    """Fresh app per test: in-memory SQLite, temporary uploads folder, sample data."""
    app = create_app(TestConfig, overrides={"UPLOAD_FOLDER": str(tmp_path / "uploads")})
    with app.app_context():
        seed_database()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def make_user(email: str, role: str = "customer", name: str = "Test User") -> User:
    user = User(name=name, email=email, role=role)
    user.set_password(PASSWORD)
    db.session.add(user)
    db.session.commit()
    return user


def login(client, email: str, password: str = PASSWORD) -> dict:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.get_json()
    return {"Authorization": f"Bearer {res.get_json()['data']['token']}"}


@pytest.fixture()
def business(app, client) -> dict:
    """Authorization header for a business (staff) account."""
    make_user("staff@shop.test", role="business", name="Shop Staff")
    return login(client, "staff@shop.test")


@pytest.fixture()
def customer(app, client) -> dict:
    """Authorization header for a customer account."""
    make_user("sam@example.com", name="Sam Taylor")
    return login(client, "sam@example.com")


@pytest.fixture()
def other_customer(app, client) -> dict:
    make_user("alex@example.com", name="Alex Doe")
    return login(client, "alex@example.com")


def make_image(fmt: str = "JPEG", size=(2400, 1200), color=(180, 150, 120)) -> io.BytesIO:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, fmt)
    buf.seek(0)
    return buf
