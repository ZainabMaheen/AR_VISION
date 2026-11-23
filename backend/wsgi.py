"""Production entry point for a WSGI server, e.g. `waitress-serve wsgi:app` or `gunicorn wsgi:app`."""
from app import create_app

app = create_app()
