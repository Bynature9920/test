"""
Create initial database migration.
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


def create_migration(message: str = "Initial migration"):
    """Create a new migration."""
    alembic_cfg = Config(str(backend_path / "database" / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    
    # Set script location
    script_location = str(backend_path / "database" / "migrations")
    alembic_cfg.set_main_option("script_location", script_location)
    
    print(f"Creating migration: {message}")
    command.revision(alembic_cfg, autogenerate=True, message=message)
    print("Migration created successfully!")


if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else "Initial migration"
    create_migration(message)

