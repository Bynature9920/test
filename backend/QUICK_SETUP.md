# Quick Environment Setup Guide

## Step 1: Create .env File

1. **Copy the example file:**
   - Copy `backend/.env.example` to `backend/.env`
   - Or create a new file called `.env` in the `backend` folder

2. **Open `.env` in a text editor** (Notepad, VS Code, etc.)

## Step 2: Configure MySQL Connection

Find this line in `.env`:
```
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/fintech_db
```

**Replace it with your MySQL credentials:**

### If MySQL has NO password (common for local):
```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/fintech_db
```

### If MySQL has a password:
```
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/fintech_db
```
(Replace `YOUR_PASSWORD` with your actual MySQL password)

### If you use a different username:
```
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@localhost:3306/fintech_db
```

## Step 3: Generate Secret Keys

You need to generate secure keys. Open PowerShell or Command Prompt and run:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run it twice to get two different keys, then:

1. Copy the first key → Replace `JWT_SECRET_KEY` value in `.env`
2. Copy the second key → Replace `ENCRYPTION_KEY` value in `.env`

**Or manually edit these lines:**
```
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-min-32-characters-long
ENCRYPTION_KEY=your-encryption-key-change-this-in-production-min-32-characters
```

Replace with any long random strings (at least 32 characters).

## Step 4: Create the Database

Open MySQL (MySQL Workbench, command line, or phpMyAdmin) and run:

```sql
CREATE DATABASE fintech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or if you want a different name, update `fintech_db` in your `DATABASE_URL`.

## Step 5: Test Your Setup

1. Make sure MySQL is running
2. Check your `.env` file has:
   - ✅ Correct `DATABASE_URL` with your MySQL credentials
   - ✅ `JWT_SECRET_KEY` set (not the placeholder)
   - ✅ `ENCRYPTION_KEY` set (not the placeholder)

## Common MySQL Configurations

### Default Local MySQL:
- Username: `root`
- Password: (usually empty/blank)
- Host: `localhost`
- Port: `3306`

### XAMPP:
- Username: `root`
- Password: (usually empty)
- Host: `localhost`
- Port: `3306`

### MySQL Workbench:
- Username: `root` (or your custom username)
- Password: (the password you set)
- Host: `localhost`
- Port: `3306`

## Example .env File

Here's a complete example for local development:

```env
# Database - No password
DATABASE_URL=mysql+pymysql://root:@localhost:3306/fintech_db

# JWT (replace with generated key)
JWT_SECRET_KEY=abc123xyz789randomkeyatleast32characterslong
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Encryption (replace with generated key)
ENCRYPTION_KEY=def456uvw012anotherrandomkeyatleast32characters

# Rest can stay as default
APP_NAME=Fintech Super App
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Next Steps

After setting up `.env`:

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run database migrations:**
   ```bash
   python scripts/migrate.py
   ```

3. **Start the backend:**
   ```bash
   python -m api_gateway.main
   ```

4. **Test registration:**
   - Open `http://localhost:3000/register`
   - Try creating an account

## Troubleshooting

### "Access denied for user"
- Check your MySQL username and password in `DATABASE_URL`
- Try connecting manually: `mysql -u root -p`

### "Can't connect to MySQL"
- Make sure MySQL service is running
- Check if port 3306 is correct
- Try `127.0.0.1` instead of `localhost`

### "Unknown database"
- Create the database first (see Step 4)

### Python not found
- Make sure Python is installed and in PATH
- Or use `python3` instead of `python`




