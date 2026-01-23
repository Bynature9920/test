"""
Script to create cards and card_transactions tables.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.database import engine
from shared.models.card import Card, CardTransaction
from shared.models.base import Base

def create_tables():
    """Create cards tables."""
    print("Creating cards tables...")
    
    try:
        # Create tables
        Card.__table__.create(engine, checkfirst=True)
        print("✅ Cards table created/verified")
        
        CardTransaction.__table__.create(engine, checkfirst=True)
        print("✅ Card transactions table created/verified")
        
        print("\n✅ All card tables created successfully!")
        
    except Exception as e:
        print(f"\n❌ Error creating tables: {str(e)}")
        raise

if __name__ == "__main__":
    create_tables()
