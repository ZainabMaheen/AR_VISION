"""Development entry point.

    flask run          (uses FLASK_APP=run.py from .env)
    python run.py      (same, without the Flask CLI)
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=app.config.get("DEBUG", False))
