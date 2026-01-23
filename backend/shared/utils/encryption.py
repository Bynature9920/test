"""
Encryption utilities for sensitive data like CVV.
"""
from cryptography.fernet import Fernet
import os
import base64
from hashlib import sha256

# Generate a key from environment or use default for development
# In production, this should come from secure environment variables
SECRET_KEY = os.getenv("ENCRYPTION_KEY", "bengo-secure-key-change-in-production")

# Create a Fernet key from the secret
def get_fernet_key():
    """Generate a Fernet key from secret key."""
    key = sha256(SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)

def encrypt_value(value: str) -> str:
    """Encrypt a string value."""
    try:
        f = Fernet(get_fernet_key())
        encrypted = f.encrypt(value.encode())
        return encrypted.decode()
    except Exception as e:
        raise Exception(f"Encryption failed: {str(e)}")

def decrypt_value(encrypted_value: str) -> str:
    """Decrypt an encrypted string value."""
    try:
        f = Fernet(get_fernet_key())
        decrypted = f.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception as e:
        raise Exception(f"Decryption failed: {str(e)}")
