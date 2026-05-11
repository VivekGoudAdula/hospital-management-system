import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config.settings import settings
import logging

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body_html: str):
    """Sends an email using SMTP settings from config."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"SMTP credentials not configured. Email to {to_email} not sent.")
        return False

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email

        part = MIMEText(body_html, "html")
        message.attach(part)

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, message.as_string())
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def get_appointment_email_template(patient_name: str, doctor_name: str, date: str, time: str, token: str, action_type: str = "confirmed"):
    """Generates a beautiful HTML email template for appointments."""
    action_text = "confirmed" if action_type == "confirmed" else "rescheduled"
    color = "#4f46e5" # Indigo-600
    
    return f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: {color}; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">ApexCare Hospital</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Excellence in Medical Care</p>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #1e293b; margin-top: 0;">Appointment {action_text.capitalize()}</h2>
                <p>Dear <strong>{patient_name}</strong>,</p>
                <p>Your appointment has been successfully <strong>{action_text}</strong>. Below are the details for your visit:</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #f1f5f9;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Doctor</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: bold; text-align: right;">Dr. {doctor_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: bold; text-align: right;">{date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: bold; text-align: right;">{time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Token Number</td>
                            <td style="padding: 8px 0; color: {color}; font-weight: 900; font-size: 18px; text-align: right;">{token}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e;">
                        <strong>Note:</strong> Please arrive 15 minutes before your scheduled time. Show this token at the reception desk upon arrival.
                    </p>
                </div>

                <p style="font-size: 14px; color: #64748b;">
                    If you need to cancel or reschedule, please contact our support at +1 (555) 000-1234.
                </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                &copy; 2026 ApexCare Hospital Management Systems. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
