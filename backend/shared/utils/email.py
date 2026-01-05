"""
Email utilities for sending emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from ..config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Email configuration (can be moved to .env)
SMTP_HOST = getattr(settings, 'smtp_host', 'smtp.gmail.com')
SMTP_PORT = getattr(settings, 'smtp_port', 587)
SMTP_USER = getattr(settings, 'smtp_user', '')
SMTP_PASSWORD = getattr(settings, 'smtp_password', '')
FROM_EMAIL = getattr(settings, 'from_email', 'noreply@fintechapp.com')


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_body:
            text_part = MIMEText(text_body, 'plain')
            msg.attach(text_part)
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Send email
        if SMTP_USER and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Email sent to {to_email}")
            return True
        else:
            # In development, just log the email
            logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
            logger.info(f"Email content:\n{html_body}")
            return True  # Return True in dev mode
            
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)
        return False


def send_password_reset_email(to_email: str, reset_token: str, reset_url: str) -> bool:
    """Send password reset email."""
    subject = "Reset Your Password - BenGo"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your BenGo account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="{reset_url}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">{reset_url}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <div class="footer">
                <p>Best regards,<br>BenGo Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Password Reset Request
    
    Hello,
    
    You requested to reset your password for your BenGo account.
    
    Click this link to reset your password:
    {reset_url}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, please ignore this email.
    
    Best regards,
    BenGo Team
    """
    
    return send_email(to_email, subject, html_body, text_body)




