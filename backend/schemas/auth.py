from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import uuid4
from datetime import datetime,timedelta
from pydantic import Field

class UserRegister(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid4()))  
    username: str
    email: EmailStr
    password: str
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class UserOut(BaseModel):
    username: str
    email: EmailStr
    is_verified: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    message: Optional[str]

class TokenData(BaseModel):
    email: Optional[str] = None

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str

class EmailRequest(BaseModel):
    email: EmailStr