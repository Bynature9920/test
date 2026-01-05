"""
Validation utilities.
"""
import re
from typing import Optional
from ..config import get_settings

settings = get_settings()


def validate_nigerian_phone(phone: str) -> bool:
    """Validate Nigerian phone number format."""
    # Nigerian phone numbers: +234XXXXXXXXXX or 0XXXXXXXXXX
    pattern = r'^(\+234|0)[789][01]\d{8}$'
    return bool(re.match(pattern, phone.replace(" ", "")))


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_nigerian_bank_account(account_number: str) -> bool:
    """Validate Nigerian bank account number (10 digits)."""
    return account_number.isdigit() and len(account_number) == 10


def validate_amount(amount: float) -> tuple[bool, Optional[str]]:
    """Validate transaction amount against limits."""
    if amount < settings.min_transaction_amount:
        return False, f"Amount must be at least ₦{settings.min_transaction_amount}"
    if amount > settings.max_transaction_amount:
        return False, f"Amount cannot exceed ₦{settings.max_transaction_amount}"
    return True, None


def validate_region(region_code: str) -> tuple[bool, Optional[str]]:
    """Check if region is sanctioned."""
    if region_code.upper() in settings.sanctioned_regions_list:
        return False, f"Service not available in {region_code}"
    return True, None

