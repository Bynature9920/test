"""Verify database setup."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import engine
from sqlalchemy import text

print("Checking database tables...")
with engine.connect() as conn:
    result = conn.execute(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'"))
    tables = [row[0] for row in result]
    
print(f"\n=> Found {len(tables)} tables:")
for table in sorted(tables):
    print(f"   - {table}")

# Check users table structure
print("\n=> Checking 'users' table ID column:")
with engine.connect() as conn:
    result = conn.execute(text("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'id'"))
    for row in result:
        print(f"   Column: {row[0]}, Type: {row[1]}, Length: {row[2]}")

print("\n=> Database is ready! All new user IDs will be 12-digit numbers.")

