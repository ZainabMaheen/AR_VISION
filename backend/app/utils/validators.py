"""Small input helpers. Each raises ValidationError (-> 400 with a clear message)."""
import math
import re

from flask import request

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
URL_RE = re.compile(r"^(https?://\S+|/api/uploads/\S+)$", re.IGNORECASE)

_MISSING = object()


class ValidationError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def json_body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationError("Send a JSON object in the request body.")
    return data


def text(data: dict, key: str, *, required: bool = False, max_len: int = 200, default: str = "") -> str:
    value = data.get(key, _MISSING)
    if value is _MISSING or value is None:
        if required:
            raise ValidationError(f"'{key}' is required.")
        return default
    if not isinstance(value, str):
        raise ValidationError(f"'{key}' must be text.")
    value = value.strip()
    if required and not value:
        raise ValidationError(f"'{key}' cannot be empty.")
    if len(value) > max_len:
        raise ValidationError(f"'{key}' must be at most {max_len} characters.")
    return value


def choice(data: dict, key: str, options, *, required: bool = False, default=None):
    value = data.get(key, _MISSING)
    if value is _MISSING or value is None:
        if required:
            raise ValidationError(f"'{key}' is required.")
        return default
    if value not in options:
        raise ValidationError(f"'{key}' must be one of: {', '.join(options)}.")
    return value


def number(
    data: dict,
    key: str,
    *,
    required: bool = False,
    allow_null: bool = False,
    min_value: float | None = None,
    max_value: float | None = None,
    integer: bool = False,
    default=None,
):
    value = data.get(key, _MISSING)
    if value is _MISSING or value is None:
        if value is None and allow_null:
            return None
        if required:
            raise ValidationError(f"'{key}' is required.")
        return default
    # bool is a subclass of int in Python: reject it explicitly
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValidationError(f"'{key}' must be a number.")
    if integer and int(value) != value:
        raise ValidationError(f"'{key}' must be a whole number.")
    if min_value is not None and value < min_value:
        raise ValidationError(f"'{key}' must be at least {min_value:g}.")
    if max_value is not None and value > max_value:
        raise ValidationError(f"'{key}' must be at most {max_value:g}.")
    return int(value) if integer else float(value)


def boolean(data: dict, key: str, *, default=None):
    value = data.get(key, _MISSING)
    if value is _MISSING or value is None:
        return default
    if not isinstance(value, bool):
        raise ValidationError(f"'{key}' must be true or false.")
    return value


def email(data: dict, key: str, *, required: bool = False) -> str:
    value = text(data, key, required=required, max_len=120)
    if value and not EMAIL_RE.match(value):
        raise ValidationError(f"'{key}' must be a valid email address.")
    return value


def url(data: dict, key: str, *, max_len: int = 500) -> str:
    value = text(data, key, max_len=max_len)
    if value and not URL_RE.match(value):
        raise ValidationError(f"'{key}' must be a link starting with https://")
    return value


def id_list(data: dict, key: str, *, max_items: int = 50) -> list[int]:
    value = data.get(key, [])
    if value is None:
        return []
    if not isinstance(value, list) or len(value) > max_items:
        raise ValidationError(f"'{key}' must be a list of up to {max_items} ids.")
    out: list[int] = []
    for v in value:
        if isinstance(v, bool) or not isinstance(v, int) or v < 1:
            raise ValidationError(f"'{key}' must contain whole-number ids.")
        if v not in out:
            out.append(v)
    return out


def query_bool(name: str) -> bool:
    return (request.args.get(name) or "").strip().lower() in {"1", "true", "yes"}


def form_number(name: str, *, default: float, min_value: float, max_value: float, integer: bool = False):
    """Number from a multipart form field (strings)."""
    raw = (request.form.get(name) or "").strip()
    if raw == "":
        return default
    try:
        value = float(raw)
    except ValueError:
        raise ValidationError(f"'{name}' must be a number.")
    if not math.isfinite(value) or value < min_value or value > max_value:
        raise ValidationError(f"'{name}' must be between {min_value:g} and {max_value:g}.")
    if integer:
        if int(value) != value:
            raise ValidationError(f"'{name}' must be a whole number.")
        return int(value)
    return value
