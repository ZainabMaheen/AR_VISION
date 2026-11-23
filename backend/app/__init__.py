"""AR Vision API (Flask + SQLite). Create the app with create_app()."""
import logging
from pathlib import Path

import click
from flask import Flask
from sqlalchemy import event
from sqlalchemy.engine import Engine
from werkzeug.exceptions import HTTPException

from .config import Config
from .extensions import cors, db, jwt, migrate
from .services.images import KINDS
from .utils.auth import LoginLimiter
from .utils.responses import error
from .utils.validators import ValidationError

log = logging.getLogger(__name__)


@event.listens_for(Engine, "connect")
def _sqlite_foreign_keys(dbapi_connection, _record):
    """SQLite ignores ON DELETE rules unless foreign keys are switched on."""
    if dbapi_connection.__class__.__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_app(config_class: type[Config] = Config, overrides: dict | None = None) -> Flask:
    app = Flask(__name__, instance_path=str(Path(__file__).resolve().parent.parent / "instance"))
    app.config.from_object(config_class)
    if overrides:
        app.config.update(overrides)
    app.json.sort_keys = False

    if not app.config.get("JWT_SECRET_KEY"):
        if app.debug or app.testing:
            app.config["JWT_SECRET_KEY"] = "dev-only-jwt-secret-do-not-use-in-production-0000"
            log.warning("JWT_SECRET_KEY is not set: using a development-only key.")
        else:
            raise RuntimeError(
                "JWT_SECRET_KEY is not set. Add a long random value to backend/.env "
                "(for example: python -c \"import secrets; print(secrets.token_urlsafe(48))\")."
            )

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    for kind in KINDS:
        (Path(app.config["UPLOAD_FOLDER"]) / kind).mkdir(parents=True, exist_ok=True)

    from . import models  # noqa: F401  (register tables)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        allow_headers=["Content-Type", "Authorization"],
    )
    app.extensions["login_limiter"] = LoginLimiter(app.config["LOGIN_MAX_FAILURES"], app.config["LOGIN_WINDOW_SECONDS"])

    from .routes import register_blueprints

    register_blueprints(app)
    _register_error_handlers(app)
    _register_jwt_handlers()
    _register_commands(app)

    if app.config.get("AUTO_SETUP_DB") and not app.config.get("TESTING"):
        from .services.seed import seed_if_empty

        with app.app_context():
            seed_if_empty()

    return app


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ValidationError)
    def _validation(e: ValidationError):
        db.session.rollback()
        return error(e.message, e.status)

    @app.errorhandler(HTTPException)
    def _http(e: HTTPException):
        messages = {
            404: "Not found.",
            405: "This method is not allowed here.",
            413: f"The upload is too large. Images can be up to {app.config['MAX_IMAGE_MB']} MB each.",
        }
        return error(messages.get(e.code or 500, e.description or "Request failed."), e.code or 500)

    @app.errorhandler(Exception)
    def _unexpected(e: Exception):
        # Log the details, never send a stack trace to the client
        db.session.rollback()
        log.exception("Unhandled error: %s", e)
        return error("Something went wrong on the server.", 500)


def _register_jwt_handlers() -> None:
    """JSON errors for missing, invalid or expired tokens."""

    @jwt.unauthorized_loader
    def _missing(_reason: str):
        return error("Please sign in to continue.", 401)

    @jwt.invalid_token_loader
    def _invalid(_reason: str):
        return error("Your session is not valid. Please sign in again.", 401)

    @jwt.expired_token_loader
    def _expired(_header: dict, _payload: dict):
        return error("Your session has expired. Please sign in again.", 401)


def _register_commands(app: Flask) -> None:
    @app.cli.command("seed")
    def seed_command():
        """Create tables, then add the sample materials and the shop row (safe to repeat)."""
        from .services.seed import seed_database

        result = seed_database()
        click.echo(f"Seeded: {result['materials_added']} material(s) added, {result['materials_total']} in total.")

    @app.cli.command("create-business-user")
    @click.option("--name", prompt="Name", help="Staff member's name")
    @click.option("--email", prompt="Email", help="Sign-in email")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True, help="Leave out to be asked (safer)")
    @click.option("--reset", is_flag=True, help="If the email exists, make it a business account with this password")
    def create_business_user(name: str, email: str, password: str, reset: bool):
        """Create a business (staff) account. Customers register in the app instead."""
        from sqlalchemy import func

        from .models import User
        from .services.schema import upgrade_schema
        from .utils.validators import EMAIL_RE

        db.create_all()
        upgrade_schema()
        name, email = name.strip(), email.strip().lower()
        if not name or len(name) > 60:
            raise click.ClickException("Name must be 1 to 60 characters.")
        if not EMAIL_RE.match(email):
            raise click.ClickException("That is not a valid email address.")
        if not 8 <= len(password) <= 128:
            raise click.ClickException("Password must be 8 to 128 characters.")
        user = User.query.filter(func.lower(User.email) == email).first()
        if user and not reset:
            raise click.ClickException("A user with this email already exists. Add --reset to make it a business account with this password.")
        if user is None:
            user = User(email=email)
            db.session.add(user)
        user.name = name
        user.role = "business"
        user.set_password(password)
        db.session.commit()
        click.echo(f"Business account ready: {email}")
