"""
template.py  (BACKEND)
----------------------
Scaffolds the AR Stone Vision backend (FastAPI + SQLAlchemy + PostgreSQL).

Usage (from the backend root folder):
    python template.py

Safe to re-run: existing files are never overwritten.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Folders that must be Python packages (get an __init__.py automatically)
PACKAGE_ROOTS = ["app", "tests", "scripts"]

# Empty folders: a .gitkeep is added so git tracks them
EMPTY_DIRS = [
    "alembic/versions",
    "storage/uploads/rooms",      # customer room photos
    "storage/uploads/renders",    # saved visualisation results
    "storage/textures",           # stone texture images served to the frontend
    "logs",
]

FILES = [
    # ---------- app entry ----------
    "app/main.py",

    # ---------- api ----------
    "app/api/deps.py",                      # get_db, get_current_user, etc.
    "app/api/v1/router.py",                 # collects all endpoint routers
    "app/api/v1/endpoints/health.py",
    "app/api/v1/endpoints/auth.py",
    "app/api/v1/endpoints/users.py",
    "app/api/v1/endpoints/workspaces.py",
    "app/api/v1/endpoints/stones.py",       # catalogue: list, filter, detail
    "app/api/v1/endpoints/favourites.py",
    "app/api/v1/endpoints/projects.py",
    "app/api/v1/endpoints/scans.py",        # AR scans / saved visualisations
    "app/api/v1/endpoints/uploads.py",      # room photo upload
    "app/api/v1/endpoints/cart.py",
    "app/api/v1/endpoints/orders.py",       # checkout + order history
    "app/api/v1/endpoints/payments.py",

    # ---------- core ----------
    "app/core/config.py",                   # settings from .env
    "app/core/security.py",                 # password hashing, JWT
    "app/core/logging.py",
    "app/core/exceptions.py",
    "app/core/middleware.py",               # CORS, request logging

    # ---------- database ----------
    "app/db/base.py",                       # imports all models for Alembic
    "app/db/base_class.py",
    "app/db/session.py",                    # engine + SessionLocal
    "app/db/init_db.py",

    # ---------- models (SQLAlchemy) ----------
    "app/models/user.py",
    "app/models/workspace.py",
    "app/models/stone.py",
    "app/models/favourite.py",
    "app/models/project.py",
    "app/models/scan.py",
    "app/models/cart.py",
    "app/models/order.py",
    "app/models/order_item.py",

    # ---------- schemas (Pydantic) ----------
    "app/schemas/user.py",
    "app/schemas/token.py",
    "app/schemas/workspace.py",
    "app/schemas/stone.py",
    "app/schemas/favourite.py",
    "app/schemas/project.py",
    "app/schemas/scan.py",
    "app/schemas/cart.py",
    "app/schemas/order.py",
    "app/schemas/common.py",                # pagination, message responses

    # ---------- crud (DB access) ----------
    "app/crud/base.py",
    "app/crud/user.py",
    "app/crud/workspace.py",
    "app/crud/stone.py",
    "app/crud/favourite.py",
    "app/crud/project.py",
    "app/crud/scan.py",
    "app/crud/cart.py",
    "app/crud/order.py",

    # ---------- services (business logic) ----------
    "app/services/auth_service.py",
    "app/services/stone_service.py",
    "app/services/project_service.py",
    "app/services/scan_service.py",
    "app/services/cart_service.py",
    "app/services/order_service.py",
    "app/services/payment_service.py",
    "app/services/storage_service.py",      # save / serve uploaded images
    "app/services/area_calculator.py",      # sq ft + wastage for wall / floor
    "app/services/ar/surface_detection.py", # optional server-side wall/floor segmentation
    "app/services/ar/texture_renderer.py",  # optional server-side compositing

    # ---------- utils ----------
    "app/utils/pagination.py",
    "app/utils/file_utils.py",
    "app/utils/image_utils.py",

    # ---------- migrations ----------
    "alembic/env.py",
    "alembic/script.py.mako",
    "alembic.ini",

    # ---------- scripts ----------
    "scripts/seed_stones.py",               # load sample marble / granite / tiles
    "scripts/create_admin.py",

    # ---------- tests ----------
    "tests/conftest.py",
    "tests/test_auth.py",
    "tests/test_stones.py",
    "tests/test_favourites.py",
    "tests/test_projects.py",
    "tests/test_scans.py",
    "tests/test_cart.py",
    "tests/test_orders.py",

    # ---------- root files ----------
    ".env",
    ".env.example",
    ".gitignore",
    "requirements.txt",
    "Dockerfile",
    "docker-compose.yml",
    "README.md",
]

# Starter content for a few files (everything else is created empty)
CONTENT = {
    "requirements.txt": """fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
pydantic
pydantic-settings
email-validator
python-jose[cryptography]
passlib[bcrypt]
python-multipart
pillow
httpx
pytest
""",
    ".env.example": """APP_NAME=AR Stone Vision
DEBUG=true

DATABASE_URL=postgresql://postgres:password@localhost:5432/ar_stone_vision

SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=60

CORS_ORIGINS=http://localhost:5173

UPLOAD_DIR=storage/uploads
""",
    ".gitignore": """__pycache__/
*.pyc
.venv/
venv/
.env
logs/
storage/uploads/*
!storage/uploads/**/.gitkeep
.pytest_cache/
.idea/
.vscode/
""",
    "README.md": """# AR Stone Vision - Backend

Run the API:

    uvicorn app.main:app --reload

Docs: http://localhost:8000/docs
""",
}


def ensure_init_files() -> int:
    """Add __init__.py to every folder under the package roots."""
    created = 0
    folders = set()
    for f in FILES:
        parts = Path(f).parts
        if parts[0] in PACKAGE_ROOTS:
            for i in range(1, len(parts)):          # every parent folder
                folders.add(Path(*parts[:i]))
    for folder in sorted(folders):
        init = ROOT / folder / "__init__.py"
        init.parent.mkdir(parents=True, exist_ok=True)
        if not init.exists():
            init.touch()
            created += 1
    return created


def create_empty_dirs() -> int:
    created = 0
    for d in EMPTY_DIRS:
        folder = ROOT / d
        folder.mkdir(parents=True, exist_ok=True)
        keep = folder / ".gitkeep"
        if not keep.exists():
            keep.touch()
            created += 1
    return created


def create_files() -> tuple[int, int]:
    created = skipped = 0
    for f in FILES:
        path = ROOT / f
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            skipped += 1
            print(f"  skipped (exists): {f}")
        else:
            path.write_text(CONTENT.get(f, ""), encoding="utf-8")
            created += 1
            print(f"  created:          {f}")
    return created, skipped


def main() -> None:
    print(f"Scaffolding backend structure in: {ROOT}\n")

    f_created, f_skipped = create_files()
    init_created = ensure_init_files()
    dirs_created = create_empty_dirs()

    print("\n----------------------------------------")
    print(f"Files created:        {f_created}")
    print(f"Files skipped:        {f_skipped} (already existed, left untouched)")
    print(f"__init__.py added:    {init_created}")
    print(f"Empty folders set up: {dirs_created}")
    print("Done.")


if __name__ == "__main__":
    main()