"""
Quick setup script to create .env file from .env.example
"""
import os
import secrets
import shutil

def generate_secret_key():
    """Generate a secure random key."""
    return secrets.token_urlsafe(32)

def setup_env():
    """Create .env file from .env.example with generated secrets."""
    
    # Check if .env already exists
    if os.path.exists('.env'):
        response = input(".env file already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Setup cancelled.")
            return
    
    # Check if .env.example exists
    if not os.path.exists('.env.example'):
        print("❌ .env.example not found!")
        return
    
    # Copy .env.example to .env
    shutil.copy('.env.example', '.env')
    print("✅ Created .env file from .env.example")
    
    # Read the file
    with open('.env', 'r') as f:
        content = f.read()
    
    # Generate secrets
    jwt_secret = generate_secret_key()
    encryption_key = generate_secret_key()
    
    # Replace placeholder secrets
    content = content.replace(
        'your-super-secret-jwt-key-change-this-in-production-min-32-characters-long',
        jwt_secret
    )
    content = content.replace(
        'your-encryption-key-change-this-in-production-min-32-characters',
        encryption_key
    )
    
    # Write back
    with open('.env', 'w') as f:
        f.write(content)
    
    print("✅ Generated secure JWT_SECRET_KEY and ENCRYPTION_KEY")
    print("\n⚠️  IMPORTANT: Edit .env file and update:")
    print("   1. DATABASE_URL - Set your MySQL username and password")
    print("   2. Review other settings as needed")
    print("\nExample DATABASE_URL formats:")
    print("   - No password: mysql+pymysql://root:@localhost:3306/fintech_db")
    print("   - With password: mysql+pymysql://root:yourpassword@localhost:3306/fintech_db")
    print("   - Custom user: mysql+pymysql://myuser:mypassword@localhost:3306/fintech_db")

if __name__ == '__main__':
    setup_env()




