import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # the backend folder

# Read backend/.env (real environment variables still win)
load_dotenv(BASE_DIR / ".env")


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    return default if value is None or value == "" else value.strip().lower() in {"1", "true", "yes", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name) or default)
    except ValueError:
        return default


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") or "dev-only-change-me"

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or f"sqlite:///{(BASE_DIR / 'instance' / 'ar_vision.db').as_posix()}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CORS_ORIGINS = [
        o.strip()
        for o in (os.getenv("CORS_ORIGINS") or "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if o.strip()
    ]

    UPLOAD_FOLDER = str((BASE_DIR / (os.getenv("UPLOAD_FOLDER") or "uploads")).resolve())
    MAX_IMAGE_MB = _int("MAX_IMAGE_MB", 10)
    MAX_IMAGE_SIDE = _int("MAX_IMAGE_SIDE", 1600)
    THUMBNAIL_SIDE = 600
    # Whole request limit: room photo + thumbnail + form fields
    MAX_CONTENT_LENGTH = (MAX_IMAGE_MB * 2 + 1) * 1024 * 1024

    # Login (JWT). Must be set in production; a dev-only fallback is used when FLASK_DEBUG=1.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or None
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=_int("JWT_EXPIRES_HOURS", 12))
    JWT_TOKEN_LOCATION = ["headers"]
    # Failed sign-ins: max attempts per IP + email within the window, and a small delay after each failure
    LOGIN_MAX_FAILURES = _int("LOGIN_MAX_FAILURES", 5)
    LOGIN_WINDOW_SECONDS = _int("LOGIN_WINDOW_SECONDS", 15 * 60)
    LOGIN_FAIL_DELAY = 0.5

    # Create tables and seed sample data when the app starts
    AUTO_SETUP_DB = _bool("AUTO_SETUP_DB", True)

    TESTING = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    AUTO_SETUP_DB = False
    MAX_IMAGE_MB = 1
    MAX_CONTENT_LENGTH = 3 * 1024 * 1024
    JWT_SECRET_KEY = "test-only-secret-key-that-is-long-enough-for-hs256"
    LOGIN_FAIL_DELAY = 0
