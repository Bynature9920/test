"""Fix google_id unique index to allow multiple NULLs."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import engine
from sqlalchemy import text

print("Fixing google_id index...")
try:
    with engine.begin() as conn:
        # Drop the unique index
        try:
            conn.execute(text('DROP INDEX ix_users_google_id ON users'))
            print("=> Dropped unique index ix_users_google_id")
        except Exception as e:
            print(f"Note: {e}")
        
        # Create a filtered index that allows multiple NULLs
        conn.execute(text('CREATE INDEX ix_users_google_id ON users(google_id) WHERE google_id IS NOT NULL'))
        print("=> Created filtered index ix_users_google_id")
    
    print("\n✅ Google ID index fixed! You can now register regular users.")
except Exception as e:
    print(f"\n❌ Error: {e}")

