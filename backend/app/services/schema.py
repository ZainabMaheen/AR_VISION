"""Tiny forward-only upgrade for databases created before Phase 6B.

`db.create_all()` creates missing tables but never adds columns to existing ones,
so the owner columns are added here with SQLite's ALTER TABLE ... ADD COLUMN.
(For bigger schema changes later, switch to Flask-Migrate: see README.)"""
from sqlalchemy import inspect, text

from ..extensions import db

NEW_COLUMNS = {
    "scans": [("user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL")],
    "projects": [("user_id", "INTEGER REFERENCES users(id) ON DELETE CASCADE")],
    "enquiries": [("user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL")],
}


def upgrade_schema() -> list[str]:
    """Add any missing owner columns. Returns what was added (empty when up to date)."""
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())
    added: list[str] = []
    with db.engine.begin() as conn:
        for table, columns in NEW_COLUMNS.items():
            if table not in tables:
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
                    conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_{name} ON {table} ({name})"))
                    added.append(f"{table}.{name}")
    return added
