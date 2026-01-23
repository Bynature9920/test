"""
Script to insert bill providers into the database.
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from shared.config import get_settings
from shared.models.bill import BillProvider
from shared.database import get_db

settings = get_settings()

def insert_providers():
    """Insert bill providers."""
    print("Inserting bill providers...")
    
    db = next(get_db())
    
    providers = [
        BillProvider(id='bp_mtn', name='MTN', category='airtime', api_code='mtn', is_active=True),
        BillProvider(id='bp_airtel', name='Airtel', category='airtime', api_code='airtel', is_active=True),
        BillProvider(id='bp_glo', name='Glo', category='airtime', api_code='glo', is_active=True),
        BillProvider(id='bp_9mobile', name='9mobile', category='airtime', api_code='9mobile', is_active=True),
        BillProvider(id='bp_mtn_data', name='MTN Data', category='data', api_code='mtn-data', is_active=True),
        BillProvider(id='bp_airtel_data', name='Airtel Data', category='data', api_code='airtel-data', is_active=True),
        BillProvider(id='bp_glo_data', name='Glo Data', category='data', api_code='glo-data', is_active=True),
        BillProvider(id='bp_9mobile_data', name='9mobile Data', category='data', api_code='9mobile-data', is_active=True),
        BillProvider(id='bp_dstv', name='DSTV', category='tv', api_code='dstv', is_active=True),
        BillProvider(id='bp_gotv', name='GOTV', category='tv', api_code='gotv', is_active=True),
        BillProvider(id='bp_startimes', name='Startimes', category='tv', api_code='startimes', is_active=True),
    ]
    
    for provider in providers:
        # Check if exists
        existing = db.query(BillProvider).filter(BillProvider.api_code == provider.api_code).first()
        if not existing:
            db.add(provider)
            print(f"Added: {provider.name} ({provider.category})")
        else:
            print(f"Already exists: {provider.name}")
    
    db.commit()
    print("\nAll providers inserted successfully!")
    
    # Verify
    count = db.query(BillProvider).count()
    print(f"Total providers in database: {count}")

if __name__ == "__main__":
    insert_providers()
