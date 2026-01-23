"""
Interactive script to set up email configuration.
"""
import os
import sys

def setup_email():
    print("\n" + "="*60)
    print("Email Configuration Setup (Gmail SMTP)")
    print("="*60 + "\n")
    
    print("This script will help you configure email sending for password resets.\n")
    print("You'll need:")
    print("  1. A Gmail account with 2-Factor Authentication enabled")
    print("  2. A Gmail App Password (not your regular password)\n")
    
    print("For detailed setup instructions, see: backend/EMAIL_SETUP.md\n")
    
    # Check if .env exists
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    if not os.path.exists(env_path):
        print("Error: .env file not found!")
        print("Please create a .env file first.\n")
        sys.exit(1)
    
    # Get user input
    print("Please enter your email configuration:\n")
    
    smtp_user = input("Gmail address (e.g., yourname@gmail.com): ").strip()
    if not smtp_user:
        print("Error: Email address is required!")
        sys.exit(1)
    
    smtp_password = input("Gmail App Password (16-char, e.g., xxxx xxxx xxxx xxxx): ").strip()
    if not smtp_password:
        print("Error: App Password is required!")
        sys.exit(1)
    
    from_email = input("From email address (press Enter to use 'noreply@bengo.com'): ").strip()
    if not from_email:
        from_email = "noreply@bengo.com"
    
    frontend_url = input("Frontend URL (press Enter to use 'http://localhost:3000'): ").strip()
    if not frontend_url:
        frontend_url = "http://localhost:3000"
    
    # Read existing .env
    with open(env_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Update or add email config
    email_keys = {
        'SMTP_HOST': 'smtp.gmail.com',
        'SMTP_PORT': '587',
        'SMTP_USER': smtp_user,
        'SMTP_PASSWORD': smtp_password,
        'FROM_EMAIL': from_email,
        'FRONTEND_URL': frontend_url,
    }
    
    updated_lines = []
    found_keys = set()
    
    for line in lines:
        # Check if this line contains one of our email config keys
        updated = False
        for key, value in email_keys.items():
            if line.strip().startswith(f"{key}="):
                updated_lines.append(f"{key}={value}\n")
                found_keys.add(key)
                updated = True
                break
        
        if not updated:
            updated_lines.append(line)
    
    # Add missing keys
    if found_keys != set(email_keys.keys()):
        # Add a section header if needed
        if not any('Email Configuration' in line for line in updated_lines):
            updated_lines.append("\n# Email Configuration\n")
        
        for key, value in email_keys.items():
            if key not in found_keys:
                updated_lines.append(f"{key}={value}\n")
    
    # Write back to .env
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print("\n" + "="*60)
    print("SUCCESS: Email configuration saved to .env")
    print("="*60 + "\n")
    
    print("Next steps:")
    print("  1. Restart your backend server")
    print("  2. Test password reset at: http://localhost:3000/forgot-password")
    print("  3. Check your email inbox for the reset link!\n")
    
    print("For troubleshooting, see: backend/EMAIL_SETUP.md\n")

if __name__ == "__main__":
    try:
        setup_email()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
