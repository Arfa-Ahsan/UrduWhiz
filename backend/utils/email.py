import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=465,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="UrduWhiz",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fast_mail = FastMail(conf)

async def send_email(subject: str, recipients: list[EmailStr], html: str):
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=html,
        subtype="html"
    )
    await fast_mail.send_message(message)