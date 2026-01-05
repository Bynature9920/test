# Environment Variables Setup Guide

## Quick Setup Steps

### Step 1: Edit the .env file

Open `backend/.env` and update these required fields:

1. **DATABASE_URL** - Your MySQL connection string
   ```
   DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/fintech_db
   ```
   
   Replace:
   - `root` with your MySQL username
   - `your_password` with your MySQL password
   - `fintech_db` with your database name (or keep it as is)

### Step 2: Generate Secret Keys

You need to generate secure keys for JWT and encryption. Run these commands in your terminal:

**On Windows (PowerShell):**
```powershell
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('ENCRYPTION_KEY=' + secrets.token_urlsafe(32))"
```

**On Mac/Linux:**
```bash
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
python3 -c "import secrets; print('ENCRYPTION_KEY=' + secrets.token_urlsafe(32))"
```

Copy the output and replace the values in your `.env` file.

### Step 3: Create the Database

Open MySQL and run:

```sql
CREATE DATABASE fintech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or if you want to use a different database name, update `DATABASE_URL` in `.env` accordingly.

### Step 4: Test Your Configuration

Run this Python script to test your database connection:

```python
# test_db_connection.py
import os
from sqlalchemy import create_engine

# Load from .env
from dotenv import load_dotenv
load_dotenv()

database_url = os.getenv('DATABASE_URL')
print(f"Testing connection to: {database_url.split('@')[1]}")  # Don't print password

try:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Check if MySQL is running")
    print("2. Verify username and password in DATABASE_URL")
    print("3. Ensure database exists")
    print("4. Check if MySQL port is 3306")
```

## Common MySQL Configurations

### Default MySQL Setup (Windows)
```
Username: root
Password: (usually empty or set during installation)
Host: localhost
Port: 3306
```

### XAMPP MySQL
```
Username: root
Password: (usually empty)
Host: localhost
Port: 3306
```

### WAMP MySQL
```
Username: root
Password: (usually empty)
Host: localhost
Port: 3306
```

### MySQL Workbench
```
Username: root (or your custom username)
Password: (the password you set)
Host: localhost
Port: 3306
```

## Example .env File

Here's a complete example with common defaults:

```env
# Database - For local MySQL with no password
DATABASE_URL=mysql+pymysql://root:@localhost:3306/fintech_db

# Database - For MySQL with password
DATABASE_URL=mysql+pymysql://root:mypassword@localhost:3306/fintech_db

# Database - For custom username
DATABASE_URL=mysql+pymysql://myuser:mypassword@localhost:3306/fintech_db
```

## Troubleshooting

### "Access denied for user"
- Check your MySQL username and password
- Try connecting with MySQL command line: `mysql -u root -p`

### "Can't connect to MySQL server"
- Ensure MySQL service is running
- Check if MySQL is on port 3306: `netstat -an | findstr 3306` (Windows)
- Try `127.0.0.1` instead of `localhost`

### "Unknown database 'fintech_db'"
- Create the database first (see Step 3 above)

### "Module 'pymysql' not found"
- Install it: `pip install pymysql`

## Next Steps

After configuring `.env`:
1. Run database migrations: `python scripts/migrate.py`
2. Start the API Gateway: `python -m api_gateway.main`
3. Test registration at: `http://localhost:3000/register`




