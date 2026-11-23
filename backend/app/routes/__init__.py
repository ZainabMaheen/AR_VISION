from flask import Flask

from . import auth, enquiries, health, materials, projects, scans, shop, uploads


def register_blueprints(app: Flask) -> None:
    """Every route lives under /api."""
    for module in (health, auth, materials, scans, projects, enquiries, shop, uploads):
        app.register_blueprint(module.bp, url_prefix="/api")
