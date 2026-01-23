"""
Comprehensive test script to verify all API endpoints are working correctly.
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test credentials (use real user from DB)
TEST_EMAIL = "emzzygee000@gmail.com"  # Replace with your test email
TEST_PASSWORD = "your_password"  # Replace with your test password

def print_result(test_name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if message:
        print(f"   {message}")
    print()

def test_health():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print_result("Health Check", response.status_code == 200, f"Status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print_result("Health Check", False, f"Error: {str(e)}")
        return False

def test_login():
    """Test login endpoint and return token"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print_result("Login", True, f"Token obtained: {token[:20]}...")
            return token
        else:
            print_result("Login", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        print_result("Login", False, f"Error: {str(e)}")
        return None

def test_get_user_info(token):
    """Test get current user endpoint"""
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print_result("Get User Info", True, f"User: {data.get('email')}")
            return True
        else:
            print_result("Get User Info", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_result("Get User Info", False, f"Error: {str(e)}")
        return False

def test_wallet_balance(token):
    """Test wallet balance endpoint"""
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/wallet/balance?currency=NGN",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print_result(
                "Wallet Balance", 
                True, 
                f"Available: {data.get('available_balance')}, Pending: {data.get('pending_balance')}, Total: {data.get('total_balance')}"
            )
            
            # Verify no NaN values
            for key in ['available_balance', 'pending_balance', 'total_balance']:
                if data.get(key) is None or data.get(key) == 'NaN':
                    print_result("Wallet Balance Data Validation", False, f"{key} is NaN or None!")
                    return False
            
            print_result("Wallet Balance Data Validation", True, "All balance fields are valid")
            return True
        else:
            print_result("Wallet Balance", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print_result("Wallet Balance", False, f"Error: {str(e)}")
        return False

def test_transactions(token):
    """Test transactions endpoint"""
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/wallet/transactions?page=1&limit=20",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print_result("Get Transactions", True, f"Total: {data.get('total', 0)} transactions")
            return True
        else:
            print_result("Get Transactions", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_result("Get Transactions", False, f"Error: {str(e)}")
        return False

def test_bill_providers(token):
    """Test bill providers endpoint"""
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/bills/providers?category=airtime",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            providers = data.get('providers', [])
            print_result("Get Bill Providers", True, f"Found {len(providers)} providers")
            return True
        else:
            print_result("Get Bill Providers", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_result("Get Bill Providers", False, f"Error: {str(e)}")
        return False

def test_crypto_balances(token):
    """Test crypto balances endpoint"""
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/crypto/balances",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            balances = data.get('balances', [])
            print_result("Get Crypto Balances", True, f"Found {len(balances)} crypto balances")
            
            # Verify structure
            for bal in balances:
                if 'currency' in bal and 'balance' in bal and 'ngn_value' in bal:
                    continue
                else:
                    print_result("Crypto Balance Structure", False, "Missing required fields")
                    return False
            
            print_result("Crypto Balance Structure", True, "All balances have correct structure")
            return True
        else:
            print_result("Get Crypto Balances", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_result("Get Crypto Balances", False, f"Error: {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("  BenGo API Comprehensive Test Suite")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60 + "\n")
    
    # Run tests
    test_health()
    
    token = test_login()
    if not token:
        print("\n❌ Cannot continue tests without authentication token")
        return
    
    print("\n" + "-"*60)
    print("  Authenticated Endpoint Tests")
    print("-"*60 + "\n")
    
    test_get_user_info(token)
    test_wallet_balance(token)
    test_transactions(token)
    test_bill_providers(token)
    test_crypto_balances(token)
    
    print("\n" + "="*60)
    print("  Test Suite Complete")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
