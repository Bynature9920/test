"""
NOWPayments Configuration Setup Script
This script helps you add your NOWPayments API key to the .env file
"""
import os
from pathlib import Path

def setup_nowpayments():
    """Add NOWPayments configuration to .env file."""
    
    print("=" * 60)
    print("NOWPayments Configuration Setup")
    print("=" * 60)
    print()
    
    # Get the .env file path
    env_path = Path(__file__).parent / ".env"
    
    if not env_path.exists():
        print("ERROR: .env file not found!")
        print("Please create a .env file first by copying .env.example")
        return
    
    # Read current .env content
    with open(env_path, 'r') as f:
        env_content = f.read()
    
    # Check if NOWPayments config already exists
    if 'NOWPAYMENTS_API_KEY' in env_content:
        print("NOWPayments configuration already exists in .env file.")
        update = input("Do you want to update it? (y/n): ").strip().lower()
        if update != 'y':
            print("Setup cancelled.")
            return
    
    print()
    print("Please enter your NOWPayments API key.")
    print("You can find it at: https://account.nowpayments.io/")
    print("Go to Settings → API → API keys")
    print()
    
    api_key = input("Enter your NOWPayments API key: ").strip()
    
    if not api_key:
        print("ERROR: API key cannot be empty!")
        return
    
    print()
    print("(Optional) Enter your IPN Secret for webhook verification.")
    print("You can find it at: Settings → IPN in NOWPayments dashboard")
    print("Leave empty if you haven't set up webhooks yet.")
    print()
    
    ipn_secret = input("Enter your IPN Secret (or press Enter to skip): ").strip()
    
    # Update or add NOWPayments configuration
    if 'NOWPAYMENTS_API_KEY' in env_content:
        # Update existing values
        lines = env_content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith('NOWPAYMENTS_API_KEY='):
                new_lines.append(f'NOWPAYMENTS_API_KEY={api_key}')
            elif line.startswith('NOWPAYMENTS_IPN_SECRET='):
                new_lines.append(f'NOWPAYMENTS_IPN_SECRET={ipn_secret}')
            else:
                new_lines.append(line)
        env_content = '\n'.join(new_lines)
    else:
        # Add new configuration
        if not env_content.endswith('\n'):
            env_content += '\n'
        env_content += f'\n# NOWPayments Configuration\n'
        env_content += f'NOWPAYMENTS_API_KEY={api_key}\n'
        env_content += f'NOWPAYMENTS_IPN_SECRET={ipn_secret}\n'
    
    # Write back to .env
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print()
    print("=" * 60)
    print("SUCCESS! NOWPayments configuration saved to .env file")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Set up payout wallets in NOWPayments dashboard")
    print("2. Restart your backend server")
    print("3. Test crypto deposits in your app!")
    print()
    print("See NOWPAYMENTS_SETUP.md for detailed instructions.")
    print()

if __name__ == "__main__":
    try:
        setup_nowpayments()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
    except Exception as e:
        print(f"\nERROR: {str(e)}")
