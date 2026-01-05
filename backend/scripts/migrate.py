"""
Database migration script.
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from alembic.config import Config
from alembic import command
from shared.config import get_settings

settings = get_settings()


def run_migrations():
    """Run database migrations."""
    alembic_cfg = Config(str(backend_path / "database" / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    
    # Set script location
    script_location = str(backend_path / "database" / "migrations")
    alembic_cfg.set_main_option("script_location", script_location)
    
    print("Running database migrations...")
    command.upgrade(alembic_cfg, "head")
    print("Migrations completed successfully!")


if __name__ == "__main__":
    run_migrations()

