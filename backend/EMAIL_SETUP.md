# Email Setup Guide (Gmail SMTP)

This guide will help you configure Gmail SMTP so users can receive password reset emails.

## Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication on Your Gmail Account

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2FA (required for App Passwords)

### Step 2: Generate a Gmail App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "BenGo Backend" as the name
5. Click **Generate**
6. **Copy the 16-character password** (looks like: `xxxx xxxx xxxx xxxx`)

### Step 3: Add SMTP Credentials to Your .env File

Open `backend/.env` and add these lines (or update if they exist):

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
FROM_EMAIL=noreply@bengo.com
FRONTEND_URL=http://localhost:3000
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `xxxx xxxx xxxx xxxx` with the App Password you generated (keep the spaces)

### Step 4: Restart the Backend Server

Stop and restart your backend server for the changes to take effect:

```powershell
# Press Ctrl+C to stop the server, then:
cd backend
python start_server.py
```

### Step 5: Test Password Reset

1. Go to http://localhost:3000/forgot-password
2. Enter a valid user email
3. Check the email inbox - you should receive a password reset email! 📧

## Troubleshooting

### "Authentication failed"
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Factor Authentication is enabled on your Google account
- Double-check the email and password in your `.env` file

### "SMTP AUTH extension not supported"
- Make sure `SMTP_PORT=587` (not 465 or 25)
- Verify `SMTP_HOST=smtp.gmail.com`

### Email not received
- Check spam folder
- Verify the recipient email exists in the database
- Check backend logs for errors
- Try sending a test email to yourself first

### "Less secure app access"
- Gmail no longer supports "Less secure apps"
- You **must** use App Passwords with 2FA

## Alternative: Use a Different Email Provider

### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

## Security Notes

- ⚠️ **Never commit your `.env` file to Git** (it's already in `.gitignore`)
- 🔒 App Passwords are safer than using your main Gmail password
- 📧 For production, use a dedicated email service (SendGrid, Mailgun, AWS SES)
- 🚫 Don't use your personal email for production systems

## Testing Email in Development

If you don't want to set up real email for development, the system will log password reset links to the backend console. Check the terminal output for the reset URL.

---

**Need help?** Check the backend logs for detailed error messages.
