from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str | None = None
    gender: str | None = None
    role: str | None = "client"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class VerifyEmailRequest(BaseModel):
    username: str
    code: str
