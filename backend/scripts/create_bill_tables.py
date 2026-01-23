"""
Script to create bill payment tables.
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, text
from shared.config import get_settings
from shared.models import Bill, BillProvider, BillTransaction, BaseModel

settings = get_settings()

def create_tables():
    """Create bill payment tables."""
    print("Creating bill payment tables...")
    
    # Create engine
    engine = create_engine(settings.database_url, echo=True)
    
    # Create tables
    BaseModel.metadata.create_all(engine, tables=[
        BillProvider.__table__,
        Bill.__table__,
        BillTransaction.__table__
    ])
    
    print("\n✅ Tables created successfully!")
    
    # Insert initial providers
    print("\nInserting initial bill providers...")
    with engine.connect() as conn:
        conn.execute(text("""
            IF NOT EXISTS (SELECT 1 FROM bill_providers WHERE api_code = 'mtn')
            BEGIN
                INSERT INTO bill_providers (id, name, category, api_code, is_active, created_at)
                VALUES 
                ('bp_mtn', 'MTN', 'airtime', 'mtn', 1, CURRENT_TIMESTAMP),
                ('bp_airtel', 'Airtel', 'airtime', 'airtel', 1, CURRENT_TIMESTAMP),
                ('bp_glo', 'Glo', 'airtime', 'glo', 1, CURRENT_TIMESTAMP),
                ('bp_9mobile', '9mobile', 'airtime', '9mobile', 1, CURRENT_TIMESTAMP),
                ('bp_mtn_data', 'MTN Data', 'data', 'mtn-data', 1, CURRENT_TIMESTAMP),
                ('bp_airtel_data', 'Airtel Data', 'data', 'airtel-data', 1, CURRENT_TIMESTAMP),
                ('bp_glo_data', 'Glo Data', 'data', 'glo-data', 1, CURRENT_TIMESTAMP),
                ('bp_9mobile_data', '9mobile Data', 'data', '9mobile-data', 1, CURRENT_TIMESTAMP),
                ('bp_dstv', 'DSTV', 'tv', 'dstv', 1, CURRENT_TIMESTAMP),
                ('bp_gotv', 'GOTV', 'tv', 'gotv', 1, CURRENT_TIMESTAMP),
                ('bp_startimes', 'Startimes', 'tv', 'startimes', 1, CURRENT_TIMESTAMP)
            END
        """))
        conn.commit()
    
    print("✅ Initial providers inserted!")
    print("\n🎉 Bill payment setup complete!")

if __name__ == "__main__":
    create_tables()
