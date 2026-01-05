"""
Simple script to start the API Gateway server.
"""
import os
import sys
from pathlib import Path

# Set DEBUG if not set
if 'DEBUG' not in os.environ:
    os.environ['DEBUG'] = 'true'

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# Import and run
from api_gateway.main import app
import uvicorn

if __name__ == "__main__":
    print("Starting API Gateway on http://localhost:8000")
    print("Press Ctrl+C to stop")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False
    )




