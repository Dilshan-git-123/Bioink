import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_reset_email(email: str, reset_token: str) -> None:
    """
    Send a professional HTML password reset email to the specified address.

    Args:
        email:       Recipient email address.
        reset_token: The secure password reset token.

    Raises:
        ValueError:   If required environment variables are missing.
        RuntimeError: If the email fails to send.
    """
    if not EMAIL_ADDRESS:
        raise ValueError("EMAIL_ADDRESS is not set in the environment.")
    if not EMAIL_PASSWORD:
        raise ValueError("EMAIL_PASSWORD is not set in the environment.")

    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    # ── Build the message ────────────────────────────────────────────────────
    message = MIMEMultipart("alternative")
    message["Subject"] = "BioInkAI \u2013 Password Reset Request"
    message["From"] = f"BioInkAI <{EMAIL_ADDRESS}>"
    message["To"] = email

    # ── Plain-text fallback ──────────────────────────────────────────────────
    plain_text = f"""\
BioInkAI \u2013 Password Reset Request

We received a request to reset the password for your BioInkAI account.

Click the link below to reset your password:
{reset_url}

This link will expire in 30 minutes.

If you did not request this password reset, you can ignore this email.

\u2014 The BioInkAI Team
"""

    # ── HTML body ────────────────────────────────────────────────────────────
    html_body = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BioInkAI \u2013 Password Reset</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      background-color: #0f1117;
      font-family: 'Inter', Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }}

    .wrapper {{
      width: 100%;
      padding: 48px 16px;
      background-color: #0f1117;
    }}

    .card {{
      max-width: 560px;
      margin: 0 auto;
      background: linear-gradient(145deg, #1a1d2e, #141624);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }}

    /* Header */
    .header {{
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
      padding: 36px 40px;
      text-align: center;
    }}

    .logo {{
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }}

    .logo span {{
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.75);
      display: block;
      margin-top: 4px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }}

    /* Body */
    .body {{
      padding: 40px 40px 32px;
    }}

    .heading {{
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 12px;
    }}

    .description {{
      font-size: 15px;
      line-height: 1.7;
      color: #94a3b8;
      margin-bottom: 32px;
    }}

    /* CTA Button */
    .btn-container {{
      text-align: center;
      margin-bottom: 28px;
    }}

    .btn {{
      display: inline-block;
      padding: 14px 36px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }}

    /* Plain link section */
    .plain-link-section {{
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 28px;
    }}

    .plain-link-label {{
      font-size: 12px;
      color: #64748b;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }}

    .plain-link {{
      font-size: 12px;
      color: #60a5fa;
      word-break: break-all;
      text-decoration: none;
    }}

    /* Security note */
    .security-note {{
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
      padding: 14px 18px;
      border-left: 3px solid #374151;
      background: rgba(255,255,255,0.02);
      border-radius: 0 6px 6px 0;
    }}

    /* Footer */
    .footer {{
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 20px 40px;
      text-align: center;
    }}

    .footer p {{
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }}

    .expiry-badge {{
      display: inline-block;
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 20px;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo">
          \U0001f9ec BioInkAI
          <span>GT Enterprise</span>
        </div>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="expiry-badge">\u23f1 Expires in 30 minutes</p>

        <h1 class="heading">Password Reset Request</h1>
        <p class="description">
          We received a request to reset the password for your BioInkAI account
          associated with <strong style="color:#e2e8f0;">{email}</strong>.
          Click the button below to choose a new password and restore access to
          your laboratory workspace.
        </p>

        <!-- CTA Button -->
        <div class="btn-container">
          <a href="{reset_url}" class="btn">Reset Password</a>
        </div>

        <!-- Plain link fallback -->
        <div class="plain-link-section">
          <p class="plain-link-label">Or copy this link into your browser</p>
          <a href="{reset_url}" class="plain-link">{reset_url}</a>
        </div>

        <!-- Security note -->
        <div class="security-note">
          \U0001f512 If you did not request this password reset, you can ignore this email.
          Your password will remain unchanged and no action is required.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>
          This email was sent by <strong style="color:#64748b;">BioInkAI</strong>.
          For security, never share this link with anyone.<br />
          &copy; 2026 BioInkAI &middot; All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
"""

    message.attach(MIMEText(plain_text, "plain"))
    message.attach(MIMEText(html_body, "html"))

    # ── Send via Gmail SMTP with TLS ─────────────────────────────────────────
    context = ssl.create_default_context()
    smtp = None

    try:
        smtp = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        smtp.set_debuglevel(1)

        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()

        smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

        print("FROM:", EMAIL_ADDRESS)
        print("TO:", email)

        smtp.sendmail(EMAIL_ADDRESS, email, message.as_string())

    except smtplib.SMTPAuthenticationError:
        raise RuntimeError(
            "SMTP authentication failed. Check EMAIL_ADDRESS and EMAIL_PASSWORD in your .env file."
        )

    except smtplib.SMTPConnectError:
        raise RuntimeError(
            f"Failed to connect to SMTP server '{SMTP_SERVER}:{SMTP_PORT}'. Check SMTP_SERVER and SMTP_PORT in your .env file."
        )

    except smtplib.SMTPRecipientsRefused:
        raise RuntimeError(
            f"The recipient address '{email}' was refused by the SMTP server."
        )

    except smtplib.SMTPException as exc:
        raise RuntimeError(
            f"An SMTP error occurred while sending the email: {exc}"
        ) from exc

    except OSError as exc:
        raise RuntimeError(
            f"Network error while connecting to SMTP server: {exc}"
        ) from exc

    finally:
        if smtp is not None:
            try:
                smtp.quit()
            except Exception:
                smtp.close()
