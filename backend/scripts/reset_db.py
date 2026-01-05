"""Reset database and create fresh tables with numeric IDs."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import engine, Base
from sqlalchemy import text
from shared.models import *

print("Resetting migration history...")
with engine.begin() as conn:
    try:
        conn.execute(text('DROP TABLE IF EXISTS alembic_version'))
        print("=> Migration history reset!")
    except Exception as e:
        print(f"Note: {e}")

print("\nCreating all tables with numeric IDs...")
Base.metadata.create_all(bind=engine)
print("=> All tables created successfully!")

print("\n=> Database is ready! All new IDs will be 12-digit numbers.")

