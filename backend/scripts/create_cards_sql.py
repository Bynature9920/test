"""
Direct SQL script to create cards tables.
"""
from sqlalchemy import text
import sys
import os

# Add parent directory to path  
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.database import engine, get_db

def create_cards_table():
    """Create cards tables using raw SQL."""
    
    # Cards table
    cards_sql = """
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cards')
    BEGIN
        CREATE TABLE cards (
            id VARCHAR(20) PRIMARY KEY DEFAULT (REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', '')),
            user_id VARCHAR(20) NOT NULL,
            card_number VARCHAR(16) NOT NULL UNIQUE,
            cardholder_name VARCHAR(100) NOT NULL,
            expiry_month INT NOT NULL,
            expiry_year INT NOT NULL,
            cvv_hash VARCHAR(255) NOT NULL,
            card_type VARCHAR(20) NOT NULL DEFAULT 'VIRTUAL',
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
            balance DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
            provider_card_id VARCHAR(100) NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME NOT NULL DEFAULT GETDATE(),
            deleted_at DATETIME NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE INDEX idx_cards_user_id ON cards(user_id);
        CREATE INDEX idx_cards_card_number ON cards(card_number);
        
        PRINT '✅ Cards table created successfully';
    END
    ELSE
    BEGIN
        PRINT '✅ Cards table already exists';
    END
    """
    
    # Card transactions table
    card_transactions_sql = """
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'card_transactions')
    BEGIN
        CREATE TABLE card_transactions (
            id VARCHAR(20) PRIMARY KEY DEFAULT (REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', '')),
            card_id VARCHAR(20) NOT NULL,
            transaction_type VARCHAR(20) NOT NULL,
            amount DECIMAL(20, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
            merchant_name VARCHAR(255) NULL,
            merchant_category VARCHAR(50) NULL,
            description VARCHAR(500) NULL,
            reference VARCHAR(100) NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME NOT NULL DEFAULT GETDATE(),
            deleted_at DATETIME NULL,
            FOREIGN KEY (card_id) REFERENCES cards(id)
        );
        
        CREATE INDEX idx_card_transactions_card_id ON card_transactions(card_id);
        CREATE INDEX idx_card_transactions_reference ON card_transactions(reference);
        
        PRINT '✅ Card transactions table created successfully';
    END
    ELSE
    BEGIN
        PRINT '✅ Card transactions table already exists';
    END
    """
    
    try:
        with engine.connect() as conn:
            print("Executing SQL to create cards table...")
            conn.execute(text(cards_sql))
            conn.commit()
            
            print("Executing SQL to create card_transactions table...")
            conn.execute(text(card_transactions_sql))
            conn.commit()
            
        print("\n✅ All card tables created successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_cards_table()
