"""
Add crypto_wallets table to database.
Run this script to create the table for storing user crypto deposit addresses.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.database import engine, Base
from shared.models.crypto import CryptoWallet
from sqlalchemy import inspect, text

def main():
    print("Adding crypto_wallets table...")
    
    # Check if table already exists
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if 'crypto_wallets' in existing_tables:
        print("crypto_wallets table already exists!")
        return
    
    # Create the table
    try:
        CryptoWallet.__table__.create(engine, checkfirst=True)
        print("crypto_wallets table created successfully!")
        
        # Verify
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM crypto_wallets"))
            count = result.scalar()
            print(f"Table verified. Current row count: {count}")
        
    except Exception as e:
        print(f"Error creating table: {str(e)}")
        return
    
    print("\nDone! The crypto_wallets table is ready.")
    print("Users can now generate BTC, ETH, and USDT deposit addresses!")

if __name__ == "__main__":
    main()
