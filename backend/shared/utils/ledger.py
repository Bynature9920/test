"""
Double-entry accounting ledger utilities.
"""
from enum import Enum
from typing import Optional
from decimal import Decimal


class AccountType(str, Enum):
    """Account types in double-entry accounting."""
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"


class TransactionType(str, Enum):
    """Transaction types."""
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class LedgerEntry:
    """Represents a ledger entry in double-entry accounting."""
    
    def __init__(
        self,
        account_id: str,
        account_type: AccountType,
        transaction_type: TransactionType,
        amount: Decimal,
        currency: str = "NGN",
        description: Optional[str] = None,
        reference: Optional[str] = None
    ):
        self.account_id = account_id
        self.account_type = account_type
        self.transaction_type = transaction_type
        self.amount = amount
        self.currency = currency
        self.description = description
        self.reference = reference
    
    def to_dict(self) -> dict:
        """Convert ledger entry to dictionary."""
        return {
            "account_id": self.account_id,
            "account_type": self.account_type.value,
            "transaction_type": self.transaction_type.value,
            "amount": str(self.amount),
            "currency": self.currency,
            "description": self.description,
            "reference": self.reference
        }


class DoubleEntryTransaction:
    """Represents a double-entry transaction."""
    
    def __init__(self, transaction_id: str, entries: list[LedgerEntry]):
        self.transaction_id = transaction_id
        self.entries = entries
        self._validate_balance()
    
    def _validate_balance(self):
        """Validate that debits equal credits."""
        total_debits = sum(
            entry.amount for entry in self.entries 
            if entry.transaction_type == TransactionType.DEBIT
        )
        total_credits = sum(
            entry.amount for entry in self.entries 
            if entry.transaction_type == TransactionType.CREDIT
        )
        
        if total_debits != total_credits:
            raise ValueError(
                f"Transaction {self.transaction_id} is not balanced: "
                f"Debits {total_debits} != Credits {total_credits}"
            )
    
    def to_dict(self) -> dict:
        """Convert transaction to dictionary."""
        return {
            "transaction_id": self.transaction_id,
            "entries": [entry.to_dict() for entry in self.entries]
        }

