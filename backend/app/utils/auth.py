"""Who is calling? JWT helpers, role checks and a simple failed-login limiter."""
import threading
import time
from functools import wraps

from flask import current_app, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from ..extensions import db
from ..models import User
from .validators import ValidationError


def _load_user(optional: bool) -> User | None:
    verify_jwt_in_request(optional=optional)  # 401 via the JWT error handlers if missing/invalid
    identity = get_jwt_identity()
    if identity is None:
        return None
    try:
        user = db.session.get(User, int(identity))
    except (TypeError, ValueError):
        user = None
    if user is None:
        raise ValidationError("Your session has expired. Please sign in again.", 401)
    return user


def current_user() -> User | None:
    """The signed-in user, or None for guests (public endpoints). Read fresh on every call."""
    return _load_user(optional=True)


def require_user() -> User:
    user = _load_user(optional=False)
    g.auth_user = user
    return user  # type: ignore[return-value]


def require_business() -> User:
    user = require_user()
    if user.role != "business":
        raise ValidationError("Business accounts only.", 403)
    return user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        require_user()
        return fn(*args, **kwargs)

    return wrapper


def business_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        require_business()
        return fn(*args, **kwargs)

    return wrapper


class LoginLimiter:
    """In-memory limit on failed sign-ins per (IP, email). Good enough for one server process;
    it resets when the server restarts."""

    def __init__(self, max_failures: int, window_seconds: int):
        self.max_failures = max_failures
        self.window = window_seconds
        self._fails: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _recent(self, key: str, now: float) -> list[float]:
        recent = [t for t in self._fails.get(key, []) if now - t < self.window]
        if recent:
            self._fails[key] = recent
        else:
            self._fails.pop(key, None)
        return recent

    def seconds_blocked(self, key: str) -> float:
        now = time.monotonic()
        with self._lock:
            recent = self._recent(key, now)
            if len(recent) >= self.max_failures:
                return max(1.0, self.window - (now - recent[0]))
            return 0.0

    def fail(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            if len(self._fails) > 10_000:  # keep memory bounded
                for k in list(self._fails):
                    self._recent(k, now)
            self._fails.setdefault(key, []).append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._fails.pop(key, None)


def login_limiter() -> LoginLimiter:
    return current_app.extensions["login_limiter"]
