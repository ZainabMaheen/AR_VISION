import math
import time

from flask import Blueprint, current_app, request
from flask_jwt_extended import create_access_token
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from ..models import User
from ..utils import validators as v
from ..utils.auth import login_limiter, require_user
from ..utils.responses import error, ok

bp = Blueprint("auth", __name__)

MIN_PASSWORD = 8
MAX_PASSWORD = 128
WRONG_LOGIN = "Email or password is incorrect."

# Checked when the email does not exist, so both cases take about the same time
_DUMMY_HASH = generate_password_hash("not-a-real-password-just-for-timing")


def _password(data: dict) -> str:
    value = data.get("password")
    if not isinstance(value, str) or not value:
        raise v.ValidationError("'password' is required.")
    if len(value) < MIN_PASSWORD:
        raise v.ValidationError(f"Password must be at least {MIN_PASSWORD} characters.")
    if len(value) > MAX_PASSWORD:
        raise v.ValidationError(f"Password must be at most {MAX_PASSWORD} characters.")
    return value  # never stripped, never logged


def _session(user: User) -> dict:
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return {"token": token, "user": user.to_dict()}


def find_user_by_email(email: str) -> User | None:
    return User.query.filter(func.lower(User.email) == email.strip().lower()).first()


@bp.post("/auth/register")
def register():
    """Customer accounts only. Business accounts are made with `flask create-business-user`."""
    data = v.json_body()
    name = v.text(data, "name", required=True, max_len=60)
    email = v.email(data, "email", required=True).lower()
    password = _password(data)
    if find_user_by_email(email):
        return error("An account with this email already exists. Try signing in instead.", 409)
    user = User(name=name, email=email, role="customer")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return ok(_session(user), 201)


@bp.post("/auth/login")
def login():
    data = v.json_body()
    email = data.get("email") if isinstance(data.get("email"), str) else ""
    password = data.get("password") if isinstance(data.get("password"), str) else ""
    email = email.strip().lower()
    if not email or not password:
        return error("Enter your email and password.", 400)

    limiter = login_limiter()
    key = f"{request.remote_addr or '?'}|{email}"
    wait = limiter.seconds_blocked(key)
    if wait:
        minutes = math.ceil(wait / 60)
        return error(f"Too many failed sign-in attempts. Try again in {minutes} minute{'s' if minutes != 1 else ''}.", 429)

    user = find_user_by_email(email)
    password_ok = check_password_hash(user.password_hash if user else _DUMMY_HASH, password)
    if user is None or not password_ok:
        limiter.fail(key)
        delay = current_app.config.get("LOGIN_FAIL_DELAY", 0)
        if delay:
            time.sleep(delay)  # slows down guessing
        return error(WRONG_LOGIN, 401)

    limiter.reset(key)
    return ok(_session(user))


@bp.get("/auth/me")
def me():
    return ok(require_user().to_dict())
