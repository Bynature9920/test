"""add bill payment tables

Revision ID: bill_payment_001
Revises: 41a7e09f31e0
Create Date: 2026-01-16 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

# revision identifiers, used by Alembic.
revision = 'bill_payment_001'
down_revision = '41a7e09f31e0'
branch_labels = None
depends_on = None


def upgrade():
    # Create bill_providers table
    op.create_table(
        'bill_providers',
        sa.Column('id', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('api_code', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('api_code')
    )
    op.create_index('idx_bill_provider_category', 'bill_providers', ['category'])
    op.create_index('idx_bill_provider_active', 'bill_providers', ['is_active'])
    
    # Create bills table
    op.create_table(
        'bills',
        sa.Column('id', sa.String(20), nullable=False),
        sa.Column('user_id', sa.String(20), nullable=False),
        sa.Column('bill_type', sa.String(50), nullable=False),
        sa.Column('provider_code', sa.String(50), nullable=False),
        sa.Column('provider_name', sa.String(100), nullable=False),
        sa.Column('reference', sa.String(100), nullable=False),
        sa.Column('amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('account_number', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('provider_reference', sa.String(100), nullable=True),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference')
    )
    op.create_index('idx_bill_user', 'bills', ['user_id'])
    op.create_index('idx_bill_type', 'bills', ['bill_type'])
    op.create_index('idx_bill_status', 'bills', ['status'])
    op.create_index('idx_bill_reference', 'bills', ['reference'])
    
    # Create bill_transactions table
    op.create_table(
        'bill_transactions',
        sa.Column('id', sa.String(20), nullable=False),
        sa.Column('bill_id', sa.String(20), nullable=False),
        sa.Column('wallet_transaction_id', sa.String(20), nullable=True),
        sa.Column('provider_response', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['bill_id'], ['bills.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_bill_transaction_bill', 'bill_transactions', ['bill_id'])
    op.create_index('idx_bill_transaction_status', 'bill_transactions', ['status'])
    
    # Insert initial bill providers
    op.execute("""
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
    """)


def downgrade():
    op.drop_index('idx_bill_transaction_status', 'bill_transactions')
    op.drop_index('idx_bill_transaction_bill', 'bill_transactions')
    op.drop_table('bill_transactions')
    
    op.drop_index('idx_bill_reference', 'bills')
    op.drop_index('idx_bill_status', 'bills')
    op.drop_index('idx_bill_type', 'bills')
    op.drop_index('idx_bill_user', 'bills')
    op.drop_table('bills')
    
    op.drop_index('idx_bill_provider_active', 'bill_providers')
    op.drop_index('idx_bill_provider_category', 'bill_providers')
    op.drop_table('bill_providers')
