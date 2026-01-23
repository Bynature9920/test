"""
Fix admin panel issues:
1. Add is_locked column to wallets table
2. Update existing users KYC status from PENDING to NOT_STARTED
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from shared.config import get_settings

settings = get_settings()

# Create engine
engine = create_engine(settings.database_url, echo=True)

def fix_database():
    """Apply database fixes."""
    with engine.connect() as conn:
        print("\n1. Adding is_locked column to wallets table...")
        try:
            conn.execute(text("""
                ALTER TABLE wallets 
                ADD is_locked BIT NOT NULL DEFAULT 0
            """))
            conn.commit()
            print("   SUCCESS: Added is_locked column")
        except Exception as e:
            if "already exists" in str(e) or "Duplicate" in str(e):
                print("   SKIPPED: Column already exists")
            else:
                print(f"   ERROR: {e}")
        
        print("\n2. Updating KYC status for existing users...")
        try:
            # Update users with PENDING status who have no verification documents
            result = conn.execute(text("""
                UPDATE users 
                SET kyc_status = 'NOT_STARTED'
                WHERE kyc_status = 'PENDING'
                AND id NOT IN (
                    SELECT DISTINCT user_id 
                    FROM verification_documents 
                    WHERE user_id IS NOT NULL
                )
            """))
            conn.commit()
            print(f"   SUCCESS: Updated {result.rowcount} users to NOT_STARTED status")
        except Exception as e:
            print(f"   ERROR: {e}")
        
        print("\n3. Verifying changes...")
        try:
            # Check wallets table structure
            result = conn.execute(text("SELECT TOP 1 * FROM wallets"))
            columns = result.keys()
            if 'is_locked' in columns:
                print("   SUCCESS: is_locked column exists in wallets table")
            else:
                print("   WARNING: is_locked column not found!")
            
            # Check KYC status distribution
            result = conn.execute(text("""
                SELECT kyc_status, COUNT(*) as count 
                FROM users 
                GROUP BY kyc_status
            """))
            print("\n   KYC Status Distribution:")
            for row in result:
                print(f"      {row.kyc_status}: {row.count} users")
            
        except Exception as e:
            print(f"   ERROR during verification: {e}")
        
        print("\n" + "="*60)
        print("Database fixes completed!")
        print("="*60)

if __name__ == "__main__":
    print("="*60)
    print("ADMIN PANEL DATABASE FIXES")
    print("="*60)
    fix_database()




