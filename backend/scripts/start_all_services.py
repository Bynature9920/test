"""
Script to start all services for development.
"""
import subprocess
import sys
import time
import os
from pathlib import Path

# Service configurations
SERVICES = [
    {"name": "API Gateway", "module": "api_gateway.main", "port": 8000},
    {"name": "Auth Service", "module": "services.auth.main", "port": 8001},
    {"name": "Wallet Service", "module": "services.wallet.main", "port": 8002},
    {"name": "Payments Service", "module": "services.payments.main", "port": 8003},
    {"name": "Cards Service", "module": "services.cards.main", "port": 8004},
    {"name": "Loans Service", "module": "services.loans.main", "port": 8005},
    {"name": "Crypto Service", "module": "services.crypto.main", "port": 8006},
    {"name": "Travel Service", "module": "services.travel.main", "port": 8007},
    {"name": "Rewards Service", "module": "services.rewards.main", "port": 8008},
    {"name": "Risk Service", "module": "services.risk.main", "port": 8009},
]

def start_service(service_info):
    """Start a single service."""
    print(f"Starting {service_info['name']} on port {service_info['port']}...")
    
    # Change to backend directory
    backend_path = Path(__file__).parent.parent
    os.chdir(backend_path)
    
    # Start service
    process = subprocess.Popen(
        [sys.executable, "-m", service_info["module"]],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    return process

def main():
    """Start all services."""
    print("=" * 50)
    print("Starting Fintech Super App Services")
    print("=" * 50)
    print()
    
    processes = []
    
    try:
        for service in SERVICES:
            process = start_service(service)
            processes.append((service["name"], process))
            time.sleep(2)  # Stagger service starts
        
        print()
        print("All services started!")
        print("Press Ctrl+C to stop all services")
        print()
        
        # Wait for interrupt
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print()
        print("Stopping all services...")
        for name, process in processes:
            print(f"Stopping {name}...")
            process.terminate()
            process.wait()
        print("All services stopped.")

if __name__ == "__main__":
    main()

